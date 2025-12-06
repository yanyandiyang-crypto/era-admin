import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Home as HomeIcon } from "lucide-react";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0 || location.pathname === '/dashboard') {
      return [];
    }

    interface Breadcrumb {
      label: string;
      path: string;
    }

    const breadcrumbs: Breadcrumb[] = [];
    let currentPath = '';

    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const menuItem = MENU_ITEMS.find(item => item.path === currentPath);
      if (menuItem) {
        breadcrumbs.push({
          label: menuItem.label,
          path: menuItem.path
        });
      }
    });

    return breadcrumbs.slice(-2); // Show only last 2 breadcrumbs to keep it clean
  }, [location.pathname]);

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modernized Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/80 ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-0.5">
              <img
                src="/logo.png"
                alt="ERA"
                onClick={() => navigate("/dashboard")}
                className="h-10 sm:h-12 w-auto object-contain cursor-pointer select-none transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
              />
              <span className="text-2xl font-bold text-blue-600 whitespace-nowrap hidden sm:inline font-serif">
                IRA
              </span>
            </div>

            {/* Desktop Navigation - With visible labels for admin use */}
            <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 ml-4">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-out transform shadow-sm group
                    ${isActive(item.path)
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105 ring-2 ring-blue-200 ring-offset-2"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-lg hover:scale-110 hover:-translate-y-0.5 hover:shadow-indigo-200/50"}
                    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95`}
                  style={{ boxShadow: isActive(item.path) ? '0 2px 12px 0 rgba(37, 99, 235, 0.10)' : undefined }}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Global Search - Available on desktop/tablet */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Mobile Search Button - Now triggers overlay */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="Search (Tap to open)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

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

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {/* TODO: Toggle profile dropdown */}}
                className="hidden sm:flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="User profile"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <span className="text-sm text-gray-700 hidden md:inline">Admin</span>
              </button>
            </div>

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

        {/* Close menu overlay - covers entire screen below header */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-[64px] z-20"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Enhanced Mobile Navigation with Slide Animation */}
        <div
          className={`md:hidden fixed inset-x-0 top-[64px] z-30 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/80 transition-all duration-300 ease-out ${
            mobileMenuOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <nav className="relative z-40 px-4 py-3 max-h-[calc(100vh-80px)] overflow-y-auto" role="navigation" aria-label="Mobile navigation">
            <div className="space-y-1">
              {MENU_ITEMS.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => navigateToPath(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform
                    ${isActive(item.path)
                      ? "bg-blue-600 text-white shadow-lg scale-[1.02] translate-x-1"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:scale-[1.01] hover:translate-x-0.5"}
                    focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 active:scale-95`}
                  style={mobileMenuOpen ? {
                    animationDelay: `${index * 60}ms`,
                    animationFillMode: 'both',
                    animationName: 'slideInLeft'
                  } : undefined}
                >
                  <div className={`p-2 rounded-lg ${
                    isActive(item.path)
                      ? "bg-white/20"
                      : "bg-gray-100"
                  }`}>
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>

            {/* User Actions Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-12 rounded-xl border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-3" />
                )}
                <span className="text-sm font-medium">
                  {isLoggingOut ? "Logging out..." : "Sign Out"}
                </span>
              </Button>
            </div>
          </nav>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden fixed inset-x-0 top-[64px] z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-lg animate-in slide-in-from-top-1 duration-200">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex-1 text-lg font-semibold text-gray-900">Search</div>
              </div>
              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search incidents, personnel, barangays..."
                    className="flex-1 text-base placeholder-gray-500 outline-none bg-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Search results will appear here...</p>
                <p className="text-xs text-gray-400 mt-1">Try searching for incident IDs, personnel names, or barangay names.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb Navigation */}
      {false && breadcrumbs.length > 0 && location.pathname !== '/map' && !location.pathname.includes('/barangays') && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="px-3 py-1.5 md:px-6 md:py-2">
            <nav aria-label="Breadcrumb" className="flex items-center text-sm">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={`transition-colors ${
                      index === breadcrumbs.length - 1
                        ? "text-blue-600 font-medium"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                    disabled={index === breadcrumbs.length - 1}
                  >
                    {crumb.label}
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={location.pathname === '/map' ? 'fixed top-16 left-0 right-0 bottom-0' : 'pt-16'}>
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
