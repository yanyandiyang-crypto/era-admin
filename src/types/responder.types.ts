import type { Personnel } from "./personnel.types";

export interface Responder {
  id: string;
  incidentId: string;
  personnelId: string;
  personnel: Personnel;
  isPrimary: boolean;
  arrivedAt?: string | null;
  assignedAt: string;
}