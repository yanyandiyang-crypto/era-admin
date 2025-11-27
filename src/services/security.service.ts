// src/services/security.service.ts

import api from './api';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
  secret?: string; // Only returned on creation
}

export interface LoginStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  topFailingIPs: Array<{
    ip: string;
    count: number;
  }>;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresInDays?: number;
}

export interface AccountLockoutStatus {
  locked: boolean;
  unlockTime?: string;
  attempts: number;
}

class SecurityService {
  private authBaseUrl = '/api/v1/auth';
  private adminBaseUrl = '/api/v1/admin/security';

  // API Key Management
  async getApiKeys(): Promise<ApiKey[]> {
    const response = await api.get(`${this.authBaseUrl}/api-keys`);
    return response.data.data;
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await api.post(`${this.authBaseUrl}/api-keys`, data);
    return response.data.data;
  }

  async revokeApiKey(keyId: string): Promise<void> {
    await api.delete(`${this.authBaseUrl}/api-keys/${keyId}`);
  }

  // Account Protection
  async getLoginStats(hours: number = 24): Promise<LoginStats> {
    const response = await api.get(`${this.adminBaseUrl}/login-stats`, {
      params: { hours },
    });
    return response.data;
  }

  async cleanupOldAttempts(): Promise<{ deletedCount: number }> {
    const response = await api.post(`${this.adminBaseUrl}/cleanup-attempts`);
    return response.data;
  }

  async checkAccountLockout(email: string): Promise<AccountLockoutStatus> {
    const response = await api.get(`${this.adminBaseUrl}/check-lockout`, {
      params: { email },
    });
    return response.data;
  }
}

export const securityService = new SecurityService();