import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MapPin,
  // Calendar,
  Activity,
  Award,
  Clock,
  TrendingUp,
  Edit,
  AlertCircle,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { Personnel } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { getImageUrl } from "@/lib/constants";

export default function PersonnelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPersonnel();
      fetchLocationHistory();
      // fetchAssignmentHistory();
    } else if (id === 'new') {
      navigate('/personnel/new');
    }
  }, [id, navigate]);

  const fetchPersonnel = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await personnelService.getPersonnelById(id);
      setPersonnel(response.data);
    } catch {
      toast.error("Failed to load personnel details");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationHistory = async () => {
    if (!id) return;
    try {
      const response = await personnelService.getLocationHistory(id, 10);
      setLocationHistory(response.data);
    } catch {
      // console.error("Failed to load location history:", error);
    }
  };

  // const fetchAssignmentHistory = async () => {
  //   if (!id) return;
  //   try {
  //     const response = await personnelService.getAssignmentHistory(id);
  //     setAssignmentHistory(response.data);
  //   } catch (error) {
  //     // console.error("Failed to load assignment history:", error);
  //   }
  // };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

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

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      await personnelService.uploadPhoto(id, formData);
      toast.success('Profile photo updated successfully');
      await fetchPersonnel(); // Refresh personnel data
    } catch {
      // console.error('Photo upload failed:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await personnelService.deletePersonnel(id);
      toast.success('Personnel account deleted successfully');
      navigate('/personnel');
    } catch {
      // console.error('Delete failed:', error);
      toast.error('Failed to delete personnel account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      RESPONDER: "bg-orange-100 text-orange-700 border-orange-200",
      MEDIC: "bg-blue-100 text-blue-700 border-blue-200",
      FIREFIGHTER: "bg-red-100 text-red-700 border-red-200",
      POLICE: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getRoleGradient = (role: string) => {
    const gradients: Record<string, string> = {
      RESPONDER: "from-orange-500 to-orange-600",
      MEDIC: "from-blue-500 to-blue-600",
      FIREFIGHTER: "from-red-500 to-red-600",
      POLICE: "from-indigo-500 to-indigo-600",
      COORDINATOR: "from-purple-500 to-purple-600",
    };
    return gradients[role] || "from-gray-500 to-gray-600";
  };

  const getRoleDisplayName = (role: string) => {
    const names: Record<string, string> = {
      RESPONDER: "Responder",
      MEDIC: "Medic",
      FIREFIGHTER: "Firefighter",
      POLICE: "Peace Officer",
      COORDINATOR: "Coordinator",
    };
    return names[role] || role;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ON_DUTY: "bg-green-100 text-green-800", // Primary active
      ON_BREAK: "bg-yellow-100 text-yellow-800",
      OFF_DUTY: "bg-gray-100 text-gray-800",
      RESPONDING: "bg-orange-100 text-orange-800",
      ON_SCENE: "bg-red-100 text-red-800",
      AVAILABLE: "bg-blue-100 text-blue-800", // Legacy
      INACTIVE: "bg-slate-100 text-slate-800",
      SUSPENDED: "bg-red-50 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/personnel")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Personnel
        </Button>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/personnel/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover */}
        <div className={`h-32 bg-linear-to-r ${getRoleGradient(personnel.role)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
            {/* Avatar */}
            <div className="relative group">
              {personnel.profilePhoto && getImageUrl(personnel.profilePhoto) ? (
                <img
                  src={getImageUrl(personnel.profilePhoto)!}
                  alt={`${personnel.firstName} ${personnel.lastName}`}
                  className="h-32 w-32 rounded-2xl shadow-lg object-cover border-4 border-white"
                />
              ) : (
                <div className={`h-32 w-32 bg-linear-to-br ${getRoleGradient(personnel.role)} rounded-2xl shadow-lg flex items-center justify-center text-white text-4xl font-bold border-4 border-white ring-4 ring-white/30`}>
                  {personnel.firstName.charAt(0)}
                  {personnel.lastName.charAt(0)}
                </div>
              )}
              {/* Upload Photo Overlay */}
              <label className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="text-white text-center">
                    <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs mt-2">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <Upload className="h-8 w-8 mx-auto" />
                    <p className="text-xs mt-2">Upload Photo</p>
                  </div>
                )}
              </label>
            </div>

            {/* Name and Role */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {personnel.firstName} {personnel.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">{personnel.employeeId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-lg border ${getRoleColor(
                      personnel.role
                    )}`}
                  >
                    {getRoleDisplayName(personnel.role)}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-lg ${getStatusColor(
                      personnel.status
                    )}`}
                  >
                    {personnel.status.replace("_", " ")}
                  </span>
                  {personnel.isAvailable && (
                    <span className="px-3 py-1 text-sm font-medium rounded-lg bg-green-500 text-white">
                      ● Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm font-medium">Incidents</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {personnel.totalIncidentsHandled || 0}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Avg Response</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {personnel.averageResponseTime?.toFixed(1) || "N/A"}
                {personnel.averageResponseTime && (
                  <span className="text-sm font-normal text-gray-500 ml-1">min</span>
                )}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Award className="h-5 w-5" />
                <span className="text-sm font-medium">Rating</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {personnel.performanceRating?.toFixed(1) || "N/A"}
                {personnel.performanceRating && (
                  <span className="text-sm font-normal text-gray-500 ml-1">/5.0</span>
                )}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Duty Status</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {personnel.dutyStatus?.replace("_", " ") || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personnel Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Personnel Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 mt-1">{personnel.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 mt-1">{personnel.email}</p>
            </div>
            {personnel.bloodType && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Blood Type
                </label>
                <p className="text-gray-900 mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    {personnel.bloodType}
                  </span>
                </p>
              </div>
            )}
            {personnel.emergencyContact && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Emergency Contact
                </label>
                <p className="text-gray-900 mt-1">{personnel.emergencyContact}</p>
              </div>
            )}
            {personnel.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900 mt-1">{personnel.address}</p>
              </div>
            )}
            {personnel.dateOfBirth && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date of Birth
                </label>
                <p className="text-gray-900 mt-1">
                  {format(new Date(personnel.dateOfBirth), "MMMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location & Location History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Tracking
          </h2>

          {/* Current Location */}
          {personnel.currentLatitude && personnel.currentLongitude ? (
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Current Location</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-blue-700">Coordinates</label>
                    <p className="text-blue-900 font-mono text-sm">
                      {personnel.currentLatitude.toFixed(6)}, {personnel.currentLongitude.toFixed(6)}
                    </p>
                  </div>
                  {personnel.locationAccuracy && (
                    <div>
                      <label className="text-xs font-medium text-blue-700">Accuracy</label>
                      <p className="text-blue-900 text-sm">±{personnel.locationAccuracy.toFixed(0)} meters</p>
                    </div>
                  )}
                  {personnel.lastLocationUpdate && (
                    <div>
                      <label className="text-xs font-medium text-blue-700">Last Updated</label>
                      <p className="text-blue-900 text-sm">
                        {formatDistanceToNow(new Date(personnel.lastLocationUpdate), { addSuffix: true })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 mb-6 bg-gray-50 rounded-lg">
              <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No current location data</p>
            </div>
          )}

          {/* Location History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Location History</span>
              <span className="text-xs text-gray-500 font-normal">
                Updates from Mobile App
              </span>
            </h3>
            {locationHistory.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {locationHistory.map((location, index) => (
                  <div
                    key={location.id}
                    className={`p-3 rounded-lg border ${index === 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-mono text-xs text-gray-700">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        {location.accuracy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Accuracy: ±{location.accuracy.toFixed(0)}m
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-900">
                          {format(new Date(location.timestamp), 'MMM dd, HH:mm')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(location.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No location history yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Location updates from mobile app will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">Warning: This action cannot be undone!</p>
                  <p className="text-xs text-red-700 mt-1">All data associated with this personnel will be permanently deleted.</p>
                </div>
              </div>
              <p className="text-gray-700">
                Are you sure you want to delete the account for{' '}
                <strong>{personnel.firstName} {personnel.lastName}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
