/** 명시적으로 지정한 시험 DB에만 fixture를 생성·정리합니다. */
import { createTestAdminClient } from '../src/lib/testing/database'
import { seedDemoData } from './demo-seed/seed'
import { cleanupDemoData } from './demo-seed/cleanup'

async function main() {
  const admin = createTestAdminClient()
  if (process.argv.includes('--cleanup')) await cleanupDemoData(admin)
  else await seedDemoData(admin)
}

main().catch((error: unknown) => {
  // SDK 오류 본문에는 주소·자격증명 등이 포함될 수 있어 원문을 출력하지 않습니다.
  const code = error instanceof Error && error.message.startsWith('[TEST_DB_TARGET]') ? '[TEST_DB_TARGET]' : '[DEMO_FAILED]'
  console.error(`${code} 시험 데이터 작업이 실패했습니다. 완료로 처리하지 않습니다.`)
  process.exitCode = 1
})
