import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { SocketContext } from './socket-context-internal';
import type { Notification } from '../types/socket.types';
import { WS_URL } from '@/lib/constants';

// Pages that handle their own incident alerts (to prevent duplicates)
const PAGES_WITH_OWN_ALERTS = ['/map', '/dashboard', '/incidents'];

// Priority-based alert configuration
const PRIORITY_CONFIG: Record<string, { playSound: boolean; toastDuration: number; loopSound: boolean; maxLoopDuration?: number }> = {
  CRITICAL: { playSound: true, toastDuration: 10000, loopSound: true, maxLoopDuration: 30000 },
  HIGH: { playSound: true, toastDuration: 6000, loopSound: false },
  MEDIUM: { playSound: true, toastDuration: 4000, loopSound: false },
  LOW: { playSound: false, toastDuration: 3000, loopSound: false },
};



export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { accessToken, isAuthenticated } = useAuthStore();
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to WebSocket server
    console.log('🔧 Environment variables available:', {
      VITE_WS_URL: import.meta.env.VITE_WS_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    });
    
    console.log('🔌 Connecting to WebSocket server:', WS_URL);

    const newSocket = io(WS_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    console.log('🔌 Socket.IO client created with config:', {
      url: WS_URL,
      auth: { token: accessToken ? 'present' : 'missing' },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected with ID:', newSocket.id);
      setIsConnected(true);
      toast.success('Connected to real-time updates', {
        duration: 2000,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error);
      setIsConnected(false);
      toast.error('Real-time connection failed', {
        description: 'Falling back to manual refresh',
        duration: 3000,
      });
    });

    // Real-time incident updates
    // Toast and sound are shown here for pages that DON'T have their own handlers
    // Pages like Map, Dashboard, Incidents handle their own alerts with more context
    newSocket.on('incident:created', (data: { id: string; type: string; location: string; priority?: string; address?: string; incidentId?: string }) => {
      console.log('🚨 SocketContext: New incident received:', data);

      const notification: Notification = {
        id: `incident-${data.id}-${Date.now()}`,
        type: 'incident',
        title: 'New Incident Reported',
        message: `${data.type} incident in ${data.location}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      // Add to notification list (for notification bell icon)
      setNotifications((prev) => [notification, ...prev]);

      // Emit custom event that pages can listen to for consistent handling
      window.dispatchEvent(new CustomEvent('incident:created:global', { detail: data }));

      // Check if current page has its own alert handler
      const currentPath = window.location.pathname;
      const pageHasOwnHandler = PAGES_WITH_OWN_ALERTS.some(page => currentPath.startsWith(page));
      
      console.log('🌐 SocketContext: Current path:', currentPath);
      console.log('🌐 SocketContext: Page has own handler:', pageHasOwnHandler);

      // Only show toast and play sound if current page doesn't handle its own alerts
      if (!pageHasOwnHandler) {
        console.log('🔔 SocketContext: Showing global alert for page without own handler');
        
        const priority = data.priority || 'MEDIUM';
        const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
        
        // Play notification sound
        if (config.playSound) {
          playNotificationSound();
        }

        // Get location string
        const locationStr = data.address || data.location || 'Unknown Location';
        const incidentId = data.incidentId || data.id;

        // Show toast notification
        const toastType = priority === 'CRITICAL' ? 'error' : 
                          priority === 'HIGH' ? 'warning' : 'info';
        
        const message = priority === 'CRITICAL' ? '🚨 CRITICAL INCIDENT' :
                        priority === 'HIGH' ? '⚠️ High Priority Incident' :
                        '📢 New Incident Reported';

        (toast as any)[toastType](message, {
          description: `${data.type} - ${locationStr}`,
          duration: config.toastDuration,
          action: incidentId ? {
            label: 'View',
            onClick: () => window.location.href = `/incidents/${incidentId}`,
          } : undefined,
        });
      } else {
        console.log('⏭️ SocketContext: Skipping global alert (page has own handler)');
      }
    });

    // Personnel alert broadcasts
    newSocket.on('alert:broadcast', (data: { alertId: string; alertedPersonnelCount: number }) => {
      // console.log('📢 Alert broadcasted:', data);

      const notification: Notification = {
        id: `alert-${data.alertId}-${Date.now()}`,
        type: 'alert',
        title: 'Alert Broadcasted',
        message: `Alert sent to ${data.alertedPersonnelCount} personnel`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.info(notification.title, {
        description: notification.message,
        duration: 3000,
      });
    });

    // Personnel alert responses
    newSocket.on('alert:response', (data: { personnelId: string; personnelName: string; response: string }) => {
      // console.log('✅ Personnel responded:', data);

      const notification: Notification = {
        id: `response-${data.personnelId}-${Date.now()}`,
        type: 'info',
        title: 'Personnel Response',
        message: `${data.personnelName} ${data.response.toLowerCase()} the alert`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      if (data.response === 'ACCEPTED') {
        toast.success(notification.message, {
          duration: 3000,
        });
      }
    });

    // Personnel receiving individual alerts (including OFF_DUTY)
    newSocket.on('alert:received', (data: { alertId: string; incidentType: string; location: string }) => {
      // console.log('🔔 Alert received by personnel:', data);

      const notification: Notification = {
        id: `alert-received-${data.alertId}-${Date.now()}`,
        type: 'alert',
        title: 'Emergency Alert Received',
        message: `${data.incidentType} incident - ${data.location}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.error(notification.title, {
        description: notification.message,
        duration: 8000, // Longer duration for emergency alerts
      });

      // Play sound for emergency alerts
      playNotificationSound();
    });

    // Personnel location updates
    newSocket.on('personnel:location:updated', (data: { personnelId: string; latitude: number; longitude: number; timestamp?: string }) => {
      console.log('📍 Personnel location updated FROM MOBILE APP:', data);
      console.log('📍 Broadcasting personnel:location event:', data);
      // Trigger a custom event that the map can listen to
      window.dispatchEvent(new CustomEvent('personnel:location', { detail: data }));
    });

    // NOTE: Individual pages handle their own incident:updated toasts
    // We only add to notification list here
    newSocket.on('incident:updated', (data: { id: string; status: string; incidentId?: string }) => {
      console.log('📝 SocketContext: Incident updated:', data);

      const notification: Notification = {
        id: `incident-update-${data.id || data.incidentId}-${Date.now()}`,
        type: 'info',
        title: 'Incident Updated',
        message: `Status changed to ${data.status}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
      
      // Emit custom event for pages
      window.dispatchEvent(new CustomEvent('incident:updated:global', { detail: data }));
    });

    newSocket.on('incident:resolved', (data: { id: string; type: string; incidentId?: string }) => {
      console.log('✅ SocketContext: Incident resolved:', data);

      const notification: Notification = {
        id: `incident-resolved-${data.id || data.incidentId}-${Date.now()}`,
        type: 'info',
        title: 'Incident Resolved',
        message: `${data.type} incident has been resolved`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.success(notification.title, {
        description: notification.message,
        duration: 3000,
      });
    });

    newSocket.on('incident:deleted', (data: { incidentId?: string; id: string }) => {
      // console.log('🗑️ Incident deleted:', data);

      const notification: Notification = {
        id: `incident-deleted-${data.incidentId || data.id}-${Date.now()}`,
        type: 'info',
        title: 'Incident Deleted',
        message: `Incident has been removed from the system`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.info(notification.title, {
        description: notification.message,
        duration: 3000,
      });
    });

    // Real-time incident acknowledgments
    newSocket.on('incident:acknowledged', (data: { incidentId: string; acknowledgedCount: number; totalPersonnelNotified: number; acknowledgmentPercentage: number }) => {
      // console.log('✅ Incident acknowledged:', data);

      // Emit custom event that incident list can listen to
      window.dispatchEvent(new CustomEvent('incident:acknowledged', { detail: data }));

      // Optional: Show notification
      const notification: Notification = {
        id: `incident-ack-${data.incidentId}-${Date.now()}`,
        type: 'info',
        title: 'Personnel Acknowledged',
        message: `${data.acknowledgedCount}/${data.totalPersonnelNotified} personnel have viewed (${data.acknowledgmentPercentage}%)`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
    });

    // System alerts
    newSocket.on('alert:critical', (data: { title?: string; message: string }) => {
      // console.log('🚨 Critical alert:', data);

      const notification: Notification = {
        id: `alert-${Date.now()}`,
        type: 'alert',
        title: data.title || 'Critical Alert',
        message: data.message,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.error(notification.title, {
        description: notification.message,
        duration: 10000,
      });

      // Play sound for critical alerts
      playNotificationSound();
    });

    // General notification broadcasts
    newSocket.on('notification:broadcast:received', (data: { title: string; message: string; type: 'info' | 'alert' | 'system' }) => {
      // console.log('📢 Notification broadcast received:', data);

      const notification: Notification = {
        id: `broadcast-${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      const toastType = data.type === 'alert' ? 'warning' : 'info';
      toast[toastType](notification.title, {
        description: notification.message,
        duration: 5000,
      });

      if (data.type === 'alert') {
        playNotificationSound();
      }
    });

    // Broadcast notifications
    newSocket.on('notification:new', (data) => {
      console.log('🔔 New broadcast notification:', data);

      const notification: Notification = {
        id: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show toast based on type
      const toastType = data.type === 'error' ? 'error' : 
                       data.type === 'warning' || data.type === 'alert' ? 'warning' : 
                       data.type === 'success' ? 'success' : 'info';
      
      toast[toastType as keyof typeof toast](data.title, {
        description: data.message,
        duration: 6000,
      });

      playNotificationSound();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  const playNotificationSound = () => {
    try {
      // Initialize audio element once if not already done
      if (!notificationAudioRef.current) {
        const audio = new Audio('/notification.mp3');
        audio.preload = 'auto';
        audio.volume = 0.7;
        audio.loop = false;
        notificationAudioRef.current = audio;
        
        // Handle browser autoplay policy - log for debugging
        audio.addEventListener('error', (e) => {
          console.warn('🔊 Audio error:', e.error?.message || 'Unknown error');
        });
      }
      
      // Reset playback and play
      const audio = notificationAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 Notification sound played successfully');
            })
            .catch((e) => {
              console.warn('🔊 Notification sound play blocked:', e.message);
              // Browser autoplay policy likely prevented playback
              // This is expected behavior - sound will play after user interacts
            });
        }
      }
    } catch (error) {
      console.warn('🔊 Notification sound play error:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

