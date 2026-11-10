# v82 네이티브 라이브 업데이트 (2단계)

스토어 심사 없이 웹 번들(게임 화면·코드·그림)을 교체한다. `@capgo/capacitor-updater` 8.54를 **수동 모드**로 쓰고,
업데이트 파일은 우리 Cloudflare 계정의 전용 Worker에만 둔다. Capgo 관리형 서비스에는 아무 요청도 보내지 않는다
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
{ "version": "20261110-v84-update-worker",
  "minNative": "1.0",
  "files": { "index.html": "<sha256>", "assets/…": "<sha256>" } }
```

- `files`: 번들의 모든 파일과 SHA-256. 기기는 앱에 이미 든 파일·이전에 받은 파일과 해시가 같으면 재사용하고 **바뀐 파일만** `<updateBaseUrl>/<파일 경로>`에서 받는다. 받은 파일은 해시를 검증한다.
- `minNative`: 이 번들을 실행할 수 있는 가장 낮은 스토어 앱 버전. 새 네이티브 플러그인이 필요한 릴리스(3·4단계)를 낼 때 `package.json`의 `liveUpdate.minNative`를 올린다. 낮은 앱은 내려받지 않는다.
- 앱은 `files`가 없을 때 `zip: {url, checksum}`도 받아들이지만 배포 도구는 만들지 않는다(Workers 정적 자산은 파일당 25MiB 제한).

## 호스팅 (v84: 전용 Worker)

v82–v83은 R2 버킷에 올렸으나, v84부터 **업데이트 전용 Worker**(`workers/update/wrangler.jsonc`, 이름 `midnight-update`)의 정적 자산으로 서빙한다.
Workers 정적 자산은 요청·저장 모두 무료라 사용자 수가 늘어도 비용이 없다. R2 버킷과 캐시 규칙은 필요 없다.

- 주소: `https://midnight-update.couprice.com` (`docs/src/platform/config.js`의 `updateBaseUrl`과 `workers/update/wrangler.jsonc`의 route가 같아야 한다).
- `html_handling: "none"`: `/index.html`을 `/`로 리디렉션하지 않고 모든 파일을 정확한 경로로 내준다.
- 브라우저 테스트 사이트(`wrangler.jsonc`, `docs/`)와 분리돼 있어, 테스트 배포가 출시된 앱에 나가지 않는다.

## 배포 (v86: 자동 태그)

`release` 브랜치에 푸시하면 Cloudflare Workers Builds가 루트 디렉터리 `workers/update`에서 `npx wrangler deploy`를 실행하고, 그 설정의 빌드 단계가 `tools/publish-update.cjs`로 사이트를 만든다. Git에 연결된 Worker는 자기 루트 디렉터리의 `wrangler.jsonc` 이름을 검사하므로 Worker마다 폴더를 나눴다.
릴리스 태그는 빌드가 커밋 시각(UTC)과 해시로 붙인다(`YYYYMMDD-vHHMMSS-<sha7>`). 같은 커밋으로 만든 스토어 앱과 업데이트 사이트는 같은 태그가 된다.

```sh
node tools/publish-update.cjs            # 미리 보기: dist/live-update/site만 만든다
node tools/publish-update.cjs --deploy   # 수동 배포가 필요할 때 (npx wrangler login 필요)
```

wrangler가 바뀐 파일만 올리고 새 버전으로 한 번에 전환한다. 배포 뒤 도구가 `latest.json`을 다시 읽어 버전을 확인한다.
앱은 더 늦은 커밋만 새 버전으로 본다. 이전 상태로 되돌리려면 되돌리는 커밋을 새로 만들어 배포한다.

## 코드

- `docs/src/platform/updater.js`: 플러그인 호출은 이 파일에만 있다(`Capacitor.nativePromise`). `latest.json`은 CORS 설정이 필요 없도록 네이티브 HTTP로 읽는다.
- `docs/pwa.js` 네이티브 분기: 실행 → `init()`(정상 시작 확인) → `check()`; 백그라운드 → 저장 → `apply()`.
- `capacitor.config.json`: 플러그인 수동 모드 설정. `npx cap sync` 때 플러그인이 `ota-builtin-hashes.json`을 네이티브 자산에 써서 앱 내장 파일 재사용을 빠르게 한다.

## 검증과 한계

- `tests/platform.test.cjs`: 새 릴리스 다운로드, 동시 확인 1회 처리, 같은/낮은 릴리스·오프라인·잘못된 데이터·경로 이탈 차단, `minNative`, zip 대체, 받은 번들 재사용, 이어하기 표시, 백그라운드 저장 후 적용.
- 업데이트 사이트는 로컬 `wrangler dev`로 띄워 `latest.json` 헤더, `/index.html` 200, 550개 파일 전체의 경로·해시 일치를 확인했다.
- 이 작업 환경에는 Xcode·Android SDK·Cloudflare 계정 접근이 없어 **실제 기기에서 다운로드·교체·되돌리기는 확인하지 못했다.** 첫 기기 테스트에서 확인이 필요하다.
- 업데이트를 받은 기기는 번들 사본을 하나 더 저장하므로 앱 저장 공간이 최대 약 2배가 된다. 이전 번들은 플러그인이 자동 삭제한다.
