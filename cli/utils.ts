import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gold: '\x1b[33m',
}

export function c(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`
}

// Supabase client — uses service role key (bypasses RLS) when available, falls back to anon key
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = serviceKey || anonKey
  if (!url || !key) {
    console.error(c('red', '오류: NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY(또는 NEXT_PUBLIC_SUPABASE_ANON_KEY) 환경변수가 필요합니다.'))
    console.error(c('dim', '  .env.local 파일에 환경변수를 설정하세요.'))
    process.exit(1)
  }
  return createSupabaseClient(url, key)
}

// Table formatter
export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  )

  const separator = colWidths.map((w) => '-'.repeat(w + 2)).join('+')
  const formatRow = (cells: string[]) =>
    cells.map((cell, i) => ` ${(cell ?? '').padEnd(colWidths[i])} `).join('|')

  console.log(c('dim', separator))
  console.log(c('bold', formatRow(headers)))
  console.log(c('dim', separator))
  rows.forEach((row) => console.log(formatRow(row)))
  console.log(c('dim', separator))
}

// Truncate long strings
export function trunc(str: string | null | undefined, len: number): string {
  if (!str) return '-'
  return str.length > len ? str.slice(0, len - 1) + '…' : str
}
