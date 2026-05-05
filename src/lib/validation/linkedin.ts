import { z } from 'zod'

/** LinkedIn URL 검증 스키마 — 필수 입력 컨텍스트(초대 수락 등)에서 사용 */
export const linkedinUrlSchema = z
  .string()
  .min(1, 'LinkedIn URL을 입력해주세요')
  .url('올바른 URL 형식이어야 합니다')
  .regex(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, 'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)')

/**
 * 선택적 LinkedIn URL 스키마 — D-0004 (linkedin_url OPTIONAL)
 * 빈 문자열 / null / undefined 를 모두 허용하고, 입력된 경우만 형식을 검증한다.
 * 빈 문자열은 null 로 정규화하여 DB 에 저장한다.
 */
export const optionalLinkedinUrlSchema = z
  .union([
    z.literal(''),
    z.null(),
    z
      .string()
      .url('올바른 URL 형식이어야 합니다')
      .regex(
        /^https?:\/\/(www\.)?linkedin\.com\/in\//i,
        'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)'
      ),
  ])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v))
