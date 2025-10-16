// src/lib/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  Camp,
  CreateCampRequest,
  RegistrationFormData,
  Registration,
  RegistrationLinkStatus,
  PublicRegistrationData,
  CampStats,
  Category,
  CreateCategoryRequest,
  RegistrationLink,
  CreateRegistrationLinkRequest,
  CustomField,
  CreateCustomFieldRequest,
  Church,
  CreateChurchRequest,
  InventoryItem,
  CreateInventoryRequest,
  Purchase,
  CreatePurchaseRequest,
  Pledge,
  CreatePledgeRequest,
  PledgeFulfillment,
  CreatePledgeFulfillmentRequest
} from './types';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'camp_manager_token';
const REFRESH_TOKEN_KEY = 'camp_manager_refresh_token';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    // @ts-ignore
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // @ts-ignore
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          
          const { access_token } = response.data.data;
          tokenManager.setToken(access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { data });
    return response.data.data;
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/auth/register', { data });
    return response.data.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    tokenManager.clearTokens();
  },
};

// Public registration API (no auth required)
export const publicApi = {
  getCampRegistrationForm: async (campId: string): Promise<PublicRegistrationData> => {
    const response = await api.get<ApiResponse<PublicRegistrationData>>(`/camps/${campId}/register`);
    return response.data.data;
  },
  
  getCampRegistrationFormByLink: async (linkToken: string): Promise<PublicRegistrationData> => {
    const response = await api.get<ApiResponse<PublicRegistrationData>>(`/register/${linkToken}`);
    return response.data.data;
  },
  
  checkRegistrationLink: async (linkToken: string): Promise<RegistrationLinkStatus> => {
    const response = await api.get<ApiResponse<RegistrationLinkStatus>>(`/register/check/${linkToken}`);
    return response.data.data;
  },
  
  submitRegistration: async (campId: string, data: RegistrationFormData): Promise<Registration> => {
    const response = await api.post<ApiResponse<Registration>>(`/camps/${campId}/register`, { data });
    return response.data.data;
  },
  
  submitRegistrationByLink: async (linkToken: string, data: RegistrationFormData): Promise<Registration> => {
    const response = await api.post<ApiResponse<Registration>>(`/register/${linkToken}`, { data });
    return response.data.data;
  },
};

// Camps API
export const campsApi = {
  getCamps: async (): Promise<Camp[]> => {
    const response = await api.get<ApiResponse<Camp[]>>('/camps');
    return response.data.data;
  },
  
  getCamp: async (id: string): Promise<Camp> => {
    const response = await api.get<ApiResponse<Camp>>(`/camps/${id}`);
    return response.data.data;
  },
  
  createCamp: async (data: CreateCampRequest): Promise<Camp> => {
    const response = await api.post<ApiResponse<Camp>>('/camps', { data });
    return response.data.data;
  },
  
  updateCamp: async (id: string, data: Partial<CreateCampRequest>): Promise<Camp> => {
    const response = await api.put<ApiResponse<Camp>>(`/camps/${id}`, { data });
    return response.data.data;
  },
  
  deleteCamp: async (id: string): Promise<void> => {
    await api.delete(`/camps/${id}`);
  },
  
  getCampStats: async (campId: string): Promise<CampStats> => {
    const response = await api.get<ApiResponse<CampStats>>(`/camps/${campId}/stats`);
    return response.data.data;
  },
};

// Registrations API
export const registrationsApi = {
  /**
   * Get all registrations for a camp, with optional filters.
   * @param campId - The camp ID
   * @param filters - Optional filters: { church_id?: string, category_id?: string }
   */
  getCampRegistrations: async (
    campId: string,
    filters?: { church_id?: string; category_id?: string }
  ): Promise<Registration[]> => {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.church_id) params.append('church_id', filters.church_id);
      if (filters.category_id) params.append('category_id', filters.category_id);
      query = `?${params.toString()}`;
    }
    const response = await api.get<ApiResponse<Registration[]>>(
      `/camps/${campId}/registrations${query}`
    );
    return response.data.data;
  },
  
  getRegistration: async (registrationId: string): Promise<Registration> => {
    const response = await api.get<ApiResponse<Registration>>(`/camps/registrations/${registrationId}`);
    return response.data.data;
  },
  
  updateRegistration: async (registrationId: string, data: Partial<Registration>): Promise<Registration> => {
    const response = await api.put<ApiResponse<Registration>>(`/camps/registrations/${registrationId}`, { data });
    return response.data.data;
  },
  
  updatePaymentStatus: async (registrationId: string, hasPaid: boolean): Promise<Registration> => {
    const response = await api.patch<ApiResponse<Registration>>(`/camps/registrations/${registrationId}/payment`, { 
      data: { has_paid: hasPaid } 
    });
    return response.data.data;
  },
  
  updateCheckinStatus: async (registrationId: string, hasCheckedIn: boolean): Promise<Registration> => {
    const response = await api.patch<ApiResponse<Registration>>(`/camps/registrations/${registrationId}/checkin`, { 
      data: { has_checked_in: hasCheckedIn } 
    });
    return response.data.data;
  },
  
  deleteRegistration: async (registrationId: string): Promise<void> => {
    await api.delete(`/camps/registrations/${registrationId}`);
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async (campId: string): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>(`/camps/${campId}/categories`);
    return response.data.data;
  },

  createCategory: async (campId: string, data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>(`/camps/${campId}/categories`, { data });
    return response.data.data;
  },

  updateCategory: async (categoryId: string, data: Partial<CreateCategoryRequest>): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/camps/categories/${categoryId}`, { data });
    return response.data.data;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await api.delete(`/camps/categories/${categoryId}`);
  },
};

// Registration Links API
export const registrationLinksApi = {
  getRegistrationLinks: async (campId: string): Promise<RegistrationLink[]> => {
    const response = await api.get<ApiResponse<RegistrationLink[]>>(`/camps/${campId}/registration-links`);
    return response.data.data;
  },

  getRegistrationLink: async (linkId: string): Promise<RegistrationLink> => {
    const response = await api.get<ApiResponse<RegistrationLink>>(`/camps/registration-links/${linkId}`);
    return response.data.data;
  },

  createRegistrationLink: async (campId: string, data: CreateRegistrationLinkRequest): Promise<RegistrationLink> => {
    const response = await api.post<ApiResponse<RegistrationLink>>(`/camps/${campId}/registration-links`, { data });
    return response.data.data;
  },

  updateRegistrationLink: async (linkId: string, data: Partial<CreateRegistrationLinkRequest>): Promise<RegistrationLink> => {
    const response = await api.put<ApiResponse<RegistrationLink>>(`/camps/registration-links/${linkId}`, { data });
    return response.data.data;
  },

  toggleRegistrationLink: async (linkId: string): Promise<RegistrationLink> => {
    const response = await api.patch<ApiResponse<RegistrationLink>>(`/camps/registration-links/${linkId}/toggle`);
    return response.data.data;
  },

  deleteRegistrationLink: async (linkId: string): Promise<void> => {
    await api.delete(`/camps/registration-links/${linkId}`);
  },
};

// Custom Fields API
export const customFieldsApi = {
  getCustomFields: async (campId: string): Promise<CustomField[]> => {
    const response = await api.get<ApiResponse<CustomField[]>>(`/camps/${campId}/custom-fields`);
    return response.data.data;
  },

  createCustomField: async (campId: string, data: CreateCustomFieldRequest): Promise<CustomField> => {
    const response = await api.post<ApiResponse<CustomField>>(`/camps/${campId}/custom-fields`, { data });
    return response.data.data;
  },

  updateCustomField: async (fieldId: string, data: Partial<CreateCustomFieldRequest>): Promise<CustomField> => {
    const response = await api.put<ApiResponse<CustomField>>(`/camps/custom-fields/${fieldId}`, { data });
    return response.data.data;
  },

  deleteCustomField: async (fieldId: string): Promise<void> => {
    await api.delete(`/camps/custom-fields/${fieldId}`);
  },
};

/**
 * Payments API
 */
export const paymentsApi = {
  getCampPayments: async (campId: string) => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/payments`);
    return response.data.data;
  },
  createPayment: async (
    campId: string,
    data: {
      amount: number;
      payment_channel: string;
      payment_metadata: Record<string, any>;
      payment_reference: string;
      registration_ids: string[];
    }
  ) => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/payments`, { data });
    return response.data.data;
  },
};

/**
 * Financials API
 */
export const financialsApi = {
  getCampFinancials: async (campId: string) => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/financials`);
    return response.data.data;
  },
  createFinancial: async (
    campId: string,
    data: {
      amount: number;
      approved_by: string;
      date: string;
      description: string;
      payment_method: 'cash' | 'check' | 'momo' | 'bank_transfer' | 'card';
      received_by: string;
      reference_number: string;
      transaction_category: 'offering' | 'sales' | 'donation' | 'camp_payment' | 'camp_expense' | 'pledge' | 'other';
      transaction_type: 'income' | 'expense';
    }
  ) => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/financials`, { data });
    return response.data.data;
  },
};

// Churches API
export const churchesApi = {
  getChurches: async (campId: string): Promise<Church[]> => {
    const response = await api.get<ApiResponse<Church[]>>(`/camps/${campId}/churches`);
    return response.data.data;
  },

  createChurch: async (campId: string, data: CreateChurchRequest): Promise<Church> => {
    const response = await api.post<ApiResponse<Church>>(`/camps/${campId}/churches`, { data });
    return response.data.data;
  },

  updateChurch: async (churchId: string, data: Partial<CreateChurchRequest>): Promise<Church> => {
    const response = await api.put<ApiResponse<Church>>(`/camps/churches/${churchId}`, { data });
    return response.data.data;
  },

  deleteChurch: async (churchId: string): Promise<void> => {
    await api.delete(`/camps/churches/${churchId}`);
  },
};

/**
 * Inventory API
 */
export const inventoryApi = {
  getCampInventory: async (campId: string): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(`/camps/${campId}/inventory`);
    return response.data.data;
  },
  
  createInventoryItem: async (campId: string, data: CreateInventoryRequest): Promise<InventoryItem> => {
    const response = await api.post<ApiResponse<InventoryItem>>(`/camps/${campId}/inventory`, { data });
    return response.data.data;
  },
  
  updateInventoryItem: async (itemId: string, data: Partial<CreateInventoryRequest>): Promise<InventoryItem> => {
    const response = await api.put<ApiResponse<InventoryItem>>(`/camps/inventory/${itemId}`, { data });
    return response.data.data;
  },
  
  deleteInventoryItem: async (itemId: string): Promise<void> => {
    await api.delete(`/camps/inventory/${itemId}`);
  },
};

/**
 * Purchases API
 */
export const purchasesApi = {
  getCampPurchases: async (campId: string): Promise<Purchase[]> => {
    const response = await api.get<ApiResponse<Purchase[]>>(`/camps/${campId}/purchases`);
    return response.data.data;
  },
  
  createPurchase: async (campId: string, data: CreatePurchaseRequest): Promise<Purchase> => {
    const response = await api.post<ApiResponse<Purchase>>(`/camps/${campId}/purchases`, { data });
    return response.data.data;
  },

  // Update an existing purchase. Backend expects camp_id in the request body.
  updatePurchase: async (
    purchaseId: string,
    data: Partial<CreatePurchaseRequest>,
    campId: string
  ): Promise<Purchase> => {
    const response = await api.put<ApiResponse<Purchase>>(
      `/camps/purchases/${purchaseId}`,
      { data: { ...data, camp_id: campId } }
    );
    return response.data.data;
  },
};

/**
 * Pledges API
 */
export const pledgesApi = {
  getCampPledges: async (campId: string): Promise<Pledge[]> => {
    const response = await api.get<ApiResponse<Pledge[]>>(`/camps/${campId}/pledges`);
    return response.data.data;
  },
  
  createPledge: async (campId: string, data: CreatePledgeRequest): Promise<Pledge> => {
    const response = await api.post<ApiResponse<Pledge>>(`/camps/${campId}/pledges`, { data });
    return response.data.data;
  },
  
  updatePledgeStatus: async (pledgeId: string, status: 'pending' | 'fulfilled' | 'cancelled', campId: string): Promise<Pledge> => {
    const response = await api.patch<ApiResponse<Pledge>>(`/camps/pledges/${pledgeId}/status`, { 
      data: { status, camp_id: campId } 
    });
    return response.data.data;
  },

  // Pledge Fulfillments
  getPledgeFulfillments: async (pledgeId: string, campId: string): Promise<PledgeFulfillment[]> => {
    const response = await api.get<ApiResponse<PledgeFulfillment[]>>(`/camps/pledges/${pledgeId}/fulfillments?camp_id=${campId}`);
    return response.data.data;
  },

  addPledgeFulfillment: async (pledgeId: string, campId: string, data: CreatePledgeFulfillmentRequest): Promise<PledgeFulfillment> => {
    const response = await api.post<ApiResponse<PledgeFulfillment>>(`/camps/pledges/${pledgeId}/fulfillments?camp_id=${campId}`, { data });
    return response.data.data;
  },

  deletePledgeFulfillment: async (fulfillmentId: string, campId: string): Promise<void> => {
    await api.delete(`/camps/pledge-fulfillments/${fulfillmentId}?camp_id=${campId}`);
  },
};

/**
 * Rooms API
 */
export const roomsApi = {
  getCampRooms: async (campId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/rooms`);
    return response.data.data;
  },
  
  createRoom: async (campId: string, data: {
    hostel_name: string;
    block: string;
    room_number: string;
    room_capacity: number;
    is_special_room: boolean;
    extra_beds: number;
    room_gender: 'male' | 'female' | 'other';
    is_damaged: boolean;
    misc_info?: string;
    adjoining_to?: string;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/rooms`, { data });
    return response.data.data;
  },
  
  updateRoom: async (roomId: string, data: any): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/camps/rooms/${roomId}`, { data });
    return response.data.data;
  },
  
  deleteRoom: async (roomId: string): Promise<void> => {
    await api.delete(`/camps/rooms/${roomId}`);
  },
  
  getAvailableRooms: async (campId: string, gender?: string): Promise<any[]> => {
    const query = gender ? `?gender=${gender}` : '';
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/rooms/available${query}`);
    return response.data.data;
  },
};

/**
 * Room Allocations API
 */
export const roomAllocationsApi = {
  getCampRoomAllocations: async (campId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/room-allocations`);
    return response.data.data;
  },
  
  allocateRoom: async (campId: string, data: {
    room_id: string;
    registration_ids: string[];
    notes?: string;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/room-allocations`, { data });
    return response.data.data;
  },
  
  updateRoomAllocation: async (allocationId: string, data: {
    is_active?: boolean;
    notes?: string;
  }): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/camps/room-allocations/${allocationId}`, { data });
    return response.data.data;
  },
  
  deallocateRoom: async (allocationId: string): Promise<void> => {
    await api.delete(`/camps/room-allocations/${allocationId}`);
  },
};

/**
 * Food API
 */
export const foodApi = {
  getCampFoods: async (campId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/foods`);
    return response.data.data;
  },
  
  createFood: async (campId: string, data: {
    name: string;
    quantity: number;
    vendor: string;
    date: string;
    category: 'lunch' | 'supper' | 'snacks' | 'breakfast';
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/foods`, { data });
    return response.data.data;
  },
  
  updateFood: async (foodId: string, data: any): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/camps/foods/${foodId}`, { data });
    return response.data.data;
  },
  
  deleteFood: async (foodId: string): Promise<void> => {
    await api.delete(`/camps/foods/${foodId}`);
  },
};

/**
 * Food Allocations API
 */
export const foodAllocationsApi = {
  getCampFoodAllocations: async (campId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/camps/${campId}/food-allocations`);
    return response.data.data;
  },
  
  allocateFood: async (campId: string, data: {
    food_id: string;
    registration_id: string;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/camps/${campId}/food-allocations`, { data });
    return response.data.data;
  },
  
  bulkAllocateFood: async (campId: string, data: {
    food_id: string;
    registration_ids: string[];
    category_id?: string;
  }): Promise<any[]> => {
    const response = await api.post<ApiResponse<any[]>>(`/camps/${campId}/food-allocations/bulk`, { data });
    return response.data.data;
  },
  
  getFoodAllocation: async (allocationId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/camps/food-allocations/${allocationId}`);
    return response.data.data;
  },
  
  deleteFoodAllocation: async (allocationId: string): Promise<void> => {
    await api.delete(`/camps/food-allocations/${allocationId}`);
  },
};

// Camper QR Code API - using existing registration endpoint
export const camperApi = {
  getCamperQRData: async (registrationId: string): Promise<Registration> => {
    return registrationsApi.getRegistration(registrationId);
  },
};

// Error handler utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.data?.message || error.response?.data?.message;
    if (message) return message;
    
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Please check your input and try again.';
      case 500:
        return 'Something went wrong. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred.';
};

export default api;
