"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            An unexpected error occurred. We've been notified and are looking into it.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;