import { Alarm, Repeat } from '../models/alarm';

/**
 * Get the next occurrence of an alarm
 */
export const getNextAlarmTime = (alarm: Alarm): Date | null => {
  if (!alarm.enabled) return null;

  const now = new Date();
  const timeParts = alarm.time.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  if (hours === undefined || minutes === undefined) {
    return null;
  }
  
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
  if (todayKey && alarm.repeat[todayKey]) {
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
    
    if (nextDayKey && alarm.repeat[nextDayKey]) {
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
  const timeParts = alarm.time.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  if (hours === undefined || minutes === undefined) {
    return [];
  }
  
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
    
    if (dayKey && alarm.repeat[dayKey] && date > now) {
      times.push(date);
    }
  }
  
  return times.sort((a, b) => a.getTime() - b.getTime());
};

/**
 * Format time for display
 */
export const formatTime = (time: string): string => {
  const timeParts = time.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  if (hours === undefined || minutes === undefined) {
    return '12:00 AM';
  }
  
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
  if (!time) return '00:00';
  
  const timeParts = time.split(':').map(Number);
  let hours = timeParts[0];
  let minutes = timeParts[1];
  
  if (hours === undefined || minutes === undefined) {
    return '00:00';
  }
  
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

/**
 * Get human-readable text for repeat pattern
 */
export const getRepeatText = (repeat: Repeat): string => {
  const days = {
    mon: 'Mon',
    tue: 'Tue', 
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun'
  };
  
  const selectedDays = Object.entries(repeat)
    .filter(([_, isSelected]) => isSelected)
    .map(([day, _]) => days[day as keyof typeof days]);
  
  if (selectedDays.length === 0) {
    return 'Once';
  }
  
  if (selectedDays.length === 7) {
    return 'Every day';
  }
  
  if (selectedDays.length === 5 && !repeat.sat && !repeat.sun) {
    return 'Weekdays';
  }
  
  if (selectedDays.length === 2 && repeat.sat && repeat.sun) {
    return 'Weekends';
  }
  
  return selectedDays.join(', ');
};