import {
  SeennError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from './errors.js';
import type { SeennConfig } from './client.js';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  idempotencyKey?: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class HttpClient {
  private readonly config: Required<SeennConfig>;

  constructor(config: Required<SeennConfig>) {
    this.config = config;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'GET', path });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body } = options;
    const url = `${this.config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': '@seenn/node',
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return this.executeWithRetry<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof SeennError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new SeennError('Request timeout', 'TIMEOUT', 408);
          }
          throw new SeennError(error.message, 'NETWORK_ERROR', 0);
        }

        throw new SeennError('Unknown error', 'UNKNOWN', 0);
      }
    }, method === 'GET' || !!options.idempotencyKey);
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    idempotent: boolean
  ): Promise<T> {
    let lastError: Error | undefined;
    const maxRetries = idempotent ? this.config.maxRetries : 1;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except rate limits
        if (error instanceof SeennError) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            if (!(error instanceof RateLimitError)) {
              throw error;
            }
          }
        }

        // Calculate delay with exponential backoff + jitter
        if (attempt < maxRetries - 1) {
          const baseDelay = 1000; // 1 second
          const exponentialDelay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.random() * 0.2 * exponentialDelay;
          const delay = Math.min(exponentialDelay + jitter, 30000); // Max 30s

          if (this.config.debug) {
            console.log(`[seenn] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          }

          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: ErrorResponse | undefined;

    try {
      errorData = (await response.json()) as ErrorResponse;
    } catch {
      // Response might not be JSON
    }

    const message = errorData?.error?.message || response.statusText;
    const code = errorData?.error?.code || 'UNKNOWN';
    const details = errorData?.error?.details;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, details);

      case 401:
        throw new AuthenticationError(message);

      case 404:
        throw new NotFoundError('Resource', details?.id as string || 'unknown');

      case 429: {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10);
        const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);
        throw new RateLimitError(retryAfter, limit, remaining);
      }

      default:
        throw new SeennError(message, code, response.status, details);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
