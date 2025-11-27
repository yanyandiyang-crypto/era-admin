import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { incidentService } from "@/services/incident.service";
import type { Incident } from "@/types/incident.types";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { IncidentDetailHeader } from "../../components/incidents/IncidentDetailHeader";
import { IncidentPersonnelPanel } from "../../components/incidents/IncidentPersonnelPanel";
import { IncidentRespondersPanel } from "@/components/incidents/IncidentRespondersPanel";
import { IncidentPhotosPanel } from "../../components/incidents/IncidentPhotosPanel";
import { IncidentUpdatesPanel } from "../../components/incidents/IncidentUpdatesPanel";
import { IncidentQuickActions } from "../../components/incidents/IncidentQuickActions";
import { ResolutionReview } from "@/components/incidents/ResolutionReview";

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  const fetchIncident = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await incidentService.getIncident(id);
      setIncident(response.data);
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to load incident"
      );
      // console.error(error);
      // Redirect to incidents list if not found
      if ((error as { response?: { status?: number } }).response?.status === 404) {
        navigate("/incidents");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchIncident();
    }
  }, [id, fetchIncident]);
  
  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !id) return;
    
    const handleIncidentUpdated = (updatedIncident: Incident) => {
      if (updatedIncident.incidentId === id) {
        // console.log('🔄 Real-time incident update received:', updatedIncident);
        setIncident(updatedIncident);
        toast.info('Incident updated in real-time', { duration: 2000 });
      }
    };
    
    const handleIncidentDeleted = (deletedId: string) => {
      if (deletedId === id) {
        // console.log('🗑️ Incident deleted in real-time');
        toast.error('This incident has been deleted', { duration: 3000 });
        navigate('/incidents');
      }
    };
    
    const handleStatusChanged = (data: { incidentId: string }) => {
      if (data.incidentId === id) {
        // console.log('🔄 Status changed in real-time:', data.status);
        // We'll get the full updated incident from handleIncidentUpdated
        // This is just an additional event with more specific data
      }
    };
    
    const handleResponderJoined = (data: { incidentId: string }) => {
      if (data.incidentId === id) {
        // console.log('👥 Personnel joined response:', data);
        // Refresh incident data to get updated responder list
        fetchIncident();
        toast.success('Personnel joined the response', { duration: 2000 });
      }
    };
    
    const handleResponderLeft = (data: { incidentId: string }) => {
      if (data.incidentId === id) {
        // console.log('👥 Personnel left response:', data);
        // Refresh incident data to get updated responder list
        fetchIncident();
        toast.info('Personnel left the response', { duration: 2000 });
      }
    };
    
    // Listen for real-time acknowledgment updates
    const handleAcknowledgment = (event: Event) => {
      const customEvent = event as CustomEvent<{
        incidentId: string;
        acknowledgedCount: number;
        acknowledgmentPercentage: number;
        totalPersonnelNotified: number;
      }>;
      const data = customEvent.detail;
      
      if (data.incidentId === id && incident) {
        // console.log('🔄 Real-time acknowledgment update:', data);
        
        // Update incident with new acknowledgment data
        setIncident(prev => prev ? {
          ...prev,
          acknowledgmentCount: data.acknowledgedCount,
          acknowledgmentPercentage: data.acknowledgmentPercentage,
          totalPersonnelNotified: data.totalPersonnelNotified,
        } : null);
      }
    };
    
    // Register socket event listeners
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:deleted', handleIncidentDeleted);
    socket.on('incident:status', handleStatusChanged);
    socket.on('incident:responder-joined', handleResponderJoined);
    socket.on('incident:responder-left', handleResponderLeft);
    
    // Custom event for acknowledgments
    window.addEventListener('incident:acknowledged', handleAcknowledgment);
    
    return () => {
      // Clean up socket listeners
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:deleted', handleIncidentDeleted);
      socket.off('incident:status', handleStatusChanged);
      socket.off('incident:responder-joined', handleResponderJoined);
      socket.off('incident:responder-left', handleResponderLeft);
      socket.off('connect');
      socket.off('disconnect');
      
      // Clean up custom event listener
      window.removeEventListener('incident:acknowledged', handleAcknowledgment);
    };
  }, [socket, id, incident, navigate, fetchIncident]);

  // Edit and Delete handlers removed (buttons hidden)
  // const handleEdit = () => {
  //   toast.info("Edit functionality coming soon");
  // };

  // const handleDelete = async () => {
  //   if (!id || !incident) return;
  //   const confirmed = window.confirm(
  //     `Are you sure you want to delete incident ${incident.trackingNumber}? This action cannot be undone.`
  //   );
  //   if (!confirmed) return;
  //   try {
  //     await incidentService.deleteIncident(id);
  //     toast.success("Incident deleted successfully");
  //     navigate("/incidents");
  //   } catch (error: unknown) {
  //     toast.error((error as any).response?.data?.message || "Failed to delete incident");
  //     // console.error(error);
  //   }
  // };

  // Photo upload/delete removed - photos are submitted by public reporters only
  // Admin can only view the photos submitted with the incident report


  // Context-aware action handlers
  const handleVerify = async (priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", notes?: string) => {
    if (!id) return;
    
    try {
      await incidentService.verifyIncident(id, priority, notes);
      toast.success("Incident verified successfully");
      fetchIncident();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to verify incident"
      );
      throw error;
    }
  };

  const handleMarkAsSpam = async (reason: string) => {
    if (!id) return;
    
    try {
      await incidentService.markAsSpam(id, reason);
      toast.success("Incident marked as spam");
      fetchIncident();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to mark as spam"
      );
      throw error;
    }
  };


  const handleResolve = async (notes: string) => {
    if (!id) return;
    
    try {
      await incidentService.resolveIncident(id, notes);
      toast.success("Incident marked as resolved");
      fetchIncident();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to resolve incident"
      );
      throw error;
    }
  };

  const handleReopen = async (reason: string) => {
    if (!id) return;
    
    try {
      await incidentService.reopenIncident(id, reason);
      toast.success("Incident reopened");
      fetchIncident();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to reopen incident"
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-4">Loading incident details...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Incident not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time status indicator - Hidden */}
      
      {/* Header */}
      {/* Header */}
      <IncidentDetailHeader
        incident={incident}
        quickActions={
          <IncidentQuickActions
            incident={incident}
            onVerify={handleVerify}
            onMarkAsSpam={handleMarkAsSpam}
            onResolve={handleResolve}
            onReopen={handleReopen}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Column 1: Recent Activity */}
        <div className="md:col-span-2 lg:col-span-1">
          <IncidentUpdatesPanel incident={incident} />
        </div>

        {/* Column 2: Personnel */}
        <div className="md:col-span-1 lg:col-span-1">
          {/* New Workflow - Responders Panel */}
          {(incident.status === "RESPONDING" || incident.status === "ARRIVED" || incident.responders?.length) ? (
            <IncidentRespondersPanel incident={incident} />
          ) : (
            /* Legacy - Assigned Personnel */
            <IncidentPersonnelPanel incident={incident} />
          )}
        </div>

        {/* Column 3: Photos & Media */}
        <div className="md:col-span-1 lg:col-span-1">
          <IncidentPhotosPanel
            incident={incident}
          />
        </div>
      </div>

      {/* Resolution Review Section - Shows when status is PENDING_RESOLVE */}
      {incident.status === "PENDING_RESOLVE" && (
        <div className="mt-4">
          <ResolutionReview 
            incidentId={incident.incidentId} 
            onResolutionConfirmed={() => fetchIncident()}
          />
        </div>
      )}
    </div>
  );
}
