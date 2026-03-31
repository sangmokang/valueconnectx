import { describe, it, expect } from 'vitest'
import { linkedinUrlSchema } from '@/lib/validation/linkedin'

describe('linkedinUrlSchema', () => {
  describe('유효한 URL 통과', () => {
    it('www 포함 표준 LinkedIn 프로필 URL을 허용한다', () => {
      const result = linkedinUrlSchema.safeParse('https://www.linkedin.com/in/john-doe')
      expect(result.success).toBe(true)
    })

    it('www 없는 LinkedIn 프로필 URL을 허용한다', () => {
      const result = linkedinUrlSchema.safeParse('https://linkedin.com/in/jane123')
      expect(result.success).toBe(true)
    })

    it('trailing slash가 있는 LinkedIn 프로필 URL을 허용한다', () => {
      const result = linkedinUrlSchema.safeParse('https://www.linkedin.com/in/user-name-extra/')
      expect(result.success).toBe(true)
    })
  })

  describe('빈 문자열 거부', () => {
    it('빈 문자열을 거부하고 "LinkedIn URL을 입력해주세요" 메시지를 반환한다', () => {
      const result = linkedinUrlSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((e) => e.message)
        expect(messages).toContain('LinkedIn URL을 입력해주세요')
      }
    })
  })

  describe('유효하지 않은 URL 형식 거부', () => {
    it('URL 형식이 아닌 문자열을 거부한다', () => {
      const result = linkedinUrlSchema.safeParse('not-a-url')
      expect(result.success).toBe(false)
    })

    it('ftp 프로토콜 LinkedIn URL은 url() 검증을 통과하지만 regex로 거부되지 않으므로 통과한다 (ftp는 유효한 URL 형식)', () => {
      // Zod .url()은 ftp:// 를 유효한 URL로 허용한다
      // ftp://linkedin.com/in/user 는 regex도 통과하므로 성공한다
      const result = linkedinUrlSchema.safeParse('ftp://linkedin.com/in/user')
      expect(result.success).toBe(true)
    })
  })

  describe('LinkedIn이 아닌 URL 거부', () => {
    it('GitHub URL을 거부하고 regex 에러 메시지를 반환한다', () => {
      const result = linkedinUrlSchema.safeParse('https://github.com/user')
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((e) => e.message)
        expect(messages).toContain(
          'LinkedIn 프로필 URL이어야 합니다 (linkedin.com/in/...)'
        )
      }
    })

    it('Twitter URL을 거부한다', () => {
      const result = linkedinUrlSchema.safeParse('https://twitter.com/user')
      expect(result.success).toBe(false)
    })
  })

  describe('linkedin.com/in/ 없는 LinkedIn URL 거부', () => {
    it('company 페이지 URL을 거부한다', () => {
      const result = linkedinUrlSchema.safeParse('https://linkedin.com/company/mycompany')
      expect(result.success).toBe(false)
    })

    it('jobs 페이지 URL을 거부한다', () => {
      const result = linkedinUrlSchema.safeParse('https://linkedin.com/jobs/view/123')
      expect(result.success).toBe(false)
    })
  })
})
