# v81 Capacitor 전환 (1단계)

웹 게임(`docs/`)을 Capacitor 8 iOS/안드로이드 앱 "심야식탁"(`com.couprice.midnight`)으로 묶는다.
게임 파일은 앱 안에 번들하며 원격 URL을 웹뷰로 열지 않는다. Workers/Pages 사이트는 계속 `docs/`를 그대로 서빙한다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `docs/` | 게임 원본. 브라우저 테스트 사이트가 직접 서빙 |
| `tools/build-native.cjs` | `docs/` → `www/` 복사. 목업, `sw.js`, `preview.html`, `approved.html`, 리노베이션 검토 페이지 제외 |
| `www/` | Capacitor `webDir`. 생성물이라 Git 제외 |
| `ios/`, `android/` | 네이티브 프로젝트(Git 포함). 복사된 웹 자산 폴더만 각 `.gitignore`가 제외 |
| `docs/src/platform/` | 네이티브 기능 경계: `ads.js`, `store.js`, `updater.js` |

번들러가 없어서 플랫폼 계층은 서빙 루트 안(`docs/src/platform/`)에 두고 `window.MidnightPlatform.{ads,store,updater}`로 노출한다.
게임 로직은 이 인터페이스만 호출하고, Capacitor 플러그인은 이 세 파일 안에서만 부른다.

## 1단계 동작

- 네이티브 판별: `window.Capacitor.isNativePlatform()` (Capacitor가 웹뷰에 주입하는 전역).
- 브라우저: 광고는 본 것으로, 결제는 성공으로(메모리에만 보관), 업데이트는 건너뜀.
- 네이티브: SDK가 아직 없으므로 광고·결제는 "사용 불가"를 돌려주고 아무것도 지급하지 않는다. 업데이트는 건너뜀.
- `pwa.js`는 네이티브에서 서비스 워커 등록, `version.json` 확인, 설치 안내를 모두 건너뛰고 게임만 시작한다. 설정의 설치/오프라인/전체 화면 항목은 숨긴다.
- 아직 게임 로직은 플랫폼 계층을 호출하지 않는다. 2~4단계에서 연결한다.

## 명령

```sh
npm install            # 최초 1회
npm run sync           # docs → www 복사 후 ios/android에 반영
npm run open:ios       # Xcode 열기 (Mac)
npm run open:android   # Android Studio 열기
```

`docs/`를 고친 뒤에는 항상 `npm run sync`를 다시 실행한다. 릴리스 태그는 기존대로 `node tools/set-release.cjs`를 쓴다.

## 검증

- `node --test tests/*.test.cjs`: `tests/platform.test.cjs` 5건 추가.
- `tests/browser/native-shell.cjs`: `www/`를 Capacitor 브리지를 흉내 낸 Chromium으로 열어, 서비스 워커·`version.json` 요청 없이 번들 파일만으로 인트로와 게임이 시작되는지 확인.
- 실제 기기/시뮬레이터 빌드는 이 작업 환경에 Xcode와 Android SDK가 없어 실행하지 못했다.
