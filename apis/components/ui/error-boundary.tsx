"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-lg">Error en el componente</CardTitle>
            <CardDescription>
              Ha ocurrido un error inesperado en esta sección.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Intenta recargar esta sección o contacta con soporte si el
              problema persiste.
            </p>
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Detalles del error (desarrollo)
                </summary>
                <pre className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  return function WithErrorBoundaryComponent(props: T) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
