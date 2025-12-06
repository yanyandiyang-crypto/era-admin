import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Key, CheckCircle, AlertCircle, User, Mail, Phone, MapPin, Shield, Camera, Briefcase, Clock } from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { Personnel, PersonnelRole, PersonnelStatus } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Enhanced form validation types
interface ValidationErrors {
  [key: string]: string;
}

interface FieldStatus {
  [key: string]: 'idle' | 'valid' | 'invalid' | 'checking';
}

export default function PersonnelEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  
  // Enhanced state management
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({});
  const [completionProgress, setCompletionProgress] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as PersonnelRole,
    status: "" as PersonnelStatus,
    dateOfBirth: "",
    bloodType: "",
    address: "",
    emergencyContact: "",
    isAvailable: true,
    currentDuty: "",
  });

  const [originalData, setOriginalData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPersonnel();
    } else if (id === 'new') {
      navigate('/personnel/new');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // Calculate form completion and changes
  useEffect(() => {
    if (originalData) {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'status'];
      const optionalFields = ['dateOfBirth', 'bloodType', 'address', 'emergencyContact', 'currentDuty'];
      
      let completed = 0;
      let total = requiredFields.length + optionalFields.length;
      
      requiredFields.forEach(field => {
        if (formData[field as keyof typeof formData]?.toString().trim()) completed++;
      });
      
      optionalFields.forEach(field => {
        if (formData[field as keyof typeof formData]?.toString().trim()) completed++;
      });
      
      setCompletionProgress(Math.round((completed / total) * 100));
      
      // Check for changes
      const hasAnyChanges = Object.keys(formData).some(key => 
        formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
      );
      setHasChanges(hasAnyChanges);
    }
  }, [formData, originalData]);

  const fetchPersonnel = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await personnelService.getPersonnelById(id);
      const data = response.data;
      setPersonnel(data);
      
      // Populate form
      const populatedData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role,
        status: data.status,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : "",
        bloodType: data.bloodType || "",
        address: data.address || "",
        emergencyContact: data.emergencyContact || "",
        isAvailable: data.isAvailable,
        currentDuty: data.currentDuty || "",
      };
      
      setFormData(populatedData);
      setOriginalData(populatedData);
    } catch {
      toast.error("Failed to load personnel details");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSaving(true);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        bloodType: formData.bloodType || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        isAvailable: formData.isAvailable,
        currentDuty: formData.currentDuty || undefined,
      };

      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth; // Keep as string, backend transforms it
      }

      await personnelService.updatePersonnel(id, updateData);
      toast.success("Personnel updated successfully");
      navigate(`/personnel/${id}`);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      // console.error("Update error:", axiosError);
      
      // Display detailed error message
      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else if (axiosError.response?.data?.error) {
        toast.error(axiosError.response.data.error);
      } else if (axiosError.response?.data?.issues) {
        // Zod validation errors
        const issues = axiosError.response.data.issues;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessages = issues.map((issue: any) => issue.message).join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else if (axiosError.message) {
        toast.error(`Error: ${axiosError.message}`);
      } else {
        toast.error("Failed to update personnel");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time validation
  const validateField = (name: string, value: string) => {
    const errors: ValidationErrors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'phone':
        const phoneRegex = /^(\+63|0)[9]\d{9}$/;
        if (value && !phoneRegex.test(value)) {
          errors.phone = 'Please enter a valid Philippine phone number';
        } else {
          delete errors.phone;
        }
        break;
    }
    
    setValidationErrors(errors);
    setFieldStatus(prev => ({ ...prev, [name]: errors[name] ? 'invalid' : value ? 'valid' : 'idle' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Real-time validation
      validateField(name, value);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    
    try {
      setIsResettingPassword(true);
      await personnelService.resetPassword(id, "Personnel123!");
      toast.success("Password reset to default (Personnel123!). Personnel will be required to change it on next login.");
      setShowResetPasswordModal(false);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      // console.error("Reset password error:", axiosError);
      toast.error(axiosError.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading || !personnel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading personnel details...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="px-4 lg:px-6 xl:px-8 py-6">
        {/* Enhanced Header with Progress */}
        <section className="w-full mb-8">
          <div className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-2xl border border-blue-200/20 px-6 py-8 sm:px-8 sm:py-10 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)] animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-36 -mt-36 animate-bounce"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -ml-28 -mb-28 animate-bounce delay-1000"></div>

            <div className="relative z-10">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-blue-100/80 mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/personnel/${id}`)}
                  className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Go back to personnel profile"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <span className="text-white/70">/</span>
                <span className="text-white/80">Personnel</span>
                <span className="text-white font-medium">Edit</span>
              </div>

              {/* Title and Progress */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Edit Personnel</h1>
                  <p className="text-blue-100 text-lg font-medium">Update {personnel.firstName} {personnel.lastName}'s information</p>
                </div>
                
                {/* Progress and Status */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-blue-100 text-sm font-medium">Form Completion</div>
                    <div className="text-white text-2xl font-bold">{completionProgress}%</div>
                  </div>
                  <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${completionProgress}%` }}
                    ></div>
                  </div>
                  {hasChanges && (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Unsaved Changes
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetPasswordModal(true)}
                  className="text-orange-300 hover:text-orange-100 border-orange-300/50 hover:border-orange-200 bg-orange-600/10 hover:bg-orange-600/20 transition-all duration-200"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/personnel/${id}`)}
                  className="text-white/80 hover:text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Form Layout */}
        <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Profile Photo Card */}
              <div className="relative rounded-3xl border border-blue-200/30 bg-gradient-to-b from-white/95 via-white/90 to-white/80 shadow-xl ring-1 ring-blue-500/10 overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-blue-400/20 via-transparent to-transparent blur-3xl opacity-60 pointer-events-none"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-600 font-bold">Profile Photo</p>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">Current Photo</h3>
                      <p className="text-sm text-gray-600">Personnel identification photo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-blue-500" />
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        View Only
                      </span>
                    </div>
                  </div>

                  {/* Photo Display */}
                  <div className="relative group mb-4">
                    <div className="h-48 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <span className="text-2xl text-white font-bold">
                            {personnel.firstName?.[0]}{personnel.lastName?.[0]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {personnel.firstName} {personnel.lastName}
                        </p>
                        <p className="text-xs text-gray-600">No photo uploaded</p>
                      </div>
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200/50 px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm mb-2">📷 Photo Status</p>
                    <p className="text-xs text-gray-700 mb-2">No profile photo has been uploaded for this personnel.</p>
                    <p className="text-xs text-blue-600 font-medium">Photo upload can be managed from the personnel detail view.</p>
                  </div>
                </div>
              </div>

              {/* Personnel Status Card */}
              <div className="rounded-3xl border border-gray-200/30 bg-gradient-to-b from-white/95 via-white/90 to-white/80 shadow-xl ring-1 ring-gray-300/10 overflow-hidden backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-bold">Status</p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Current Status</h3>
                  </div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    personnel.status === 'ON_DUTY' || personnel.status === 'AVAILABLE' 
                      ? 'bg-green-100 text-green-700' 
                      : personnel.status === 'SUSPENDED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {personnel.status === 'ON_DUTY' ? 'Active' : personnel.status === 'AVAILABLE' ? 'Active' : personnel.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="text-sm font-medium text-gray-900">{personnel.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available:</span>
                    <span className={`text-sm font-medium ${personnel.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {personnel.isAvailable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {personnel.currentDuty && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Duty:</span>
                      <span className="text-sm font-medium text-gray-900">{personnel.currentDuty}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="rounded-3xl border border-gray-200/70 bg-white/95 shadow-xl ring-1 ring-gray-300/30 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-gray-600">Basic details and contact information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enhanced Name Fields */}
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Juan"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Dela Cruz"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                {/* Enhanced Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="personnel@emergency.gov.ph"
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        fieldStatus.email === 'valid' 
                          ? 'border-green-300 bg-green-50 focus:border-green-500' 
                          : fieldStatus.email === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                    />
                    {fieldStatus.email === 'valid' && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {fieldStatus.email === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Used for login and system notifications</p>
                </div>

                {/* Enhanced Phone Field */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+639123456789"
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        fieldStatus.phone === 'valid' 
                          ? 'border-green-300 bg-green-50 focus:border-green-500' 
                          : fieldStatus.phone === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                    />
                    {fieldStatus.phone === 'valid' && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {fieldStatus.phone === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Format: +639XXXXXXXXX or 09XXXXXXXXX</p>
                </div>

                {/* Date of Birth */}
                <div className="space-y-3">
                  <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                {/* Blood Type */}
                <div className="space-y-3">
                  <Label htmlFor="bloodType" className="text-sm font-semibold text-gray-700">
                    Blood Type
                  </Label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-3">
                  <Label htmlFor="emergencyContact" className="text-sm font-semibold text-gray-700">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergencyContact"
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Name and phone number"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-3 mt-6">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Address
                </Label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Complete address including barangay, municipality, province"
                  className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none"
                />
              </div>
            </div>

            {/* Work Information Card */}
            <div className="rounded-3xl border border-blue-100/60 bg-white/95 shadow-xl ring-1 ring-blue-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Work Information</h2>
                  <p className="text-gray-600">Role, status, and assignment details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role */}
                <div className="space-y-3">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">Select Role</option>
                    <option value="RESPONDER">Responder</option>
                    <option value="MEDIC">Medic</option>
                    <option value="FIREFIGHTER">Firefighter</option>
                    <option value="POLICE">Peace Officer</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">Select Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Current Duty */}
                <div className="space-y-3">
                  <Label htmlFor="currentDuty" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Current Duty
                  </Label>
                  <Input
                    id="currentDuty"
                    type="text"
                    name="currentDuty"
                    value={formData.currentDuty}
                    onChange={handleInputChange}
                    placeholder="Current assignment or location"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                {/* Availability */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    Availability Status
                  </Label>
                  <div className="flex items-center pt-3">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 group-hover:border-blue-400"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        Available for assignments
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Toggle to indicate current availability status</p>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-3xl p-8 shadow-inner">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Ready to update personnel information?</p>
                <p>Review all changes before saving.</p>
                {hasChanges && (
                  <p className="text-orange-600 font-medium mt-1">⚠️ You have unsaved changes</p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/personnel/${id}`)}
                  disabled={isSaving}
                  className="rounded-xl px-8 py-4 text-base font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !hasChanges}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 text-base font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Enhanced Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Reset Password</h3>
                  <p className="text-orange-100 text-sm">Security action required</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                  <Key className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Password Reset</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This will reset <strong>{personnel.firstName} {personnel.lastName}</strong>'s password to the default: 
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono mx-1">
                    Personnel123!
                  </code>
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>The personnel will be required to change their password when they next log in to the mobile app.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 hover:shadow-xl"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowResetPasswordModal(false)}
                  disabled={isResettingPassword}
                  className="rounded-xl px-6 py-3 text-sm font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
