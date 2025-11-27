import { useMemo } from "react";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationSettingsProps {
  notifications: {
    emailIncidents: boolean;
    emailReports: boolean;
    pushIncidents: boolean;
    pushAssignments: boolean;
    soundAlerts: boolean;
  };
  setNotifications: React.Dispatch<React.SetStateAction<{
    emailIncidents: boolean;
    emailReports: boolean;
    pushIncidents: boolean;
    pushAssignments: boolean;
    soundAlerts: boolean;
  }>>;
  savedNotifications: {
    emailIncidents: boolean;
    emailReports: boolean;
    pushIncidents: boolean;
    pushAssignments: boolean;
    soundAlerts: boolean;
  };
  isSavingNotifications: boolean;
  handleSaveNotifications: () => Promise<void>;
  handleResetNotifications: () => void;
}

export default function NotificationSettings({
  notifications,
  setNotifications,
  savedNotifications,
  isSavingNotifications,
  handleSaveNotifications,
  handleResetNotifications,
}: NotificationSettingsProps) {
  const notificationsChanged = useMemo(
    () => JSON.stringify(notifications) !== JSON.stringify(savedNotifications),
    [notifications, savedNotifications]
  );

  const canSaveNotifications = notificationsChanged && !isSavingNotifications;

  const activeNotificationCount = useMemo(
    () => Object.values(notifications).filter(Boolean).length,
    [notifications]
  );

  const emailNotificationOptions = [
    { key: "emailIncidents", label: "New incidents", description: "Dispatch center alerts" },
    { key: "emailReports", label: "Daily reports", description: "Morning summary digest" },
  ] as const;

  const pushNotificationOptions = [
    { key: "pushIncidents", label: "Critical incidents", description: "High-priority events" },
    { key: "pushAssignments", label: "Personnel assignments", description: "New task hand-offs" },
  ] as const;

  const toggleNotification = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notification preferences</h2>
            <p className="text-sm text-gray-500">
              Choose how you stay informed about incidents and reports.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {activeNotificationCount} of 5 alerts enabled
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {emailNotificationOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleNotification(item.key)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                notifications[item.key]
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
              <span
                className={`mt-3 inline-flex h-6 w-11 items-center rounded-full transition ${
                  notifications[item.key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow transition ${
                    notifications[item.key] ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {pushNotificationOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleNotification(item.key)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                notifications[item.key]
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
              <span
                className={`mt-3 inline-flex h-6 w-11 items-center rounded-full transition ${
                  notifications[item.key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow transition ${
                    notifications[item.key] ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          ))}
          <div className="rounded-2xl border border-gray-200 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Sound alerts</p>
            <p className="text-xs text-gray-500">Play a tone when urgent events occur</p>
            <label className="mt-3 inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 transition">
              <input
                type="checkbox"
                checked={notifications.soundAlerts}
                onChange={() => toggleNotification("soundAlerts")}
                className="hidden"
              />
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition ${
                  notifications.soundAlerts ? "translate-x-6 bg-blue-600" : "translate-x-1"
                }`}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Customize alerts per channel. You can mute notifications anytime.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetNotifications}
              disabled={!notificationsChanged}
            >
              Reset
            </Button>
            <Button onClick={handleSaveNotifications} disabled={!canSaveNotifications}>
              {isSavingNotifications ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}