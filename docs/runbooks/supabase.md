# Supabase 런북

## P0: DB 접속 불가

1. Supabase Dashboard → Project Status 확인
2. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 환경변수 Vercel에서 확인
3. `/api/health` 엔드포인트 상태 확인: `curl https://<domain>/api/health`
4. 복구 안 되면 Supabase 지원 티켓 제출

## P1: 마이그레이션 실패

```bash
# 현재 마이그레이션 상태 확인
supabase db diff --linked

# 특정 마이그레이션 재적용
supabase db push --linked
```

## P2: RLS 정책 오류

- `vcx_prevent_ddl` 이벤트 트리거가 DDL을 차단하는지 확인
- `supabase/migrations/012_vcx_ddl_protection.sql` 참조
- 정책 변경은 반드시 마이그레이션 파일로만 수행

## 백업

- Supabase 자동 백업: 7일 보존
- Point-in-time recovery: Dashboard → Backups
