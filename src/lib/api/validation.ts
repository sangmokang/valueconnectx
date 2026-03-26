import { ZodSchema, ZodError } from 'zod';
import { badRequest } from './error';

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: ReturnType<typeof badRequest> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        data: null,
        error: badRequest('유효하지 않은 요청입니다', e.issues),
      };
    }
    return {
      data: null,
      error: badRequest('요청 본문을 파싱할 수 없습니다'),
    };
  }
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: ReturnType<typeof badRequest> } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        data: null,
        error: badRequest('유효하지 않은 파라미터입니다', e.issues),
      };
    }
    return {
      data: null,
      error: badRequest('파라미터를 파싱할 수 없습니다'),
    };
  }
}
