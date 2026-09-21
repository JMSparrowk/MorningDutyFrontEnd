# Morning Duty Calendar Frontend

React + Vite + JavaScript. Phase 1~5 UI/API를 유지하고 Phase 6 Cognito 인증을 연결했다.

## 실행 및 인증 설정

`.env.local`과 `.env.production`에 실제 API/Cognito 값이 설정되어 있다. `$default` stage는 API URL에 붙이지 않는다.

```sh
npm install
npm run dev
```

http://localhost:5173/ 로 접속한다. 환경변수 변경 후 서버를 재시작한다.

Cognito App Client `n7q639k6url5fa8110ohb2ooc`의 Managed Login 설정:

- Identity provider: Cognito User Pool
- OAuth grant: Authorization code grant (Client Secret 없음, PKCE S256 사용)
- OpenID Connect scope: `openid` 활성화. API/custom scope는 요청하지 않는다.
- Allowed callback URLs 및 Allowed sign-out URLs 모두 다음 두 URL 등록:
  - `http://localhost:5173/`
  - `https://d88l94lniveng.cloudfront.net/`
- 제공된 Cognito Domain과 Managed Login이 이 App Client에 연결되어 있어야 한다.

API Gateway CORS에는 Origin `http://localhost:5173`, `https://d88l94lniveng.cloudfront.net`, Method GET/PATCH/POST/OPTIONS, Header Authorization/Content-Type을 허용한다. JWT Authorizer의 App Client audience와 User Pool issuer도 일치해야 한다. Authorization scopes는 비워 둔다.

## Phase 6 인증

- Route는 `/` 하나. 인증 완료 전에는 CalendarPage를 마운트하지 않는다.
- 유효한 Access Token과 갱신 가능한 Refresh Token이 없으면 매번 무작위 state/verifier와 S256 challenge를 생성하여 Cognito로 이동한다.
- Root callback에서 state 및 10분 유효기간을 검사하고 verifier로 code를 교환한다. StrictMode에서도 교환은 한 번만 실행한다.
- Access Token, ID Token, Refresh Token 및 각 만료 시각을 localStorage에 저장하여 브라우저 종료 후에도 유지한다. PKCE state/verifier와 로그인 오류 제어는 탭별 sessionStorage에 둔다. 기존 sessionStorage 토큰은 초기 접속 시 이동한다.
- 초기 접속 및 API 요청 시 Access Token 또는 ID Token이 만료 30초 이내이면 Refresh Token으로 두 토큰을 갱신한다. ID Token의 exp는 갱신 시점 계산에만 사용하며, API Authorization Bearer에는 Access Token만 사용한다.
- 동시 갱신은 한 요청으로 합치며 Web Locks 지원 브라우저에서는 탭 사이에도 갱신을 직렬화한다. Rotation 응답의 새 Refresh Token을 저장한다.
- callback의 code/state 및 오류 파라미터를 URL에서 제거한다. 일시적인 갱신 오류에는 토큰을 보존하고 재시도 UI를 제공한다. 재시도 버튼은 유효한 Refresh Token이 있으면 로그인 이동 없이 갱신을 다시 시도한다.
- 공통 Axios가 세 API 모두에 Access Token을 자동 첨부한다. 토큰/코드/verifier/Authorization 헤더를 로그로 출력하지 않는다.
- 첫 401은 갱신 후 원래 요청을 한 번 재시도한다. 재시도도 401이면 세션을 보존하고 API 오류를 반환한다. Refresh Token이 없거나 만료·취소 등으로 invalid_grant를 받으면 로그인으로 이동한다. 일시적 네트워크/서버 오류는 로그인 이동 사유가 아니다.
- Header 로그아웃은 지속 저장된 인증과 이전 세션 토큰을 제거하고 Cognito `/logout`으로 이동한다. 다른 탭에도 로그아웃을 반영하고 늦은 갱신 응답의 세션 복원을 차단한다. 환경별 Root 복귀 후 다시 Managed Login으로 이동한다.

## 테스트 및 운영 빌드

```sh
node --test tests/auth.test.mjs
npm run build
```

운영 빌드는 `.env.production`을 적용하며 결과는 `dist/`에 생성된다. `dist/` 내용을 S3 Root에 배포한다. 운영 빌드의 callback은 CloudFront이므로 localhost preview에서 로그인 검증하지 않는다.

로컬에서 로그인 → URL 정리 → Calendar 표시 → 월 이동/알림/교환 → 로그아웃을 확인한다. 실제 Swap은 일정 변경과 이메일 발송을 수행한다. 실제 계정 로그인과 운영 API 연동은 Console 설정 후 수동 확인이 필요하다.

## 구현

- DB의 `holiday`는 공휴일 표시로 유지한다. 화면은 `holiday === true` 또는 `dayOfWeek`가 SAT/SUN이면 휴일로 처리하여 클릭 및 休日 상세 표시를 허용하고 일정 교환에서 제외한다. 토요일 날짜의 파란색 표시는 유지한다.

- 공통 Axios Client가 `VITE_API_BASE_URL`을 사용하고 `GET /calendar?year=...&month=...`를 요청한다.
- 초기 월은 Asia/Tokyo의 현재 월. 이전/다음 버튼은 API `navigation`에 따라 활성화되며 연도 경계도 처리한다.
- `currentUser`, `navigation`, `days`, `changeCandidates`를 응답 그대로 사용한다. `calendarMock.js`는 기존 참고 fixture로만 유지하며 앱에서 import하지 않는다.
- 프런트엔드에서 날짜/공휴일/후보를 생성하지 않는다. 식별자가 null인 후보 및 토·일요일/휴일 후보는 Dropdown에서 제외한다.
- 조회 중 상태 표시, 실패 메시지와 재조회, 15초 요청 timeout, 화면 해제/요청 교체 시 취소 처리. API 주소 미설정 및 잘못된 응답도 오류로 표시한다. Mock으로 대체하지 않는다.
- MY_DUTY의 안내/신청 버튼을 708px 패널 하단에 고정. Dropdown 개폐 시 위치/높이를 유지하고 목록만 최대 5행 내에서 스크롤한다. 좁은 화면에서는 남은 공간에 맞춰 목록 높이만 줄어든다.
- 안내 문구는 요청한 일본어 두 문장 사이에 명시적 줄바꿈을 적용했다. 기존 글자 크기와 패널 폭을 유지하여 각 문장은 화면 폭에 따라 추가로 줄바꿈된다.
- OTHER_DUTY, HOLIDAY에는 안내와 신청 버튼을 표시하지 않는다. 기존 파란 안내 스타일 및 버튼 디자인 유지.
- 알림 Toggle은 `GET /calendar`의 `currentUser.emailNotification`에서 초기화한다.
- 클릭 시 공통 Axios Client로 `PATCH /me/notification`에 `{ "enabled": true }` 또는 `{ "enabled": false }`를 전송한다. userId는 전송하지 않는다.
- 성공 응답의 `emailNotification`으로만 갱신한다. 요청 중에는 Toggle 비활성화 및 중복 요청 차단. 실패/잘못된 응답은 기존 상태 유지와 짧은 일본어 오류를 표시하며 다시 클릭하면 재시도한다.
- 알림 저장 중 월 이동 시 PATCH가 끝난 뒤 GET을 호출하여 오래된 알림 값이 덮어쓰지 않도록 한다.
- 본인 담당일에서 유효한 후보 선택 시에만 신청 버튼 활성화. 공통 Axios로 `POST /schedule/swap`에 `{ myDate, targetDate }`만 전송한다.
- POST 중 신청/Dropdown/날짜·월 이동을 비활성화하고 중복 요청을 차단한다. 버튼은 `変更中...`으로 표시한다.
- HTTP 200 및 `{ success: true }` 확인 후 현재 표시 중인 year/month로 GET을 다시 호출한다. 로컬에서 일정을 교환하지 않으며 모든 응답 필드를 갱신하고 후보 선택을 초기화한다.
- POST 실패(409 포함)는 기존 캘린더와 선택값 유지, 짧은 일본어 오류 표시. 성공 후 GET만 실패하면 기존 재조회 버튼으로 GET만 재시도하며 POST를 반복하지 않는다.
- GET 성공 시 Asia/Tokyo 기준 오늘과 표시 월이 같고 오늘이 본인/타인 담당일 또는 휴일이면 자동 선택한다. 다른 월은 선택 초기화, 오늘이 속한 월로 돌아오면 오늘을 다시 선택한다. 담당자 없는 평일은 기본 패널 유지.
- Header/Calendar 디자인, 패널 708px 높이·하단 안내/버튼 고정, Dropdown 최대 5행 내부 스크롤 유지.

## 검증 및 확인 방법

- 주말 휴일 처리: `holiday: false`인 SAT/SUN도 선택 가능하고 휴일로 판정되는지, 담당자가 있어도 교환 후보에서 제외되는지 공통 함수 검증 완료. 미배정 평일 선택 불가, 평일 공휴일 판정, null ID 후보 제외도 확인했다.
- 해당 변경 후 인증 테스트 5개 및 운영 빌드 통과. 운영 반영 시 최신 `dist/index.html`과 `dist/assets/`를 S3 Root에 업로드하고 CloudFront 캐시를 무효화한다.

- `npm run build` 통과.
- Chrome/Playwright에서 실제 Axios 요청을 가로채 API 규격의 통제된 응답으로 검증했다. 실제 배포 API 검증과는 구분한다.
- GET 경로/쿼리, currentUser 이름·알림 상태 반영, 월·연도 이동, 로딩, 401/500/네트워크 실패/잘못된 응답/빈 배열 및 재조회 확인.
- 본인/타인/휴일 선택, ID 없는 후보 제외, 키보드 목록 스크롤 확인.
- 1448px/390px에서 Dropdown 개폐 전후 패널 높이와 안내/버튼 좌표가 동일함을 검증하고 캡처 확인. 목록과 안내가 겹치지 않으며 런타임 오류 및 가로 넘침 없음.
- 실제 환경에서는 브라우저 Network에서 요청 파라미터와 응답을 확인하고, 본인 담당일을 선택하여 위 UI 동작을 확인한다.
- Phase 4: 초기 ON/OFF, 명시적 enabled 전송, 서버가 요청과 다른 값을 응답한 경우, 중복 클릭 차단, HTTP/네트워크/응답 형식 오류 시 상태 유지, 재시도, 월 이동과 저장의 동시 동작을 통제된 응답으로 검증했다.
- 실제 API 확인: Toggle 클릭 후 Network에서 PATCH body와 응답을 확인한다. 응답 대기 중 비활성화, 성공 후 응답값 반영, 네트워크 실패 시 기존 상태 및 오류 문구를 확인한다.
- Phase 5: 브라우저를 America/Los_Angeles로 설정하고 도쿄와 날짜가 다른 시각에서 자동 선택 검증. 오늘의 본인/타인/휴일/미배정 상태 및 월 이동 후 복귀 확인.
- Phase 5: POST body에 날짜 두 개만 포함, 후보 선택 전 비활성화, 중복 차단, 409/500/네트워크 오류 시 상태 유지, POST→현재 월 GET 순서, 비현재 월 재조회, 모든 응답 필드 갱신, 후보 초기화, GET 실패 후 GET만 재시도 검증.
- 실제 환경에서는 본인 날짜와 후보를 선택하여 신청하고 Network에서 POST body 및 후속 GET year/month를 확인한다. 이 동작은 실제 담당 일정을 교환하고 양쪽 담당자에게 이메일을 보낸다.
- 검증 도구는 임시 폴더에서 실행했으며 프로젝트 의존성은 변경하지 않았다.

## 미확정 TODO

- 담당자 없는 평일의 상세 패널은 미정. 이름은 표시하되 선택을 비활성화하는 기존 동작 유지.
- API에 인접 월 날짜가 없어 월 경계는 빈 셀 유지.
- 모바일 세부 기준 확인 필요. 기존 세로 레이아웃 유지.
# MorningDutyFrontEnd
