# 시험 데이터 실행

`npm run e2e`, `npm run seed:demo`, `npm run seed:clean`, `npm run demo`는 `config/test-database.json`에 있는 로컬 시험 DB만 사용합니다. 일반 `.env.local`을 자동으로 읽지 않습니다. 기존 hosted demo DB는 차단됩니다.

격리된 로컬 Supabase를 준비한 후 셸 또는 CI에서 다음 값을 명시적으로 주입합니다.

- `NEXT_PUBLIC_SUPABASE_URL`: `http://127.0.0.1:54321` 또는 `http://localhost:54321`
- `SUPABASE_SERVICE_ROLE_KEY`: 해당 로컬 인스턴스의 관리자 키
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 해당 로컬 인스턴스의 공개 키. E2E에서 필요합니다.

`SUPABASE_URL`은 직접 seed의 대체 주소입니다. 두 URL을 함께 지정하면 같은 origin이어야 합니다. E2E 앱은 `NEXT_PUBLIC_SUPABASE_URL`이 필요합니다. 키를 문서·커밋·명령 기록에 붙여 넣지 마십시오.

E2E 앱도 로컬의 `E2E_PORT`(기본 3100)만 허용합니다. Playwright가 주입된 환경으로 새 앱을 시작합니다. `E2E_REUSE_SERVER=1`과 원격 `E2E_BASE_URL`은 오류입니다. `SKIP_DEMO_SEED=1`은 시드 실행만 생략하며 대상·필수 키 검사는 유지합니다.

로컬 주소라는 사실은 데이터 격리를 보증하지 않습니다. 운영 DB로 연결한 프록시·터널·운영 데이터 복제본을 사용하지 마십시오. 특히 `seed:clean`은 시험 DB의 여러 테이블 전체를 삭제하므로 폐기 가능한 인스턴스에서만 실행합니다.

예상하지 않은 주소나 누락된 키는 `[TEST_DB_TARGET]` 오류로 실행 전에 차단됩니다. 허용 목록을 넓히려면 시험 환경과 운영 환경의 분리를 확인하고 별도 변경으로 리뷰해야 합니다.

현재 cleanup은 일부 DB 오류를 무시하고 종료값 0을 반환할 수 있습니다. 주소 제한 통과나 종료값만으로 정리 성공을 판단하지 마십시오. 오류 전파·삭제 범위 제한은 후속 W02b 대상이며, 그 검증 전 실제 데이터로 seed/cleanup을 실행하지 않습니다.
