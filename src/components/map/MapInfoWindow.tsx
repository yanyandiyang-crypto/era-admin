
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoWindowF } from '@react-google-maps/api';
import { Bell, Users, MapPin, Clock, AlertTriangle, Phone, User, Crown } from 'lucide-react';
import type { Incident } from '../../types/incident.types';
import type { Personnel } from '../../types/personnel.types';
import type { Barangay } from '../../types/barangay.types';
import type { Responder } from '../../types/responder.types';

interface MarkerData {
  id: string;
  type: "incident" | "personnel" | "post";
  data: Incident | Personnel | Barangay;
  position: { lat: number; lng: number };
  icon: string;
}


// Get backend URL for image serving
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

// Helper to get full image URL
const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

type IncidentWithAckData = Omit<Incident, 'responders'> & {
  responders?: Responder[];
  totalPersonnelNotified?: number;
  acknowledgmentCount?: number;
};

interface MapInfoWindowProps {
  selectedMarker: MarkerData;
  onClose: () => void;
  formatStatus: (status: string) => string;
  formatRole: (role: string) => string;
  getMarkerEmoji: (type: "incident" | "personnel" | "post", data?: Incident | Personnel | Barangay) => string;
  openResolveModal: (incidentId: string) => void;
  handleVerifyIncident: (incidentId: string) => void;
  handleInvalidateIncident: (incidentId: string) => void;
}

export const MapInfoWindow: React.FC<MapInfoWindowProps> = ({
  selectedMarker,
  onClose,
  formatStatus,
  formatRole,
  getMarkerEmoji,
  openResolveModal,
  handleVerifyIncident,
  handleInvalidateIncident,
}) => {
  const navigate = useNavigate();

  return (
    <InfoWindowF
      position={selectedMarker.position}
      onCloseClick={onClose}
      options={{
        pixelOffset: new window.google.maps.Size(0, -40),
        disableAutoPan: true,
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md border-2 border-gray-500">
        <style>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .emergency-contacts-scroll::-webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          .emergency-contacts-scroll {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          
          /* Hide scrollbar for Google Maps InfoWindow content */
          .gm-style-iw-d::-webkit-scrollbar {
            display: none;
          }
          
          .gm-style-iw-d {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}</style>
        {selectedMarker.type === "incident" && (
          <div className="p-0">
            {/* Header with color-coded background */}
            <div className={`px-4 py-3 text-white font-semibold flex items-center gap-2 justify-between ${
              (selectedMarker.data as IncidentWithAckData).status === "PENDING_VERIFICATION" ? "bg-gray-600" :
              (selectedMarker.data as IncidentWithAckData).priority === "CRITICAL" ? "bg-red-600" :
              (selectedMarker.data as IncidentWithAckData).priority === "HIGH" ? "bg-orange-600" :
              (selectedMarker.data as IncidentWithAckData).priority === "MEDIUM" ? "bg-yellow-600" :
              "bg-green-600"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getMarkerEmoji("incident", selectedMarker.data)}</span>
                <span>{(selectedMarker.data as IncidentWithAckData).type}</span>
              </div>
              {/* Acknowledgment Badge */}
              {(() => {
                const incident = selectedMarker.data as IncidentWithAckData;
                return incident.totalPersonnelNotified &&
                       incident.totalPersonnelNotified > 0 &&
                       incident.acknowledgmentCount !== undefined ? (
                  <div className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 mr-5">
                    <Bell className="h-3 w-3" />
                    <span>{incident.acknowledgmentCount}/{incident.totalPersonnelNotified}</span>
                  </div>
                ) : null;
              })()}
            </div>
            {/* Content */}
            <div className="px-4 py-3 space-y-3">
              {/* Only show priority if incident is verified (not PENDING_VERIFICATION) */}
              {(selectedMarker.data as IncidentWithAckData).status !== "PENDING_VERIFICATION" && (
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black-500 font-weight-bold font-medium">PRIORITY</p>
                    <p className="text-sm font-semibold text-gray-800 font-weight-bold">{(selectedMarker.data as IncidentWithAckData).priority}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-black-500 font-medium font-weight-bold">STATUS</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 font-weight-bold">{formatStatus((selectedMarker.data as IncidentWithAckData).status)}</p>
                    {/* Status badges */}
                    {(() => {
                      const incident = selectedMarker.data as IncidentWithAckData;
                      if (incident.status === "RESPONDING" && incident.responders && incident.responders.length > 0) {
                        return (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            🟠 {incident.responders.length} Responding
                          </span>
                        );
                      }
                      if (incident.status === "ARRIVED" && incident.responders) {
                        const arrivedCount = incident.responders?.filter((r) => r.arrivedAt).length ?? 0;
                        return (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            🟢 {arrivedCount} On Scene
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-black-500 font-medium font-weight-bold">LOCATION</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">{(selectedMarker.data as IncidentWithAckData).address || "N/A"}</p>
                </div>
              </div>
              {/* Enhanced Responder information */}
              {(() => {
                const incident = selectedMarker.data as IncidentWithAckData;
                if (incident.responders && incident.responders.length > 0) {
                  const primaryResponder = incident.responders?.find((r: Responder) => r.isPrimary);
                  const supportingResponders = incident.responders?.filter((r: Responder) => !r.isPrimary) || [];
                  return (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-500" />
                        Responding Personnel ({incident.responders.length})
                      </p>
                      
                      {/* Primary Responder */}
                      {primaryResponder && (
                        <div className="bg-amber-50 rounded-lg p-2 mb-2 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              {primaryResponder.personnel.profilePhoto ? (
                                <img
                                  src={getImageUrl(primaryResponder.personnel.profilePhoto)}
                                  alt={`${primaryResponder.personnel.firstName} ${primaryResponder.personnel.lastName}`}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-300"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center border-2 border-amber-400">
                                  <User className="h-4 w-4 text-amber-700" />
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-amber-800">PRIMARY</span>
                                <span className="text-xs font-semibold text-gray-800">
                                  {primaryResponder.personnel.firstName} {primaryResponder.personnel.lastName}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">{formatRole(primaryResponder.personnel.role)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Supporting Responders */}
                      {supportingResponders.length > 0 && (
                        <div className="space-y-1">
                          {supportingResponders.slice(0, 3).map((responder: Responder) => (
                            <div key={responder.id} className="bg-blue-50 rounded-md p-2 border border-blue-200">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  {responder.personnel.profilePhoto ? (
                                    <img
                                      src={getImageUrl(responder.personnel.profilePhoto)}
                                      alt={`${responder.personnel.firstName} ${responder.personnel.lastName}`}
                                      className="w-6 h-6 rounded-full object-cover border border-blue-300"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center border border-blue-400">
                                      <User className="h-3 w-3 text-blue-700" />
                                    </div>
                                  )}
                                  {responder.arrivedAt && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold text-gray-800">
                                      {responder.personnel.firstName} {responder.personnel.lastName}
                                    </span>
                                    {responder.arrivedAt && (
                                      <span className="text-xs bg-green-100 text-green-700 px-1 rounded">ON SCENE</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">{formatRole(responder.personnel.role)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {supportingResponders.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              +{supportingResponders.length - 3} more responders
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Description */}
              {(selectedMarker.data as IncidentWithAckData).description && (
                <div className="pt-2 border-t border-black-300">
                  <p className="text-sm text-black-600 font-medium font-weight-bold leading-relaxed">
                    {(selectedMarker.data as IncidentWithAckData).description}
                  </p>
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
              {(selectedMarker.data as IncidentWithAckData).status === "PENDING_VERIFICATION" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyIncident((selectedMarker.data as IncidentWithAckData).incidentId)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    ✅ Verify Incident
                  </button>
                  <button
                    onClick={() => handleInvalidateIncident((selectedMarker.data as IncidentWithAckData).incidentId)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    ⛔ Mark Invalid
                  </button>
                </div>
              )}
              {(selectedMarker.data as IncidentWithAckData).status === "ARRIVED" && (
                <button
                  onClick={() => openResolveModal((selectedMarker.data as IncidentWithAckData).incidentId)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  🔵 Resolve Incident
                </button>
              )}
              <button
                onClick={() => {
                  navigate(`/incidents/${(selectedMarker.data as IncidentWithAckData).incidentId}`);
                  onClose();
                }}
                tabIndex={0}
                className="w-full bg-gray-700 text-white py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
              >
                View Full Details →
              </button>
            </div>
          </div>
        )}

        {selectedMarker.type === "personnel" && (
          <div className="p-0">
            {/* Header */}
            <div className="px-10 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold flex items-center gap-3">
              {/* Profile Picture */}
              <div className="relative">
                {((selectedMarker.data as Personnel).profilePhoto) ? (
                  <img
                    src={getImageUrl((selectedMarker.data as Personnel).profilePhoto)}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white/80 object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallbackDiv = target.nextSibling as HTMLElement;
                      if (fallbackDiv) fallbackDiv.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback initials */}
                <div
                  className="w-10 h-10 rounded-full border-2 border-white/80 bg-white/20 text-white font-semibold text-sm flex items-center justify-center"
                  style={{ display: ((selectedMarker.data as Personnel).profilePhoto) ? 'none' : 'flex' }}
                >
                  {(selectedMarker.data as Personnel).firstName?.charAt(0)}
                  {(selectedMarker.data as Personnel).lastName?.charAt(0)}
                </div>
              </div>
              <span>{(selectedMarker.data as Personnel).firstName} {(selectedMarker.data as Personnel).lastName}</span>
            </div>
            {/* Content - Wider Layout */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-wrap gap-3">
                  {/* Left Column - Role and Status */}
                  <div className="flex-1 min-w-[120px]">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-blue-500" />
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Role</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatRole((selectedMarker.data as Personnel).role)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-green-500" />
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Status</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatStatus((selectedMarker.data as Personnel).status)}</p>
                    </div>
                  </div>

                  {/* Right Column - ID */}
                  {(selectedMarker.data as Personnel).employeeId && (
                    <div className="flex-1 min-w-[120px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">ID</span>
                      </div>
                      <p className="text-sm font-mono font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded inline-block">
                        {(selectedMarker.data as Personnel).employeeId}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Row - Contact and Last Seen */}
                <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                  {/* Contact */}
                  {(selectedMarker.data as Personnel).phone && (
                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={16} className="text-orange-500" />
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Contact</span>
                      </div>
                      <a
                        href={`tel:${(selectedMarker.data as Personnel).phone}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(selectedMarker.data as Personnel).phone}
                      </a>
                    </div>
                  )}

                  {/* Last Seen */}
                  {(selectedMarker.data as Personnel).lastLocationUpdate && (
                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} className="text-purple-500" />
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Last Seen</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {(() => {
                          const lastUpdate = (selectedMarker.data as Personnel).lastLocationUpdate;
                          return lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Unknown';
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/personnel/${(selectedMarker.data as Personnel).personnelId}`);
                  }}
                  className="flex-1 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Profile
                </button>
                {(selectedMarker.data as Personnel).phone && (
                  <a
                    href={`tel:${(selectedMarker.data as Personnel).phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedMarker.type === "post" && (() => {
          const barangay = selectedMarker.data as Barangay;
          return (
            <div className="p-0">
              {/* Header */}
              <div className="px-3 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-semibold flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <span>{barangay.name}</span>
              </div>
              {/* Content */}
              <div className="px-4 py-3 space-y-3">
                {barangay.description && (
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    {barangay.description}
                  </p>
                )}

                {/* Address */}
                {barangay.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{barangay.address}</span>
                  </div>
                )}

                {/* Operating Hours */}
                {barangay.operatingHours && (
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{barangay.operatingHours}</span>
                  </div>
                )}

                {/* Emergency Contacts */}
                {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-red-600" />
                      Emergency Contacts ({barangay.emergencyContacts.length})
                    </h4>
                    {/* Scrollable container for all contacts */}
                    <div className="emergency-contacts-scroll space-y-2 max-h-[240px] overflow-y-auto">
                      {barangay.emergencyContacts.map((contact) => (
                        <div key={contact.id} className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900">{contact.name}</span>
                            {contact.isPrimary && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1.5 text-sm font-mono font-semibold text-blue-600 hover:text-blue-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                          <span className="text-[10px] text-gray-500 uppercase">
                            {contact.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => {
                    navigate(`/barangays/${barangay.id}`);
                  }}
                  className="w-full mt-2 px-3 py-2 bg-linear-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2"
                >
                  View Full Details
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </InfoWindowF>
  );
};
