# v82 네이티브 라이브 업데이트 (2단계)

스토어 심사 없이 웹 번들(게임 화면·코드·그림)을 교체한다. `@capgo/capacitor-updater` 8.54를 **수동 모드**로 쓰고,
업데이트 파일은 우리 Cloudflare R2 버킷에만 둔다. Capgo 관리형 서비스에는 아무 요청도 보내지 않는다
(`autoUpdate:false`, `updateUrl`/`statsUrl`/`channelUrl` 모두 빈 값).

## 동작

1. 앱 실행 직후와 앱으로 돌아올 때마다 `<updateBaseUrl>/latest.json`을 읽는다.
2. `version`(릴리스 태그)이 지금 실행 중인 번들보다 새것이면 게임을 멈추지 않고 내려받는다.
3. 내려받은 번들은 **저장에 성공한 뒤, 앱이 백그라운드로 갈 때** 적용한다. 다시 열면 인트로 없이 이어서 시작한다.
4. 새 번들이 게임 시작까지 도달하지 못하면(`notifyAppReady` 미호출) 플러그인이 이전 번들로 되돌린다.
5. 스토어에서 앱 자체를 업데이트하면 내려받은 번들을 버리고 앱에 든 번들부터 다시 시작한다.

확인·다운로드 실패, 오프라인은 조용히 넘어가고 다음 기회에 다시 시도한다. 브라우저 사이트는 종전대로 서비스 워커가 갱신한다.

## latest.json

```json
{ "version": "20261110-v82-native-live-update",
  "minNative": "1.0",
  "files": { "index.html": "<sha256>", "assets/…": "<sha256>" },
  "zip": { "url": "https://…/bundles/<version>.zip", "checksum": "<sha256>" } }
```

- `files`: 번들의 모든 파일과 SHA-256. 기기는 앱에 이미 든 파일·이전에 받은 파일과 해시가 같으면 재사용하고 **바뀐 파일만** `<updateBaseUrl>/files/<sha256>`에서 받는다.
- `zip`: 선택 사항(`--zip`). `files`가 없을 때만 쓰는 전체 번들 대체 경로다. 번들이 약 205MB라 기본으로는 만들지 않는다.
- `minNative`: 이 번들을 실행할 수 있는 가장 낮은 스토어 앱 버전. 새 네이티브 플러그인이 필요한 릴리스(3·4단계)를 낼 때 `package.json`의 `liveUpdate.minNative`를 올린다. 낮은 앱은 내려받지 않는다.

## 배포

```sh
node tools/set-release.cjs YYYYMMDD-vNN-description   # 릴리스 태그를 올려야 새 버전으로 인식한다
node tools/publish-update.cjs                          # 미리 보기: dist/live-update/latest.json만 만든다
node tools/publish-update.cjs --upload --bucket <버킷 이름>
```

업로드는 `npx wrangler r2 object put … --remote`를 쓴다(`npx wrangler login` 필요). 버킷에 이미 있는 해시는 건너뛰고,
`latest.json`은 모든 파일이 올라간 뒤 마지막에 올린다. 첫 배포는 543개 파일(약 205MB)을 올리므로 오래 걸린다.

버킷 공개 주소는 `docs/src/platform/config.js`의 `updateBaseUrl` 한 곳에 적는다. 앱과 배포 도구가 같은 값을 읽는다. 비어 있으면 업데이트 확인을 하지 않는다.

## 코드

- `docs/src/platform/updater.js`: 플러그인 호출은 이 파일에만 있다(`Capacitor.nativePromise`). `latest.json`은 CORS 설정이 필요 없도록 네이티브 HTTP로 읽는다.
- `docs/pwa.js` 네이티브 분기: 실행 → `init()`(정상 시작 확인) → `check()`; 백그라운드 → 저장 → `apply()`.
- `capacitor.config.json`: 플러그인 수동 모드 설정. `npx cap sync` 때 플러그인이 `ota-builtin-hashes.json`을 네이티브 자산에 써서 앱 내장 파일 재사용을 빠르게 한다.

## 검증과 한계

- `tests/platform.test.cjs`: 새 릴리스 다운로드, 동시 확인 1회 처리, 같은/낮은 릴리스·오프라인·잘못된 데이터·경로 이탈 차단, `minNative`, zip 대체, 받은 번들 재사용, 이어하기 표시, 백그라운드 저장 후 적용.
- 배포 도구는 가짜 업로더와 로컬 서버로 리허설했다(첫 실행 543개 업로드, 재실행 0개).
- 이 작업 환경에는 Xcode·Android SDK·R2 버킷이 없어 **실제 기기에서 다운로드·교체·되돌리기는 확인하지 못했다.** 첫 기기 테스트에서 확인이 필요하다.
- 업데이트를 받은 기기는 번들 사본을 하나 더 저장하므로 앱 저장 공간이 최대 약 2배가 된다. 이전 번들은 플러그인이 자동 삭제한다.
