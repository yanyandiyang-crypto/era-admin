/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { X, Send, Users, MapPin, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { personnelService } from "@/services/personnel.service";
import type { Personnel, PersonnelRole, BroadcastAlertRequest, AlertResponse } from "@/types/personnel.types";
import type { Incident } from "@/types/incident.types";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

interface AlertBroadcastModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onAlertSent?: (alertId: string) => void;
}

export function AlertBroadcastModal({
  incident,
  isOpen,
  onClose,
  onAlertSent,
}: AlertBroadcastModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [targetRoles, setTargetRoles] = useState<PersonnelRole[]>([]);
  const [radius, setRadius] = useState<number>(5000); // 5km default
  const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState<AlertResponse[]>([]);

  useEffect(() => {
    if (isOpen && incident) {
      // Set default message
      setMessage(
        `🚨 EMERGENCY ALERT\n\nType: ${incident.type}\nLocation: ${incident.address}\nPriority: ${incident.priority}\n\nImmediate response required.`
      );
      
      // Fetch available personnel
      fetchAvailablePersonnel();
    }
  }, [isOpen, incident, radius]);

  const fetchAvailablePersonnel = async () => {
    try {
      if (incident.latitude && incident.longitude) {
        const response = await personnelService.getNearbyPersonnel(
          incident.latitude,
          incident.longitude,
          radius,
          true // Include OFF_DUTY personnel for emergency alerts
        );
        setAvailablePersonnel(response.data);
      } else {
        // Get ALL personnel (including OFF_DUTY) for emergency alerts
        const response = await personnelService.getPersonnel({
          limit: 1000, // Get all personnel
          // Don't filter by status - include OFF_DUTY personnel for alerts
        });
        setAvailablePersonnel(response.data.data || response.data);
      }
    } catch {
      // console.error("Failed to fetch personnel:", error);
    }
  };

  const handleBroadcast = async () => {
    try {
      setIsLoading(true);

      const alertData: BroadcastAlertRequest = {
        incidentId: incident.incidentId,
        message,
        priority: incident.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        targetRoles: targetRoles.length > 0 ? targetRoles : undefined,
        radius: incident.latitude && incident.longitude ? radius : undefined,
        latitude: incident.latitude,
        longitude: incident.longitude,
      };

      const response = await personnelService.broadcastIncidentAlert(alertData);
      
      toast.success(`Alert broadcasted to ${response.data.alertedPersonnel.length} personnel!`, {
        description: "Personnel will be notified immediately",
      });

      if (onAlertSent) {
        onAlertSent(response.data.alertId);
      }

      // Show responses screen
      setShowResponses(true);
      
      // Poll for responses
      pollResponses(response.data.alertId);
      
    } catch (error: any) {
      toast.error("Failed to broadcast alert", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollResponses = async (alertId: string) => {
    try {
      const response = await personnelService.getAlertResponses(alertId);
      setResponses(response.data);
      
      // Continue polling if alert is still active
      setTimeout(() => pollResponses(alertId), 5000);
    } catch {
      // console.error("Failed to fetch responses:", error);
    }
  };

  const toggleRole = (role: PersonnelRole) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const filteredPersonnel = targetRoles.length > 0
    ? availablePersonnel.filter((p) => targetRoles.includes(p.role))
    : availablePersonnel;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Broadcast Emergency Alert</h2>
                <p className="text-red-100 text-sm">
                  {incident.trackingNumber} • {incident.type}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close emergency alert modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showResponses ? (
            <>
              {/* Incident Info */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Incident Location</h3>
                    <p className="text-sm text-gray-600 mt-1">{incident.address}</p>
                    {incident.description && (
                      <p className="text-sm text-gray-700 mt-2">{incident.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      incident.priority === "CRITICAL"
                        ? "bg-red-100 text-red-700"
                        : incident.priority === "HIGH"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {incident.priority}
                  </span>
                </div>
              </div>

              {/* Target Filters */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Roles (Optional - Leave empty to alert all)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(["RESPONDER", "MEDIC", "FIREFIGHTER", "POLICE"] as PersonnelRole[]).map(
                      (role) => (
                        <button
                          key={role}
                          onClick={() => toggleRole(role)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            targetRoles.includes(role)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {role}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {incident.latitude && incident.longitude && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Radius: {(radius / 1000).toFixed(1)} km
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="20000"
                      step="1000"
                      value={radius}
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 km</span>
                      <span>20 km</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Personnel Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {filteredPersonnel.length} Personnel Will Receive Alert
                    </p>
                    <p className="text-sm text-gray-600">
                      {availablePersonnel.filter((p) => p.dutyStatus === "AVAILABLE").length} available,{" "}
                      {availablePersonnel.filter((p) => p.dutyStatus === "RESPONDING").length} responding
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                  placeholder="Enter alert message..."
                />
              </div>
            </>
          ) : (
            /* Responses View */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Alert Broadcasted Successfully!</h3>
                    <p className="text-sm text-gray-600">
                      {responses.length} responses received so far
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Personnel Responses:</h4>
                {responses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-pulse" />
                    <p>Waiting for personnel responses...</p>
                  </div>
                ) : (
                  responses.map((response) => (
                    <div
                      key={response.alertId + response.personnelId}
                      className={`border rounded-lg p-4 ${
                        response.response === "ACCEPTED"
                          ? "border-green-200 bg-green-50"
                          : response.response === "DECLINED"
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Personnel {response.personnelId}
                          </p>
                          <p className="text-sm text-gray-600">
                            Response: {response.response} •{" "}
                            {formatDistance(new Date(response.respondedAt), new Date(), {
                              addSuffix: true,
                            })}
                          </p>
                          {response.estimatedArrivalTime && (
                            <p className="text-sm text-gray-600">
                              ETA: {response.estimatedArrivalTime} minutes
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded ${
                            response.response === "ACCEPTED"
                              ? "bg-green-100 text-green-700"
                              : response.response === "DECLINED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {response.response}
                        </span>
                      </div>
                      {response.notes && (
                        <p className="text-sm text-gray-700 mt-2 italic">{response.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
          {!showResponses ? (
            <>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleBroadcast}
                disabled={isLoading || !message.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Broadcast Alert
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}
