import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const claude = apiKey
  ? new Anthropic({ apiKey })
  : null

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
