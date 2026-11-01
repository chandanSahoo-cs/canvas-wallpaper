import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PaperTab unhandled error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-paper text-ink p-6 select-none">
          <div className="max-w-md w-full p-6 rounded-sk-lg bg-surface text-ink border-2 border-line shadow-hard text-center flex flex-col items-center gap-4">
            <h1 className="text-xl font-hand font-bold text-ink">Something went wrong</h1>
            <p className="text-xs font-sans text-muted leading-relaxed">
              An unexpected error occurred while loading your canvas wallpaper.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-hand font-bold rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
              >
                Reload Tab
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("wallpaperScenes");
                    localStorage.removeItem("wallpaperActiveSceneId");
                    localStorage.removeItem("wallpaperWidgets");
                  } catch {}
                  window.location.reload();
                }}
                className="px-4 py-2 text-xs font-hand font-bold rounded-sk bg-surface text-ink border-2 border-line shadow-hard hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
