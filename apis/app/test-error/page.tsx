"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useState } from "react";

function ThrowError() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("This is a test error for the error boundary");
  }

  return (
    <Button onClick={() => setShouldThrow(true)}>
      Throw Error in Component
    </Button>
  );
}

export default function TestErrorPage() {
  const [showComponentError, setShowComponentError] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Error Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Test Page-Level Error</h3>
              <Button
                onClick={() => {
                  throw new Error("This is a test page-level error");
                }}
              >
                Throw Page Error
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                Test Component Error Boundary
              </h3>
              <ErrorBoundary>
                {showComponentError ? (
                  <ThrowError />
                ) : (
                  <Button onClick={() => setShowComponentError(true)}>
                    Show Component with Error
                  </Button>
                )}
              </ErrorBoundary>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test 404 Page</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Navigate to a non-existent page:{" "}
                <code>/this-page-does-not-exist</code>
              </p>
              <Button asChild variant="outline">
                <a href="/this-page-does-not-exist">Go to 404 Page</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
