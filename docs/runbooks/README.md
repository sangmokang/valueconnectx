# VCX 운영 런북 (Runbook Index)

> 담당: SRE/On-call (현재: Sangmo Kang)
> 갱신: 2026-05-07

## 런북 목록

| 파일 | 대상 | 심각도 범위 |
|---|---|---|
| [supabase.md](./supabase.md) | DB 장애·마이그레이션·RLS | P0–P2 |
| [vercel.md](./vercel.md) | 배포 실패·롤백 | P0–P1 |
| [anthropic.md](./anthropic.md) | AI Brief 장애·fallback | P1–P2 |
| [resend.md](./resend.md) | 초대 이메일 발송 실패 | P1–P2 |

## SLO 요약

| 지표 | 목표 |
|---|---|
| 인증 성공률 | ≥ 99.5% |
| AI Brief 생성 성공률 | ≥ 95% (fallback 포함) |
| 초대 이메일 전달률 | ≥ 99% |
| p95 API 응답 | ≤ 2000ms |
