/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { User, Lock, Bell, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import ProfileSettings from "./ProfileSettings";
import PasswordSettings from "./PasswordSettings";
import NotificationSettings from "./NotificationSettings";
import SystemSettings from "./SystemSettings";

const sleep = (ms: number = 900) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications" | "system">(
    "profile"
  );

  // Profile settings
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "",
  });

  // Password settings
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailIncidents: true,
    emailReports: true,
    pushIncidents: true,
    pushAssignments: true,
    soundAlerts: false,
  });
  const [savedProfile, setSavedProfile] = useState(profile);
  const [savedNotifications, setSavedNotifications] = useState(notifications);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [darkModePreference, setDarkModePreference] = useState<"system" | "light" | "dark">(
    "system"
  );
  const [apiStatus, setApiStatus] = useState<"online" | "degraded" | "offline">("online");
  const [apiLatency, setApiLatency] = useState(208);

  const handleResetProfile = () => setProfile(savedProfile);
  const handleResetNotifications = () => setNotifications(savedNotifications);
  const handleToggleTwoFactor = async () => {
    setTwoFactorEnabled((prev) => !prev);
    toast.success(
      twoFactorEnabled ? "Two-factor authentication disabled" : "Two-factor authentication enabled"
    );
  };
  const handleRefreshSystem = async () => {
    await sleep(600);
    setApiLatency(180 + Math.floor(Math.random() * 80));
    setApiStatus("online");
    toast.success("System status refreshed");
  };
  const handleGenerateBackupCodes = async () => {
    await sleep(700);
    toast.success("New backup codes generated");
  };
  const handleThemeChange = (value: "system" | "light" | "dark") => {
    setDarkModePreference(value);
    toast.success(`Theme preference set to ${value}`);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await sleep();
      setSavedProfile(profile);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change password";
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await sleep();
      setSavedNotifications(notifications);
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(79,70,229,0.12),_transparent_55%)]" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-sm text-blue-100">
            Manage your account, security, and notification preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
                {[
                  { id: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
                  { id: "password", label: "Password", icon: <Lock className="h-5 w-5" /> },
                  { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
                  { id: "system", label: "System", icon: <Smartphone className="h-5 w-5" /> },
                ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <ProfileSettings
              profile={profile}
              setProfile={setProfile}
              savedProfile={savedProfile}
              isSavingProfile={isSavingProfile}
              handleSaveProfile={handleSaveProfile}
              handleResetProfile={handleResetProfile}
            />
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <PasswordSettings
              passwords={passwords}
              setPasswords={setPasswords}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
              isChangingPassword={isChangingPassword}
              handleChangePassword={handleChangePassword}
              handleGenerateBackupCodes={handleGenerateBackupCodes}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <NotificationSettings
              notifications={notifications}
              setNotifications={setNotifications}
              savedNotifications={savedNotifications}
              isSavingNotifications={isSavingNotifications}
              handleSaveNotifications={handleSaveNotifications}
              handleResetNotifications={handleResetNotifications}
            />
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <SystemSettings
              twoFactorEnabled={twoFactorEnabled}
              sessionTimeout={sessionTimeout}
              setSessionTimeout={setSessionTimeout}
              darkModePreference={darkModePreference}
              apiStatus={apiStatus}
              apiLatency={apiLatency}
              handleToggleTwoFactor={handleToggleTwoFactor}
              handleRefreshSystem={handleRefreshSystem}
              handleGenerateBackupCodes={handleGenerateBackupCodes}
              handleThemeChange={handleThemeChange}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  );
}
