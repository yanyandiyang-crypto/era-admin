import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { SocketContext } from './socket-context-internal';
import type { Notification } from '../types/socket.types';



export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to WebSocket server
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
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

    // Connection events
    newSocket.on('connect', () => {
      // console.log('✅ WebSocket connected');
      setIsConnected(true);
      toast.success('Connected to real-time updates', {
        duration: 2000,
      });
    });

    newSocket.on('disconnect', () => {
      // console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      // console.warn('⚠️ WebSocket connection error:', error.message);
      setIsConnected(false);
      toast.error('Real-time connection failed', {
        description: 'Falling back to manual refresh',
        duration: 3000,
      });
    });

    // Real-time incident updates
    newSocket.on('incident:created', (data: { id: string; type: string; location: string }) => {
      // console.log('🚨 New incident:', data);

      const notification: Notification = {
        id: `incident-${data.id}-${Date.now()}`,
        type: 'incident',
        title: 'New Incident Reported',
        message: `${data.type} incident in ${data.location}`,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.error(notification.title, {
        description: notification.message,
        duration: 5000,
      });

      // Play sound
      playNotificationSound();
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
      console.log('📍 Personnel location updated:', data);
      // Trigger a custom event that the map can listen to
      window.dispatchEvent(new CustomEvent('personnel:location', { detail: data }));
    });

    newSocket.on('incident:updated', (data: { id: string; status: string }) => {
      // console.log('📝 Incident updated:', data);

      const notification: Notification = {
        id: `incident-update-${data.id}-${Date.now()}`,
        type: 'info',
        title: 'Incident Updated',
        message: `Status changed to ${data.status}`,
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

    newSocket.on('incident:resolved', (data: { id: string; type: string }) => {
      // console.log('✅ Incident resolved:', data);

      const notification: Notification = {
        id: `incident-resolved-${data.id}-${Date.now()}`,
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
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch((e) => console.warn('Notification sound failed:', e));
    } catch (error) {
      console.warn('Notification sound play failed:', error);
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

