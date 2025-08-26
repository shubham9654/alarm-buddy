import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Alarm } from '../models/alarm';

class SoundService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // Don't duck for alarms
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
      console.log('Audio mode configured for alarm playback');
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  async playAlarm(alarm: Alarm): Promise<void> {
    try {
      // Stop any currently playing sound
      await this.stopAlarm();

      // Load the sound
      const soundUri = this.getSoundUri(alarm.sound);
      
      if (soundUri === null) {
        // Use system notification sound as fallback
        console.log('Using system notification sound for alarm');
        // For now, we'll just log - in a real app you'd trigger system notification
        this.isPlaying = true;
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        soundUri,
        {
          shouldPlay: false,
          isLooping: true,
          volume: Math.max(0.7, alarm.volume), // Ensure minimum volume for alarms
        }
      );

      // Set additional audio properties for alarm playback
      await sound.setStatusAsync({
        shouldPlay: false,
        isLooping: true,
        volume: Math.max(0.7, alarm.volume),
        rate: 1.0,
        shouldCorrectPitch: true,
      });

      this.sound = sound;
      
      // Wait for the sound to be loaded before playing
      await sound.playAsync();
      this.isPlaying = true;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && this.isPlaying) {
          // If sound stopped unexpectedly and we're still supposed to be playing, restart it
          // But only if the sound is still loaded and we haven't manually stopped it
          if (this.sound === sound) {
            sound.playAsync().catch((error) => {
              console.warn('Failed to restart alarm sound:', error);
            });
          }
        }
      });

      console.log('Alarm sound started playing');
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback to system notification
      console.log('Falling back to system notification sound');
      this.isPlaying = true;
    }
  }

  async stopAlarm(): Promise<void> {
    try {
      // Always clear the playing flag so the service state doesn't remain
      // 'playing' when there isn't an active Audio.Sound instance. This
      // handles fallbacks where a system notification sound is used and
      // `this.sound` is null.
      this.isPlaying = false;

      if (this.sound) {
        // Remove the status update listener to prevent restart attempts
        try {
          this.sound.setOnPlaybackStatusUpdate(null);
        } catch (e) {
          // ignore
        }

        await this.sound.stopAsync().catch(() => {});
        await this.sound.unloadAsync().catch(() => {});
        this.sound = null;
      }

      console.log('Alarm sound stopped');
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }

  async pauseAlarm(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        console.log('Alarm sound paused');
      }
    } catch (error) {
      console.error('Error pausing alarm sound:', error);
    }
  }

  async resumeAlarm(): Promise<void> {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
        console.log('Alarm sound resumed');
      }
    } catch (error) {
      console.error('Error resuming alarm sound:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private getSoundUri(soundName: string): any {
    // For development, we'll use system notification sound
    // In production, replace with actual alarm sound files
    try {
      // Try to load custom sounds (will fail with placeholder files)
      const defaultSounds = {
        default: require('../assets/sounds/default-alarm.mp3'),
        gentle: require('../assets/sounds/gentle-alarm.mp3'),
        nature: require('../assets/sounds/nature-alarm.mp3'),
        electronic: require('../assets/sounds/electronic-alarm.mp3'),
      };
      
      return defaultSounds[soundName as keyof typeof defaultSounds] || defaultSounds.default;
    } catch (error) {
      // Fallback to system notification sound for development
      console.warn('Using system notification sound as fallback');
      return null; // Will use system default
    }
  }

  async preloadSounds(): Promise<void> {
    try {
      // Preload default sounds for better performance
      const soundNames = ['default', 'gentle', 'nature', 'electronic'];
      
      for (const soundName of soundNames) {
        try {
          const soundUri = this.getSoundUri(soundName);
          const { sound } = await Audio.Sound.createAsync(soundUri);
          await sound.unloadAsync();
        } catch (error) {
          console.warn(`Failed to preload sound: ${soundName}`, error);
        }
      }
      
      console.log('Sounds preloaded successfully');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  async testSound(soundName: string, volume: number = 0.5): Promise<void> {
    try {
      const soundUri = this.getSoundUri(soundName);
      const { sound } = await Audio.Sound.createAsync(
        soundUri,
        {
          shouldPlay: true,
          volume,
        }
      );

      // Play for 3 seconds then stop
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error stopping test sound:', error);
        }
      }, 3000);

      console.log(`Testing sound: ${soundName}`);
    } catch (error) {
      console.error('Error testing sound:', error);
      throw new Error('Failed to test sound');
    }
  }

  getAvailableSounds(): Array<{ name: string; label: string }> {
    return [
      { name: 'default', label: 'Default' },
      { name: 'gentle', label: 'Gentle' },
      { name: 'nature', label: 'Nature' },
      { name: 'electronic', label: 'Electronic' },
    ];
  }

  async playPersistentAlarm(alarm: Alarm): Promise<void> {
    try {
      // Stop any currently playing sound
      await this.stopAlarm();

      // Configure audio mode for persistent playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      // Load and play the alarm sound
      const soundUri = this.getSoundUri(alarm.sound);
      
      if (soundUri === null) {
        console.log('Using system notification sound for persistent alarm');
        this.isPlaying = true;
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        soundUri,
        {
          shouldPlay: false,
          isLooping: true,
          volume: Math.max(0.8, alarm.volume), // Higher minimum volume for persistent alarms
        }
      );

      this.sound = sound;
      
      // Start playing immediately
      await sound.playAsync();
      this.isPlaying = true;

      // Set up aggressive playback status monitoring for persistence
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && this.isPlaying) {
          // Immediately restart if sound stops unexpectedly
          if (this.sound === sound) {
            setTimeout(() => {
              sound.playAsync().catch((error) => {
                console.warn('Failed to restart persistent alarm sound:', error);
                // Try to reload and play again
                this.playPersistentAlarm(alarm).catch(() => {
                  console.error('Failed to reload persistent alarm');
                });
              });
            }, 100); // Very short delay before restart
          }
        }
      });

      console.log('Persistent alarm sound started playing');
    } catch (error) {
      console.error('Error playing persistent alarm sound:', error);
      // Fallback to regular alarm playback
      await this.playAlarm(alarm);
    }
  }
}

export const soundService = new SoundService();
export default soundService;