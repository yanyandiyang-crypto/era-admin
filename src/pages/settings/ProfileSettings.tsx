import { useMemo } from "react";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileSettingsProps {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  setProfile: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  }>>;
  savedProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  isSavingProfile: boolean;
  handleSaveProfile: () => Promise<void>;
  handleResetProfile: () => void;
}

export default function ProfileSettings({
  profile,
  setProfile,
  savedProfile,
  isSavingProfile,
  handleSaveProfile,
  handleResetProfile,
}: ProfileSettingsProps) {
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email),
    [profile.email]
  );
  const phoneValid = useMemo(
    () => !profile.phone || /^[0-9+\-\s()]{7,}$/.test(profile.phone),
    [profile.phone]
  );

  const profileChanged = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(savedProfile),
    [profile, savedProfile]
  );

  const canSaveProfile = profileChanged && emailValid && phoneValid && !isSavingProfile;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-gray-900">Profile information</h2>
          <p className="text-sm text-gray-500">
            Keep your contact information accurate for faster coordination.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">First name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Last name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primary email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 ${
                emailValid
                  ? "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                  : "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              }`}
            />
            {!emailValid && (
              <p className="text-xs text-rose-600">Enter a valid email address.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 ${
                phoneValid
                  ? "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                  : "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              }`}
            />
            {!phoneValid && (
              <p className="text-xs text-rose-600">
                Include only numbers, spaces, parentheses, or +.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
              {profile.role || "Member"}
              <span className="text-xs text-gray-400">Managed by admin</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Region</label>
            <input
              type="text"
              value="Philippines (Default)"
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Your contact details are used for mission-critical alerts and reports.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetProfile} disabled={!profileChanged}>
              Reset
            </Button>
            <Button onClick={handleSaveProfile} disabled={!canSaveProfile}>
              {isSavingProfile ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}