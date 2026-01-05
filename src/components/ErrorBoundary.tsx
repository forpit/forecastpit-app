import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-24">
            <div className="max-w-2xl mx-auto border-2 border-foreground p-8 bg-background">
              <h1 className="text-4xl font-display font-bold mb-4">
                Something Went Wrong
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                The app encountered an error and couldn't recover.
                This has been logged and we'll fix it.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <pre className="bg-muted p-4 rounded mb-6 text-xs overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                >
                  Go to Homepage
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}
