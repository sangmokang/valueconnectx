type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const dbError = error as SupabaseErrorLike
  if (dbError.code === 'PGRST205' || dbError.code === '42703') return true

  const message = [dbError.message, dbError.details, dbError.hint]
    .filter(Boolean)
    .join(' ')

  return /schema cache|does not exist|could not find the table/i.test(message)
}
