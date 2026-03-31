import { z } from 'zod'

/** LinkedIn URL 검증 스키마 — 프론트엔드와 API에서 공유 */
export const linkedinUrlSchema = z
  .string()
  .min(1, 'LinkedIn URL을 입력해주세요')
  .url('올바른 URL 형식이어야 합니다')
  .regex(/linkedin\.com\/in\//i, 'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)')
