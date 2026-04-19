# 시스템 아키텍처 개요

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript (strict)
- **UI**: @base-ui/react + Tailwind CSS v4 + CVA
- **DB/Auth**: Supabase (PostgreSQL + RLS + Auth)
- **Deploy**: Vercel
- **Monitoring**: Sentry + Discord Alerts
- **Cache**: Upstash Redis (rate limiting)
- **Email**: Resend
- **AI**: Anthropic Claude (커피챗 브리프 생성)
- **Analytics**: Mixpanel

## 레이어 구조

```
[Client] → [Next.js Pages] → [Route Handlers] → [Supabase]
                                    ↓
                              [lib/ modules]
                              ├── auth/     (인증)
                              ├── supabase/ (DB 클라이언트)
                              ├── api/      (에러/검증)
                              ├── ai/       (Claude 브리프)
                              ├── ops/      (헬스체크/알림)
                              └── utils     (공통)
```

## 인증 흐름
1. 추천(recommendation) → 관리자 승인
2. 초대(invite) 이메일 발송 (Resend)
3. 토큰 검증 → 회원가입 → Supabase Auth
4. 미들웨어에서 세션 체크 + VCX 사용자 정보 주입

## 데이터베이스
- 23개 마이그레이션 (001~021, 013/014 중복 포함)
- DDL Protection Event Trigger 적용
- RLS 정책으로 행 수준 보안
