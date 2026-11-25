import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Home, Check } from "lucide-react";

interface Props {
  children?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, copied: false });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error in Component:", error, errorInfo);
    const msg = error?.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk")
    ) {
      const key = "skillora_eb_chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }

  private handleCopyError = () => {
    if (this.state.error) {
      navigator.clipboard.writeText(`${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack || ""}`);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[420px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-4 shadow-sm">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-display">
            Terjadi Kesalahan Komponen
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-4 leading-relaxed">
            Maaf, terjadi kendala teknis saat memuat tampilan ini. Anda dapat mencoba memuat ulang atau kembali ke halaman utama.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 text-left">
              <p className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold truncate">
                {this.state.error.name}: {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>

            <button
              onClick={this.handleCopyError}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              {this.state.copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{this.state.copied ? "Tersalin!" : "Salin Log Error"}</span>
            </button>

            <a
              href="/belajar"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Ke Beranda
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
