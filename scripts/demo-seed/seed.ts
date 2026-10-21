import type { DemoClient } from './common'
import { preflightSchemaCheck } from './common'
import { seedProfiles } from './profiles'
import { seedCoffee } from './coffee'
import { seedCommunity } from './community'
import { seedHiring } from './hiring'

export async function seedDemoData(admin: DemoClient) {
  console.log('🌱 ValueConnect X 더미 데이터 시딩 시작...')
  await preflightSchemaCheck(admin)
  const profiles = await seedProfiles(admin)
  const coffee = await seedCoffee(admin, profiles)
  const community = await seedCommunity(admin, profiles)
  const summary = await seedHiring(admin, profiles, coffee, community)
  console.log('🎉 시딩 완료!', summary)
}
