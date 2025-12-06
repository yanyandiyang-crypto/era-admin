import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Upload, X, CheckCircle, AlertCircle, User, Mail, Phone, Shield, Eye, EyeOff } from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { PersonnelRole, CreatePersonnelRequest } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

// Enhanced form validation types
interface ValidationErrors {
  [key: string]: string;
}

interface FieldStatus {
  [key: string]: 'idle' | 'valid' | 'invalid' | 'checking';
}

export default function PersonnelCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoFileName, setPhotoFileName] = useState<string>("");

  // Enhanced state management
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({});
  const [completionProgress, setCompletionProgress] = useState(0);

  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "Personnel123!", // Auto-fill with default password
    confirmPassword: "Personnel123!", // Auto-fill confirmation
    role: "" as PersonnelRole | "",
    dateOfBirth: "",
    bloodType: "",
    address: "",
    emergencyContact: "",
  });

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'role'];
    const optionalFields = ['dateOfBirth', 'bloodType', 'address', 'emergencyContact', 'password'];
    
    let completed = 0;
    let total = requiredFields.length + optionalFields.length + (photoFile ? 1 : 0);
    
    requiredFields.forEach(field => {
      if (formData[field as keyof typeof formData]?.toString().trim()) completed++;
    });
    
    optionalFields.forEach(field => {
      if (formData[field as keyof typeof formData]?.toString().trim()) completed++;
    });
    
    if (photoFile) completed++;
    
    setCompletionProgress(Math.round((completed / total) * 100));
  }, [formData, photoFile]);

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
      case 'employeeId':
        if (value && value.length < 3) {
          errors.employeeId = 'Employee ID must be at least 3 characters';
        } else {
          delete errors.employeeId;
        }
        break;
      case 'password':
        if (value && value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else {
          delete errors.password;
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    
    setValidationErrors(errors);
    setFieldStatus(prev => ({ ...prev, [name]: errors[name] ? 'invalid' : value ? 'valid' : 'idle' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation before submission
    const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'role'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.toString().trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Use default password "Personnel123!" if not provided
    const password = formData.password || "Personnel123!";
    
    // Validate passwords match (only if password was entered)
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Validate password length (only if custom password was entered)
    if (formData.password && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsSaving(true);

      const createData: CreatePersonnelRequest = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: password, // Use default password "Personnel123!"
        role: formData.role as PersonnelRole,
      };

      if (formData.dateOfBirth) {
        createData.dateOfBirth = formData.dateOfBirth; // Keep as string, backend transforms it
      }
      if (formData.bloodType) {
        createData.bloodType = formData.bloodType;
      }
      if (formData.address) {
        createData.address = formData.address;
      }
      if (formData.emergencyContact) {
        createData.emergencyContact = formData.emergencyContact;
      }

      const response = await personnelService.createPersonnel(createData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const personnelId = response.data.personnelId || (response.data as any).id;
      
      // Upload photo if provided
      if (photoFile && personnelId) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          await personnelService.uploadPhoto(personnelId, photoFormData);
          toast.success("Personnel created with photo successfully");
        } catch {
          // console.error("Photo upload failed:", photoError);
          toast.warning("Personnel created but photo upload failed");
        }
      } else {
        toast.success("Personnel created successfully");
      }
      
      navigate(`/personnel/${personnelId}`);
    } catch (error: unknown) {
      // console.error("Create error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as AxiosError<any>;
      const errorData = axiosError.response?.data;
      
      // console.error("Error response:", axiosError.response);
      // console.error("Error data:", errorData);
      
      if (errorData?.error) {
        // New error format with details
        const errorMessage = errorData.error.message || "Failed to create personnel";
        const details = errorData.error.details;
        
        if (details && Array.isArray(details)) {
          // Show main error message
          toast.error(errorMessage);
          
          // Show field-specific errors
          details.forEach((detail: { field?: string; message?: string }) => {
            if (detail.field && detail.message) {
              toast.error(`${detail.field}: ${detail.message}`, {
                duration: 5000,
              });
            }
          });
        } else {
          toast.error(errorMessage);
        }
      } else if (errorData?.message) {
        // Legacy format
        toast.error(errorData.message);
      } else if (errorData?.issues) {
        // Zod validation errors
        const issues = errorData.issues;
        const errorMessages = issues.map((issue: { message: string }) => issue.message).join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else if (axiosError.message) {
        toast.error(`Error: ${axiosError.message}`);
      } else {
        toast.error("Failed to create personnel. Please check your input and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoFileName(file.name);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoFileName("");
  };

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
                  onClick={() => navigate("/personnel")}
                  className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Go back to personnel list"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <span className="text-white/70">/</span>
                <span className="text-white/80">Personnel</span>
                <span className="text-white font-medium">Create</span>
              </div>

              {/* Title and Progress */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Add New Personnel</h1>
                  <p className="text-blue-100 text-lg font-medium">Create a new personnel account in the system</p>
                </div>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-blue-100 text-sm font-medium">Form Progress</div>
                    <div className="text-white text-2xl font-bold">{completionProgress}%</div>
                  </div>
                  <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${completionProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Main Content */}
      <div className="w-full px-0 py-8">
        <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Photo Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="relative rounded-2xl border border-blue-200/30 bg-gradient-to-b from-white/90 via-card to-card shadow-lg ring-1 ring-blue-500/5 overflow-hidden p-6">
                <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-blue-400/30 via-transparent to-transparent blur-3xl opacity-70 pointer-events-none"></div>
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-semibold">
                        Profile Photo
                      </p>
                      <h3 className="text-lg font-semibold text-card-foreground mt-1">Visual Identity</h3>
                      <p className="text-xs text-muted-foreground">Helps responders recognize teammates quickly</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700">
                      Step 1
                    </span>
                  </div>

                  {/* Photo Preview */}
                  <div className="relative group">
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-blue-200/40 bg-blue-950/5 shadow-md">
                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          className="h-48 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-3 right-3 bg-white/90 text-destructive hover:bg-white text-destructive-foreground rounded-full p-1.5 transition-colors shadow-lg"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-48 rounded-2xl border border-dashed border-blue-200/60 flex items-center justify-center bg-blue-950/5 hover:border-blue-400 hover:bg-blue-950/10 transition-all duration-200 text-center">
                        <div>
                          <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-blue-900">No photo uploaded</p>
                          <p className="text-xs text-blue-700/70">Upload a square image (max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      aria-label="Upload profile photo"
                    />
                    <div className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 text-sm font-semibold shadow-lg transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                    </div>
                  </label>

                  {/* File Info */}
                  {photoFileName && (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      <span className="text-base">📄</span>
                      <span className="truncate">{photoFileName}</span>
                    </div>
                  )}

                  {/* Helper Text */}
                  <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-4 py-3 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold text-blue-800">Guidelines</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Square image (1:1) works best</li>
                      <li>Max size 5MB • JPG, PNG, GIF</li>
                      <li>Clear front-facing photo recommended</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="rounded-3xl border border-gray-200/30 bg-gradient-to-b from-white/95 via-white/90 to-white/80 shadow-xl ring-1 ring-gray-300/10 overflow-hidden backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-bold">Form Status</p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Completion</h3>
                  </div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    completionProgress >= 80 ? 'bg-green-100 text-green-700' : completionProgress >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {completionProgress >= 80 ? 'Almost Done' : completionProgress >= 50 ? 'In Progress' : 'Getting Started'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Required Fields:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {['employeeId', 'firstName', 'lastName', 'email', 'phone', 'role'].filter(field => formData[field as keyof typeof formData]?.toString().trim()).length}/6
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Photo:</span>
                    <span className={`text-sm font-medium ${photoFile ? 'text-green-600' : 'text-gray-400'}`}>
                      {photoFile ? 'Uploaded' : 'Optional'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Validation:</span>
                    <span className={`text-sm font-medium ${Object.keys(validationErrors).length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Object.keys(validationErrors).length === 0 ? 'All Good' : `${Object.keys(validationErrors).length} Issues`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information Card */}
            <div className="rounded-3xl border border-blue-100/60 bg-white/95 shadow-xl ring-1 ring-blue-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Account Information</h2>
                  <p className="text-gray-600">Secure login credentials for the personnel portal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enhanced Employee ID Field */}
                <div className="space-y-3">
                  <Label htmlFor="employeeId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="employeeId"
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., EMP-001"
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        fieldStatus.employeeId === 'valid' 
                          ? 'border-green-300 bg-green-50 focus:border-green-500' 
                          : fieldStatus.employeeId === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                    />
                    {fieldStatus.employeeId === 'valid' && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {fieldStatus.employeeId === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                  </div>
                  {validationErrors.employeeId && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.employeeId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Unique identifier for the employee</p>
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

                {/* Enhanced Password Fields */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={8}
                      placeholder="Enter secure password"
                      className={`h-12 rounded-xl border-2 pr-12 transition-all duration-200 ${
                        fieldStatus.password === 'valid' 
                          ? 'border-green-300 bg-green-50 focus:border-green-500' 
                          : fieldStatus.password === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Default: <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Personnel123!</code>
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      minLength={8}
                      placeholder="Re-enter password"
                      className={`h-12 rounded-xl border-2 pr-12 transition-all duration-200 ${
                        fieldStatus.confirmPassword === 'valid' 
                          ? 'border-green-300 bg-green-50 focus:border-green-500' 
                          : fieldStatus.confirmPassword === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-xl ring-1 ring-slate-300/30 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold text-lg shadow-lg">
                  3
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

                {/* Role */}
                <div className="space-y-3">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm focus:border-blue-500 transition-all duration-200"
                    aria-required="true"
                  >
                    <option value="">Select Role</option>
                    <option value="RESPONDER">Responder</option>
                    <option value="MEDIC">Medic</option>
                    <option value="FIREFIGHTER">Firefighter</option>
                    <option value="POLICE">Peace Officer</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                  Address
                </Label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Full address"
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-8 border-t border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl p-8 shadow-inner">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Create Personnel
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/personnel")}
                disabled={isSaving}
                className="rounded-xl px-8 py-4 text-base font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
