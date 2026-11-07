import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCacheAndReload = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('rsumb_schedules_cache');
    } catch {}
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Top RSUMB Header Strip */}
            <div className="bg-[#005d42] px-6 py-4 text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-emerald-200">
                <ShieldAlert className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg tracking-tight">
                  RSU Muhammadiyah Babat
                </h1>
                <p className="text-xs text-emerald-200/90 font-medium">
                  Portal Informasi & Manajemen Layanan Pasien
                </p>
              </div>
            </div>

            {/* Error Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <h2 className="font-bold text-amber-950 mb-1">
                    Terjadi Kendala pada Tampilan Aplikasi
                  </h2>
                  <p className="text-amber-800/90 leading-relaxed">
                    Sistem mendeteksi adanya error runtime tak terduga. Seluruh data pasien dan jadwal Anda tetap aman di Cloud Firestore & penyimpanan lokal.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Silakan muat ulang halaman untuk memulihkan modul aplikasi. Jika kendala terus berlanjut, hubungi tim IT RSUMB atau gunakan tombol bersihkan cache.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#005d42] hover:bg-[#004732] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Muat Ulang Halaman</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleResetCacheAndReload}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span>Bersihkan Cache & Muat Ulang</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Error Diagnostics */}
              {this.state.error && (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={this.toggleDetails}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <span>Informasi Teknis Diagnosis</span>
                    {this.state.showDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-48 space-y-1">
                      <p className="text-rose-400 font-bold">{this.state.error.toString()}</p>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>IT & Pelayanan Medis RSUMB Babat</span>
              <span>Status Sistem: Siaga</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
