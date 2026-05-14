# Site Footer + Legal Pages (site-footer-legal)

## 스코프 (사용자 직접 요청, 2026-05-14)
- 전역 SiteFooter — RootLayout 부착, 모든 페이지 노출 (사용자 확인)
- `/privacy` — 개인정보처리방침 (한국 개인정보보호법 §30 게시 의무)
- `/terms` — 서비스 이용약관 (한국 표준 패키지, 사용자 확인)
- 회사 정보: 밸류커넥트 주식회사 · 646-87-02542 · 대표 강상모 · sangmokang@valueconnect.kr · 서울시 서초구 사평대로335, 3층 306-2호 (반포동, 금성빌딩)

## scope-gate 판정
- L-Std (신규 UI 페이지 2개 + 신규 컴포넌트 + 미들웨어 publicRoutes 1줄 추가)
- FEATURE_MANIFEST 미등재 — 법적 게시 의무 + 사용자 직접 요청으로 정당화 (out_of_slice_but_live)
- 48h 쿨다운 불필요, ADR 불필요

## AC (Given-When-Then)

### AC-1 — Footer 전역 노출 (단위 테스트)
**Given** Landing 페이지가 렌더링됐을 때
**When** Footer 영역을 본다
**Then** 다음 텍스트가 모두 존재:
- `밸류커넥트 주식회사`
- `사업자등록번호 646-87-02542`
- `대표 강상모`
- `sangmokang@valueconnect.kr` (mailto: 링크)
- `서울시 서초구 사평대로335, 3층 306-2호` (포함)
- `개인정보처리방침` link → `/privacy`
- `이용약관` link → `/terms`

### AC-2 — /privacy 페이지 (단위 테스트)
**Given** 비로그인 방문자가 `/privacy` 로 진입
**When** 페이지가 로드됨
**Then** `개인정보처리방침` heading 노출 + 처리목적·항목·보유기간·이용자권리 섹션 존재 + publicRoutes 통과 (로그인 리다이렉트 없음)

### AC-3 — /terms 페이지 (단위 테스트)
**Given** 비로그인 방문자가 `/terms` 로 진입
**When** 페이지가 로드됨
**Then** `이용약관` heading 노출 + 제1조 이상 조항 존재 + publicRoutes 통과

## 테스트 매트릭스 (Phase 2)
| AC | Level | 파일 |
|---|---|---|
| AC-1 | 단위 (jsdom) | `src/__tests__/components/site-footer.test.tsx` |
| AC-2 | 단위 (jsdom) | `src/__tests__/app/privacy.test.tsx` |
| AC-3 | 단위 (jsdom) | `src/__tests__/app/terms.test.tsx` |

E2E 스킵 — Phase 1 슬라이스 (S1~S5) 외 정적 콘텐츠 페이지.

## 파일 슬롯
- 슬롯 B: `src/components/site-footer.tsx`
- 슬롯 A: `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`
- 슬롯 A: `src/app/layout.tsx` (Footer mount)
- 슬롯 D: `src/lib/auth/routes.ts` (publicRoutes 2개 추가)
- 슬롯 H: `src/__tests__/components/site-footer.test.tsx`, `src/__tests__/app/{privacy,terms}.test.tsx`

## 안전 가드
- ADR-0001 — 멤버 UI 에 `수수료/25%/fee` 노출 금지 → Footer 본문 및 Privacy/Terms 본문에서 해당 어휘 사용 금지 (Phase 1 사용자 결제 없음으로 ToS 결제 조항 생략)
- CLAUDE.md §3 — `rounded-*` 금지 (전역 `border-radius: 0`)
- §3.0 사용자 승인 카피 — 회사 정보 5개 필드는 사용자 입력 그대로 보존, 임의 수정 금지

## Verification Tier
LIGHT — <5 핵심 파일, 정적 콘텐츠, full test pass 예상.
