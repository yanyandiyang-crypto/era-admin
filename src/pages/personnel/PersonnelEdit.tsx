import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Key } from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { Personnel, PersonnelRole, PersonnelStatus } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PersonnelEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

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

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPersonnel();
    } else if (id === 'new') {
      navigate('/personnel/new');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const fetchPersonnel = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await personnelService.getPersonnelById(id);
      const data = response.data;
      setPersonnel(data);
      
      // Populate form
      setFormData({
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
      });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Loading personnel details...</p>
        </div>
      </div>
    );
  }

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
                    onClick={() => navigate(`/personnel/${id}`)}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    aria-label="Go back to personnel profile"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <span className="text-white/70">/</span>
                  <span className="text-white/80">Personnel</span>
                  <span className="text-white font-medium">Edit</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Personnel Management</h1>
                  <p className="text-blue-100 mt-1 font-medium">Edit personnel profile</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetPasswordModal(true)}
                className="text-orange-300 hover:text-orange-100 border-orange-300/50 hover:border-orange-200 bg-orange-600/10 hover:bg-orange-600/20"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
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
                      <h3 className="text-lg font-semibold text-card-foreground mt-1">Current Photo</h3>
                      <p className="text-xs text-muted-foreground">Personnel identification photo</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700">
                      Info
                    </span>
                  </div>

                  {/* Photo Display */}
                  <div className="relative group">
                    <div className="h-48 rounded-2xl border border-blue-200/40 bg-blue-950/5 shadow-md flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl text-blue-600 font-semibold">
                            {personnel.firstName?.[0]}{personnel.lastName?.[0]}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-blue-900">Profile Photo</p>
                        <p className="text-xs text-blue-700/70">Not uploaded yet</p>
                      </div>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-4 py-3 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold text-blue-800">Photo Status</p>
                    <p>No profile photo uploaded for this personnel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form - Two Column Layout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-lg ring-1 ring-slate-300/30 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 font-semibold">
                  01
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

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
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
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                  <p className="text-xs text-muted-foreground">Used for login and notifications</p>
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

            {/* Work Information Card */}
            <div className="rounded-2xl border border-blue-100/60 bg-white/90 shadow-lg ring-1 ring-blue-500/5 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 font-semibold">
                  02
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground tracking-tight">Work Information</h2>
                  <p className="text-sm text-muted-foreground">Role, status, and assignment details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="flex h-11 w-full rounded-xl border-slate-200 bg-transparent px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-required="true"
                  >
                    <option value="">Select Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Current Duty */}
                <div className="space-y-2">
                  <Label htmlFor="currentDuty" className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Current Duty
                  </Label>
                  <Input
                    id="currentDuty"
                    type="text"
                    name="currentDuty"
                    value={formData.currentDuty}
                    onChange={handleInputChange}
                    placeholder="Current assignment"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-slate-500/40"
                  />
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wide text-muted-foreground/80">
                    Availability
                  </Label>
                  <div className="flex items-center pt-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Available for assignments
                      </span>
                    </label>
                  </div>
                </div>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/personnel/${id}`)}
                disabled={isSaving}
                className="rounded-xl px-6 py-4 text-base font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              This will reset the password to the default: <strong>Personnel123!</strong>
              <br />
              <br />
              The personnel will be required to change their password when they next log in to the mobile app.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="flex-1"
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
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
