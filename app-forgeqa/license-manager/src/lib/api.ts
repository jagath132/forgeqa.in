import axios from "axios";

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

export type Admin = {
  id: string;
  email: string;
};

export type ProductKey = {
  id: string;
  key: string;
  status: "available" | "used" | "expired";
  customerEmail: string | null;
  registeredEmail: string | null;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  notes: string | null;
};

export type Customer = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  productKey: string | null;
  keyStatus: string | null;
  keys: { id: string; key: string; status: string; createdAt: string }[];
  rejected?: boolean;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
};

export type EmailLog = {
  id: string;
  to: string;
  subject: string;
  productKey: string;
  status: string;
  error: string | null;
  sentAt: string;
};

export type Transaction = {
  id: string;
  transactionId: string;
  email: string;
  amount: number | null;
  currency: string | null;
  status: string;
  provider: string;
  productKey: string | null;
  timestamp: string;
};

export type PendingRegistration = {
  id: string;
  pendingId: string;
  name: string | null;
  email: string;
  plan: "free" | "pro" | "enterprise" | null;
  paymentStatus: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  active: boolean;
  maxUsers: number | null;
  maxTestCases: number | null;
  aiProviders: number | null;
  advancedExport: boolean;
  regressionTesting: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  onPremise: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KeyStats = {
  total: number;
  used: number;
  available: number;
  expired: number;
};

export function setAuthToken(token: string) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
}
