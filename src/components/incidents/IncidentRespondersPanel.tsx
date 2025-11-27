/* eslint-disable @typescript-eslint/no-explicit-any */
import { Users, Crown, Clock, MapPin, Phone, User } from "lucide-react";
import { format } from "date-fns";
import type { Incident } from "@/types/incident.types";

// Get backend URL for image serving
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

interface IncidentRespondersPanelProps {
  incident: Incident;
}

export function IncidentRespondersPanel({ incident }: IncidentRespondersPanelProps) {
  const responders = incident.responders || [];
  
  if (responders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Enhanced Header - matching photo panel */}
        <div className="relative overflow-hidden">
          <div className="bg-linear-to-r from-blue-800 to-blue-700 px-4 py-3 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
            <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Response Personnel</h2>
              <p className="text-sm text-blue-300">Personnel responding to this incident</p>
            </div>
          </div>
        </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">No personnel responding yet</h3>
            <p className="text-sm text-blue-600">Personnel will appear here when they accept this incident</p>
          </div>
        </div>
      </div>
    );
  }

  const primaryResponder = responders.find(r => r.isPrimary);
  const supportResponders = responders.filter(r => !r.isPrimary);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Enhanced Header - matching photo panel */}
      <div className="relative overflow-hidden">
        <div className="bg-linear-to-r from-blue-800 to-blue-700 px-4 py-3 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Response Personnel</h2>
              <p className="text-sm text-blue-300">Personnel responding to this incident</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-white">
              {responders.length} Personnel
            </span>
          </div>
          </div>
        </div>
      </div>

      <div className="p-4">

      <div className="space-y-3">
        {/* Primary Responder */}
        {primaryResponder && (
          <div className="bg-linear-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Primary Responder
                </span>
              </div>
              {primaryResponder.arrivedAt && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                  ✓ On Scene
                </span>
              )}
            </div>

            <div className="flex items-start gap-4">
              {/* Profile Picture */}
              <div className="relative shrink-0">
                {(primaryResponder.personnel as any).photo ? (
                  <img
                    src={getImageUrl((primaryResponder.personnel as any).photo)}
                    alt={`${primaryResponder.personnel.firstName} ${primaryResponder.personnel.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-3 border-amber-300 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-amber-200 border-3 border-amber-300 flex items-center justify-center shadow-lg">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {primaryResponder.personnel.firstName} {primaryResponder.personnel.lastName}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">{primaryResponder.personnel.role}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <a 
                      href={`tel:${primaryResponder.personnel.phone}`}
                      className="hover:text-blue-600 hover:underline font-medium"
                    >
                      {primaryResponder.personnel.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>
                      Accepted {format(new Date(primaryResponder.acceptedAt), "MMM dd, HH:mm")}
                    </span>
                  </div>

                  {primaryResponder.arrivedAt && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        Arrived {format(new Date(primaryResponder.arrivedAt), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Responders */}
        {supportResponders.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-4 mb-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Additional Support ({supportResponders.length})
              </span>
            </div>

            {supportResponders.map((responder) => (
              <div
                key={responder.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Profile Picture */}
                  <div className="relative shrink-0">
                    {(responder.personnel as any).photo ? (
                      <img
                        src={getImageUrl((responder.personnel as any).photo)}
                        alt={`${responder.personnel.firstName} ${responder.personnel.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shadow-sm">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    {responder.arrivedAt && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {responder.personnel.firstName} {responder.personnel.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{responder.personnel.role}</p>
                      </div>
                      {responder.arrivedAt && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                          ✓ On Scene
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="h-3 w-3 text-blue-500" />
                        <a 
                          href={`tel:${responder.personnel.phone}`}
                          className="hover:text-blue-600 hover:underline font-medium"
                        >
                          {responder.personnel.phone}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3 text-blue-400" />
                        <span>
                          Accepted {format(new Date(responder.acceptedAt), "MMM dd, HH:mm")}
                        </span>
                      </div>

                      {responder.arrivedAt && (
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="font-medium">
                            Arrived {format(new Date(responder.arrivedAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

        {/* Response Summary */}
        {responders.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center bg-blue-50 rounded-lg p-2">
                <span className="block text-2xl font-bold text-blue-600">{responders.length}</span>
                <span className="text-blue-700 font-medium">Total Responding</span>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-2">
                <span className="block text-2xl font-bold text-green-600">
                  {responders.filter(r => r.arrivedAt).length}
                </span>
                <span className="text-green-700 font-medium">On Scene</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
