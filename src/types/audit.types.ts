export interface AuditUserSummary {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
  userId?: string | null;
  user?: AuditUserSummary | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
}




