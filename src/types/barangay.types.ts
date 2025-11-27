export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: "EMERGENCY" | "BARANGAY_HALL" | "POLICE" | "FIRE" | "MEDICAL" | "OTHER";
  isPrimary?: boolean;
}

export interface Barangay {
  id: string;
  barangayId?: string; // For backward compatibility
  _id?: string; // MongoDB ObjectId fallback
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  emergencyContacts: EmergencyContact[];
  operatingHours?: string;
  landmarks?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateBarangayRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  emergencyContacts: EmergencyContact[];
  operatingHours?: string;
  landmarks?: string;
}

export interface UpdateBarangayRequest {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  emergencyContacts?: EmergencyContact[];
  operatingHours?: string;
  landmarks?: string;
  status?: "ACTIVE" | "INACTIVE";
}
