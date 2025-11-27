/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Loader2, Plus, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CreateBarangayRequest, EmergencyContact } from "@/types/barangay.types";
import { barangayService } from "@/services/barangay.service";

export default function BarangayForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      phone: "",
      type: "EMERGENCY",
      isPrimary: true,
    },
  ]);

  useEffect(() => {
    const fetchBarangay = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await barangayService.getBarangayById(id);
        const barangay = response.data;

        setFormData({
          name: barangay.name,
          description: barangay.description || "",
          latitude: barangay.latitude.toString(),
          longitude: barangay.longitude.toString(),
          address: barangay.address,
        });
        setEmergencyContacts(barangay.emergencyContacts);
      } catch (error: unknown) {
        toast.error((error as any).response?.data?.message || "Failed to load post details");
        // console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode) {
      fetchBarangay();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate emergency contacts
      const validContacts = emergencyContacts.filter(c => c.name && c.phone);
      if (validContacts.length === 0) {
        toast.error("Please add at least one emergency contact");
        setIsSaving(false);
        return;
      }

      const payload: CreateBarangayRequest = {
        name: formData.name,
        description: formData.description || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        emergencyContacts: validContacts,
        operatingHours: "24/7",
      };

      if (isEditMode) {
        await barangayService.updateBarangay(id!, payload);
        toast.success("Post updated successfully");
      } else {
        await barangayService.createBarangay(payload);
        toast.success("Post created successfully");
      }

      navigate("/post");
    } catch (error: unknown) {
      toast.error((error as any).response?.data?.message || "Failed to save post");
      // console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      {
        id: crypto.randomUUID(),
        name: "",
        phone: "",
        type: "OTHER",
      },
    ]);
  };

  const removeEmergencyContact = (id: string) => {
    if (emergencyContacts.length === 1) {
      toast.error("At least one emergency contact is required");
      return;
    }
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const openMapDispatch = () => {
    const query =
      formData.latitude && formData.longitude
        ? `${formData.latitude},${formData.longitude}`
        : formData.address || "";
    const url = query
      ? `https://www.gps-coordinates.net/?q=${encodeURIComponent(query)}`
      : "https://www.gps-coordinates.net/";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const updateEmergencyContact = (
    id: string,
    field: keyof EmergencyContact,
    value: string | boolean
  ) => {
    setEmergencyContacts(
      emergencyContacts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const setPrimaryContact = (id: string) => {
    setEmergencyContacts(
      emergencyContacts.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Loading post details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="w-full">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl border border-blue-200/20 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/posts")}
                className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-xs text-white/90 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to List
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {isEditMode ? "Edit Post" : "Post Management"}
                </h1>
                <p className="text-blue-100 mt-1 font-medium">
                  {isEditMode
                    ? "Update emergency response post details"
                    : "Add new post • Manage emergency response posts and locations"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <div className="rounded-2xl border border-blue-100/60 bg-white/95 shadow-xl ring-1 ring-blue-500/5 p-6 sm:p-8">
        <div className="flex items-center border-b border-blue-100 pb-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-500 font-semibold">
              Post Form
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditMode ? "Edit Post" : "Add New Post"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50 to-white shadow-lg ring-1 ring-blue-500/10 p-6 sm:p-7 space-y-6 relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-blue-100/60 via-transparent to-transparent blur-3xl opacity-70 pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-700 font-semibold">
                01
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Post Information</h2>
                <p className="text-sm text-slate-600">Name, description, and base address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">
                  <span>Post Name <span className="text-destructive">*</span></span>
                  <span className="text-blue-500 font-semibold tracking-[0.15em]">Required</span>
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  placeholder="e.g., Post Alpha"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                  Give the post a clear, human-friendly name.
                </p>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80 font-semibold">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  placeholder="Brief description of the post"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80 font-semibold flex items-center justify-between">
                  <span>Address <span className="text-destructive">*</span></span>
                  <span className="text-blue-500/80 font-semibold tracking-[0.15em]">Map-ready</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  placeholder="Complete address"
                />
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-white via-blue-50/60 to-white shadow-xl ring-1 ring-blue-500/10 p-6 sm:p-7 space-y-5 relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-blue-200/40 via-transparent to-transparent blur-3xl opacity-60 pointer-events-none" />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 font-semibold">
                  02
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Location Coordinates</h2>
                  <p className="text-sm text-muted-foreground">Precise latitude & longitude values</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openMapDispatch}
                className="rounded-xl border-blue-200 bg-white/80 text-blue-600 hover:bg-blue-50 shadow-sm"
              >
                <MapPin className="h-4 w-4" />
                Open Map
              </Button>
            </div>
            <p className="text-sm text-slate-600 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
              <span>
                Click on the Map Dispatch page or use Google Maps to capture accurate coordinates. Precise data helps dispatch teams reach posts faster.
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80 font-semibold">
                  Latitude <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  step="any"
                  className="h-12 w-full rounded-2xl border border-blue-200/70 bg-white px-4 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  placeholder="e.g., 10.3157"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80 font-semibold">
                  Longitude <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                  step="any"
                  className="h-12 w-full rounded-2xl border border-blue-200/70 bg-white px-4 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  placeholder="e.g., 123.8854"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="rounded-2xl border border-blue-100/60 bg-white shadow-xl p-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-700 font-semibold">
                    03
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Emergency Contacts</h2>
                    <p className="text-sm text-muted-foreground">Provide at least one reachable contact</p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmergencyContact}
                className="rounded-xl border-blue-200 bg-white/80 hover:bg-blue-50/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            <div className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-blue-100/70 bg-blue-50/30 p-5 shadow-inner"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white/70 text-blue-500 flex items-center justify-center shadow">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-blue-500/80">
                          Contact #{index + 1}
                        </p>
                        <p className="text-base font-semibold text-slate-900">
                          {contact.name || "Unnamed Contact"}
                        </p>
                      </div>
                      {contact.isPrimary && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/70">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!contact.isPrimary && emergencyContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryContact(contact.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50/70"
                        >
                          Set as Primary
                        </button>
                      )}
                      {emergencyContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmergencyContact(contact.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">
                        Contact Type <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={contact.type}
                        onChange={(e) =>
                          updateEmergencyContact(contact.id, "type", e.target.value)
                        }
                        required
                        className="h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        <option value="BARANGAYHALL">POST</option>
                        <option value="EMERGENCY">Emergency Hotline</option>
                        <option value="POLICE">Police</option>
                        <option value="FIRE">Fire Department</option>
                        <option value="MEDICAL">Medical/Hospital</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">
                        Contact Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) =>
                          updateEmergencyContact(contact.id, "name", e.target.value)
                        }
                        required
                        className="h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        placeholder="e.g., POST"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">
                        Phone Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          updateEmergencyContact(contact.id, "phone", e.target.value)
                        }
                        required
                        className="h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              These contacts appear on the public map so residents can reach the post during emergencies.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-6 border-t border-slate-200">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Update Post" : "Create Post"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/post")}
              disabled={isSaving}
              className="rounded-xl px-6 py-3 text-base font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
