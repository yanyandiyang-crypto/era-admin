import type { Incident } from "@/types/incident.types";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

// Get backend URL for image serving
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

interface IncidentPhotosPanelProps {
  incident: Incident;
}

export function IncidentPhotosPanel({ incident }: IncidentPhotosPanelProps) {
  const photos = incident.photos || [];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);



  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden h-full">
      <div className="relative overflow-hidden">
        <div className="bg-linear-to-r from-blue-800 to-blue-700 px-4 py-3 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/10">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Reporter Photos</h2>
              <p className="text-sm text-blue-300">
                {photos.length > 0 
                  ? `${photos.length} photo${photos.length > 1 ? 's' : ''} from reporter` 
                  : 'No photos submitted'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {photos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Photos</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">The reporter did not attach any photos to this incident.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo: any) => (
              <div 
                key={photo.id || photo.photoId} 
                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedImage(getImageUrl(photo.url))}
              >
                <img 
                  src={getImageUrl(photo.url)} 
                  alt={photo.caption || "Reporter submitted photo"} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                    Click to view
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs text-white font-medium">{photo.caption}</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Reporter
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Full size preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
