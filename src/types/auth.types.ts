export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "DISPATCHER" | "RESPONDER";
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "DISPATCHER" | "RESPONDER";
  };
  // Optional personnel field returned by backend for personnel logins
  personnel?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: "ADMIN" | "DISPATCHER" | "RESPONDER";
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "DISPATCHER" | "RESPONDER";
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
