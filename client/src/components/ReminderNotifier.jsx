import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardData } from '../services/dashboardService';
import { updateLogStatus } from '../services/logService';
import ReminderCard from './ReminderCard';

const ReminderNotifier = () => {
  const { user } = useAuth();
  const [activeReminder, setActiveReminder] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    if (!user || user.role !== 'patient') return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkDueReminders = async () => {
      try {
        const data = await getDashboardData();
        if (!data || !data.todaySchedule) return;

        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const item of data.todaySchedule) {
          const log = item.log;
          const medicine = item.medicine;

          if (!log || dismissedIds.has(log._id)) continue;

          let isDue = false;

          if (log.status === 'upcoming') {
            // Due within +- 5 minutes window
            if (log.scheduledTime === currentHHMM) {
              isDue = true;
            }
          } else if (log.status === 'snoozed' && log.snoozedUntil) {
            const snoozeEnd = new Date(log.snoozedUntil);
            if (snoozeEnd <= now) {
              isDue = true;
            }
          }

          if (isDue) {
            setActiveReminder({ ...item, log, medicine });

            // Trigger Browser Notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`MediTrack Reminder: ${medicine?.name}`, {
                body: `It's time for your dose: ${medicine?.dosage} (${medicine?.foodInstruction || ''})`,
                icon: '/favicon.svg',
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('[ReminderNotifier] Error polling reminders:', err);
      }
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, [user, dismissedIds]);

  const handleTaken = async (logId) => {
    try {
      await updateLogStatus(logId, { status: 'taken' });
      setActiveReminder(null);
    } catch (err) {
      console.error('[ReminderNotifier] Error marking taken:', err);
    }
  };

  const handleSnooze = async (logId, minutes) => {
    try {
      await updateLogStatus(logId, { status: 'snoozed', snoozedMinutes: minutes });
      setActiveReminder(null);
    } catch (err) {
      console.error('[ReminderNotifier] Error snoozing:', err);
    }
  };

  const handleDismiss = () => {
    if (activeReminder?.log?._id) {
      setDismissedIds(prev => new Set(prev).add(activeReminder.log._id));
    }
    setActiveReminder(null);
  };

  if (!activeReminder) return null;

  return (
    <ReminderCard
      reminder={activeReminder}
      onTaken={handleTaken}
      onSnooze={handleSnooze}
      onDismiss={handleDismiss}
    />
  );
};

export default ReminderNotifier;
