# 담당 | Supabase와 Vercel 설정

현재 화면은 예시 영업 문의와 담당자로 바로 둘러볼 수 있습니다. 샘플에서 등록하거나 배정한 내용은 이 브라우저에 저장됩니다. 팀이 함께 쓰려면 아래 연결 절차를 한 번 진행하세요.

## 1. Supabase 데이터베이스 준비

1. Supabase에서 프로젝트를 만듭니다.
2. **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql)의 내용을 실행합니다.
3. **Authentication → Providers → Email**을 켜고, 영업 담당자·SA·관리자가 로그인할 계정을 **Authentication → Users**에서 생성합니다.
4. 각 사용자에 대해 **Table Editor → profiles → Insert row**에서 Auth 사용자 ID, 이름, 역할, 담당 지역을 등록합니다. 문의를 등록하는 직원은 `sales`, 배정 대상은 `sa`, 관리자는 `admin` 역할로 설정합니다. (기존 `member` 역할도 SA로 인식합니다.) 지역 이름은 문의 등록 폼과 똑같이 입력합니다. 서울은 `강북`과 `강남`으로 나누고, 그 외에는 `경기`, `인천`, `부산`, `대구`, `대전`, `광주`, `기타`를 사용합니다.
5. 프로젝트의 **Project Settings → API**에서 Project URL과 `anon` 또는 `publishable` 키를 복사합니다. `service_role` 키는 브라우저에 넣지 마세요.

## 2. 앱 연결

[`app.js`](app.js) 위쪽에 있는 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 빈 값에 Supabase Project URL 및 공개 키를 넣습니다. 연결 후 이메일과 비밀번호로 로그인할 수 있습니다. `sales` 계정은 영업 문의를 등록하고 추천 SA를 선택하거나 자동 배정할 수 있습니다. `sa` 계정은 본인에게 배정된 문의를 보고 상태와 메모를 수정합니다. `admin` 계정은 전체 문의와 수동 배정을 관리합니다.

추천 순위는 문의 지역을 담당 지역으로 가진 SA를 먼저 보여주고, 같은 적합도 안에서 진행 중인 문의 수가 적은 순서로 정합니다. 지역 담당자가 없으면 전체 SA 중 진행 중인 문의 수가 가장 적은 사람부터 최대 3명을 추천합니다. 동률이면 이름순입니다. 문의 행을 누르면 상세 팝업에서 고객 정보, 영업 메모, 추천 TOP 3과 담당자별 솔루션을 확인하고 SA를 배정할 수 있습니다. SA 담당자 페이지에서 각 SA 카드를 눌러 담당 지역과 솔루션을 관리합니다. 진행 중인 건은 `계약 완료`나 `종료` 상태가 아닌 문의입니다. 대시보드와 SA 담당자 페이지의 막대그래프는 배정된 진행 건수를 보여줍니다.

기존 Supabase 프로젝트에 `profiles` 테이블이 이미 있다면, 새 버전의 `schema.sql`을 다시 실행해 `solutions` 배열 컬럼과 SA 본인 프로필 수정 정책을 추가하세요. 관리자는 모든 SA 정보를 수정하고, SA는 본인의 담당 지역과 솔루션을 수정할 수 있습니다.

기존 데이터가 있다면 profiles의 담당 지역과 sales_leads의 영업 지역에 남아 있는 `서울` 값을 실제 주소에 따라 `강북` 또는 `강남`으로 수정해주세요. 기존 주소만으로 어느 쪽인지 확정할 수 없어 자동 변환하지 않습니다.

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소에 올리고 Vercel에서 **Add New → Project**로 저장소를 가져옵니다.
2. Framework Preset은 **Other**로 설정하고 Build Command와 Output Directory는 비워 둡니다.
3. Deploy를 누르면 정적 사이트로 배포됩니다.
4. Supabase **Authentication → URL Configuration**에서 배포 주소를 Site URL 및 허용 Redirect URL에 추가합니다.

이 정적 버전은 프로젝트 주소와 공개 키가 브라우저에 들어갑니다. 데이터 접근은 SQL에 설정된 Row Level Security 정책이 보호합니다. 정책을 제거하거나 `service_role` 키를 공개하지 마세요.
