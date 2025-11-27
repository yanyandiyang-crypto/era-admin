import { Socket } from 'socket.io-client';

export type NotificationData =
  | { id: string; type: string; location: string } // incident:created
  | { alertId: string; alertedPersonnelCount: number } // alert:broadcast
  | { personnelId: string; personnelName: string; response: string } // alert:response
  | { alertId: string; incidentType: string; location: string } // alert:received
  | { personnelId: string; latitude: number; longitude: number } // personnel:location:updated
  | { id: string; status: string } // incident:updated
  | { id: string; type: string } // incident:resolved
  | { incidentId?: string; id: string } // incident:deleted
  | { incidentId: string; acknowledgedCount: number; totalPersonnelNotified: number; acknowledgmentPercentage: number } // incident:acknowledged
  | { title?: string; message: string }; // alert:critical

export interface Notification {
  id: string;
  type: 'incident' | 'alert' | 'system' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: NotificationData;
}

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}