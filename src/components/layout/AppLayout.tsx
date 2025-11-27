import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useState, useEffect, useTransition } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, Home, AlertTriangle, Users, MapPin, Map, FileText, Settings, Menu, X, Shield, Loader2 } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { useNotificationStore } from "@/store/notificationStore";
import { BroadcastNotificationDialog } from "@/components/notifications/BroadcastNotificationDialog";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: AlertTriangle, label: "Incidents", path: "/incidents" },
  { icon: Map, label: "Map", path: "/map" },
  { icon: Users, label: "Personnel", path: "/personnel" },
  { icon: MapPin, label: "Post", path: "/barangays" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Shield, label: "Audit Logs", path: "/audit-logs" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { isBroadcastDialogOpen, closeBroadcastDialog } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleLogout = useCallback(async () => {
    startLogoutTransition(async () => {
      try {
        await logout();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error);
        // Could add error toast here
      }
    });
  }, [logout, navigate]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const navigateToPath = useCallback((path: string) => {
    navigate(path);
    closeMobileMenu();
  }, [navigate, closeMobileMenu]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileMenuOpen, closeMobileMenu]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modernized Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/80 ring-1 ring-gray-900/5">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-between px-3 py-2 md:px-6 md:py-3 min-h-[52px]">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-0.5">
              <img
                src="/logo.png"
                alt="ERA"
                onClick={() => navigate("/dashboard")}
                className="h-10 sm:h-12 w-auto object-contain cursor-pointer select-none"
              />
              <span className="text-xl font-bold text-blue-600 whitespace-nowrap hidden sm:inline">
                IRA
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block flex-1 min-w-0 md:ml-2">
              <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 md:pl-1 [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden" role="navigation" aria-label="Main navigation">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200
                      ${isActive(item.path)
                        ? "bg-blue-600 text-white shadow-md scale-105"
                        : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}
                      focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1`}
                    style={{ boxShadow: isActive(item.path) ? '0 2px 12px 0 rgba(37, 99, 235, 0.10)' : undefined }}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Global Search */}
            <div className="hidden lg:block">
              <GlobalSearch />
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* New Notification Button - Hidden */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={openBroadcastDialog}
              className="hidden sm:flex items-center gap-1 hover:bg-blue-50"
              title="Send broadcast notification"
            >
              <Plus className="h-4 w-4" />
            </Button> */}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <nav className="p-1 space-y-1" role="navigation" aria-label="Mobile navigation">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateToPath(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-full text-xs font-medium transition-colors
                    ${isActive(item.path)
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}
                    focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="pt-1 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={location.pathname === '/map' ? 'fixed top-14 left-0 right-0 bottom-0' : 'pt-14'}>
        <div className={location.pathname === '/map' ? 'w-full h-full' : 'p-4 md:p-6'}>
          <Outlet />
        </div>
      </main>

      {/* Broadcast Dialog - rendered at root level */}
      <BroadcastNotificationDialog 
        open={isBroadcastDialogOpen} 
        onOpenChange={(open) => !open && closeBroadcastDialog()}
      />
    </div>
  );
}
