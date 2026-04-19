# 운영 가이드

## 인프라

| 서비스 | 용도 | 대시보드 |
|--------|------|----------|
| Vercel | 배포/호스팅 | vercel.com/dashboard |
| Supabase | DB/Auth | supabase.com/dashboard |
| Upstash | Redis (Rate Limit) | console.upstash.com |
| Sentry | 에러 모니터링 | sentry.io |
| Resend | 이메일 | resend.com |
| Discord | 운영 알림 | 웹훅 |
| Mixpanel | 사용자 분석 | mixpanel.com |

## 배포 프로세스
1. `main` 브랜치 push → Vercel 자동 배포
2. PR → Preview 배포 자동 생성
3. 환경변수는 Vercel Dashboard에서만 관리

## 모니터링
- `/api/ops/health` — 시스템 상태 체크
- Discord 웹훅 알림 (src/lib/ops/discord.ts)
- Sentry 에러 자동 수집

## DB 마이그레이션
- `supabase/migrations/` 폴더에 순번 SQL 파일
- 현재 021번까지 존재
- 013, 014번 중복 주의 (레거시)
- DDL Protection으로 비인가 스키마 변경 차단
