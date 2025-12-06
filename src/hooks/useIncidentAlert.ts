import { useCallback, useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Incident } from '@/types/incident.types';

interface AlertConfig {
  playSound: boolean;
  toastDuration: number;
  loopSound: boolean;
  maxLoopDuration?: number; // ms
}

const PRIORITY_CONFIG: Record<string, AlertConfig> = {
  CRITICAL: {
    playSound: true,
    toastDuration: 10000,
    loopSound: true,
    maxLoopDuration: 30000, // 30 seconds
  },
  HIGH: {
    playSound: true,
    toastDuration: 6000,
    loopSound: false,
  },
  MEDIUM: {
    playSound: true,
    toastDuration: 4000,
    loopSound: false,
  },
  LOW: {
    playSound: false,
    toastDuration: 3000,
    loopSound: false,
  },
};

/**
 * Centralized hook for incident alert handling across all pages
 * Provides consistent notification behavior for Map, Dashboard, and Incidents pages
 */
export function useIncidentAlert() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('incidentSoundEnabled') !== 'false';
    }
    return true;
  });

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.7;

    return () => {
      stopAlertSound();
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('incidentSoundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  const stopAlertSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const playAlertSound = useCallback((config: AlertConfig) => {
    if (!soundEnabled || !audioRef.current) return;

    const audio = audioRef.current;
    
    try {
      // Stop any current playback
      stopAlertSound();

      audio.loop = config.loopSound;
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('🔊 Alert sound blocked by browser:', e.message);
        });
      }

      // Auto-stop looping sound after max duration
      if (config.loopSound && config.maxLoopDuration) {
        loopTimeoutRef.current = setTimeout(() => {
          stopAlertSound();
        }, config.maxLoopDuration);
      }
    } catch (error) {
      console.warn('🔊 Alert sound error:', error);
    }
  }, [soundEnabled, stopAlertSound]);

  const showIncidentAlert = useCallback((incident: Incident, options?: { navigate?: (path: string) => void }) => {
    const priority = incident.priority || 'MEDIUM';
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

    // Play sound based on priority
    if (config.playSound) {
      playAlertSound(config);
    }

    // Show toast notification
    const toastType = priority === 'CRITICAL' ? 'error' : 
                      priority === 'HIGH' ? 'warning' : 'info';
    
    const toastOptions: Parameters<typeof toast.info>[1] = {
      description: `${incident.type} - ${incident.address}`,
      duration: config.toastDuration,
    };

    // Add action button for navigation
    if (options?.navigate && incident.incidentId) {
      toastOptions.action = {
        label: 'View',
        onClick: () => options.navigate!(`/incidents/${incident.incidentId}`),
      };
    }

    // Show the toast
    const toastId = (toast as any)[toastType](
      priority === 'CRITICAL' ? '🚨 CRITICAL INCIDENT' :
      priority === 'HIGH' ? '⚠️ High Priority Incident' :
      'New Incident Reported',
      toastOptions
    );

    return toastId;
  }, [playAlertSound]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  /**
   * Convenience method to handle a new incident with alert
   * Combines sound + toast notification
   */
  const handleNewIncident = useCallback((incident: Incident, options?: { navigate?: (path: string) => void }) => {
    return showIncidentAlert(incident, options);
  }, [showIncidentAlert]);

  return {
    soundEnabled,
    toggleSound,
    setSoundEnabled,
    playAlertSound,
    stopAlertSound,
    showIncidentAlert,
    handleNewIncident,
    PRIORITY_CONFIG,
  };
}

export type { AlertConfig };
