import { create } from 'zustand';

interface NotificationState {
  isBroadcastDialogOpen: boolean;
  openBroadcastDialog: () => void;
  closeBroadcastDialog: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isBroadcastDialogOpen: false,
  openBroadcastDialog: () => set({ isBroadcastDialogOpen: true }),
  closeBroadcastDialog: () => set({ isBroadcastDialogOpen: false }),
}));
