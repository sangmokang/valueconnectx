# Anthropic AI Brief 런북

## P1: AI Brief 생성 실패

AI Brief 생성 실패 시 `PreBriefCard`는 자동으로 skeleton fallback을 표시합니다.

**증상**: 커피챗 수락 후 Brief가 계속 로딩 상태
**확인**:
1. Sentry에서 `AI Brief generation failed` 에러 확인
2. `ANTHROPIC_API_KEY` 환경변수 유효성 확인
3. Anthropic 상태 페이지 확인 (status.anthropic.com)

**임시 조치**: fallback UI가 자동 표시되므로 사용자 플로우 차단 없음

## P2: API 예산 초과

- Anthropic Console → Usage 확인
- Brief 생성 빈도 검토 (`src/app/api/coffeechat/brief/route.ts`)
- 필요 시 rate limiter 임계값 조정 (`src/lib/rate-limit.ts`)
