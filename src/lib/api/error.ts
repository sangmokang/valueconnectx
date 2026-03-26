import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export function createApiError(
  status: number,
  error: string,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json({ error, code, details }, { status });
}

export function badRequest(error: string, details?: unknown) {
  return createApiError(400, error, 'BAD_REQUEST', details);
}

export function unauthorized(error = '인증이 필요합니다') {
  return createApiError(401, error, 'UNAUTHORIZED');
}

export function forbidden(error = '권한이 없습니다') {
  return createApiError(403, error, 'FORBIDDEN');
}

export function notFound(error = '리소스를 찾을 수 없습니다') {
  return createApiError(404, error, 'NOT_FOUND');
}

export function conflict(error: string) {
  return createApiError(409, error, 'CONFLICT');
}

export function serverError(error = '서버 오류가 발생했습니다') {
  return createApiError(500, error, 'INTERNAL_ERROR');
}
