export enum ErrorCode {
  VALIDATION_ERROR = 'INVALID_QUERY',
  RESOURCE_NOT_FOUND = 'PERSON_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetails;
  request_id: string;
  timestamp: string;
}

export const createError = (
  code: ErrorCode | string,
  message: string,
  requestId: string,
  details?: ErrorDetails
): ApiError => ({
  code,
  message,
  details,
  request_id: requestId,
  timestamp: new Date().toISOString(),
});
