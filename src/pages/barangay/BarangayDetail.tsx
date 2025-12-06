import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Map as MapIcon,
  Clock,
  Shield,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Barangay } from "@/types/barangay.types";
import { barangayService } from "@/services/barangay.service";

export default function BarangayDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [barangay, setBarangay] = useState<Barangay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBarangay();
  }, [id]);

  const fetchBarangay = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await barangayService.getBarangayById(id);
      setBarangay(response.data);
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to load barangay details"
      );
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = () => {
    if (barangay) {
      // Navigate to map with coordinates
      navigate(`/map?lat=${barangay.latitude}&lng=${barangay.longitude}&zoom=15`);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 h-16 w-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin mx-auto animate-[spin_1.5s_linear_infinite]" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 font-medium">Loading barangay details...</p>
              <p className="text-sm text-gray-400">Fetching emergency response information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!barangay) {
    return (
      <div className="px-4 lg:px-6 xl:px-8">
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl shadow-lg border border-gray-200/60 p-12 text-center hover:shadow-xl transition-all duration-300">
          <div className="relative mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <MapPin className="h-10 w-10 text-red-600" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <ArrowLeft className="h-4 w-4 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Barangay Not Found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            The barangay you're looking for doesn't exist or may have been removed.
          </p>
          <Button
            onClick={() => navigate("/barangays")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Barangay List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 xl:px-8">
      <div className="space-y-6">
        {/* Enhanced Header with Modern Button Design */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/80 p-4">
          <div className="flex items-center justify-between">
            {/* Enhanced Back Button */}
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate("/barangays")}
              className="bg-white/90 hover:bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl font-medium gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to List</span>
            </Button>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-3">
              {/* View on Map Button */}
              <Button
                variant="outline"
                size="default"
                onClick={handleViewOnMap}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 hover:from-green-100 hover:to-emerald-100 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl font-medium gap-2 transform hover:scale-105"
              >
                <MapIcon className="h-5 w-5" />
                <span>View on Map</span>
              </Button>

              {/* Edit Button */}
              <Button
                size="default"
                onClick={() => navigate(`/barangays/${id}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 rounded-xl font-medium gap-2 transform hover:scale-105"
              >
                <Edit className="h-5 w-5" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
        </div>

      {/* Enhanced Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden relative">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"></div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{barangay.name}</h1>
            <p className="text-gray-600 text-base leading-relaxed">{barangay.address}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-bold rounded-full shadow-sm ${
              barangay.status === "ACTIVE"
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200"
                : "bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-gray-200"
              }`}
          >
            ● {barangay.status}
          </span>
        </div>

        {barangay.description && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-4 mb-6 border border-gray-100">
            <p className="text-gray-700 leading-relaxed">{barangay.description}</p>
          </div>
        )}

        {/* Enhanced Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {barangay.operatingHours && (
            <div className="group bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 rounded-xl p-5 border border-blue-100/80 hover:shadow-md transition-all duration-300 hover:scale-102 hover:shadow-blue-500/20">
              <div className="flex items-center gap-3 text-blue-700 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm group-hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                  <Clock className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                </div>
                <span className="text-base font-semibold">Operating Hours</span>
              </div>
              <p className="text-gray-800 font-medium leading-relaxed">{barangay.operatingHours}</p>
            </div>
          )}

          {barangay.landmarks && (
            <div className="group bg-gradient-to-br from-purple-50 via-purple-25 to-violet-50 rounded-xl p-5 border border-purple-100/80 hover:shadow-md transition-all duration-300 hover:scale-102 hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 text-purple-700 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 shadow-sm group-hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                  <Building2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                </div>
                <span className="text-base font-semibold">Nearby Landmarks</span>
              </div>
              <p className="text-gray-800 font-medium leading-relaxed">{barangay.landmarks}</p>
            </div>
          )}
        </div>

        {/* Enhanced Location Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 shadow-sm flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            Location
          </h2>

          {/* Coordinates Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-lg p-4 border border-green-100/80 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-100 to-green-200 shadow-sm flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 mb-1">Coordinates</p>
                <p className="font-mono font-semibold text-gray-900 text-base">
                  {barangay.latitude.toFixed(6)}, {barangay.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Map Button */}
          <Button
            onClick={handleViewOnMap}
            size="default"
            className="w-full relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 rounded-xl font-medium gap-2 transform hover:scale-102 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="flex items-center justify-center gap-2 relative z-10">
              <MapIcon className="h-5 w-5" />
              <span>Open in Map Dispatch</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Enhanced Emergency Contacts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden relative">
        {/* Decorative alert bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-100 to-orange-200 shadow-sm flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
        </div>

        {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barangay.emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className={`border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-lg group ${
                  contact.isPrimary
                    ? "border-blue-500 bg-blue-50 hover:bg-blue-100/80 hover:border-blue-400"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${contact.type === "EMERGENCY"
                        ? "bg-red-100"
                        : contact.type === "POLICE"
                          ? "bg-indigo-100"
                          : contact.type === "FIRE"
                            ? "bg-orange-100"
                            : contact.type === "MEDICAL"
                              ? "bg-green-100"
                              : "bg-gray-100"
                        }`}
                    >
                      <Phone
                        className={`h-5 w-5 group-hover:rotate-12 transition-transform duration-200 ${
                          contact.type === "EMERGENCY"
                            ? "text-red-600"
                            : contact.type === "POLICE"
                              ? "text-indigo-600"
                              : contact.type === "FIRE"
                                ? "text-orange-600"
                                : contact.type === "MEDICAL"
                                  ? "text-green-600"
                                  : "text-gray-600"
                          }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <span className="text-xs text-gray-500">
                        {contact.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {contact.isPrimary && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded">
                      Primary
                    </span>
                  )}
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 group hover:shadow-md"
                >
                  <Phone className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                  <span className="text-lg font-mono font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {contact.phone}
                  </span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No emergency contacts available</p>
          </div>
        )}

        {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>For Public Display:</strong> These emergency contacts are shown on both admin and public maps to help citizens quickly access emergency services.
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Metadata Footer */}
      <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Created</p>
              <p className="text-slate-700 font-semibold">
                {new Date(barangay.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <Edit className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Last Updated</p>
              <p className="text-slate-700 font-semibold">
                {new Date(barangay.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
