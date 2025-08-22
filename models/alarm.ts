import { z } from 'zod';

export const RepeatSchema = z.object({
  mon: z.boolean(),
  tue: z.boolean(),
  wed: z.boolean(),
  thu: z.boolean(),
  fri: z.boolean(),
  sat: z.boolean(),
  sun: z.boolean(),
});

export const AlarmSchema = z.object({
  id: z.string(),
  label: z.string(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  enabled: z.boolean(),
  repeat: RepeatSchema,
  taskType: z.enum(['math', 'riddle']),
  taskDifficulty: z.enum(['easy', 'medium', 'hard']),
  sound: z.string(),
  volume: z.number().min(0).max(1),
  vibrate: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Repeat = z.infer<typeof RepeatSchema>;
export type Alarm = z.infer<typeof AlarmSchema>;

export const createDefaultAlarm = (): Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'> => ({
  label: 'New Alarm',
  time: '07:00',
  enabled: true,
  repeat: {
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  },
  taskType: 'math',
  taskDifficulty: 'medium',
  sound: 'default',
  volume: 0.8,
  vibrate: true,
});

export const isRepeating = (repeat: Repeat): boolean => {
  return Object.values(repeat).some(day => day);
};

export const getRepeatDays = (repeat: Repeat): string[] => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days.filter(day => repeat[day as keyof Repeat]);
};

export const getRepeatText = (repeat: Repeat): string => {
  const activeDays = getRepeatDays(repeat);
  
  if (activeDays.length === 0) return 'Once';
  if (activeDays.length === 7) return 'Every day';
  if (activeDays.length === 5 && !repeat.sat && !repeat.sun) return 'Weekdays';
  if (activeDays.length === 2 && repeat.sat && repeat.sun) return 'Weekends';
  
  const dayNames = {
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
  };
  
  return activeDays.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
};