import { Alarm, Repeat } from '../models/alarm';

/**
 * Get the next occurrence of an alarm
 */
export const getNextAlarmTime = (alarm: Alarm): Date | null => {
  if (!alarm.enabled) return null;

  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  
  // Check if it's a one-time alarm (no repeat days selected)
  const hasRepeatDays = Object.values(alarm.repeat).some(day => day);
  
  if (!hasRepeatDays) {
    // One-time alarm - schedule for today if time hasn't passed, otherwise tomorrow
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    
    if (today > now) {
      return today;
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }
  
  // Repeating alarm - find next occurrence
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if alarm should trigger today
  const todayKey = daysOfWeek[currentDay];
  if (alarm.repeat[todayKey]) {
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    
    if (today > now) {
      return today;
    }
  }
  
  // Find next day when alarm should trigger
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextDayKey = daysOfWeek[nextDay];
    
    if (alarm.repeat[nextDayKey]) {
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + i);
      nextDate.setHours(hours, minutes, 0, 0);
      return nextDate;
    }
  }
  
  return null;
};

/**
 * Get all upcoming alarm times for the next 7 days
 */
export const getUpcomingAlarmTimes = (alarm: Alarm): Date[] => {
  if (!alarm.enabled) return [];
  
  const times: Date[] = [];
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  
  const hasRepeatDays = Object.values(alarm.repeat).some(day => day);
  
  if (!hasRepeatDays) {
    // One-time alarm
    const nextTime = getNextAlarmTime(alarm);
    if (nextTime) {
      times.push(nextTime);
    }
    return times;
  }
  
  // Repeating alarm - get all occurrences in next 7 days
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    date.setHours(hours, minutes, 0, 0);
    
    const dayKey = daysOfWeek[date.getDay()];
    
    if (alarm.repeat[dayKey] && date > now) {
      times.push(date);
    }
  }
  
  return times.sort((a, b) => a.getTime() - b.getTime());
};

/**
 * Format time for display
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get time until next alarm
 */
export const getTimeUntilAlarm = (alarmTime: Date): string => {
  const now = new Date();
  const diff = alarmTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Check if time is in 24-hour format
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Convert 12-hour time to 24-hour format
 */
export const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (hours === 12) {
    hours = 0;
  }
  
  if (modifier === 'PM') {
    hours += 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get notification identifier for alarm
 */
export const getNotificationId = (alarmId: string, dayIndex?: number): string => {
  return dayIndex !== undefined ? `${alarmId}-${dayIndex}` : alarmId;
};

/**
 * Calculate snooze time
 */
export const calculateSnoozeTime = (snoozeMinutes: number): Date => {
  const now = new Date();
  return new Date(now.getTime() + snoozeMinutes * 60 * 1000);
};