import { daysAgo, pick, checkResult, type DemoClient } from './common'
import type { seedProfiles } from './profiles'
import { randomUUID } from 'node:crypto'

export async function seedCommunity(admin: DemoClient, profiles: Awaited<ReturnType<typeof seedProfiles>>) {
  const { memberIds, corpIds } = profiles
  // ── 7. Community Posts ──
  console.log('💬 커뮤니티 게시글 생성 중...')
  const communityPosts = [
    { category: 'career', title: '10년차 개발자, 매니지먼트 vs 아키텍트 고민', content: '개발 10년차입니다. 최근 EM 오퍼와 Staff Engineer 오퍼를 동시에 받았는데, 어떤 길이 더 나을지 고민됩니다.\n\nEM은 팀 빌딩과 피플 매니지먼트를 해야 하고, Staff Engineer는 기술 방향을 리드하는 역할입니다.\n\n비슷한 갈림길에 서보신 분들의 경험담을 듣고 싶습니다. 특히 매니지먼트로 갔다가 다시 IC로 돌아오신 분 계신가요?', anonymous: false },
    { category: 'salary', title: '시리즈 B 스타트업 VP of Engineering 연봉 수준', content: '시리즈 B 스타트업에서 VP of Engineering 오퍼를 받았습니다. 현금 1.8억 + 스톡옵션 제안인데, 시장 수준에 맞는지 감이 안 잡힙니다.\n\n비슷한 포지션에 계신 분들의 의견을 구합니다. (당연히 회사마다 다르겠지만 레인지라도 알면 좋겠습니다)', anonymous: true },
    { category: 'leadership', title: '새로 합류한 팀에서 신뢰를 쌓는 법', content: '최근 새 회사에 디렉터로 합류했습니다. 기존 팀원들이 이전 리더를 좋아했던 상황에서 어떻게 신뢰를 쌓아야 할지 고민입니다.\n\n첫 90일 계획을 세우고 있는데, 비슷한 경험이 있으신 분들의 조언을 구합니다.\n\n현재 시도 중인 것:\n- 1:1 미팅으로 각자의 목표와 고민 파악\n- 빠른 성과보다는 경청과 이해에 집중\n- 기존 프로세스 유지하면서 점진적 개선', anonymous: false },
    { category: 'burnout', title: '번아웃 극복 경험 공유', content: '6개월간의 크런치 모드 후 심각한 번아웃을 겪었습니다. 아침에 일어나기 싫고, 코드를 보면 한숨이 나오는 상태까지 왔어요.\n\n결국 2주간 리프레시 휴가를 쓰고, 업무 방식을 완전히 바꿨습니다.\n\n제가 효과를 본 방법들:\n1. 칼퇴근 실천 (야근 제로 선언)\n2. 주말 코딩 금지\n3. 운동 루틴 확립 (주 3회 러닝)\n4. 사이드 프로젝트 중단\n\n번아웃 경험과 극복 방법을 공유해주세요.', anonymous: false },
    { category: 'productivity', title: 'AI 코딩 도구 실사용 후기 — Cursor vs Claude Code', content: '3개월간 Cursor와 Claude Code를 병행 사용한 후기입니다.\n\nCursor:\n- 에디터 내 자동완성이 자연스러움\n- Tab 완성의 정확도가 높음\n- 복잡한 리팩토링은 아직 부족\n\nClaude Code:\n- CLI 기반이라 워크플로우 유연\n- 멀티파일 변경에 강함\n- 아키텍처 수준 작업에 탁월\n\n결론: 일상적 코딩은 Cursor, 큰 작업은 Claude Code 조합이 최강이라고 느낍니다.\n\n다른 분들의 경험도 궁금합니다!', anonymous: false },
    { category: 'company_review', title: '네이버 vs 카카오 2026년 개발 문화 비교', content: '두 회사 모두 경험한 입장에서 2026년 기준 개발 문화를 비교해봅니다.\n\n네이버:\n- 조직별 자율성 높음\n- 기술 스택 선택 자유\n- 사내 오픈소스 문화 정착\n\n카카오:\n- 최근 조직 개편으로 효율성 강조\n- 카카오 클라우드 전환 중\n- 개발자 커리어 레벨 체계 정비\n\n두 회사 모두 좋은 점과 아쉬운 점이 있습니다. 선택은 본인의 가치관과 맞는 곳으로!', anonymous: true },
    { category: 'career', title: '외국계 vs 국내 테크 기업 — 시니어 레벨에서의 차이', content: '외국계 3년, 국내 대기업 5년, 스타트업 4년을 거쳤습니다.\n\n시니어 레벨에서 느끼는 핵심 차이:\n\n외국계:\n- 개인 성과 중심, IC 트랙이 확실함\n- 글로벌 프로젝트 참여 기회\n- 연봉 상한이 높음\n\n국내 대기업:\n- 팀 성과 중심, 리더십 트랙 자연스러움\n- 한국 시장 깊이 이해 가능\n- 안정성과 복지\n\n스타트업:\n- 임팩트 크지만 리스크도 큼\n- 성장 속도 빠름\n- 스톡옵션 변수\n\n지금 커리어 선택을 고민 중인 분들에게 도움이 되면 좋겠습니다.', anonymous: false },
    { category: 'leadership', title: '원격근무 팀의 성과 관리 노하우', content: '완전 원격 팀을 3년째 리드하고 있습니다. 시행착오를 거쳐 정착한 방법들을 공유합니다.\n\n1. OKR 기반 목표 설정 (분기별)\n2. 주간 스탠드업은 비동기 (Slack 스레드)\n3. 월 1회 오프라인 워크샵\n4. 1:1은 주 1회 30분 고정\n5. 성과 리뷰는 동료 평가 포함\n\n가장 중요한 건 "결과로 평가하되, 과정에서 소통하라"입니다.\n\n원격근무 팀 리더분들의 노하우도 공유해주세요!', anonymous: false },
    { category: 'salary', title: 'PM 직군 연봉 테이블 공유 (2026)', content: '주변 PM/PO 분들과 정보를 취합해봤습니다. (서울 기준)\n\n주니어 (1-3년): 4500-6500만원\n미드레벨 (3-6년): 6500-9000만원\n시니어 (6-10년): 9000-1.3억\nHead of Product (10년+): 1.3-2억\n\n스타트업은 스톡옵션 포함 시 상한이 더 높을 수 있고, 대기업은 상여금 포함 기준입니다.\n\n다른 분들의 체감과 어떻게 다른지 궁금합니다.', anonymous: true },
    { category: 'productivity', title: '개발팀 온보딩 프로세스 자동화 사례', content: '새 멤버가 합류할 때마다 반복되는 온보딩 작업을 자동화한 경험을 공유합니다.\n\n자동화한 항목:\n- Slack 채널 초대 (봇)\n- GitHub 팀/리포 접근 권한 (Terraform)\n- 개발 환경 셋업 스크립트 (Docker + Make)\n- 온보딩 체크리스트 (Notion 템플릿 자동 복제)\n- 멘토 자동 매칭 (라운드 로빈)\n\n결과: 온보딩 시간 3일 → 4시간으로 단축\n\n비슷한 경험이나 더 좋은 방법이 있으면 공유 부탁드립니다!', anonymous: false },
  ]

  const postIds: string[] = []
  const allMemberIds = memberIds.filter(id => !corpIds.includes(id))

  for (const post of communityPosts) {
    const postId = randomUUID()
    postIds.push(postId)
    const authorId = pick(allMemberIds)
    checkResult(await admin.from('community_posts').insert({
      id: postId,
      author_id: authorId,
      category: post.category,
      title: post.title,
      content: post.content,
      is_anonymous: post.anonymous,
      status: 'active',
      created_at: daysAgo(Math.floor(Math.random() * 25) + 1),
    }))
    console.log(`  ✅ [${post.category}] ${post.title}`)
  }
  console.log()

  // ── 8. Community Comments ──
  console.log('💭 커뮤니티 댓글 생성 중...')
  const commentTexts = [
    '정말 공감됩니다. 저도 비슷한 경험이 있어서 공유하자면, 결국 자신이 더 열정을 느끼는 방향으로 가는 게 맞는 것 같습니다.',
    '좋은 글 감사합니다. 저는 조금 다른 관점인데, 팀과 회사의 상황도 중요한 변수라고 생각해요.',
    '이 부분 정말 중요한 포인트네요. 저도 최근 같은 고민을 하고 있었는데 도움이 됩니다.',
    '경험에서 우러나온 조언이라 더 와닿습니다. 감사합니다!',
    '혹시 이 부분에 대해 좀 더 구체적으로 설명해주실 수 있을까요? 실제 사례가 궁금합니다.',
    '완전 동의합니다. 특히 마지막 부분이 핵심이라고 생각해요.',
    '저도 비슷한 시도를 했는데, 한 가지 추가하자면 팀원들의 피드백을 주기적으로 수집하는 것도 효과적이었습니다.',
    '좋은 인사이트 공유 감사합니다. 북마크해둡니다.',
    '이런 솔직한 공유가 이 커뮤니티의 가치라고 생각합니다. 저도 제 경험을 나중에 정리해서 올려볼게요.',
    '반대 의견일 수 있지만, 저는 오히려 반대 접근이 효과적이었어요. 상황에 따라 다를 수 있겠지만요.',
  ]

  for (const postId of postIds) {
    const numComments = pick([1, 2, 3, 4, 5])
    for (let c = 0; c < numComments; c++) {
      const authorId = pick(allMemberIds)
      checkResult(await admin.from('community_comments').insert({
        id: randomUUID(),
        post_id: postId,
        author_id: authorId,
        content: pick(commentTexts),
        is_anonymous: Math.random() < 0.3,
        status: 'active',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      }))
    }
  }

  // 댓글 수 업데이트 (트리거가 있지만 직접 insert라 수동 업데이트)
  for (const postId of postIds) {
    const { count } = checkResult(await admin.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).eq('status', 'active'))
    checkResult(await admin.from('community_posts').update({ comments_count: count || 0 }).eq('id', postId))
  }
  console.log(`  ✅ 게시글 ${postIds.length}개에 댓글 생성 완료\n`)

  // ── 9. Community Reactions (likes) ──
  console.log('❤️ 좋아요 생성 중...')
  for (const postId of postIds) {
    const numLikes = pick([2, 4, 6, 8, 10, 12])
    const likers = [...allMemberIds].sort(() => Math.random() - 0.5).slice(0, Math.min(numLikes, allMemberIds.length))
    for (const userId of likers) {
      checkResult(await admin.from('vcx_community_reactions').insert({
        id: randomUUID(),
        post_id: postId,
        user_id: userId,
        reaction_type: 'like',
        created_at: daysAgo(Math.floor(Math.random() * 20)),
      }))
    }
    // likes_count 업데이트
    const { count } = checkResult(await admin.from('vcx_community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', postId))
    checkResult(await admin.from('community_posts').update({ likes_count: count || 0 }).eq('id', postId))
  }
  console.log(`  ✅ 좋아요 생성 완료\n`)

  return { allMemberIds, postIds }
}
