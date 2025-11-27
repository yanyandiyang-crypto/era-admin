import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Upload, X, Eye, EyeOff } from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { PersonnelRole, CreatePersonnelRequest } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

export default function PersonnelCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoFileName, setPhotoFileName] = useState<string>("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    <div className="min-h-screen w-full bg-linear-to-br from-background via-background to-accent/5">
      {/* Header */}
      <section className="w-full pt-0 pb-6">
        <div className="w-full">
          <div className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl border border-blue-200/20 px-5 py-6 sm:px-7 sm:py-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-blue-100/80">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/personnel")}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    aria-label="Go back to personnel list"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <span className="text-white/70">/</span>
                  <span className="text-white/80">Personnel</span>
                  <span className="text-white font-medium">Create</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Personnel Management</h1>
                  <p className="text-blue-100 mt-1 font-medium">Add new personnel</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full px-0 py-8">
        <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Profile Photo & Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
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
            </div>
          </div>

          {/* Main Form - Two Column Layout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information Card */}
            <div className="rounded-2xl border border-blue-100/60 bg-white/90 shadow-lg ring-1 ring-blue-500/5 p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 font-semibold">
                    02
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-card-foreground tracking-tight">Account Information</h2>
                    <p className="text-sm text-muted-foreground">Secure credentials for the personnel portal</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Employee ID */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                    Employee ID <span className="text-destructive">*</span>
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
                      aria-required="true"
                      className="h-11 rounded-xl border-blue-200/70 bg-blue-50/30 focus-visible:ring-blue-500/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold">Required</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unique identifier for the employee</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@example.com"
                    aria-required="true"
                    className="h-11 rounded-xl border-blue-200/70 bg-blue-50/30 focus-visible:ring-blue-500/40"
                  />
                  <p className="text-xs text-muted-foreground">Used for login and notifications</p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                      Password
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Min 8 characters</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={8}
                      placeholder="Personnel123!"
                      className="h-11 rounded-xl border-blue-200/70 bg-blue-50/30 pr-12 focus-visible:ring-blue-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default: <code className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-xs">Personnel123!</code>
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
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
                      className="h-11 rounded-xl border-blue-200/70 bg-blue-50/30 pr-12 focus-visible:ring-blue-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must match password above</p>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-lg ring-1 ring-slate-300/30 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 font-semibold">
                  03
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Basic details and contact information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="John"
                    aria-required="true"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Doe"
                    aria-required="true"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+639123456789"
                    aria-required="true"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                  <p className="text-xs text-muted-foreground">Format: +639XXXXXXXXX or 09XXXXXXXXX</p>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                </div>

                {/* Blood Type */}
                <div className="space-y-2">
                  <Label htmlFor="bloodType" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Blood Type
                  </Label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-xl border-slate-200 bg-transparent px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergencyContact"
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Name and phone number"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="flex h-11 w-full rounded-xl border-slate-200 bg-transparent px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                  Address
                </Label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Full address"
                  className="w-full rounded-2xl border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-6 border-t border-slate-200 bg-card/70 rounded-2xl p-6 shadow-inner">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold shadow-lg hover:bg-blue-500 disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Personnel
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/personnel")}
                disabled={isSaving}
                className="rounded-xl px-6 py-4 text-base font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
