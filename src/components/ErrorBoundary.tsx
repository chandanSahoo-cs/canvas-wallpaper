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
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#14141a] text-white p-6 font-sans select-none">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex flex-col items-center gap-4">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-xs text-white/70">
              An unexpected error occurred while loading your canvas wallpaper.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
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
