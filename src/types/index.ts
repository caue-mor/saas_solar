// ============================================
// TIPOS GLOBAIS DO SAAS-SOLAR
// ============================================

// User & Auth
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  companyId: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "SELLER" | "TECHNICIAN";

// Company
export interface Company {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: Address;
  subscription?: Subscription;
  settings?: CompanySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CompanySettings {
  timezone: string;
  currency: string;
  businessHours: {
    start: string;
    end: string;
    days: number[];
  };
}

// Subscription & Plans
export interface Plan {
  id: string;
  name: string;
  slug: PlanType;
  price: number;
  features: string[];
  limits: PlanLimits;
}

export type PlanType = "CRM_VOZ" | "IA_ATENDIMENTO" | "IA_ATENDIMENTO_FOLLOW";

export interface PlanLimits {
  users: number;
  leads: number;
  messages: number;
  storage: number; // in MB
}

export interface Subscription {
  id: string;
  planId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "TRIALING"
  | "INACTIVE";

// Leads
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  statusId: string;
  estimatedValue?: number;
  systemSize?: number;
  notes?: string;
  assignedTo?: User;
  assignedToId?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadSource =
  | "WHATSAPP"
  | "SITE"
  | "INDICACAO"
  | "TELEFONE"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TRAFEGO_PAGO"
  | "OUTRO";

export interface LeadStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  companyId: string;
}

export interface LeadNote {
  id: string;
  content: string;
  leadId: string;
  createdBy: User;
  createdAt: Date;
}

export interface LeadActivity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  leadId: string;
  createdAt: Date;
}

export type ActivityType =
  | "STATUS_CHANGE"
  | "NOTE_ADDED"
  | "MESSAGE_SENT"
  | "MESSAGE_RECEIVED"
  | "CALL_MADE"
  | "VISIT_SCHEDULED"
  | "PROPOSAL_SENT";

// Solar Systems
export interface SolarSystem {
  id: string;
  name: string;
  type: SystemType;
  power: number; // kWp
  price: number;
  modules: number;
  inverter?: string;
  description?: string;
  active: boolean;
  images: SystemImage[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SystemType = "RESIDENCIAL" | "COMERCIAL" | "RURAL" | "INVESTIMENTO";

export interface SystemImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
  systemId: string;
}

export interface Simulation {
  id: string;
  leadId: string;
  systemId: string;
  system: SolarSystem;
  monthlyConsumption: number;
  electricityRate: number;
  estimatedSavings: number;
  paybackMonths: number;
  proposalUrl?: string;
  createdAt: Date;
}

// WhatsApp
export interface WhatsAppInstance {
  id: string;
  instanceId: string;
  name: string;
  phone?: string;
  status: WhatsAppStatus;
  qrCode?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WhatsAppStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

export interface WhatsAppMessage {
  id: string;
  instanceId: string;
  leadId?: string;
  direction: MessageDirection;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type MessageDirection = "INCOMING" | "OUTGOING";
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
export type MessageStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "RECEIVED";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  companyId: string;
  createdAt: Date;
}

// AI Config
export interface AIConfig {
  id: string;
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  agentName?: string;
  companyDescription?: string;
  qualificationQuestions: string[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Follow-up
export interface FollowUpRule {
  id: string;
  name: string;
  triggerType: FollowUpTrigger;
  delayMinutes: number;
  templateId?: string;
  template?: WhatsAppTemplate;
  enabled: boolean;
  companyId: string;
  createdAt: Date;
}

export type FollowUpTrigger =
  | "NO_RESPONSE"
  | "PROPOSAL_NOT_VIEWED"
  | "PROPOSAL_VIEWED"
  | "LEAD_INACTIVE";

export interface FollowUp {
  id: string;
  ruleId: string;
  rule: FollowUpRule;
  leadId: string;
  lead: Lead;
  status: FollowUpStatus;
  scheduledFor: Date;
  sentAt?: Date;
  createdAt: Date;
}

export type FollowUpStatus = "PENDING" | "SENT" | "CANCELED" | "FAILED";

// Kanban
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  leads: KanbanLead[];
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source: LeadSource;
  estimatedValue?: number;
  systemSize?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  totalLeads: number;
  leadsChange: number;
  systemsSold: number;
  systemsChange: number;
  monthlyRevenue: number;
  revenueChange: number;
  conversionRate: number;
  conversionChange: number;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type NotificationType =
  | "NEW_LEAD"
  | "MESSAGE_RECEIVED"
  | "PAYMENT_RECEIVED"
  | "PROPOSAL_VIEWED"
  | "SYSTEM_ALERT";
