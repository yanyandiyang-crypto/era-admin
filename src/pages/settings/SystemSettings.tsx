import { Smartphone, Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemSettingsProps {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  setSessionTimeout: React.Dispatch<React.SetStateAction<number>>;
  darkModePreference: "system" | "light" | "dark";
  apiStatus: "online" | "degraded" | "offline";
  apiLatency: number;
  handleToggleTwoFactor: () => Promise<void>;
  handleRefreshSystem: () => Promise<void>;
  handleGenerateBackupCodes: () => Promise<void>;
  handleThemeChange: (value: "system" | "light" | "dark") => void;
  user: any;
}

export default function SystemSettings({
  twoFactorEnabled,
  sessionTimeout,
  setSessionTimeout,
  darkModePreference,
  apiStatus,
  apiLatency,
  handleToggleTwoFactor,
  handleRefreshSystem,
  handleGenerateBackupCodes,
  handleThemeChange,
  user,
}: SystemSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System preferences</h2>
            <p className="text-sm text-gray-500">
              Environment information and operational controls.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshSystem}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh status
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Version</p>
            <p className="text-lg font-semibold text-gray-900">1.0.0</p>
            <p className="text-xs text-gray-500">Last updated Nov 6, 2024</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">API status</p>
            <p
              className={`text-lg font-semibold ${
                apiStatus === "online"
                  ? "text-emerald-600"
                  : apiStatus === "degraded"
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {apiStatus === "online" ? "Operational" : apiStatus === "degraded" ? "Degraded" : "Offline"}
            </p>
            <p className="text-xs text-gray-500">{apiLatency} ms latency</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Two-factor authentication</p>
                <p className="text-xs text-gray-500">
                  Add a second layer of protection to your account.
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${
                  twoFactorEnabled ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleToggleTwoFactor}>
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
              <Button variant="outline" onClick={handleGenerateBackupCodes}>
                Backup codes
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Session timeout</p>
                <p className="text-xs text-gray-500">
                  Automatically sign out after inactivity.
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {sessionTimeout} min
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={120}
              step={15}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Theme preference</p>
          <div className="flex flex-wrap gap-2">
            {(["system", "light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm capitalize ${
                  darkModePreference === mode
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {mode === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : mode === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="text-sm font-semibold text-amber-900">Rate limits</p>
          <div className="text-xs text-amber-900">
            <p>• API requests: 1000 per hour</p>
            <p>• File uploads: 100 MB per file</p>
            <p>• Report generation: 50 per day</p>
          </div>
        </div>

        {user?.role === "ADMIN" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 space-y-3">
            <p className="text-sm font-semibold text-rose-900">Danger zone</p>
            <p className="text-xs text-rose-800">
              Admin-only actions. Proceed carefully—these cannot be undone easily.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Clear cache
              </Button>
              <Button variant="outline" size="sm">
                View logs
              </Button>
              <Button variant="destructive" size="sm">
                Reset API keys
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}