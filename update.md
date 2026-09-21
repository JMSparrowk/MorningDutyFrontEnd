# 작업 기록

## 2026-09-21 — 브라우저 종료 후 로그인 유지 및 ID Token 갱신

### 개요
- 앞선 탭 단위 저장 방식을 변경하여 브라우저를 닫고 다시 접속해도 로그인 세션을 복원한다. 아래의 이전 sessionStorage 작업 기록보다 이 항목이 최신 동작이다.
- Cognito의 Refresh Token 유효기간을 활용하며 프런트엔드에 90일을 하드코딩하거나 Cognito 설정을 변경하지 않는다.

### 작업 내용
- `src/auth/cognito.js`: Access Token, ID Token, Refresh Token과 Access/ID Token 만료 시각을 localStorage에 저장한다. PKCE state/verifier 및 로그인 오류 제어 값은 sessionStorage에 유지한다.
- 기존 sessionStorage의 인증 토큰은 초기 접속 시 localStorage로 이동하고 이전 복사본을 삭제한다. 기존 Refresh Token이 남아 있으면 이를 이용해 ID Token도 발급받는다.
- 초기 접속과 API 요청 시 두 토큰의 만료를 확인한다. 어느 하나라도 만료까지 30초 이하이면 `/oauth2/token`의 `refresh_token` grant로 Access/ID Token을 함께 갱신한다. 브라우저가 닫혀 있는 동안에는 요청하지 않고 재접속할 때 갱신한다.
- ID Token의 JWT exp는 갱신 시점 계산에만 사용한다. API Gateway에는 계속 Access Token을 `Authorization: Bearer`로 전송한다.
- Refresh Token Rotation 지원을 유지하며, Web Locks 지원 브라우저에서는 여러 탭의 갱신을 직렬화하고 잠금 획득 후 최신 토큰을 다시 읽는다. 미지원 환경에서도 같은 탭의 중복 갱신과 오래된 응답 덮어쓰기를 방지한다.
- API 401은 갱신 후 한 번만 재시도한다. 재시도도 401인 경우 토큰을 지우거나 로그인으로 이동하지 않고 API 오류를 표시한다.
- Refresh Token이 만료·취소되어 Cognito가 `invalid_grant`를 반환하거나, 최초 접속/저장소 삭제 등으로 갱신 자격 증명이 없으면 로그인 흐름으로 이동한다.
- 네트워크/서버 오류에는 저장된 토큰을 유지한다. `AuthGate.jsx`의 오류 화면과 버튼을 재시도로 변경하여 갱신 오류 후 로그인 없이 다시 시도할 수 있다.
- 로그아웃하면 localStorage와 이전 sessionStorage 토큰을 지우고 Cognito `/logout`으로 이동한다. 다른 탭에도 로그아웃을 반영하며 진행 중이던 갱신 응답으로 세션이 되살아나지 않게 한다.
- README의 인증 동작 설명을 최신 구현에 맞췄다.

### 검증
- `node --test tests/auth.test.mjs`: 15개 테스트 통과.
- 새 sessionStorage와 유지된 localStorage를 이용한 브라우저 재접속 모사, ID Token 단독 만료, 기존 세션 이동, 만료된 Refresh Token, 일시적 오류 재시도, API Bearer 토큰, 반복 401, Rotation, 탭 간 잠금 및 로그아웃 경합을 검증했다.
- `git diff --check`: 통과.
- 최종 운영 빌드: `npm run build`, 결과물 `dist/`.
- 실제 Cognito 계정으로 브라우저 재시작/장기간 유지 검증 및 운영 배포는 수행하지 않았다.

### 참고
- 같은 브라우저 프로필과 사이트 주소에서 저장소가 유지되어야 한다. 사이트 데이터 삭제 또는 시크릿 모드 종료 시에는 다시 로그인이 필요하다.
- 갱신 응답 규격: [AWS Cognito Token endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html).

## 2026-09-21 — Cognito 리프레시 토큰 자동 갱신

### 개요
- 기존 구현은 로그인 응답의 Access Token만 저장하고 Refresh Token은 버렸다. 따라서 Access Token이 만료되면 Cognito의 Refresh Token 유효기간이 90일이어도 재로그인으로 이동했다.
- Refresh Token을 사용해 Access Token을 자동 갱신하도록 변경했다. Cognito 설정 자체는 변경하지 않았다.

### 작업 내용
- `src/auth/cognito.js`: Access Token, 만료 시각, Refresh Token을 sessionStorage에 저장한다. ID Token은 저장하지 않는다.
- API 요청 시 만료까지 30초 이하이면 `/oauth2/token`에 `grant_type=refresh_token`으로 갱신한다. 페이지 새로고침 시에도 저장된 Refresh Token으로 인증을 복구한다.
- 동시에 발생한 갱신 요청은 하나로 합친다. Refresh Token Rotation 응답이 있으면 새 토큰으로 교체하고, 없으면 기존 토큰을 유지한다.
- `src/api/apiClient.js`: API 401 발생 시 갱신하고 원래 요청을 한 번만 재시도한다. 이미 다른 요청이 토큰을 갱신했다면 해당 토큰을 재사용한다.
- Refresh Token이 없거나 `invalid_grant`로 무효 판정되면 로그인 복구 흐름을 사용한다. 재시도도 401이면 기존 재로그인 및 반복 이동 방지 처리를 적용한다.
- 일시적인 네트워크/서버 오류에는 토큰을 유지하여 다음 요청에서 다시 갱신할 수 있게 한다. 로그아웃 중 도착한 갱신 응답이 인증을 복원하지 않도록 방지한다.
- README 인증 설명과 인증 회귀 테스트를 갱신했다.

### 검증
- `node --test tests/auth.test.mjs`: 9개 테스트 통과.
- 검증 범위: 기존 PKCE/콜백/로그아웃, 만료 및 새로고침 갱신, 동시 요청, Rotation, 일시적 실패와 무효 토큰, 로그아웃 경합, 401 재시도 제한.
- `git diff --check`: 통과.
- 최종 빌드 명령: `npm run build` (`dist/` 출력).
- 실제 Cognito 계정을 통한 1시간 경과 및 90일 유지 검증은 수행하지 않았다.

### 적용 시 참고
- 기존 로그인 세션에는 Refresh Token이 저장되어 있지 않으므로 변경 반영 후 한 번은 다시 로그인해야 한다.
- sessionStorage를 사용하므로 탭을 닫은 후에도 90일간 로그인이 유지되는 기능은 아니다. 해당 세션에서 Refresh Token이 유효한 동안 자동 갱신한다.
