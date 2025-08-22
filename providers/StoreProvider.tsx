import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAlarmStore } from '../state/alarmStore';
import { useSettingsStore } from '../state/settingsStore';
import { soundService } from '../lib/sound';

interface StoreContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  retryInitialization: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadAlarms = useAlarmStore(state => state.loadAlarms);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    initializeStores();
  }, []);

  const initializeStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing app stores...');
      
      // Initialize sound service
      await soundService.initialize();
      console.log('Sound service initialized');
      
      // Load settings first (they might be needed for other operations)
      await loadSettings();
      console.log('Settings loaded');
      
      // Load alarms
      await loadAlarms();
      console.log('Alarms loaded');
      
      // Preload sounds for better performance
      await soundService.preloadSounds();
      console.log('Sounds preloaded');
      
      setIsInitialized(true);
      console.log('App stores initialized successfully');
    } catch (error) {
      console.error('Error initializing stores:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  };

  const retryInitialization = async () => {
    await initializeStores();
  };

  const contextValue: StoreContextType = {
    isInitialized,
    isLoading,
    error,
    retryInitialization,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// Hook for checking if the app is ready to use
export const useAppReady = () => {
  const { isInitialized, isLoading, error } = useStore();
  
  return {
    isReady: isInitialized && !isLoading && !error,
    isLoading,
    hasError: !!error,
    error,
  };
};

// Component to show loading or error states
interface AppStateWrapperProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string, retry: () => void) => React.ReactNode;
}

export const AppStateWrapper: React.FC<AppStateWrapperProps> = ({
  children,
  loadingComponent,
  errorComponent,
}) => {
  const { isReady, isLoading, hasError, error } = useAppReady();
  const { retryInitialization } = useStore();

  if (isLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Alarm Buddy
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Loading...
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (hasError && error) {
    return (
      <>
        {errorComponent ? errorComponent(error, retryInitialization) : (
          <div className="flex-1 justify-center items-center bg-white dark:bg-gray-900 p-6">
            <div className="text-center max-w-sm">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Oops!
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-6">
                {error}
              </div>
              <button
                onPress={retryInitialization}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (isReady) {
    return <>{children}</>;
  }

  // Fallback
  return null;
};

// Hook to get store loading states
export const useStoreLoadingStates = () => {
  const alarmStore = useAlarmStore();
  const settingsStore = useSettingsStore();
  
  return {
    alarms: {
      isLoading: alarmStore.isLoading,
      error: alarmStore.error,
    },
    settings: {
      isLoading: settingsStore.isLoading,
      error: settingsStore.error,
    },
    hasAnyError: !!(alarmStore.error || settingsStore.error),
    isAnyLoading: alarmStore.isLoading || settingsStore.isLoading,
  };
};