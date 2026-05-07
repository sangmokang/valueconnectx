# Vercel 배포 런북

## P0: 배포 실패

1. Vercel Dashboard → Deployments → 최신 빌드 로그 확인
2. 로컬에서 `npm run build` 재현 시도
3. 환경변수 누락 여부 확인 (Vercel → Settings → Environment Variables)

## P1: 즉시 롤백

```bash
# 이전 정상 배포로 롤백
vercel rollback [deployment-url]
# 또는 Vercel Dashboard → Deployments → 이전 배포 → Promote to Production
```

## 환경변수 체크리스트

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 퍼블릭 API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버사이드 어드민 키 |
| `ANTHROPIC_API_KEY` | AI Brief 생성 |
| `RESEND_API_KEY` | 초대 이메일 발송 |
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
