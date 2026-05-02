"use client";

import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[v0] Error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "sans-serif",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              maxWidth: "500px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
            <p>The application encountered an error.</p>
            <details style={{ marginTop: "20px" }}>
              <summary style={{ cursor: "pointer" }}>Error details</summary>
              <pre
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                }}
              >
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
