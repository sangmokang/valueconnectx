import { Redis } from '@upstash/redis'

let redisInstance: Redis | null = null

export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  redisInstance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redisInstance
}
