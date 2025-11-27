import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { incidentService } from "@/services/incident.service";
import { reportsService } from "@/services/reports.service";
import type { Incident, IncidentFilters } from "@/types/incident.types";
import ReportsHeader from "./ReportsHeader";
import ReportsFilters from "./ReportsFilters";
import ReportsIncidentList from "./ReportsIncidentList";
import ReportsIncidentModal from "./ReportsIncidentModal";


type ArrayFilterKey = "status" | "priority" | "type" | "barangayId";
type BooleanFilterKey = "hasPhotos" | "hasAssignedPersonnel";

export default function Reports() {
  const navigate = useNavigate();
  
  // Set default date range to last 30 days
  const getDefaultStartDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return format(thirtyDaysAgo, "yyyy-MM-dd");
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Incident list state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // 5W1H Filters - initialize without dates first
  const [filters, setFilters] = useState<IncidentFilters>({
    status: [],
    priority: [],
    type: [],
    barangayId: [],
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  const fetchIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      // Create a combined filter object with all current filter values including current dates
      const combinedFilters: IncidentFilters = {
        ...filters,
        startDate,
        endDate,
        search: searchQuery.trim() || undefined,
        limit: 100
      };

      // console.log('Fetching incidents with filters:', combinedFilters);

      const response = await incidentService.getIncidents(combinedFilters);
      let incidentsData = response.data?.data || [];

      // Apply client-side date filtering as backup
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date

        incidentsData = incidentsData.filter(incident => {
          const incidentDate = new Date(incident.reportedAt);
          return incidentDate >= start && incidentDate <= end;
        });

        // console.log(`Client-side filtering: ${response.data?.data?.length || 0} incidents filtered to ${incidentsData.length} based on date range ${startDate} to ${endDate}`);
      }

      // console.log('Final incidents data:', incidentsData);

      setIncidents(incidentsData);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
      toast.error("Failed to load incidents");
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [filters, startDate, endDate, searchQuery]);

  // Fetch incidents on component mount and when filters change
  useEffect(() => {
    fetchIncidents();
  }, [filters, startDate, endDate, searchQuery]);

  // Update filters when date range changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  }, [startDate, endDate]);

  // Update filters when search query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchQuery.trim() || undefined
      }));
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const updateFilter = (key: keyof IncidentFilters, value: IncidentFilters[keyof IncidentFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      type: [],
      barangayId: [],
      startDate: startDate,
      endDate: endDate,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      hasPhotos: undefined,
      hasAssignedPersonnel: undefined
    });
    setSearchQuery("");
  };

  const toggleArrayFilter = (key: ArrayFilterKey, value: string) => {
    setFilters(prev => {
      const current = (prev[key] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return {
        ...prev,
        [key]: next
      };
    });
  };

  const removeArrayFilterValue = (key: ArrayFilterKey, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: ((prev[key] as string[] | undefined)?.filter(item => item !== value)) || []
    }));
  };

  const toggleBooleanFilter = (key: BooleanFilterKey) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] ? undefined : true
    }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await reportsService.generateIncidentSummary(
        startDate,
        endDate,
        true // include statistics
      );

      const filename = reportsService.generateFilename(
        'incident-summary',
        'pdf',
        startDate,
        endDate
      );

      reportsService.downloadFile(blob, filename);

      toast.success("PDF report generated successfully!", {
        description: `Report: ${filename}\nDate range: ${startDate} to ${endDate}`
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      // Include all current filters and search query in Excel export
      const exportFilters: IncidentFilters = {
        ...filters,
        startDate,
        endDate,
        search: searchQuery.trim() || undefined
      };

      const blob = await reportsService.exportIncidentsToExcel(startDate, endDate, true, exportFilters);

      const filename = reportsService.generateFilename(
        'incident-export',
        'xlsx',
        startDate,
        endDate
      );

      reportsService.downloadFile(blob, filename);

      toast.success("Excel report generated successfully!", {
        description: `Report: ${filename}\nDate range: ${startDate} to ${endDate}\nFilters applied: ${Object.values(filters).flat().filter(Boolean).length} active filters`
      });
    } catch (error) {
      console.error("Failed to generate Excel:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6">
      <ReportsHeader
        isGenerating={isGenerating}
        generatePDF={generatePDF}
        generateExcel={generateExcel}

      />

      <div className="space-y-6">
        <ReportsFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          filters={filters}
          clearFilters={clearFilters}
          toggleArrayFilter={toggleArrayFilter}
          removeArrayFilterValue={removeArrayFilterValue}
          toggleBooleanFilter={toggleBooleanFilter}
          updateFilter={updateFilter}
        />

        <ReportsIncidentList
          incidents={incidents}
          isLoadingIncidents={isLoadingIncidents}
          setSelectedIncident={setSelectedIncident}
          setShowIncidentModal={setShowIncidentModal}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
        />
      </div>

      <ReportsIncidentModal
        selectedIncident={selectedIncident}
        setShowIncidentModal={setShowIncidentModal}
        navigate={navigate}
        showIncidentModal={showIncidentModal}
      />
    </div>
  );
}
