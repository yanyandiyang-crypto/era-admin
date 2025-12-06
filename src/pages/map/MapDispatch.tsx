import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, TrafficLayer } from "@react-google-maps/api";
import {
  MapPin,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Building2,
  Gauge,
  Layers,
  Users,
  Volume2,
  VolumeX,
  ShieldX,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/map.css";
import { ResolveModal } from '../../components/incidents/ResolveModal';
import { PriorityModal } from '../../components/incidents/PriorityModal';
import { MapInfoWindow } from '../../components/map/MapInfoWindow';
import { RealTimeIndicator } from '../../components/map/RealTimeIndicator';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { incidentService } from "@/services/incident.service";
import { barangayService } from "@/services/barangay.service";
import { personnelService } from "@/services/personnel.service";
import { useSocket } from "@/hooks/useSocket";
import { useIncidentAlert } from "@/hooks/useIncidentAlert";
import { handleApiError } from "@/lib/error-handling";
import type { Incident, IncidentStatus } from "@/types/incident.types";
import type { Personnel, DutyStatus } from "@/types/personnel.types";
import type { Barangay } from "@/types/barangay.types";

// Spam/Invalid reason presets
const SPAM_REASONS = [
  { id: "duplicate", label: "Duplicate Report", icon: "📋", description: "This incident was already reported" },
  { id: "false_alarm", label: "False Alarm", icon: "🔔", description: "No actual emergency exists" },
  { id: "test_report", label: "Test Report", icon: "🧪", description: "Submitted for testing purposes" },
  { id: "spam", label: "Spam/Junk", icon: "🚫", description: "Irrelevant or promotional content" },
  { id: "wrong_location", label: "Wrong Location", icon: "📍", description: "Location is incorrect or outside service area" },
  { id: "other", label: "Other", icon: "📝", description: "Specify custom reason below" },
];

// Add CSS for blinking animation
const style = document.createElement('style');
style.textContent = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  
  @keyframes pulse-ring {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
  
  .modern-marker {
    animation: blink 1.5s infinite;
  }
  
  .modern-marker-pulse {
    animation: pulse-ring 2s infinite;
  }
`;
document.head.appendChild(style);

// Function to create modern SVG marker icon with blinking animation and fixed size
const createMarkerIcon = (color: string, emoji: string): string => {
  const svg = `
    <svg width="50" height="75" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .marker-pin { animation: blink 1.5s infinite; }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }
          .marker-float { animation: float 3s ease-in-out infinite; }
        </style>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <radialGradient id="grad-${color.replace('#', '')}" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.85" />
        </radialGradient>
      </defs>
      <!-- Outer glow -->
      <circle class="marker-pin marker-float" cx="24" cy="24" r="18" fill="${color}" opacity="0.15"/>
      <!-- Main pin shape with gradient -->
      <path class="marker-pin marker-float" d="M 24 2 C 12.954 2 4 10.954 4 22 C 4 38 24 62 24 62 C 24 62 44 38 44 22 C 44 10.954 35.046 2 24 2 Z" fill="url(#grad-${color.replace('#', '')})" stroke="white" stroke-width="2" filter="url(#shadow)"/>
      <!-- Inner highlight for depth -->
      <ellipse class="marker-pin" cx="24" cy="18" rx="9" ry="7" fill="white" opacity="0.25"/>
      <!-- Icon background circle -->
      <circle class="marker-pin" cx="25" cy="22" r="13" fill="white" opacity="0.98"/>
      <!-- Emoji/Icon - centered with proper baseline -->
      <text class="marker-pin" x="25" y="20" font-size="18" text-anchor="middle" dominant-baseline="central" font-family="system-ui" letter-spacing="0">${emoji}</text>
    </svg>
  `;
  // Use encodeURIComponent for proper encoding of emoji and special characters
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
};

// Function to create incident marker with responder count badge
const createIncidentMarkerIcon = (color: string, emoji: string, responderCount?: number): string => {
  const hasBadge = responderCount !== undefined && responderCount > 0;

  const svg = `
    <svg width="50" height="75" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .marker-pin { animation: blink 1.5s infinite; }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }
          .marker-float { animation: float 3s ease-in-out infinite; }
        </style>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <radialGradient id="grad-${color.replace('#', '')}" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.85" />
        </radialGradient>
      </defs>
      <!-- Outer glow -->
      <circle class="marker-pin marker-float" cx="24" cy="24" r="22" fill="${color}" opacity="0.15"/>
      <!-- Main pin shape with gradient -->
      <path class="marker-pin marker-float" d="M 24 2 C 12.954 2 4 10.954 4 22 C 4 38 24 62 24 62 C 24 62 44 38 44 22 C 44 10.954 35.046 2 24 2 Z" fill="url(#grad-${color.replace('#', '')})" stroke="white" stroke-width="2" filter="url(#shadow)"/>
      <!-- Inner highlight for depth -->
      <ellipse class="marker-pin" cx="24" cy="18" rx="11" ry="9" fill="white" opacity="0.25"/>
      <!-- Icon background circle -->
      <circle class="marker-pin" cx="25" cy="22" r="16" fill="white" opacity="0.98"/>
      <!-- Emoji/Icon - centered with proper baseline -->
      <text class="marker-pin" x="25" y="20" font-size="20" text-anchor="middle" dominant-baseline="central" font-family="system-ui" letter-spacing="0">${emoji}</text>
      ${hasBadge ? `
        <!-- Responder count badge -->
        <circle cx="42" cy="10" r="9" fill="#3B82F6" stroke="white" stroke-width="1.5"/>
        <text x="42" y="7" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="white" font-family="system-ui">${responderCount}</text>
        <text x="42" y="16" font-size="7" text-anchor="middle" dominant-baseline="central" fill="white" font-family="system-ui">👤</text>
      ` : ''}
    </svg>
  `;
  // Use encodeURIComponent for proper encoding of emoji and special characters
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
};

// Get backend URL for image serving  
// Environment logs removed for cleaner output

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
// BACKEND_URL setup completed

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

// Helper function to convert image to base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      
      resolve(''); // Return empty string on error
    };
    img.src = url;
  });
};

// Cache for converted images
const imageCache = new Map<string, string>();
const personnelIconCache = new Map<string, string>();

const ACTIVE_INCIDENT_STATUSES: IncidentStatus[] = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REPORTED",
  "ACKNOWLEDGED",
  "DISPATCHED",
  "IN_PROGRESS",
  "RESPONDING",
  "ARRIVED",
];

// Function to create personnel marker with profile picture
const createPersonnelMarkerIcon = (color: string, person: Personnel): string => {
  const photoUrl = person.profilePhoto ? getImageUrl(person.profilePhoto) : '';
  const initials = `${person.firstName?.charAt(0) || ''}${person.lastName?.charAt(0) || ''}`.toUpperCase();
  // Orange for responding, custom colors for different statuses
  const statusColor = person.status === 'RESPONDING' ? '#F97316' :
                     person.status === 'ON_SCENE' ? '#10B981' :
                     person.status === 'ON_DUTY' ? '#3B82F6' : color;

  // Create a stable cache key based on personnel ID, status, and photo
  const cacheKey = `${person.personnelId}-${person.status}-${person.dutyStatus}-${!!photoUrl}`;

  // Check if we have a cached icon
  if (personnelIconCache.has(cacheKey)) {
    return personnelIconCache.get(cacheKey)!;
  }

  // Load image asynchronously and update cache
  if (photoUrl && !imageCache.has(photoUrl)) {
    imageToBase64(photoUrl).then(base64 => {
      if (base64) {
        imageCache.set(photoUrl, base64);
        // Clear the icon cache for this personnel so it gets regenerated with the photo
        personnelIconCache.delete(cacheKey);
        // Trigger a re-render by updating personnel (this will cause markers to refresh)
        window.dispatchEvent(new CustomEvent('personnel-image-loaded'));
      }
    });
  }

  // Use cached base64 image if available
  const base64Image = imageCache.get(photoUrl) || '';

  const svg = `
    <svg width="50" height="75" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>
          <![CDATA[
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }
          .marker-pin { animation: blink 1.5s infinite; }
          .marker-float { animation: float 3s ease-in-out infinite; }
          .marker-combined { animation: blink 1.5s infinite, float 3s ease-in-out infinite; }
          ]]>
        </style>
        <filter id="shadow-personnel-${person.personnelId}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <radialGradient id="grad-personnel-${person.personnelId}" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:${statusColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${statusColor};stop-opacity:0.85" />
        </radialGradient>
        <clipPath id="avatar-clip-${person.personnelId}">
          <circle cx="25" cy="22" r="16"/>
        </clipPath>
      </defs>
      
      <!-- Outer glow -->
      <circle class="marker-combined" cx="24" cy="24" r="22" fill="${statusColor}" opacity="0.15"/>
      
      <!-- Main pin shape with gradient -->
      <path class="marker-combined" d="M 24 2 C 12.954 2 4 10.954 4 22 C 4 38 24 62 24 62 C 24 62 44 38 44 22 C 44 10.954 35.046 2 24 2 Z" 
            fill="url(#grad-personnel-${person.personnelId})" stroke="white" stroke-width="2" filter="url(#shadow-personnel-${person.personnelId})"/>
      
      <!-- Inner highlight for depth -->
      <ellipse class="marker-pin" cx="24" cy="18" rx="11" ry="9" fill="white" opacity="0.25"/>
      
      <!-- Background circle for photo -->
      <circle class="marker-pin" cx="25" cy="22" r="16" fill="white" opacity="0.98" stroke="${statusColor}" stroke-width="1"/>
      
      ${base64Image ?
      `<!-- Profile photo -->
         <image xlink:href="${base64Image}" href="${base64Image}" x="9" y="6" width="32" height="32" clip-path="url(#avatar-clip-${person.personnelId})" preserveAspectRatio="xMidYMid slice"/>` :
      `<!-- Fallback initials -->
         <text class="marker-pin" x="25" y="26" font-size="14" font-weight="bold" text-anchor="middle" 
               dominant-baseline="central" font-family="system-ui" fill="${statusColor}">${initials}</text>`
    }
      
      <!-- Status indicator dot -->
      <circle cx="42" cy="10" r="5" fill="${person.dutyStatus === 'RESPONDING' ? '#F97316' :
      person.status === 'ON_DUTY' ? '#10B981' : '#6B7280'}" 
              stroke="white" stroke-width="1"/>
    </svg>
  `;

  const encoded = encodeURIComponent(svg);
  const iconUrl = `data:image/svg+xml,${encoded}`;

  // Cache the icon
  personnelIconCache.set(cacheKey, iconUrl);

  return iconUrl;
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Libraries for Google Maps API
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

// Default center (Basak, Lapu-Lapu City, Cebu)
const DEFAULT_CENTER = { lat: 10.312, lng: 123.96 };

interface MarkerData {
  id: string;
  type: "incident" | "personnel" | "post";
  data: Incident | Personnel | Barangay;
  position: { lat: number; lng: number };
  icon: string;
}

// Helper function to get marker color based on type and status
const getMarkerColor = (type: "incident" | "personnel" | "post", _priority?: string, status?: string): string => {
  if (type === "incident") {
    // Strict workflow: color by status only
    switch (status) {
      case "PENDING_VERIFICATION":
        return "#DC2626"; // 🔴 Red - Unverified
      case "VERIFIED":
        return "#9CA3AF"; // ⚪ Gray - Verified, waiting for response
      case "RESPONDING":
        return "#F97316"; // 🟠 Orange - Personnel responding
      case "ARRIVED":
        return "#22C55E"; // 🟢 Green - Personnel on scene
      case "PENDING_RESOLVE":
        return "#EAB308"; // 🟡 Yellow - Pending resolution confirmation
      case "RESOLVED":
        return "#3B82F6"; // 🔵 Blue - Resolved
      default:
        return "#6B7280"; // neutral gray for unknown
    }
  }
  if (type === "personnel") {
    // Personnel status colors
    if (status === "ON_BREAK") return "#6B7280"; // gray-600
    if (status === "RESPONDING") return "#F97316"; // orange-600 - En route
    if (status === "ON_SCENE") return "#22C55E"; // green-600 - At scene
    return "#2563EB"; // blue-600 - Available/On duty
  }
  if (type === "post") return "#059669"; // emerald-600
  return "#6B7280"; // gray-600 - Default
};

// Helper function to get emoji based on type and incident details
const getMarkerEmoji = (type: "incident" | "personnel" | "post", data?: Incident | Personnel | Barangay): string => {
  if (type === "incident" && data) {
    const incident = data as Incident;
    // Return emoji based on incident type
    if (incident.type === "FIRE") return "🔥";
    if (incident.type === "MEDICAL") return "🚑";
    if (incident.type === "ACCIDENT") return "💥";
    if (incident.type === "CRIME") return "🚔";
    if (incident.type === "FLOOD") return "🌊";
    if (incident.type === "NATURAL_DISASTER") return "⚠️";
    if (incident.type === "OTHER") return "🚨";
    return "🚨"; // Default for incidents
  }
  if (type === "personnel") return "👤";
  if (type === "post") return "🏢";
  return "📍";
};

// Helper function to format status display
const formatStatus = (status: string): string => {
  // Special cases for new workflow statuses
  switch (status) {
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "VERIFIED":
      return "Verified";
    case "RESPONDING":
      return "Responding";
    case "ARRIVED":
      return "On Scene";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return status.replace(/_/g, " ");
  }
};

// Helper function to format role display
const formatRole = (role: string): string => {
  switch (role) {
    case "PEACE_OFFICER":
    case "POLICE":
      return "Peace Officer";
    case "RESPONDER":
      return "Responder";
    case "MEDIC":
      return "Medic";
    case "FIREFIGHTER":
      return "Firefighter";
    default:
      return role.replace(/_/g, " ");
  }
};

export default function GoogleMapDispatchPage() {
  const mapRef = useRef<GoogleMap>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loadingData, setLoadingData] = useState(true); // Loading state for data fetching
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("hybrid");
  const [kebabOpen, setKebabOpen] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [mapTypeExpanded, setMapTypeExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | undefined>(undefined);
  const [pingTime, setPingTime] = useState<number | undefined>(undefined);
  const previousIncidentIdsRef = useRef<Set<string>>(new Set());

  // State for automatic zoom functionality
  const [originalMapCenter, setOriginalMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [originalMapZoom, setOriginalMapZoom] = useState<number | null>(null);

  // Use centralized alert hook for consistent notification behavior
  const incidentAlert = useIncidentAlert();

  // Traffic is always enabled
  const showTraffic = true;

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);

    // Store original map center and zoom before zooming to marker
    if (mapRef.current) {
      const map = mapRef.current.state.map;
      if (map) {
        const currentCenter = map.getCenter();
        if (currentCenter) {
          setOriginalMapCenter({
            lat: currentCenter.lat(),
            lng: currentCenter.lng()
          });
        }
        setOriginalMapZoom(map.getZoom() || null);

        // Auto-zoom and pan to marker position
        map.panTo(marker.position);
        map.setZoom(16); // Zoom level that shows good detail around marker
      }
    }

    // Emit event to dismiss notification if it's an incident marker
    if (marker.type === 'incident' && socket) {
      socket.emit('incident:marker_clicked', (marker.data as Incident).incidentId);
    }
  };

  // Filters
  const [showIncidents, setShowIncidents] = useState(true);
  const [showPersonnel, setShowPersonnel] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>("ALL");
  const [incidentPriorityFilter, setIncidentPriorityFilter] = useState<string>("ALL");

  const { socket } = useSocket();

  // Handlers for status transitions aligned with new workflow
  const handleVerifyIncident = async (incidentId: string) => {
    // Open priority modal to get priority level first
    setPendingVerificationId(incidentId);
    setIsPriorityModalOpen(true);
  };

  const handleConfirmVerification = async (priority: string) => {
    if (!pendingVerificationId) return;

    try {
      // Verification process started

      const res = await incidentService.verifyIncident(pendingVerificationId, priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");
      const updated = res.data;
      setIncidents((prev) => prev.map((i) => (i.incidentId === pendingVerificationId ? updated : i)));

      // Automatically broadcast alert to personnel after verification
      try {
        // Broadcasting alert to personnel after verification
        const alertData = {
          incidentId: updated.incidentId,
          message: `🚨 VERIFIED EMERGENCY\n\nType: ${updated.type}\nPriority: ${priority}\nLocation: ${updated.address}\n\nImmediate response required.`,
          priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          latitude: updated.latitude,
          longitude: updated.longitude,
          radius: 5000, // 5km radius
        };

        await personnelService.broadcastIncidentAlert(alertData);

        toast.success("Alert broadcast successful", {
          description: "Personnel notified immediately",
          duration: 5000
        });
      } catch (alertError: any) {
        // Alert broadcasting failed - handled with toast notification
        toast.warning("Incident verified successfully", {
          description: "Alert broadcast failed - please manually notify personnel",
          duration: 5000
        });
      }

      setSelectedMarker(null);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(`Failed to verify incident: ${apiError.message}`);
    } finally {
      setPendingVerificationId(null);
    }
  };

  // Invalidate/Spam modal state
  const [isInvalidateModalOpen, setIsInvalidateModalOpen] = useState(false);
  const [invalidatingIncidentId, setInvalidatingIncidentId] = useState<string | null>(null);
  const [invalidatingIncidentTitle, setInvalidatingIncidentTitle] = useState<string>("");
  const [selectedSpamReason, setSelectedSpamReason] = useState<string>("");
  const [spamNotes, setSpamNotes] = useState("");
  const [isInvalidating, setIsInvalidating] = useState(false);

  const openInvalidateModal = (incidentId: string) => {
    const incident = incidents.find(i => i.incidentId === incidentId);
    setInvalidatingIncidentId(incidentId);
    setInvalidatingIncidentTitle(incident?.title || "Unknown Incident");
    setSelectedSpamReason("");
    setSpamNotes("");
    setIsInvalidateModalOpen(true);
  };

  const closeInvalidateModal = () => {
    setIsInvalidateModalOpen(false);
    setInvalidatingIncidentId(null);
    setInvalidatingIncidentTitle("");
    setSelectedSpamReason("");
    setSpamNotes("");
  };

  const handleInvalidateIncident = (incidentId: string) => {
    openInvalidateModal(incidentId);
  };

  const handleConfirmInvalidate = async () => {
    if (!invalidatingIncidentId || !selectedSpamReason) return;
    
    setIsInvalidating(true);
    try {
      // Build the full reason from preset + custom notes
      const selectedPreset = SPAM_REASONS.find(r => r.id === selectedSpamReason);
      let fullReason = "";
      
      if (selectedPreset) {
        fullReason = `${selectedPreset.label}`;
      }
      
      if (spamNotes.trim()) {
        fullReason += spamNotes.trim();
      } else if (selectedPreset) {
        fullReason += selectedPreset.description;
      }

      await incidentService.updateStatus(invalidatingIncidentId, "SPAM", fullReason);
      
      // Remove from active lists immediately
      setIncidents((prev) => prev.filter((i) => i.incidentId !== invalidatingIncidentId));
      
      // Emit socket event for real-time removal across all clients
      if (socket) {
        socket.emit('incident:invalidated', {
          incidentId: invalidatingIncidentId
        });
      }
      
      toast.success("Incident marked as invalid", {
        description: "The incident has been removed from the map and incident list"
      });
      setSelectedMarker(null);
      closeInvalidateModal();
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(`Failed to mark incident as invalid: ${apiError.message}`);
    } finally {
      setIsInvalidating(false);
    }
  };

  // Resolve modal state and handlers
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null);
  const [resolvingIncidentId, setResolvingIncidentId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const openResolveModal = (incidentId: string) => {
    setResolvingIncidentId(incidentId);
    setResolveNotes("");
    setIsResolveOpen(true);
  };

  const closeResolveModal = () => {
    setIsResolveOpen(false);
    setResolvingIncidentId(null);
    setResolveNotes("");
  };

  const handleConfirmResolve = async () => {
    if (!resolvingIncidentId) return;
    try {
      const res = await incidentService.resolveIncident(resolvingIncidentId, resolveNotes);
      const updated = res.data;
      setIncidents((prev) => prev.map((i) => (i.incidentId === resolvingIncidentId ? updated : i)));
      toast.success("Incident resolved");
      setSelectedMarker(null);
      closeResolveModal();
    } catch (e) {
      
      toast.error("Failed to resolve incident");
    }
  };

  // Fetch incidents with acknowledgment data
  const fetchIncidents = useCallback(async () => {
    try {
      const response = await incidentService.getIncidentsWithAcks({
        status: ACTIVE_INCIDENT_STATUSES,
        limit: 100,
      });
      const newIncidents = response.data.data;

      // Check for new incidents and play sound
      const currentIncidentIds = new Set(newIncidents.map((i: Incident) => i.incidentId));
      const previousIds = previousIncidentIdsRef.current;

      // Find truly new incidents (not in previous set)
      const newIncidentIds = Array.from(currentIncidentIds).filter(id => !previousIds.has(id));

      if (newIncidentIds.length > 0 && previousIds.size > 0) {
        // Only play sound if we had previous incidents (avoid sound on initial load)
        // Use centralized alert for each new incident
        newIncidentIds.forEach(id => {
          const incident = newIncidents.find((i: Incident) => i.incidentId === id);
          if (incident) {
            incidentAlert.handleNewIncident(incident);
          }
        });
      }
      // Update the previous IDs ref
      previousIncidentIdsRef.current = currentIncidentIds;

      setIncidents(newIncidents);
    } catch (error) {
      
      toast.error("Failed to load incidents");
    }
  }, []);

  // Fetch personnel - only ON_DUTY and ON_BREAK personnel with location data
  const fetchPersonnel = useCallback(async () => {
    try {
      // Fetching personnel with status: ON_DUTY, ON_BREAK
      const response = await personnelService.getPersonnel({
        status: ["ON_DUTY", "ON_BREAK"],
        limit: 100,
      });
      const personnelData = response.data.data || response.data;
      // Personnel data received, processing...
      
      // Process personnel data...
      if (Array.isArray(personnelData)) {
        // Personnel data processing completed
      }
      
      // Clear personnel icon cache when fetching new data
      personnelIconCache.clear();
      setPersonnel(Array.isArray(personnelData) ? personnelData : []);
    } catch (error) {
      // Personnel fetch error handled internally
      setPersonnel([]);
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const response = await barangayService.getBarangays({
        limit: 100,
      });
      const barangayData = response.data.data || response.data;
      
      setBarangays(Array.isArray(barangayData) ? barangayData : []);
    } catch (error) {
      
      setBarangays([]);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    // Initial data loading
    const initialLoad = async () => {
      setLoadingData(true);
      // Loading initial data...
      try {
        await Promise.all([
          fetchIncidents(),
          fetchPersonnel(),
          fetchPosts()
        ]);
        // Initial data loaded successfully
      } finally {
        setLoadingData(false);
      }
    };

    initialLoad();

    // Optimized polling intervals - reduce frequency when WebSocket is connected
    // Poll every 2 seconds when WebSocket is not connected, every 5 seconds when connected
    const interval = setInterval(() => {
      if (!socket || !socket.connected) {
        
        fetchIncidents();
        fetchPersonnel();
      } else {
        // When WebSocket is connected, reduce polling frequency to reduce server load
        fetchIncidents();
        fetchPersonnel();
      }
    }, socket?.connected ? 5000 : 2000); // 5s when connected, 2s when not connected

    // Separate interval for posts (less frequent)
    const postInterval = setInterval(() => {
      fetchPosts();
    }, 60000); // Increase to 60 seconds to reduce server load

    // Listen for personnel image loaded events
    const handleImageLoaded = () => {
      
      fetchPersonnel();
    };

    window.addEventListener('personnel-image-loaded', handleImageLoaded);

    return () => {
      clearInterval(interval);
      clearInterval(postInterval);
      window.removeEventListener('personnel-image-loaded', handleImageLoaded);
    };
  }, [fetchIncidents, fetchPersonnel, socket]);

  // Fix Google Maps InfoWindow tabindex for accessibility
  useEffect(() => {
    if (selectedMarker) {
      // Wait for InfoWindow to render
      setTimeout(() => {
        const infoWindow = document.querySelector('.gm-style-iw-c[role="dialog"]');
        if (infoWindow) {
          infoWindow.setAttribute('tabindex', '0');
        }
      }, 100);
    }
  }, [selectedMarker]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleIncidentCreated = (incident: Incident) => {
      updateLastActivity();
      
      setIncidents((prev) => {
        const exists = prev.some((i) => i.incidentId === incident.incidentId);
        if (exists) return prev;
        // Use centralized alert hook for consistent notifications
        incidentAlert.handleNewIncident(incident);
        return [incident, ...prev];
      });
    };

    const handleIncidentUpdated = (incident: Incident) => {
      updateLastActivity();
      
      setIncidents((prev) =>
        prev.map((i) => (i.incidentId === incident.incidentId ? incident : i))
      );

      // Update selected marker if it's the same incident
      setSelectedMarker((prev) => {
        if (prev && prev.type === 'incident' && (prev.data as Incident).incidentId === incident.incidentId) {
          return { ...prev, data: incident };
        }
        return prev;
      });
    };

    const handleIncidentDeleted = (incidentId: string) => {
      updateLastActivity();
      
      setIncidents((prev) => prev.filter((i) => i.incidentId !== incidentId));

      // Close info window if deleted incident was selected
      setSelectedMarker((prev) => {
        if (prev && prev.type === 'incident' && (prev.data as Incident).incidentId === incidentId) {
          return null;
        }
        return prev;
      });
    };

    const handlePersonnelLocation = (data: { personnelId: string; latitude: number; longitude: number; timestamp?: string }) => {
      console.log('📍 Personnel location update:', {
        personnelId: data.personnelId,
        coordinates: `${data.latitude}, ${data.longitude}`,
        timestamp: data.timestamp
      });
      
      setPersonnel((prev) => {
        const existingIndex = prev.findIndex(p => p.personnelId === data.personnelId);
        
        if (existingIndex >= 0) {
          // Update existing personnel location more efficiently
          const updatedPersonnel = [...prev];
          const updatedPerson = {
            ...updatedPersonnel[existingIndex],
            currentLatitude: data.latitude,
            currentLongitude: data.longitude,
            lastLocationUpdate: data.timestamp || new Date().toISOString()
          };
          updatedPersonnel[existingIndex] = updatedPerson;
          
          console.log('📍 Personnel location updated:', {
            personnelId: data.personnelId,
            oldLat: prev[existingIndex].currentLatitude,
            oldLng: prev[existingIndex].currentLongitude,
            newLat: data.latitude,
            newLng: data.longitude
          });
          
          return updatedPersonnel;
        } else {
          // This shouldn't happen if personnel are pre-loaded, but handle it gracefully
          console.warn('📍 Unknown personnel location update:', data.personnelId);
          return prev;
        }
      });

      // Update selected marker if it's the same personnel (optimized)
      setSelectedMarker((prev) => {
        if (prev && prev.type === 'personnel' && (prev.data as Personnel).personnelId === data.personnelId) {
          return {
            ...prev,
            data: {
              ...prev.data as Personnel,
              currentLatitude: data.latitude,
              currentLongitude: data.longitude
            },
            position: { lat: data.latitude, lng: data.longitude }
          };
        }
        return prev;
      });
    };

    // DEBUG: Function to simulate personnel location updates for testing
    const simulatePersonnelLocationUpdate = () => {
      if (personnel.length > 0) {
        const testPersonnel = personnel[0];
        const testData = {
          personnelId: testPersonnel.personnelId!,
          latitude: 14.5995 + Math.random() * 0.01, // Random location near the area
          longitude: 120.9844 + Math.random() * 0.01,
          timestamp: new Date().toISOString()
        };
        console.log('🧪 Simulating personnel location update');
        handlePersonnelLocation(testData);
      }
    };

    // DEBUG: Function to simulate continuous personnel movement
    const simulatePersonnelMovement = () => {
      if (personnel.length > 0) {
        const testPersonnel = personnel[0];
        let counter = 0;
        const interval = setInterval(() => {
          const testData = {
            personnelId: testPersonnel.personnelId!,
            latitude: 14.5995 + Math.sin(counter * 0.1) * 0.005,
            longitude: 120.9844 + Math.cos(counter * 0.1) * 0.005,
            timestamp: new Date().toISOString()
          };
          console.log(`🚶 Movement simulation ${counter + 1}`);
          handlePersonnelLocation(testData);
          counter++;
          if (counter >= 20) {
            clearInterval(interval);
            console.log('✅ Movement simulation completed');
          }
        }, 1000); // Update every second
      }
    };

    // Make the functions available globally for testing
    if (typeof window !== 'undefined') {
      (window as any).simulatePersonnelUpdate = simulatePersonnelLocationUpdate;
      (window as any).simulatePersonnelMovement = simulatePersonnelMovement;
    };

    const handlePersonnelStatus = async (data: { personnelId: string; status: string; dutyStatus?: string }) => {
      updateLastActivity();
      

      // If status changed to ON_DUTY or ON_BREAK, fetch and add to map
      if (data.status === 'ON_DUTY' || data.status === 'ON_BREAK') {
        try {
          const response = await personnelService.getPersonnelById(data.personnelId);
          const updatedPersonnel = response.data;

          setPersonnel((prev) => {
            // Check if personnel already exists
            const exists = prev.some((p) => p.personnelId === data.personnelId);
            if (exists) {
              // Update existing personnel
              return prev.map((p) =>
                p.personnelId === data.personnelId ? updatedPersonnel : p
              );
            } else {
              // Add new personnel to map
              
              toast.info(`${updatedPersonnel.firstName} ${updatedPersonnel.lastName} is now on duty`, {
                duration: 3000
              });
              return [...prev, updatedPersonnel];
            }
          });
        } catch (error) {
          
        }
      }
      // If status changed to OFF_DUTY or other, remove from map
      else {
        setPersonnel((prev) => {
          const removedPersonnel = prev.find((p) => p.personnelId === data.personnelId);
          const filtered = prev.filter((p) => p.personnelId !== data.personnelId);
          if (filtered.length < prev.length && removedPersonnel) {
            
            toast.info(`${removedPersonnel.firstName} ${removedPersonnel.lastName} went off duty`, {
              duration: 3000
            });
          }
          return filtered;
        });

        // Close info window if removed personnel was selected
        setSelectedMarker((prev) => {
          if (prev && prev.type === 'personnel' && (prev.data as Personnel).personnelId === data.personnelId) {
            return null;
          }
          return prev;
        });
      }
    };

    socket.on("incident:created", handleIncidentCreated);

    socket.on("incident:updated", handleIncidentUpdated);

    socket.on("incident:deleted", handleIncidentDeleted);

    socket.on("personnel:location", handlePersonnelLocation);

    socket.on("personnel:location:updated", handlePersonnelLocation);

    socket.on("personnel:status", handlePersonnelStatus);

    // Remove invalidated incidents in real-time

    socket.on("incident:invalidated", (data: { incidentId: string }) => {
      setIncidents((prev) => prev.filter((i) => i.incidentId !== data.incidentId));
    });

    // Additional real-time events for comprehensive monitoring

    socket.on("incident:resolved", (data: { incidentId: string }) => {
      
      setIncidents((prev) =>
        prev.map((i) => i.incidentId === data.incidentId
          ? { ...i, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
          : i
        )
      );
    });

    // Personnel duty status changes

    socket.on("personnel:duty", (data: { personnelId: string; dutyStatus: string }) => {
      
      setPersonnel((prev) =>
        prev.map((p) =>
          p.personnelId === data.personnelId
            ? { ...p, dutyStatus: data.dutyStatus as DutyStatus }
            : p
        )
      );
    });

    // Emergency alerts

    socket.on("alert:emergency", (data: { message: string; location: string }) => {
      
      toast.error(`Emergency Alert: ${data.message}`, {
        description: data.location,
        duration: 10000
      });
    });

    // Additional personnel events for comprehensive tracking

    socket.on("personnel:duty_start", (data: { personnelId: string; personnelName: string }) => {
      
      toast.success(`${data.personnelName} started duty`, {
        duration: 3000
      });
      // Refresh personnel data to get updated location
      fetchPersonnel();
      // Also refresh incidents to sync with new on-duty personnel
      fetchIncidents();
    });


    socket.on("personnel:duty_end", (data: { personnelId: string; personnelName: string }) => {
      
      toast.info(`${data.personnelName} ended duty`, {
        duration: 3000
      });
      // Remove from map
      setPersonnel((prev) => prev.filter((p) => p.personnelId !== data.personnelId));
    });


    socket.on("personnel:break_start", (data: { personnelId: string; personnelName: string }) => {
      
      setPersonnel((prev) =>
        prev.map((p) =>
          p.personnelId === data.personnelId
            ? { ...p, status: 'ON_BREAK' }
            : p
        )
      );
    });


    socket.on("personnel:break_end", (data: { personnelId: string; personnelName: string }) => {
      
      setPersonnel((prev) =>
        prev.map((p) =>
          p.personnelId === data.personnelId
            ? { ...p, status: 'ON_DUTY' }
            : p
        )
      );
    });

    return () => {

      socket.off("incident:created", handleIncidentCreated);

      socket.off("incident:updated", handleIncidentUpdated);

      socket.off("incident:deleted", handleIncidentDeleted);

      socket.off("personnel:location", handlePersonnelLocation);

      socket.off("personnel:status", handlePersonnelStatus);

      socket.off("incident:invalidated");

      socket.off("incident:resolved");

      socket.off("personnel:duty");

      socket.off("alert:emergency");

      socket.off("personnel:duty_start");

      socket.off("personnel:duty_end");

      socket.off("personnel:break_start");

      socket.off("personnel:break_end");
    };
  }, [socket, fetchIncidents, fetchPersonnel, setLastUpdate, setPingTime]);

  const updateLastActivity = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  // Heartbeat/ping logic
  useEffect(() => {
    if (!socket) return;

    let pingInterval: ReturnType<typeof setInterval>;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const sendPing = () => {
      const startTime = Date.now();
      (socket as any).emit('ping', () => {
        const ping = Date.now() - startTime;
        setPingTime(ping);
        updateLastActivity();
      });
    };

    const handlePong = () => {
      const ping = Date.now() - (window as any).pingStartTime;
      setPingTime(ping);
      updateLastActivity();
      reconnectAttempts = 0;
    };

    socket.on('pong', handlePong);

    pingInterval = setInterval(sendPing, 30000);

    socket.on('disconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts <= maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(() => socket.connect(), delay);
      }
    });

    socket.on('connect', () => {
      reconnectAttempts = 0;
      updateLastActivity();
      sendPing();
    });

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      socket.off('pong', handlePong);
      socket.off('disconnect');
      socket.off('connect');
    };
  }, [socket, updateLastActivity]);

  // Update all socket handlers to call updateLastActivity()









  // Filter incidents
  const filteredIncidents = incidents.filter((incident) => {
    // Hide resolved incidents by default (show only active workflow stages)
    if (["RESOLVED"].includes(incident.status)) {
      return false;
    }
    if (incidentStatusFilter !== "ALL" && incident.status !== incidentStatusFilter) {
      return false;
    }
    if (incidentPriorityFilter !== "ALL" && incident.priority !== incidentPriorityFilter) {
      return false;
    }
    return true;
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: incidents.length };
    incidents.forEach((incident) => {
      if (!["RESOLVED"].includes(incident.status)) {
        counts[incident.status] = (counts[incident.status] || 0) + 1;
      }
    });
    return counts;
  }, [incidents]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: incidents.length };
    incidents.forEach((incident) => {
      counts[incident.priority] = (counts[incident.priority] || 0) + 1;
    });
    return counts;
  }, [incidents]);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (incidentStatusFilter !== 'ALL') filters.push(incidentStatusFilter);
    if (incidentPriorityFilter !== 'ALL') filters.push(incidentPriorityFilter);
    return filters;
  }, [incidentStatusFilter, incidentPriorityFilter]);

  // Prepare markers
  const incidentMarkers: MarkerData[] = useMemo(() => showIncidents
    ? filteredIncidents
      .filter((i) => i.latitude && i.longitude)
      .map((incident) => {
        // Count personnel who have arrived at the scene (on scene count)
        const onSceneCount = incident.responders?.filter((r: any) => r.arrivedAt !== null).length || 0;
        return {
          id: incident.incidentId,
          type: "incident" as const,
          data: incident,
          position: { lat: incident.latitude!, lng: incident.longitude! },
          icon: createIncidentMarkerIcon(
            getMarkerColor("incident", incident.priority, incident.status),
            getMarkerEmoji("incident", incident),
            onSceneCount
          ),
        };
      })
    : [], [showIncidents, filteredIncidents]);

  const personnelMarkers: MarkerData[] = useMemo(() => showPersonnel
    ? personnel
      .filter((p) => {
        // Only show ON_DUTY and ON_BREAK personnel (OFF_DUTY is hidden)
        const isOnDutyOrBreak = p.status === "ON_DUTY" || p.status === "ON_BREAK";
        const hasLocation = p.currentLatitude && p.currentLongitude;
        if (!hasLocation && isOnDutyOrBreak) {
          // Personnel without location data
        }
        return hasLocation && isOnDutyOrBreak;
      })
      .map((person) => ({
        id: person.personnelId,
        type: "personnel" as const,
        data: person,
        position: { lat: person.currentLatitude!, lng: person.currentLongitude! },
        icon: createPersonnelMarkerIcon(getMarkerColor("personnel", undefined, person.status), person),
      }))
    : [], [showPersonnel, personnel]);

  const postMarkers: MarkerData[] = useMemo(() => showPosts
    ? barangays
      .filter((b) => {
        const hasLocation = b.latitude && b.longitude && (b.id || b.barangayId);
        if (!hasLocation) {
          
        }
        return hasLocation;
      })
      .map((barangay) => ({
        id: barangay.id || barangay.barangayId!,
        type: "post" as const,
        data: barangay,
        position: { lat: barangay.latitude, lng: barangay.longitude },
        icon: createMarkerIcon(getMarkerColor("post"), getMarkerEmoji("post")),
      }))
    : [], [showPosts, barangays]);

  if (loadError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Map Loading Failed</h2>
          <p className="text-gray-600 mb-4">
            Unable to load Google Maps. Please check your internet connection and API key.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {loadError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Map Container */}
      <main className="flex-1 relative">
        <div className="w-full h-full">
          <GoogleMap
            ref={mapRef}
            center={DEFAULT_CENTER}
            zoom={14}
            mapTypeId={mapType}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              scrollwheel: true,
              styles: [
                {
                  featureType: "poi.business",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.attraction",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.government",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.medical",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.park",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.place_of_worship",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.school",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "poi.sports_complex",
                  stylers: [{ visibility: "off" }]
                },
                {
                  elementType: "labels.icon",
                  featureType: "poi",
                  stylers: [{ visibility: "off" }]
                }
              ],
            }}
            mapContainerStyle={{
              width: "100%",
              height: "100%",
            }}
            onLoad={(map) => {
              console.log('Map Loaded. Current mapTypeId:', map.getMapTypeId());
              // Force update the map type when map loads
              map.setMapTypeId(mapType);
              console.log('Forced map type during onLoad:', mapType);
            }}
            onClick={() => {
              // Stop sound when clicking on map background

            }}
          >
            {/* Data Loading Overlay */}
            {loadingData && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                  <p className="text-gray-700 font-medium">Loading emergency data...</p>
                  <p className="text-gray-500 text-sm mt-1">Incidents, personnel, and locations</p>
                </div>
              </div>
            )}
            {/* Incident Markers */}
            {incidentMarkers.map((marker) => {
              const incident = marker.data as Incident;
              return (
                <MarkerF
                  key={marker.id}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                  title={`${incident.type} - ${incident.status}`}
                  icon={marker.icon}
                />
              );
            })}

            {/* Personnel Markers */}
            {personnelMarkers.map((marker) => {
              const person = marker.data as Personnel;
              return (
                <MarkerF
                  key={marker.id}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                  title={`${person.firstName} ${person.lastName} - ${formatStatus(person.status)}`}
                  icon={marker.icon}
                />
              );
            })}

            {/* Post Markers */}
            {postMarkers.map((marker) => {
              const barangay = marker.data as Barangay;
              return (
                <MarkerF
                  key={marker.id}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                  title={barangay.name}
                  icon={marker.icon}
                />
              );
            })}

            {/* Info Window */}
            {selectedMarker ? (
              <MapInfoWindow
                selectedMarker={selectedMarker}
                onClose={() => {
                  // Restore original map center and zoom when closing info window
                  if (mapRef.current && originalMapCenter && originalMapZoom) {
                    const map = mapRef.current.state.map;
                    if (map) {
                      map.setCenter(originalMapCenter);
                      map.setZoom(originalMapZoom);
                    }
                  }

                  setSelectedMarker(null);
                  setOriginalMapCenter(null);
                  setOriginalMapZoom(null);
                }}
                formatStatus={formatStatus}
                formatRole={formatRole}
                getMarkerEmoji={getMarkerEmoji}
                openResolveModal={openResolveModal}
                handleVerifyIncident={handleVerifyIncident}
                handleInvalidateIncident={handleInvalidateIncident}
              />
            ) : null}

            {/* Traffic Layer - Always Active */}
            {showTraffic && <TrafficLayer />}
          </GoogleMap>
        </div>

        {/* Top-Left: Connection Status */}
        <div className="absolute top-6 left-4 z-10">
          <RealTimeIndicator
            isConnected={!!socket?.connected}
            lastUpdate={lastUpdate}
            pingTime={pingTime}
          />
        </div>

        {/* Top-Right: Kebab Menu */}
        <div className="absolute top-6 right-4 z-10">
          <div className="relative">
            <button
              onClick={() => setKebabOpen(!kebabOpen)}
              className="group relative bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-blue-600 rounded-2xl shadow-xl border border-gray-200/50 p-3.5 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-4 ring-blue-500/20 hover:ring-blue-200/50 aria-expanded:ring-blue-400/50 hover:aria-expanded:shadow-blue-500/25"
              title="Menu"
              aria-label="Map Controls Menu"
              aria-expanded={kebabOpen ? "true" : "false"}
            >
              <MoreVertical
                size={20}
                className="group-hover:rotate-90 transition-transform duration-300 group-aria-expanded:rotate-90"
                aria-hidden="true"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm scale-150 group-hover:scale-100" />
            </button>

            {/* Kebab Menu Dropdown */}
            {kebabOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-20 animate-in fade-in slide-in-from-top-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* Collapsible Map Type & Traffic */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => setMapTypeExpanded(!mapTypeExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    aria-expanded={mapTypeExpanded ? "true" : "false"}
                    aria-controls="map-type-content"
                  >
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      Map View
                    </h3>
                    {mapTypeExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                  </button>
                  {mapTypeExpanded && (
                    <div id="map-type-content" className="px-3 pb-3 space-y-2">
                      {/* Map Type Options */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Map Type</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'roadmap', label: '🛣️ Streets' },
                            { value: 'satellite', label: '🛰️ Satellite' },
                            { value: 'hybrid', label: '🗺️ Hybrid' },
                            { value: 'terrain', label: '⛰️ Terrain' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setMapType(option.value as "roadmap" | "satellite" | "hybrid" | "terrain")}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${mapType === option.value
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              aria-pressed={mapType === option.value ? 'true' : 'false'}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Traffic Toggle - Always Active */}
                      <div className="pt-2 border-t border-gray-200">
                        <label className="flex items-center gap-3 cursor-not-allowed p-2 rounded-lg bg-orange-50 border border-orange-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={showTraffic}
                            disabled={true}
                            className="h-4 w-4 text-orange-600 rounded cursor-not-allowed opacity-60"
                          />
                          <Gauge className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-medium text-gray-700 flex-1">Traffic</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            ALWAYS ON
                          </span>
                        </label>
                      </div>

                      {/* Sound Notifications Toggle */}
                      <div className="pt-2 border-t border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={incidentAlert.soundEnabled}
                            onChange={(e) => incidentAlert.setSoundEnabled(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                          />
                          {incidentAlert.soundEnabled ? (
                            <Volume2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <VolumeX className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs font-medium text-gray-700 flex-1">Alert Sounds</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${incidentAlert.soundEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {incidentAlert.soundEnabled ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Map Layers */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => setLayersExpanded(!layersExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    aria-expanded={layersExpanded ? "true" : "false"}
                    aria-controls="map-layers-content"
                  >
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      Map Layers
                    </h3>
                    {layersExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                  </button>
                  {layersExpanded && (
                    <div id="map-layers-content" className="px-4 pb-3 space-y-2">
                      {[
                        { id: 'incidents', label: 'Incidents', icon: AlertTriangle, color: 'text-red-600', state: showIncidents, setState: setShowIncidents },
                        { id: 'personnel', label: 'Personnel', icon: Users, color: 'text-blue-600', state: showPersonnel, setState: setShowPersonnel },
                        { id: 'posts', label: 'Posts', icon: Building2, color: 'text-green-600', state: showPosts, setState: setShowPosts },
                      ].map(({ id, label, icon: Icon, color, state, setState }) => (
                        <label key={id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={state}
                            onChange={(e) => setState(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                          />
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="text-xs font-medium text-gray-700 flex-1">{label}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${state ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {state ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Quick Stats</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-linear-to-br from-red-50 to-red-100 rounded-lg p-2 border border-red-200 text-center">
                      <p className="text-xs text-red-600 font-semibold">Active</p>
                      <p className="text-lg font-bold text-red-700">{filteredIncidents.length}</p>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200 text-center">
                      <p className="text-xs text-blue-600 font-semibold">Personnel</p>
                      <p className="text-lg font-bold text-blue-700">{personnel.length}</p>
                    </div>
                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-2 border border-green-200 text-center">
                      <p className="text-xs text-green-600 font-semibold">Posts</p>
                      <p className="text-lg font-bold text-green-700">{barangays.length}</p>
                    </div>
                  </div>
                </div>

                {/* Incident Filters */}
                <div className="p-4 border-b border-gray-200/50 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <div className="relative">
                        <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-sm"></div>
                      </div>
                      <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Filters</span>
                    </h3>
                    {activeFilters.length > 0 && (
                      <button
                        onClick={() => {
                          setIncidentStatusFilter('ALL');
                          setIncidentPriorityFilter('ALL');
                        }}
                        className="group relative px-3 py-1.5 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-200/60 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <span className="relative z-10 text-xs font-semibold text-red-700">Clear ({activeFilters.length})</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all duration-300"></div>
                      </button>
                    )}
                  </div>

                  {/* Active Filters Chips */}
                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {activeFilters.map((filter) => (
                        <span key={filter} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                          {filter.replace('_', ' ')}
                          <button
                            onClick={() => {
                              if (filter === incidentStatusFilter) setIncidentStatusFilter('ALL');
                              if (filter === incidentPriorityFilter) setIncidentPriorityFilter('ALL');
                            }}
                            className="ml-1 text-blue-500 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={incidentStatusFilter}
                          onChange={(e) => setIncidentStatusFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        >
                          <option value="ALL">All Active ({statusCounts.ALL})</option>
                          <optgroup label="Initial Reports">
                            <option value="PENDING_VERIFICATION">🔴 Pending Verification ({statusCounts.PENDING_VERIFICATION || 0})</option>
                            <option value="VERIFIED">⚪ Verified ({statusCounts.VERIFIED || 0})</option>
                          </optgroup>
                          <optgroup label="Response Active">
                            <option value="RESPONDING">🟠 Responding ({statusCounts.RESPONDING || 0})</option>
                            <option value="ARRIVED">🟢 On Scene ({statusCounts.ARRIVED || 0})</option>
                            <option value="PENDING_RESOLVE">🟡 Pending Resolution ({statusCounts.PENDING_RESOLVE || 0})</option>
                          </optgroup>
                          <optgroup label="Completed">
                            <option value="RESOLVED">🔵 Resolved ({statusCounts.RESOLVED || 0})</option>
                          </optgroup>
                        </select>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          value={incidentPriorityFilter}
                          onChange={(e) => setIncidentPriorityFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        >
                          <option value="ALL">All Priorities ({priorityCounts.ALL})</option>
                          <option value="CRITICAL">🔴 Critical ({priorityCounts.CRITICAL || 0})</option>
                          <option value="HIGH">🟠 High ({priorityCounts.HIGH || 0})</option>
                          <option value="MEDIUM">🟡 Medium ({priorityCounts.MEDIUM || 0})</option>
                          <option value="LOW">🟢 Low ({priorityCounts.LOW || 0})</option>
                        </select>
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Legend</h3>
                  <div className="space-y-2 text-xs">
                    {/* Incident Status Colors */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Incident Status</p>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { color: 'bg-red-600', label: '🔴 Unverified' },
                          { color: 'bg-gray-400', label: '⚪ Verified' },
                          { color: 'bg-orange-500', label: '🟠 Responding' },
                          { color: 'bg-green-500', label: '🟢 Arrived' },
                          { color: 'bg-blue-600', label: '🔵 Resolved' },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1 p-1 rounded">
                            <div className={`h-2 w-2 rounded-full ${color}`}></div>
                            <span className="text-gray-700">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Other Markers */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Other</p>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { color: 'bg-blue-600', label: '👤 Personnel' },
                          { color: 'bg-emerald-600', label: '🏢 Post' },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1 p-1 rounded">
                            <div className={`h-2 w-2 rounded-full ${color}`}></div>
                            <span className="text-gray-700">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        ){"}"}
        <ResolveModal
          isOpen={isResolveOpen}
          onClose={closeResolveModal}
          onConfirm={handleConfirmResolve}
          notes={resolveNotes}
          setNotes={setResolveNotes}
        />
        <PriorityModal
          isOpen={isPriorityModalOpen}
          onClose={() => {
            setIsPriorityModalOpen(false);
            setPendingVerificationId(null);
          }}
          onConfirm={handleConfirmVerification}
          incidentTitle={
            pendingVerificationId
              ? incidents.find(i => i.incidentId === pendingVerificationId)?.title
              : undefined
          }
        />

        {/* Invalidate/Spam Modal */}
        <Dialog open={isInvalidateModalOpen} onOpenChange={setIsInvalidateModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-xl scrollbar-hide">
            <style>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Modern Gradient Header */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
              <div className="relative px-6 py-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                    <ShieldX className="h-7 w-7 text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Mark as Spam/Invalid</h2>
                    <p className="text-red-100 text-sm font-medium">This will remove the incident from the map</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Enhanced Warning Banner */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900">This action cannot be undone</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    The incident will be removed from the map and all active views. Personnel will not be notified about this incident.
                  </p>
                </div>
              </div>

              {/* Modern Incident Info Card */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Details</p>
                    <p className="text-slate-900 font-semibold text-sm truncate">{invalidatingIncidentTitle}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Reason Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Select a reason for invalidation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SPAM_REASONS.map((reason, index) => (
                    <label
                      key={reason.id}
                      className={`group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                        selectedSpamReason === reason.id
                          ? "bg-gradient-to-r from-red-50 to-red-100 border-red-400 shadow-lg shadow-red-100"
                          : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <input
                        type="radio"
                        name="spamReason"
                        value={reason.id}
                        checked={selectedSpamReason === reason.id}
                        onChange={() => setSelectedSpamReason(reason.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 p-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                          selectedSpamReason === reason.id
                            ? "bg-red-500 text-white shadow-lg scale-110"
                            : "bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-red-600"
                        }`}>
                          {reason.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold transition-colors ${
                            selectedSpamReason === reason.id ? "text-red-900" : "text-gray-900"
                          }`}>
                            {reason.label}
                          </div>
                          <div className={`text-xs mt-1 transition-colors ${
                            selectedSpamReason === reason.id ? "text-red-700" : "text-gray-500"
                          }`}>
                            {reason.description}
                          </div>
                        </div>
                        {selectedSpamReason === reason.id && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Subtle gradient overlay for selected state */}
                      {selectedSpamReason === reason.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-red-100/30 pointer-events-none"></div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Enhanced Notes Section */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Additional Notes
                  <span className="text-xs font-normal text-gray-500">
                    {selectedSpamReason === "other" ? "(required)" : "(optional)"}
                  </span>
                </label>
                <div className="relative">
                  <Textarea
                    value={spamNotes}
                    onChange={(e) => setSpamNotes(e.target.value.slice(0, 500))}
                    placeholder="Provide additional context about why this incident is being marked as invalid..."
                    className="w-full min-h-[100px] max-h-[200px] overflow-y-auto resize-none border-gray-200 focus:border-red-400 focus:ring-red-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 placeholder:text-gray-400 scrollbar-hide"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {spamNotes.length}/500
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Footer */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeInvalidateModal}
                  disabled={isInvalidating}
                  className="px-6 py-2.5 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmInvalidate}
                  disabled={isInvalidating || !selectedSpamReason || (selectedSpamReason === "other" && !spamNotes.trim())}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInvalidating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    "Mark as Invalid"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
