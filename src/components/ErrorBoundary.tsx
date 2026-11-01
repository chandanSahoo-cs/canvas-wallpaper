import React, { Component, ErrorInfo, ReactNode } from "react";
import { clearAllAssets } from "../lib/assets/db";
import { useSceneStore } from "../store/useSceneStore";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  showEraseConfirm: boolean;
  isProcessing: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showEraseConfirm: false,
    isProcessing: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PaperTab unhandled error:", error, errorInfo);
  }

  private handleResetBoards = async () => {
    this.setState({ isProcessing: true });
    try {
      await useSceneStore.getState().resetAllScenes();
    } catch (err) {
      console.error("Failed to reset scenes:", err);
      try {
        localStorage.clear();
      } catch {}
    }
    window.location.reload();
  };

  private handleEraseEverything = async () => {
    this.setState({ isProcessing: true });
    try {
      await clearAllAssets();
      await useSceneStore.getState().resetAllScenes();
      try {
        localStorage.clear();
      } catch {}
    } catch (err) {
      console.error("Failed to erase everything:", err);
      try {
        localStorage.clear();
      } catch {}
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-paper text-ink p-6 select-none">
          <div className="max-w-md w-full p-6 rounded-sk-lg bg-surface text-ink border-2 border-line shadow-hard text-center flex flex-col items-center gap-4">
            <h1 className="text-xl font-hand font-bold text-ink">Something went wrong</h1>
            <p className="text-xs font-sans text-muted leading-relaxed">
              An unexpected error occurred while loading your canvas wallpaper.
            </p>

            {this.state.error && (
              <pre className="w-full max-h-24 overflow-auto p-2 bg-paper text-[10px] text-danger text-left border border-line rounded-sk font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}

            {this.state.showEraseConfirm ? (
              <div className="flex flex-col items-center gap-3 w-full p-3 bg-paper border-2 border-danger rounded-sk">
                <p className="text-xs font-hand font-bold text-danger">
                  Double confirmation: Erase all boards AND stored images?
                </p>
                <p className="text-[11px] font-sans text-muted">
                  This permanently removes all scenes and all imported images from IndexedDB. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={this.state.isProcessing}
                    onClick={this.handleEraseEverything}
                    className="px-3 py-1.5 text-xs font-hand font-bold rounded-sk bg-danger text-white border-2 border-line shadow-hard hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
                  >
                    {this.state.isProcessing ? "Erasing..." : "Yes, Erase Everything"}
                  </button>
                  <button
                    disabled={this.state.isProcessing}
                    onClick={() => this.setState({ showEraseConfirm: false })}
                    className="px-3 py-1.5 text-xs font-hand font-bold rounded-sk bg-surface text-ink border-2 border-line shadow-hard hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  disabled={this.state.isProcessing}
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-xs font-hand font-bold rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
                >
                  Reload Tab
                </button>
                <button
                  disabled={this.state.isProcessing}
                  onClick={this.handleResetBoards}
                  className="px-4 py-2 text-xs font-hand font-bold rounded-sk bg-surface text-ink border-2 border-line shadow-hard hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
                >
                  Reset Boards
                </button>
                <button
                  disabled={this.state.isProcessing}
                  onClick={() => this.setState({ showEraseConfirm: true })}
                  className="px-4 py-2 text-xs font-hand font-bold rounded-sk bg-surface text-danger border-2 border-line shadow-hard hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
                >
                  Erase Everything...
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
