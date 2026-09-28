# 담당 | Supabase와 Vercel 설정

현재 화면은 예시 영업 문의와 담당자로 바로 둘러볼 수 있습니다. 샘플에서 등록하거나 배정한 내용은 이 브라우저에 저장됩니다. 팀이 함께 쓰려면 아래 연결 절차를 한 번 진행하세요.

## 1. Supabase 데이터베이스 준비

1. Supabase에서 프로젝트를 만듭니다.
2. **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql)의 내용을 실행합니다.
3. **Authentication → Providers → Email**을 켭니다. 신규 사용자는 웹사이트 회원가입에서 이름, 이메일, 비밀번호, 영업/SA 역할, 역할에 맞는 팀을 선택합니다. 가입 시 프로필이 자동으로 생성됩니다.
4. 관리자 계정은 웹사이트에서 일반 계정으로 가입한 뒤 **Table Editor → profiles**에서 해당 사용자의 `role`을 `admin`으로 변경하세요. 관리자는 프로필에서 팀과 담당자를 관리합니다. (기존 `member` 역할도 SA로 인식합니다.)
5. 프로젝트의 **Project Settings → API**에서 Project URL과 `anon` 또는 `publishable` 키를 복사합니다. `service_role` 키는 브라우저에 넣지 마세요.

## 2. 앱 연결

[`app.js`](app.js) 위쪽에 있는 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 빈 값에 Supabase Project URL 및 공개 키를 넣습니다. 회원가입과 이메일/비밀번호 로그인이 활성화됩니다. 역할별 회원가입 팀은 영업의 `강남 1팀`, `강남 2팀`, `강북 1팀`, `강북 2팀`, `전략 1팀`, `전략 2팀`, `전략 3팀`과 SA의 `DXI 1팀`, `DXI 2팀`, `BS SA팀`입니다. 회원가입에서 역할에 맞는 팀 하나를 선택해야 합니다. `sales` 계정은 영업 문의를 등록하고 추천 SA를 선택하거나 자동 배정할 수 있습니다. `sa` 계정은 본인에게 배정된 문의를 보고 상태와 메모를 수정합니다. `admin` 계정은 전체 문의와 수동 배정을 관리합니다.

가입 후 이메일 인증을 요구하려면 Supabase **Authentication → URL Configuration**에서 로컬 미리보기 주소와 배포 주소를 허용 목록에 추가하세요. 이메일 인증이 켜져 있으면 메일의 확인 링크를 누른 뒤 로그인합니다.

추천 순위는 문의 지역을 담당 지역으로 가진 SA를 먼저 보여주고, 같은 적합도 안에서 진행 중인 문의 수가 적은 순서로 정합니다. 지역 담당자가 없으면 전체 SA 중 진행 중인 문의 수가 가장 적은 사람부터 최대 3명을 추천합니다. 동률이면 이름순입니다. 문의 행을 누르면 상세 팝업에서 고객 정보, 영업 메모, 추천 TOP 3과 담당자별 솔루션을 확인하고 SA를 배정할 수 있습니다. SA 담당자 페이지에서 각 SA 카드를 눌러 담당 지역과 솔루션을 관리합니다. 진행 중인 건은 `계약 완료`나 `종료` 상태가 아닌 문의입니다. 대시보드와 SA 담당자 페이지의 막대그래프는 배정된 진행 건수를 보여줍니다.

기존 Supabase 프로젝트에 `profiles` 테이블이 이미 있다면, 새 버전의 `schema.sql`을 다시 실행해 `solutions` 배열 컬럼과 SA 본인 프로필 수정 정책을 추가하세요. 관리자는 모든 SA 정보를 수정하고, SA는 본인의 담당 지역과 솔루션을 수정할 수 있습니다.

기존 데이터가 있다면 profiles의 담당 지역과 sales_leads의 영업 지역에 남아 있는 `서울` 값을 실제 주소에 따라 `강북` 또는 `강남`으로 수정해주세요. 기존 주소만으로 어느 쪽인지 확정할 수 없어 자동 변환하지 않습니다.

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소에 올리고 Vercel에서 **Add New → Project**로 저장소를 가져옵니다.
2. Framework Preset은 **Other**로 설정하고 Build Command와 Output Directory는 비워 둡니다.
3. Deploy를 누르면 정적 사이트로 배포됩니다.
4. Supabase **Authentication → URL Configuration**에서 배포 주소를 Site URL 및 허용 Redirect URL에 추가합니다.

이 정적 버전은 프로젝트 주소와 공개 키가 브라우저에 들어갑니다. 데이터 접근은 SQL에 설정된 Row Level Security 정책이 보호합니다. 정책을 제거하거나 `service_role` 키를 공개하지 마세요.
