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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Loading barangay details...</p>
        </div>
      </div>
    );
  }

  if (!barangay) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Barangay not found</p>
        <Button className="mt-4" onClick={() => navigate("/barangays")}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate("/barangays")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewOnMap}>
            <MapIcon className="h-4 w-4 mr-2" />
            View on Map
          </Button>
          <Button onClick={() => navigate(`/barangays/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{barangay.name}</h1>
            <p className="text-gray-600 mt-1">{barangay.address}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-lg ${barangay.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
              }`}
          >
            {barangay.status}
          </span>
        </div>

        {barangay.description && (
          <p className="text-gray-700 mb-6 pb-6 border-b">{barangay.description}</p>
        )}

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {barangay.operatingHours && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Operating Hours</span>
              </div>
              <p className="text-gray-900 font-medium">{barangay.operatingHours}</p>
            </div>
          )}

          {barangay.landmarks && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">Nearby Landmarks</span>
              </div>
              <p className="text-gray-900 font-medium">{barangay.landmarks}</p>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Coordinates</p>
                <p className="font-medium text-gray-900">
                  {barangay.latitude.toFixed(6)}, {barangay.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <button
              onClick={handleViewOnMap}
              className="w-full px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
            >
              Open in Map Dispatch
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Emergency Contacts</h2>
        </div>

        {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barangay.emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className={`border-2 rounded-lg p-4 transition-all ${contact.isPrimary
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
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
                        className={`h-5 w-5 ${contact.type === "EMERGENCY"
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
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Phone className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-lg font-mono font-semibold text-gray-900 group-hover:text-blue-600">
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

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            <span className="font-medium">Created:</span>{" "}
            {new Date(barangay.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>{" "}
            {new Date(barangay.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
