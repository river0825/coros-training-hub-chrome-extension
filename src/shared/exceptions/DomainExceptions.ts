// Domain-specific exceptions
export class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainException';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidActivityDataException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ACTIVITY_DATA');
  }
}

export class AuthenticationException extends DomainException {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_FAILED');
  }
}

export class ApiException extends DomainException {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'API_ERROR');
  }
}

export class CacheException extends DomainException {
  constructor(message: string) {
    super(message, 'CACHE_ERROR');
  }
}

export class ValidationException extends DomainException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}