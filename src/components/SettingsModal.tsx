import React from 'react';
import { SettingsModuleView } from './settings/SettingsModuleView';
import {
  DoctorSchedule,
  DoctorLeaveAnnouncement,
  PatientQueueItem,
  EmergencyAlertData
} from '../types';
import { ElectiveSurgerySchedule } from '../data/surgeryData';
import { KhitanParticipant } from '../data/khitanData';
import { MedicalLetterItem } from '../types/letterTypes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules?: DoctorSchedule[];
  doctorLeaves?: DoctorLeaveAnnouncement[];
  queueList?: PatientQueueItem[];
  surgeryList?: ElectiveSurgerySchedule[];
  khitanParticipants?: KhitanParticipant[];
  medicalLetters?: MedicalLetterItem[];
  emergencyAlert?: EmergencyAlertData;
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onRestoreSuccess?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[99999] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10 my-auto"
        style={{
          maxHeight: '88vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        <SettingsModuleView
          showToast={showToast}
          onCloseModal={onClose}
          isModalView={true}
        />
      </div>
    </div>
  );
};
