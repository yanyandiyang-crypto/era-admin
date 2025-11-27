import { useMemo } from "react";
import { Lock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordSettingsProps {
  passwords: {
    current: string;
    new: string;
    confirm: string;
  };
  setPasswords: React.Dispatch<React.SetStateAction<{
    current: string;
    new: string;
    confirm: string;
  }>>;
  showPasswords: {
    current: boolean;
    new: boolean;
    confirm: boolean;
  };
  setShowPasswords: React.Dispatch<React.SetStateAction<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>>;
  isChangingPassword: boolean;
  handleChangePassword: () => Promise<void>;
  handleGenerateBackupCodes: () => Promise<void>;
}

const getPasswordStrength = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  const levels = [
    { label: "Weak", color: "bg-rose-500", text: "text-rose-600" },
    { label: "Okay", color: "bg-amber-500", text: "text-amber-600" },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
  ];

  if (!value) return { score: 0, label: "Enter a password", color: "bg-gray-200", text: "text-gray-500" };

  if (score <= 2) return { score: 33, label: levels[0].label, color: levels[0].color, text: levels[0].text };
  if (score === 3 || score === 4) return { score: 66, label: levels[1].label, color: levels[1].color, text: levels[1].text };
  return { score: 100, label: levels[2].label, color: levels[2].color, text: levels[2].text };
};

export default function PasswordSettings({
  passwords,
  setPasswords,
  showPasswords,
  setShowPasswords,
  isChangingPassword,
  handleChangePassword,
  handleGenerateBackupCodes,
}: PasswordSettingsProps) {
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwords.new),
    [passwords.new]
  );
  const passwordReady =
    passwords.current.length > 0 &&
    passwords.new.length >= 8 &&
    passwords.new === passwords.confirm &&
    !isChangingPassword;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change password</h2>
            <p className="text-sm text-gray-500">
              Use a strong password that you haven't used on other sites.
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-500">Strength</p>
            <p className={`font-semibold ${passwordStrength.text}`}>
              {passwordStrength.label}
            </p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${passwordStrength.color}`}
            style={{ width: `${passwordStrength.score}%` }}
          />
        </div>

        <div className="grid gap-4">
          {(["current", "new", "confirm"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {field === "confirm" ? "Confirm new password" : `${field} password`}
              </label>
              <div className="relative">
                <input
                  type={showPasswords[field] ? "text" : "password"}
                  value={passwords[field]}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      [field]: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      [field]: !showPasswords[field],
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords[field] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {field === "new" && (
                <p className="text-xs text-gray-500">
                  Use at least 8 characters and mix uppercase, lowercase, numbers, and special characters.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            We'll sign you out of other devices once your password is updated.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateBackupCodes}>
              Generate backup codes
            </Button>
            <Button onClick={handleChangePassword} disabled={!passwordReady}>
              {isChangingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change password
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <p className="text-sm font-semibold text-blue-900 mb-2">Password tips</p>
        <ul className="space-y-2 text-sm text-blue-900/80">
          <li>• Avoid reusing passwords from other systems.</li>
          <li>• Add a short phrase or random words for length.</li>
          <li>• Enable two-factor authentication for maximum protection.</li>
        </ul>
      </div>
    </div>
  );
}