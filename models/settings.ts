import { z } from 'zod';

export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultTaskType: z.enum(['math', 'riddle']),
  defaultDifficulty: z.enum(['easy', 'medium', 'hard']),
  snoozeEnabled: z.boolean(),
  snoozeMinutes: z.enum([5, 10, 15]),
  soundEnabled: z.boolean(),
  vibrationEnabled: z.boolean(),
  defaultVolume: z.number().min(0).max(1),
  version: z.number(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const createDefaultSettings = (): Settings => ({
  theme: 'system',
  defaultTaskType: 'math',
  defaultDifficulty: 'medium',
  snoozeEnabled: true,
  snoozeMinutes: 10,
  soundEnabled: true,
  vibrationEnabled: true,
  defaultVolume: 0.8,
  version: 1,
});

export const migrateSettings = (settings: unknown): Settings => {
  try {
    const parsed = SettingsSchema.parse(settings);
    return parsed;
  } catch {
    // If parsing fails, return default settings
    return createDefaultSettings();
  }
};