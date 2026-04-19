import { config } from "../config/config.js";
import { logger } from "./logger.js";

enum BreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface BreakerStatus {
  state: BreakerState;
  failures: number;
  lastFailureTime: number;
}

/**
 * Global HTTP Client dengan pola Circuit Breaker.
 * Mencegah bot tertahan oleh API pihak ketiga yang sedang down.
 */
class HttpClient {
  private breakers = new Map<string, BreakerStatus>();

  /**
   * Melakukan request HTTP dengan perlindungan Circuit Breaker.
   */
  public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const hostname = new URL(url).hostname;
    const breaker = this.getBreaker(hostname);

    if (breaker.state === BreakerState.OPEN) {
      const now = Date.now();
      if (now - breaker.lastFailureTime > config.circuitBreakerResetTimeout) {
        breaker.state = BreakerState.HALF_OPEN;
        logger.warn(`[HTTP] Circuit Breaker for ${hostname} is now HALF-OPEN. Testing service...`);
      } else {
        throw new Error(`Circuit Breaker is OPEN for ${hostname}. Request blocked.`);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.httpTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (response.ok) {
        this.onSuccess(hostname);
        return response;
      }

      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    } catch (error: unknown) {
      this.onFailure(hostname);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request to ${hostname} timed out after ${config.httpTimeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getBreaker(hostname: string): BreakerStatus {
    if (!this.breakers.has(hostname)) {
      this.breakers.set(hostname, {
        state: BreakerState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
      });
    }
    return this.breakers.get(hostname)!;
  }

  private onSuccess(hostname: string): void {
    const breaker = this.getBreaker(hostname);
    if (breaker.state !== BreakerState.CLOSED) {
      logger.info(`[HTTP] Circuit Breaker for ${hostname} is now CLOSED. Service recovered.`);
    }
    breaker.state = BreakerState.CLOSED;
    breaker.failures = 0;
  }

  private onFailure(hostname: string): void {
    const breaker = this.getBreaker(hostname);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= config.circuitBreakerThreshold) {
      if (breaker.state !== BreakerState.OPEN) {
        logger.error(
          `[HTTP] Circuit Breaker for ${hostname} is now OPEN. High failure rate detected.`
        );
      }
      breaker.state = BreakerState.OPEN;
    }
  }
}

export { HttpClient };
export const httpClient = new HttpClient();
