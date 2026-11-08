export type ApiErrorKind = 'server' | 'http' | 'network' | 'schema' | 'aborted';

export class ApiError extends Error {
  readonly method: string;
  readonly kind: ApiErrorKind;
  /** Код result из ответа бэкенда (для kind = 'server') или HTTP-статус (для kind = 'http'). */
  readonly code: number | null;

  constructor(method: string, kind: ApiErrorKind, message: string, code: number | null = null, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.method = method;
    this.kind = kind;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
