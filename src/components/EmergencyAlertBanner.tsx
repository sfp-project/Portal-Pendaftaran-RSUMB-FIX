import React from 'react';
import { AlertTriangle, X, Volume2 } from 'lucide-react';
import { EmergencyAlertData } from '../types';

interface EmergencyAlertBannerProps {
  alert: EmergencyAlertData;
  onDismiss: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  alert,
  onDismiss
}) => {
  if (!alert.active) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-lg border-b border-red-700 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <div className="p-1.5 bg-red-700 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm uppercase tracking-wide mr-2">
            {alert.code}:
          </span>
          <span className="text-sm font-medium">{alert.message}</span>
          <span className="text-xs text-red-200 ml-2">({alert.issuedAt})</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-red-700 rounded-lg text-white transition-colors"
        title="Tutup Peringatan"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
