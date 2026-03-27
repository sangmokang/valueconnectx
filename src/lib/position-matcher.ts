// 규칙 기반 매칭 엔진 — LLM 호출 없이 프로필과 포지션을 매칭

export interface MemberProfile {
  professional_fields: string[] | null
  years_of_experience: number | null
  industry: string | null
  bio: string | null
  location: string | null
}

export interface PositionData {
  id: string
  title: string
  company_name: string
  role_description: string
  required_fields: string[] | null
  min_experience: number | null
  industry: string | null
  location: string | null
  team_size: string | null
  salary_range: string | null
  status: string
}

export interface MatchResult {
  position: PositionData
  matchScore: number // 0~100 정수
  matchReasons: string[]
}

// 공백 분리 + 2글자 이상 토크나이저
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2)
  )
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setB = new Set(b.map((s) => s.toLowerCase()))
  const matched = a.filter((s) => setB.has(s.toLowerCase()))
  return matched.length / Math.max(a.length, b.length)
}

export function matchPositions(
  member: MemberProfile,
  positions: PositionData[]
): MatchResult[] {
  const results: MatchResult[] = positions.map((position) => {
    let rawScore = 0
    const reasons: string[] = []

    // 1) professional_fields ↔ required_fields 겹침 × 35점
    const memberFields = member.professional_fields ?? []
    const requiredFields = position.required_fields ?? []
    if (memberFields.length > 0 && requiredFields.length > 0) {
      const ratio = overlap(memberFields, requiredFields)
      const pts = Math.round(ratio * 35)
      if (pts > 0) {
        rawScore += pts
        const matched = memberFields.filter((f) =>
          requiredFields.map((r) => r.toLowerCase()).includes(f.toLowerCase())
        )
        reasons.push(`분야 일치: ${matched.slice(0, 3).join(', ')}`)
      }
    }

    // 2) years_of_experience >= min_experience × 20점
    const exp = member.years_of_experience ?? 0
    const minExp = position.min_experience ?? 0
    if (minExp === 0) {
      rawScore += 10
    } else if (exp >= minExp) {
      rawScore += 20
      reasons.push(`경력 충족: ${exp}년 (최소 ${minExp}년)`)
    } else if (exp >= minExp - 1) {
      rawScore += 8
    }

    // 3) industry 매칭 × 15점
    if (
      member.industry &&
      position.industry &&
      member.industry.toLowerCase() === position.industry.toLowerCase()
    ) {
      rawScore += 15
      reasons.push(`산업 일치: ${member.industry}`)
    }

    // 4) bio 키워드 ↔ description 키워드 겹침 × 20점
    const bioTokens = member.bio ? tokenize(member.bio) : new Set<string>()
    const descTokens = position.role_description
      ? tokenize(position.role_description)
      : new Set<string>()
    if (bioTokens.size > 0 && descTokens.size > 0) {
      const matched: string[] = []
      for (const tok of bioTokens) {
        if (descTokens.has(tok)) matched.push(tok)
      }
      const ratio = matched.length / Math.max(bioTokens.size, descTokens.size)
      const pts = Math.round(ratio * 20)
      if (pts > 0) {
        rawScore += pts
        reasons.push(`키워드 일치: ${matched.slice(0, 3).join(', ')}`)
      }
    }

    // 5) location 일치 × 10점
    if (
      member.location &&
      position.location &&
      member.location.toLowerCase() === position.location.toLowerCase()
    ) {
      rawScore += 10
      reasons.push(`지역 일치: ${member.location}`)
    }

    // 정규화 (0~100%)
    const matchScore = Math.min(100, Math.round(rawScore))

    return { position, matchScore, matchReasons: reasons }
  })

  // 스코어 내림차순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore)
}
