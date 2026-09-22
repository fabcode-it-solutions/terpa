"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-neutral-100 dark:bg-neutral-900/60">
          <a href="/">
            <img
              src="/logo-white.svg"
              className="h-14 hidden dark:block"
              alt="logo"
            />
            <img
              src="/logo-black.svg"
              className="h-14 block dark:hidden"
              alt="logo"
            />
            <h1 className="sr-only">Terpa</h1>
          </a>

          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border">
              <div className="text-center">
                <div className="mx-auto mb-4 text-6xl font-bold text-red-500">
                  500
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Error interno del servidor
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Ha ocurrido un error inesperado. Nuestro equipo ha sido
                  notificado.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={reset}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Intentar de nuevo
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Volver al inicio
                  </button>
                </div>
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500">
                      Detalles del error (desarrollo)
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
                      {error.message}
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const isDark =
                document.documentElement.classList.contains("dark");
              document.documentElement.classList.toggle("dark", !isDark);
            }}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>
        </div>
      </body>
    </html>
  );
}
