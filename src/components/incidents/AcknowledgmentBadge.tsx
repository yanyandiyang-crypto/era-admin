import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import '@/styles/acknowledgment-badge.css';

interface AcknowledgmentBadgeProps {
  incidentId: string;
  acknowledgmentCount: number;
  totalPersonnelNotified: number;
  acknowledgmentPercentage: number;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

export function AcknowledgmentBadge({
  incidentId,
  acknowledgmentCount,
  totalPersonnelNotified,
  acknowledgmentPercentage,
  size = 'md',
  highlight = false,
}: AcknowledgmentBadgeProps) {
  // Local state for realtime updates
  const [localData, setLocalData] = useState({
    acknowledgmentCount,
    totalPersonnelNotified,
    acknowledgmentPercentage,
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(localData.acknowledgmentCount);

  // Initialize local state from props
  useEffect(() => {
    setLocalData({
      acknowledgmentCount,
      totalPersonnelNotified,
      acknowledgmentPercentage,
    });
  }, [acknowledgmentCount, totalPersonnelNotified, acknowledgmentPercentage]);

  // Listen for realtime acknowledgment updates for this specific incident
  useEffect(() => {
    const handleAcknowledgment = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Only update if this acknowledgment is for this incident
      if (data.incidentId === incidentId) {
        // console.log('🔄 AcknowledgmentBadge: Real-time update for incident', incidentId);
        setLocalData({
          acknowledgmentCount: data.acknowledgedCount,
          totalPersonnelNotified: data.totalPersonnelNotified,
          acknowledgmentPercentage: data.acknowledgmentPercentage,
        });

        // Trigger animation
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('incident:acknowledged', handleAcknowledgment);
    return () => {
      window.removeEventListener('incident:acknowledged', handleAcknowledgment);
    };
  }, [incidentId]);

  // Check if the local acknowledgment count has increased for animation
  useEffect(() => {
    if (localData.acknowledgmentCount > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Store the current count for the next render
    prevCountRef.current = localData.acknowledgmentCount;
  }, [localData.acknowledgmentCount]);

  // Also animate when highlighted (for manual triggers)
  useEffect(() => {
    if (highlight) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // Size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-2 py-1',
          fontSize: 'text-[10px]',
          iconSize: 'h-3 w-3',
        };
      case 'lg':
        return {
          padding: 'px-4 py-2',
          fontSize: 'text-sm',
          iconSize: 'h-5 w-5',
        };
      case 'md':
      default:
        return {
          padding: 'px-3 py-1.5',
          fontSize: 'text-xs',
          iconSize: 'h-4 w-4',
        };
    }
  };

  const { padding, fontSize, iconSize } = getSizeStyles();

  // Get color based on acknowledgment percentage
  const getColorClass = () => {
    if (localData.acknowledgmentPercentage === 100) return 'from-green-50 to-green-100 border-green-200';
    if (localData.acknowledgmentPercentage >= 75) return 'from-green-50 to-emerald-50 border-green-200';
    if (localData.acknowledgmentPercentage >= 50) return 'from-green-50 to-teal-50 border-green-200';
    if (localData.acknowledgmentPercentage >= 25) return 'from-blue-50 to-green-50 border-blue-200';
    return 'from-gray-50 to-blue-50 border-gray-200';
  };

  // Get icon color based on acknowledgment percentage
  const getIconColorClass = () => {
    if (localData.acknowledgmentPercentage === 100) return 'text-green-600';
    if (localData.acknowledgmentPercentage >= 75) return 'text-emerald-500';
    if (localData.acknowledgmentPercentage >= 50) return 'text-teal-500';
    if (localData.acknowledgmentPercentage >= 25) return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <div className={`
      ack-badge-highlight ${isAnimating ? 'active badge-pulse' : ''}
      ${padding} bg-linear-to-r ${getColorClass()}
      text-green-700 ${fontSize} font-medium rounded-lg border shadow-sm
      flex items-center gap-1.5 w-fit
      transition-all duration-300
    `}>
      <Bell className={`${iconSize} ${getIconColorClass()} ${isAnimating ? 'animate-bounce' : ''}`} />
      <span className={`font-bold ${isAnimating ? 'number-pulse' : ''}`}>{localData.acknowledgmentCount}</span>
      <span className="text-green-500">/</span>
      <span className="font-medium">{localData.totalPersonnelNotified}</span>
      <span className={`${localData.acknowledgmentPercentage >= 50 ? 'text-emerald-600' : 'text-blue-600'} ml-1 font-medium`}>
        ({localData.acknowledgmentPercentage}% seen)
      </span>
    </div>
  );
}
