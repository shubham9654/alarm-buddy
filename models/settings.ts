import { z } from 'zod';

export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultTaskType: z.enum(['math', 'riddle', 'none']),
  defaultDifficulty: z.enum(['easy', 'medium', 'hard']),
  snoozeEnabled: z.boolean(),
  snoozeMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  soundEnabled: z.boolean(),
  soundName: z.enum(['default', 'gentle', 'nature', 'electronic']),
  vibrationEnabled: z.boolean(),
  vibrationPattern: z.enum(['short', 'long', 'pattern']),
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
  soundName: 'default',
  vibrationEnabled: true,
  vibrationPattern: 'short',
  defaultVolume: 0.8,
  version: 1,
});

export const migrateSettings = (settings: unknown): Settings => {
  try {
    const parsed = SettingsSchema.parse(settings);
    return parsed;
  } catch {
    // If parsing fails, merge with defaults to preserve valid existing settings
    const defaults = createDefaultSettings();
    if (typeof settings === 'object' && settings !== null) {
      return {
        ...defaults,
        ...settings,
        // Ensure new fields have valid defaults
        soundName: (settings as any).soundName && ['default', 'gentle', 'nature', 'electronic'].includes((settings as any).soundName) 
          ? (settings as any).soundName : defaults.soundName,
        vibrationPattern: (settings as any).vibrationPattern && ['short', 'long', 'pattern'].includes((settings as any).vibrationPattern)
          ? (settings as any).vibrationPattern : defaults.vibrationPattern,
      };
    }
    return defaults;
  }
};