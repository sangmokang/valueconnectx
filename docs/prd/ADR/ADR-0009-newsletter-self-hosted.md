# ADR-0009 — 뉴스레터 자체 구현 (Stibee 대체, Resend 채택)

**상태**: 제안 (48h 쿨다운 진행 중 — 2026-04-30 작성, 서명 목표 2026-05-02)
**레벨**: L-High (FEATURE_MANIFEST F-FEED AC 수정, PII 처리 정책 확장)
**작성자**: Sangmo Kang (CEO/CPO/CTO)

---

## 컨텍스트

S2 DoD는 "Stibee 뉴스레터 1회 발송"을 요구했으나, Stibee 외부 SaaS 대신 자체 구현으로 방향 전환.
이유:
- 소규모(Phase 1 수십~수백 명) 에서 외부 SaaS 비용·종속성 불필요
- 오픈/클릭 트래킹을 VCX 자체 DB에서 직접 측정 가능
- Resend가 이미 `package.json` 설치 + DNS(SPF/DKIM/DMARC) 완료 상태

## 결정

1. **발송 인프라**: Resend (Gmail API 거부 — 일일 2,000건 한도, OAuth 부담, bounce webhook 빈약)
2. **트래킹**: UUID per-recipient 토큰 기반 픽셀/리다이렉트 (JWT 거부 — 키 노출 위험)
3. **DB**: `vcx_newsletter_campaigns` + `vcx_newsletter_recipients` + `vcx_newsletter_events` (migration 023)
4. **발송 UI**: Phase 1은 CLI 스크립트 (`scripts/send-newsletter.ts`), Phase 2에 Admin UI 추가
5. **PIPA 준수**: 수신 거부 1-click (`/newsletter/unsubscribe?t=`) + RFC 8058 `List-Unsubscribe-Post` 헤더

## 영향

- `docs/sdd/FEATURE_MANIFEST.yaml` F-FEED AC: "Stibee 1회 발송" → "자체 뉴스레터 발송 인프라"
- `supabase/migrations/023_vcx_newsletter.sql` 신규
- `src/app/api/newsletter/**` 신규
- `src/app/api/webhooks/resend/**` 신규
- `scripts/send-newsletter.ts` 신규

## 트레이드오프

| 항목 | Stibee(외부) | Resend 자체 구현 |
|---|---|---|
| 설정 시간 | 수 분 | 수 시간 |
| 트래킹 | 내장 | 직접 구현 필요 |
| 비용 | 구독료 | Resend 무료 tier |
| 데이터 소유 | Stibee 서버 | VCX Supabase |
| 커스터마이징 | 제한적 | 완전 제어 |

## 서명

- [ ] 2026-05-02 이후 재서명 (48h 쿨다운 완료 후)
