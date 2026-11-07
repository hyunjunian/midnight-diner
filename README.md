# 심야식당

작은 심야식당을 운영하는 웹 게임. 현재는 함께 기획할 수 있는 최소 프로토타입입니다.

## 실행

별도의 패키지 설치 없이 `python3 -m http.server 8000 --directory docs`를 실행한 뒤 http://localhost:8000 에 접속합니다.

- `docs/index.html`: 메인 화면
- `docs/style.css`: 반응형 스타일과 식당 일러스트
- `docs/game.js`: 영업 상태, 손님 주문, 로컬 저장

현재 손님 3명의 주문 처리 → 마감 → 다음 밤 진행을 지원합니다. 저장은 브라우저별 localStorage를 사용합니다. 손님과 대사는 임시 창작 데이터입니다.

## 배포

GitHub Pages는 `main` 브랜치의 `/docs`를 배포합니다. 변경 사항을 검증하고 `main`에 커밋·푸시하면 Pages가 자동으로 갱신됩니다.

배포 주소: https://rosagkim.github.io/midnight-diner/

## 다음 기획

- 핵심 플레이: 요리 / 경영 / 손님 이야기의 비중
- 화면과 아트 스타일
- 하루 진행, 식재료, 메뉴, 손님 관계 시스템
