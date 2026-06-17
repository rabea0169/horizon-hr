import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.hash = "/";
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex items-center justify-center min-h-screen p-6"
          style={{ background: "var(--bg-primary)" }}
          dir="rtl"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle size={40} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">عطل غير متوقع</h2>
            <p className="text-sm text-white/50">
              حدث خطأ في عرض هذه الصفحة. لا تقلق — بياناتك محفوظة.
            </p>
            {this.state.error && (
              <div className="text-left p-3 rounded-lg bg-red-500/5 border border-red-500/10 overflow-auto max-h-[200px]">
                <code className="text-xs text-red-600 dark:text-red-300 font-mono whitespace-pre-wrap">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                className="text-white"
                style={{ background: "var(--accent-color)" }}
                onClick={this.handleReset}
              >
                <RotateCcw size={16} className="ml-2" /> إعادة المحاولة
              </Button>
              <Button variant="outline" style={{ borderColor: "var(--border-color)" }} onClick={this.handleGoHome}>
                <Home size={16} className="ml-2" /> الرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
