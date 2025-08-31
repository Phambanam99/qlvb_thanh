/**
 * Error boundary component for văn bản đến module
 * Provides graceful error handling and recovery
 */

import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: string) => void;
}

export class DocumentErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack || "");
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Đã xảy ra lỗi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Ứng dụng đã gặp phải một lỗi không mong muốn. Vui lòng thử lại
              hoặc liên hệ với quản trị viên.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">
                  Chi tiết lỗi (chỉ hiển thị trong development):
                </p>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo && `\n${this.state.errorInfo}`}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of error boundary for functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
};
