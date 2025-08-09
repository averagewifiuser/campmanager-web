// src/lib/types.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'camp_manager' | 'volunteer';
  created_at: string;
  updated_at: string;
}

export interface Camp {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  base_fee: string;
  capacity: number;
  description: string;
  registration_deadline: string;
  is_active: boolean;
  camp_manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface Church {
  id: string;
  name: string;
  camp_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChurchRequest {
  name: string;
}

export interface Category {
  id: string;
  name: string;
  discount_percentage: string;
  discount_amount: string;
  camp_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  discount_percentage?: string;
  discount_amount?: string;
  is_default?: boolean;
}

export interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  is_required: boolean;
  options: string[] | null;
  camp_id: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldRequest {
  field_name: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  is_required?: boolean;
  options?: string[];
  order?: number;
}

export interface RegistrationLink {
  id: string;
  camp_id: string;
  link_token: string;
  name: string;
  allowed_categories: string[];
  is_active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRegistrationLinkRequest {
  name: string;
  allowed_categories: string[];
  expires_at?: string;
  usage_limit?: number;
}

export interface Registration {
  id: string;
  surname: string;
  middle_name: string;
  last_name: string;
  age: number;
  email?: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  church_id: string;
  category_id: string;
  custom_field_responses: Record<string, any>;
  total_amount: string;
  has_paid: boolean;
  has_checked_in: boolean;
  camp_id: string;
  registration_link_id?: string;
  registration_date: string;
  created_at: string;
  updated_at: string;
  camper_code?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'camp_manager' | 'volunteer';
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

// Create camp request
export interface CreateCampRequest {
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  base_fee: string;
  capacity: number;
  description: string;
  registration_deadline: string;
}

// Category with calculated fee
export interface CategoryWithFee {
  id: string;
  name: string;
  discount_percentage: string;
  discount_amount: string;
  calculated_fee: string;
}

// Public registration form data
export interface PublicRegistrationData {
  camp: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    location: string;
    base_fee: string;
    description: string;
    registration_deadline: string;
  };
  churches: Church[];
  categories: CategoryWithFee[];
  custom_fields: CustomField[];
  link_info?: {
    name: string;
    expires_at?: string;
    usage_count: number;
    usage_limit?: number;
  };
}

// Registration form submission data
export interface RegistrationFormData {
  surname: string;
  middle_name: string;
  last_name: string;
  age: number;
  email?: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  church_id: string;
  category_id: string;
  custom_field_responses: Record<string, any>;
}

// Registration link status
export interface RegistrationLinkStatus {
  is_valid: boolean;
  camp_name: string;
  link_name: string;
  expires_at?: string;
  usage_count: number;
  usage_limit?: number;
  registration_deadline: string;
  camp_capacity: number;
  current_registrations: number;
}

// Camp statistics
export interface CampStats {
  total_registrations: number;
  total_revenue: string;
  paid_registrations: number;
  unpaid_registrations: number;
  checked_in_count: number;
  capacity_utilization: number;
  registration_by_category: Record<string, number>;
  registration_by_church: Record<string, number>;
}