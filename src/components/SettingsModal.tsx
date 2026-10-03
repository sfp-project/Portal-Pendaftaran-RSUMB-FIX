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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[85vh] my-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 z-10">
        <SettingsModuleView
          showToast={showToast}
          onCloseModal={onClose}
          isModalView={true}
        />
      </div>
    </div>
  );
};
