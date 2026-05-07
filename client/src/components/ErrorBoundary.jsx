import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Class-based error boundary — catches rendering errors in any child tree
 * and shows a friendly fallback instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 py-24 text-center"
        >
          <span className="text-5xl" aria-hidden="true">😵</span>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            Go to Home
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
