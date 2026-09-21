# Morning Duty Calendar Frontend Spec

````md

## 1. 프로젝트 개요

사내 아침 조례(朝礼) 담당자 일정을 확인하고 변경하는 React SPA.

주요 기능:

- Cognito 로그인
- 월별 조례 담당자 Calendar 조회
- 본인 / 타인 / 휴일 상태 표시
- 본인 담당일과 다른 담당일 교환
- 이메일 알림 ON/OFF
- 로그아웃

Frontend는 React로 구현하고 빌드 결과를 S3 Root에 배치한다.

서비스 진입 URL은 별도 `/home` Route를 사용하지 않고 CloudFront Root를 사용한다.

```text
https://<CloudFront Domain>/
````

Backend는 별도 `Morning Duty Calendar API Spec`을 기준으로 한다.

---

# 2. Architecture

```text
Browser
  ↓
CloudFront
  ↓
S3 React SPA
  ↓
Cognito Login
  ↓
React
  ↓
API Gateway HTTP API
  ↓
JWT Authorizer
  ↓
Morning Duty Calendar API Lambda
  ↓
DynamoDB
```

Frontend는 Cognito Access Token을 API 요청에 포함한다.

```text
Authorization: Bearer <ACCESS_TOKEN>
```

JWT 검증은 API Gateway JWT Authorizer가 처리한다.

---

# 3. 기술 스택

* React
* Vite
* JavaScript
* Axios
* React Router
* CSS

사용하지 않음:

* Redux
* Zustand
* Material UI
* Ant Design
* Bootstrap

초기 상태 관리는 다음을 사용한다.

* useState
* useEffect
* props

---

# 4. UI 기준

다음 이미지 3개를 기준으로 화면을 작성한다.

```text
~/Downloads/nddProject/img1.png
~/Downloads/nddProject/img2.png
~/Downloads/nddProject/img3.png
```

구현 전에 반드시 이미지들을 확인한다.

이미지를 기준으로 다음을 맞춘다.

* 전체 Layout
* Header
* Calendar
* Detail Panel
* 카드 크기
* Padding
* Border
* Radius
* Font 크기
* 상태별 색상

새로운 UI를 임의로 추가하지 않는다.

---

# 5. Application Route

Frontend의 Main Route는 하나만 사용한다.

```text
/
```

사용자가 다음 주소로 접속하면:

```text
https://<CloudFront Domain>/
```

React Application이 시작된다.

별도 `/home` Route는 만들지 않는다.

---

# 6. Cognito 로그인 흐름

사용자가 `/`에 접근하면 로그인 상태를 확인한다.

```text
/
↓
Access Token 확인
↓
Token 있음
→ Calendar 표시

Token 없음
↓
URL에 ?code 존재 여부 확인
```

`code`가 없는 경우:

```text
Cognito Login으로 Redirect
```

로그인 성공 후 Cognito는 다시 Frontend Root로 Redirect한다.

```text
https://<CloudFront Domain>/?code=xxxx
```

React는 `/`에서 Authorization Code를 읽는다.

```text
?code=xxxx
↓
Cognito Token Endpoint 호출
↓
Access Token / ID Token 획득
↓
Token 저장
↓
URL의 ?code 제거
↓
Calendar 표시
```

Callback 전용 Route는 만들지 않는다.

---

# 7. Cognito Callback URL

개발 환경:

```text
http://localhost:5173/
```

운영 환경:

```text
https://<CloudFront Domain>/
```

Cognito App Client에도 동일한 Callback URL을 등록한다.

Logout URL도 동일하게 Root를 사용한다.

```text
https://<CloudFront Domain>/
```

---

# 8. 환경변수

```env
VITE_API_BASE_URL=

VITE_COGNITO_DOMAIN=
VITE_COGNITO_CLIENT_ID=

VITE_COGNITO_REDIRECT_URI=
VITE_COGNITO_LOGOUT_URI=
```

개발 예:

```env
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

운영 예:

```env
VITE_COGNITO_REDIRECT_URI=https://<CloudFront Domain>/
VITE_COGNITO_LOGOUT_URI=https://<CloudFront Domain>/
```

CloudFront Domain이 생성된 후 운영 환경변수를 확정한다.

Vite 환경변수는 Build 시 적용된다.

---

# 9. Header

왼쪽:

```text
朝礼当番カレンダー
当番確認・変更
```

오른쪽:

```text
ログイン中: ジョン
[ログアウト]

メール通知 [ON/OFF]
```

표시하지 않음:

* 회사 Logo
* 종 Icon
* 기타 Notification Icon

---

# 10. Calendar

Calendar UI는 참고 이미지 그대로 유지한다.

기능:

* 이전 월
* 다음 월
* 날짜 Grid
* 담당자명
* 주말 표시
* 공휴일 표시
* 선택 상태

본인 담당일:

```text
파란색
```

다른 사용자:

```text
회색
```

휴일:

```text
연한 빨간색
```

Calendar 아래 별도 통계 UI는 만들지 않는다.

---

# 11. Backend API

Frontend는 다음 API만 사용한다.

```text
GET   /calendar
PATCH /me/notification
POST  /schedule/swap
```

API 구조는 Backend `Morning Duty Calendar API Spec`을 따른다.

Frontend에서 Endpoint를 임의로 추가하지 않는다.

---

# 12. GET /calendar

Request:

```http
GET /calendar?year=2026&month=9
```

Response 주요 데이터:

```text
currentUser
navigation
days
changeCandidates
```

Frontend는 Backend에서 반환된 데이터를 사용한다.

Calendar 날짜를 Frontend에서 별도로 생성하지 않는다.

---

# 13. Calendar Day 판정

Backend Response의:

```text
mine
holiday
hasSchedule
assignedUserId
assignedUserName
```

을 사용한다.

본인 담당일:

```text
mine == true
```

다른 사용자:

```text
mine == false
hasSchedule == true
holiday == false
```

휴일:

```text
holiday == true
```

---

# 14. assignedUserId / assignedUserName

`assignedUserId`는 사용자 식별용이다.

`assignedUserName`은 화면 표시용이다.

다음 데이터가 존재할 수 있다.

```json
{
  "assignedUserId": null,
  "assignedUserName": "旧ユーザー"
}
```

이 경우:

* Calendar에는 이름 표시 가능
* 실제 사용자로 판단하지 않음
* 변경 후보에 포함하지 않음

변경 후보는 반드시:

```text
assignedUserId != null
```

이어야 한다.

`assignedUserName`만으로 사용자 여부를 판단하지 않는다.

---

# 15. Detail Panel

오른쪽 Panel은 세 상태를 가진다.

```text
MY_DUTY
OTHER_DUTY
HOLIDAY
```

## MY_DUTY

```text
当番変更

現在の担当日

2026/09/18 (金)
ジョン

変更先の日付
[ Dropdown ]

[ 変更を申請 ]
```

파란색 스타일.

표시하지 않음:

* 변경 이유
* textarea
* 취소 버튼

## OTHER_DUTY

```text
当番変更

現在の担当日

2026/09/16 (水)
松田
```

회색 스타일.

그 아래는 빈 공간.

## HOLIDAY

```text
当番変更

現在の担当日

2026/09/21 (月・祝)
休日

敬老の日
```

빨간색 스타일.

그 아래는 빈 공간.

---

# 16. 변경 후보 Dropdown

Backend의 `changeCandidates`를 사용한다.

표시 예:

```text
09月22日 (火) - 内海
09月24日 (木) - 浅利
09月25日 (金) - 松田
```

한 번에 최대 5개 표시.

5개 초과 시 Scroll.

Frontend에서도 다음 데이터는 제외한다.

```text
assignedUserId == null
```

`assignedUserName`이 있어도 `assignedUserId`가 없으면 후보에 포함하지 않는다.

---

# 17. Schedule Swap

API:

```http
POST /schedule/swap
```

Request:

```json
{
  "myDate": "2026-09-24",
  "targetDate": "2026-10-01"
}
```

userId는 보내지 않는다.

현재 사용자는 JWT로 Backend에서 식별한다.

성공 후:

```text
POST /schedule/swap
↓
200
↓
GET /calendar
```

Calendar를 다시 조회한다.

Frontend에서 Calendar 데이터를 직접 수정하지 않는다.

---

# 18. 이메일 알림

API:

```http
PATCH /me/notification
```

Request:

```json
{
  "enabled": true
}
```

성공 Response의:

```text
emailNotification
```

값을 사용하여 Toggle 상태를 갱신한다.

---

# 19. 로그아웃

로그아웃 버튼 클릭 시:

```text
저장된 Token 제거
↓
Cognito Logout
↓
/
```

최종 Logout Redirect:

```text
https://<CloudFront Domain>/
```

다시 `/`로 돌아온 뒤 Token이 없으므로 Cognito Login 화면으로 이동한다.

---

# 20. API Client

공통 Axios Client를 사용한다.

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});
```

API 요청 시:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

을 자동 추가한다.

API URL을 Component 안에 직접 작성하지 않는다.

---

# 21. 프로젝트 구조

```text
morning-duty-frontend/
├── spec.md
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── api/
│   │   ├── apiClient.js
│   │   ├── calendarApi.js
│   │   ├── notificationApi.js
│   │   └── scheduleApi.js
│   │
│   ├── auth/
│   │   └── cognito.js
│   │
│   ├── pages/
│   │   └── CalendarPage.jsx
│   │
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Calendar.jsx
│   │   ├── CalendarCell.jsx
│   │   ├── DetailPanel.jsx
│   │   └── ChangeCandidateDropdown.jsx
│   │
│   └── styles/
│       ├── global.css
│       └── calendar.css
└── public/
```

별도 Callback Page는 만들지 않는다.

Callback 처리는 `/` 진입 시 Authentication Logic에서 처리한다.

---

# 22. 구현 순서

## Phase 1

React / Vite 프로젝트 생성.

* 프로젝트 구조
* CSS
* 이미지 기반 기본 Layout

---

## Phase 2

Mock Data를 사용하여 UI 구현.

* Header
* Calendar
* MY_DUTY
* OTHER_DUTY
* HOLIDAY
* Dropdown

---

## Phase 3

`GET /calendar` 연결.

* currentUser
* navigation
* days
* changeCandidates

---

## Phase 4

`PATCH /me/notification` 연결.

메일 알림 Toggle 구현.

---

## Phase 5

`POST /schedule/swap` 연결.

성공 후 `/calendar` 재조회.

---

## Phase 6

Cognito 인증 연결.

구현:

* `/` 접근 시 Token 확인
* Token 없고 `code`도 없으면 Cognito Login Redirect
* `/?code=...` Callback 처리
* Authorization Code → Token 교환
* Access Token 저장
* URL에서 `code` 제거
* API Authorization Header
* Logout

Callback 전용 Route는 추가하지 않는다.

---

# 23. 구현 원칙

* Main Route는 `/` 하나만 사용한다.
* `/home`을 만들지 않는다.
* Callback Route를 별도로 만들지 않는다.
* Cognito Callback도 `/`를 사용한다.
* 이미지 3개를 UI 기준으로 한다.
* Backend API Spec을 우선한다.
* Endpoint를 임의로 추가하지 않는다.
* 사용자 식별은 assignedUserId 기준이다.
* assignedUserName은 표시용이다.
* assignedUserId가 없는 사용자는 변경 후보에서 제외한다.
* Swap 성공 후 GET /calendar를 다시 호출한다.
* Cognito Access Token을 API 요청에 사용한다.
* 요구사항에 없는 기능은 추가하지 않는다.

---

# 24. Codex 작업 지시

구현 전에 다음을 반드시 확인한다.

```text
Frontend spec.md
Backend Morning Duty Calendar API Spec

~/Downloads/nddProject/img1.png
~/Downloads/nddProject/img2.png
~/Downloads/nddProject/img3.png
```

구현은 Phase 순서대로 진행한다.

중요:

* 이미지 기준 Layout을 유지한다.
* Main Page는 `/`이다.
* Callback도 `/`에서 처리한다.
* Backend API와 실제 통신 가능하게 작성한다.
* Endpoint를 추측해서 만들지 않는다.
* 애매한 부분은 TODO로 남긴다.

````