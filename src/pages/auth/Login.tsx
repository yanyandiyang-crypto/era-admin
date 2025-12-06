import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { API_URL, STORAGE_KEYS } from "@/lib/constants";
import {
  AlertCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();

  const [email, setEmail] = useState("admin@era.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Debug: Check current configuration on component mount
  useEffect(() => {
    console.log('🔧 Login page loaded with configuration:');
    console.log('- API_URL:', API_URL);
    console.log('- Current localStorage tokens:', {
      accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      user: localStorage.getItem(STORAGE_KEYS.USER),
    });
  }, []);

  const emailError =
    touched.email && !email
      ? "Email is required"
      : touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Enter a valid email address"
        : "";

  const passwordError =
    touched.password && !password
      ? "Password is required"
      : touched.password && password.length < 6
        ? "Password must be at least 6 characters"
        : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    setTouched({ email: true, password: true });

    if (emailError || passwordError || !email || !password) {
      return;
    }

    try {
      console.log('🔐 Form submission - calling login with:', { email, password: '***' });
      await login({ email, password });
      console.log('🔐 Login successful');
    } catch (error) {
      console.log('🔐 Login failed:', error);
      // The store will capture and set the error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when the component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Side - Modern Blue Theme Branding */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-500 to-blue-900 p-8 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>

        <div className="z-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <img
              src="/logo.png"
              alt="ERA Logo"
              className="h-60 w-60 object-contain rounded-full hover:scale-105 transition-transform duration-300"
            />
            <p className="text-4xl font-bold tracking-wider hover:scale-105 transition-transform duration-300">BASAK IRA</p>
            <p className="text-xl font-bold italic animate-pulse hover:scale-105 transition-transform duration-300 tracking-wider">Incident Response Assistance System</p>
          </div>
        </div>
      </div>
      {/* Right Side - Login Form */}
      <div className="relative w-full flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 right-16 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-24 left-12 w-40 h-40 bg-indigo-200/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-200/10 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo Section */}
          <div className="text-center">
            <img
              src="/logo.png"
              alt="ERA Logo"
              className="h-35 w-35 mx-auto object-contain rounded-full hover:scale-105 transition-transform duration-300"
            />
          </div>
          {/* Header Section */}
          <div className="text-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Welcome Back to IRA!
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Sign in to your administrator account
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 p-8 hover:shadow-3xl transition-all duration-300">
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-50">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-700">Authenticating...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">Authentication Failed</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    required
                    disabled={isLoading}
                    className={`w-full h-12 pl-11 pr-4 rounded-lg border border-gray-300 bg-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    aria-invalid={!!emailError}
                    aria-describedby="email-error"
                  />
                </div>
                {emailError && (
                  <p id="email-error" className=" text-xs text-red-600 flex items-center gap-1.5 " role="alert">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    required
                    disabled={isLoading}
                    className={`w-full h-12 pl-11 pr-12 rounded-lg border border-gray-300 bg-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                    aria-invalid={!!passwordError}
                    aria-describedby="password-error"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="text-xs text-red-600 flex items-center gap-1.5" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" disabled={isLoading} className="rounded border-gray-300" />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-indigo-900s text-white font-semibold rounded-lg shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}