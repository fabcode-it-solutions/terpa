import { API_BASE_URL, REQUEST_TIMEOUT_MS, DEFAULT_RETRY_COUNT } from "@/utils/config";
import { getAuthToken } from "@/services/api/token";
import { triggerUnauthorized } from "@/services/api/events";

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: any;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Track if we're already handling a 401 to prevent multiple simultaneous logouts
let isHandling401 = false;

export class ApiClient {
  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra ?? {}),
    };
  }

  private async doFetch(url: string, init: RequestInit & { timeoutMs?: number }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T = unknown>(
    path: string,
    options: RequestInit & { timeoutMs?: number; retries?: number } = {},
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const method = (options.method ?? "GET").toUpperCase();
    const retries = options.retries ?? (method === "GET" ? DEFAULT_RETRY_COUNT : 0);

    let attempt = 0;
    let lastError: any;
    while (attempt <= retries) {
      try {
        const res = await this.doFetch(url, {
          ...options,
          headers: this.buildHeaders(options.headers),
        });

        if (res.status === 204) return null as unknown as T;

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await res.json().catch(() => ({})) : await res.text();

        if (!res.ok) {
          const err: ApiError = {
            status: res.status,
            code: (data as any)?.code,
            message: (data as any)?.message || `HTTP ${res.status}`,
            details: data,
          };

          // Handle 401 Unauthorized - force logout and redirect to login
          if (res.status === 401 && !isHandling401) {
            isHandling401 = true;

            // Perform logout (clears all stored data)
            try {
              await triggerUnauthorized();
            } catch (logoutError) {
              console.error("Error during automatic logout:", logoutError);
            } finally {
              // Reset the flag after a delay to allow for cleanup
              setTimeout(() => {
                isHandling401 = false;
              }, 1000);
            }
          }

          throw err;
        }

        return data as T;
      } catch (err: any) {
        lastError = err;
        const isAbort = err?.name === "AbortError";
        const isNetwork = isAbort || err?.status === undefined; // fetch/network issues
        if (attempt < retries && isNetwork) {
          await sleep(300 * Math.pow(2, attempt));
          attempt += 1;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  get<T = unknown>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...(options ?? {}), method: "GET" });
  }
  post<T = unknown>(path: string, body?: any, options?: RequestInit) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  put<T = unknown>(path: string, body?: any, options?: RequestInit) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  patch<T = unknown>(path: string, body?: any, options?: RequestInit) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  delete<T = unknown>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...(options ?? {}), method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
