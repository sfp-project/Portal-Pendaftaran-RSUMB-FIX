import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const autoBackupFirestore = async () => {
  try {
    const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
    const schedules = schedulesSnapshot.docs.map(doc => doc.data());
    
    // Logic to save to Google Sheets...
    console.log('Backup successful:', schedules);
  } catch (error) {
    console.error('Backup failed:', error);
  }
};

// Setup cron or setInterval for 24h backup
export const startBackupInterval = () => {
  setInterval(autoBackupFirestore, 24 * 60 * 60 * 1000);
};
