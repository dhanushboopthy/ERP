import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || '');

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.instance.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Try to refresh token first
          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refreshToken');
            
            // Only try refresh if we have a refresh token and not already retrying
            if (refreshToken && !originalRequest.url?.includes('/api/auth/refresh')) {
              try {
                originalRequest._retry = true;
                
                // Call refresh endpoint
                const response = await axios.post(`${API_BASE_URL}${endpoints.auth.refresh}`, {
                  refreshToken,
                });
                
                if (response.data?.success && response.data?.data) {
                  const { token, refreshToken: newRefreshToken, user } = response.data.data;
                  localStorage.setItem('token', token);
                  localStorage.setItem('refreshToken', newRefreshToken);
                  if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                  }
                  
                  // Retry the original request with new token
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                  }
                  return this.instance(originalRequest);
                }
              } catch (refreshError) {
                // Refresh failed, logout user
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
              }
            }
            
            // No refresh token or refresh endpoint call, logout
            console.warn('No refresh token available or refresh call failed, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Avoid redirect loop when already on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError<T>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Check if response data is a valid API response object
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        const data = axiosError.response.data as unknown as Record<string, unknown>;
        
        // Handle ASP.NET ValidationProblemDetails format: { title, errors: { field: [msgs] } }
        if ('errors' in data && data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          const validationErrors = data.errors as Record<string, string[]>;
          const flatErrors = Object.values(validationErrors).flat();
          return {
            success: false,
            message: (data.title as string) || 'Validation failed',
            errors: flatErrors,
          } as ApiResponse<T>;
        }
        
        // Verify it has the expected shape (success property)
        if ('success' in data || 'message' in data || 'errors' in data) {
          return data as unknown as ApiResponse<T>;
        }
      }
      
      // Handle non-JSON responses (HTML error pages, plain text, etc.)
      const statusCode = axiosError.response?.status;
      const statusText = axiosError.response?.statusText || axiosError.message;
      
      let message = 'An error occurred';
      if (statusCode === 404) {
        message = 'The requested resource was not found';
      } else if (statusCode === 500) {
        message = 'Internal server error. Please try again later.';
      } else if (statusCode === 503) {
        message = 'Service temporarily unavailable. Please try again later.';
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the server is running.';
      } else if (statusCode) {
        message = `Server error (${statusCode}): ${statusText}`;
      } else {
        message = axiosError.message || 'Network error occurred';
      }
      
      return {
        success: false,
        message,
        errors: [message],
      };
    }
    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: ['Unknown error'],
    };
  }

  // Download file helper
  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await this.instance.get(url, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;

// API Endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    changePassword: '/api/auth/change-password',
  },
  
  // Masters
  parties: '/api/parties',
  yarnCounts: '/api/yarncounts',
  loomTypes: '/api/loomtypes',
  beams: '/api/beams',
  vehicles: '/api/vehicles',
  
  // Sizing ERP
  yarnReceipts: '/api/yarnreceipts',
  babyCones: '/api/babycones',
  warpingJobCards: '/api/warpingjobcards',
  sizingJobCards: '/api/sizingjobcards',
  yarnReturns: '/api/yarnreturns',
  yarnDeliveries: '/api/yarndeliveries',
  taxInvoices: '/api/taxinvoices',
  
  // Dashboard
  dashboard: {
    stats: '/api/dashboard/stats',
    yarnStock: '/api/dashboard/yarn-stock',
    executive: '/api/dashboard/executive',
  },
  
  // Reports
  reports: {
    yarnStock: '/api/reports/yarn-stock',
    setWiseProduction: '/api/reports/set-wise-production',
    beamUtilization: '/api/reports/beam-utilization',
    partyLedger: '/api/reports/party-ledger',
    invoiceRegister: '/api/reports/invoice-register',
    pendingInvoices: '/api/reports/pending-invoices',
  },
  
  // Users
  users: '/api/users',
  roles: '/api/roles',
  
  // Notifications
  notifications: '/api/notifications',
};

// API Service functions
export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    apiClient.post<{ token: string; refreshToken: string; user: { id: number; username: string; email: string; fullName: string; roleName: string; permissions: string[] } }>(endpoints.auth.login, data),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post(endpoints.auth.refresh, { refreshToken }),
  
  getCurrentUser: () =>
    apiClient.get(endpoints.auth.me),
  
  // Parties
  getParties: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.parties, { params }),
  
  getPartyLookup: (partyType?: string) =>
    apiClient.get(`${endpoints.parties}/lookup`, { params: { partyType } }),
  
  getParty: (id: number) =>
    apiClient.get(`${endpoints.parties}/${id}`),
  
  createParty: (data: unknown) =>
    apiClient.post(endpoints.parties, data),
  
  updateParty: (id: number, data: unknown) =>
    apiClient.put(`${endpoints.parties}/${id}`, data),
  
  deleteParty: (id: number) =>
    apiClient.delete(`${endpoints.parties}/${id}`),
  
  // Yarn Counts
  getYarnCounts: () =>
    apiClient.get(endpoints.yarnCounts),
  
  // Beams
  getBeams: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.beams, { params }),
  
  getAvailableBeams: (beamType: string) =>
    apiClient.get(`${endpoints.beams}/available/${beamType}`),
  
  // Vehicles
  getVehicles: () =>
    apiClient.get(endpoints.vehicles),
  
  // Yarn Receipts
  getYarnReceipts: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.yarnReceipts, { params }),
  
  getYarnReceipt: (id: number) =>
    apiClient.get(`${endpoints.yarnReceipts}/${id}`),
  
  createYarnReceipt: (data: unknown) =>
    apiClient.post(endpoints.yarnReceipts, data),
  
  updateYarnReceipt: (id: number, data: unknown) =>
    apiClient.put(`${endpoints.yarnReceipts}/${id}`, data),

  generateYarnReceiptSampleData: () =>
    apiClient.post(`${endpoints.yarnReceipts}/sample`, {}),
  
  // Warping Job Cards
  getWarpingJobCards: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.warpingJobCards, { params }),
  
  getWarpingJobCard: (id: number) =>
    apiClient.get(`${endpoints.warpingJobCards}/${id}`),
  
  createWarpingJobCard: (data: unknown) =>
    apiClient.post(endpoints.warpingJobCards, data),
  
  completeWarpingJobCard: (id: number, actualLength: number) =>
    apiClient.post(`${endpoints.warpingJobCards}/${id}/complete`, actualLength),
  
  // Sizing Job Cards
  getSizingJobCards: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.sizingJobCards, { params }),
  
  getSizingJobCard: (id: number) =>
    apiClient.get(`${endpoints.sizingJobCards}/${id}`),
  
  createSizingJobCard: (data: unknown) =>
    apiClient.post(endpoints.sizingJobCards, data),
  
  completeSizingJobCard: (id: number, data: unknown) =>
    apiClient.post(`${endpoints.sizingJobCards}/${id}/complete`, data),
  
  approveSizingJobCard: (id: number, data: { approvalLevel: string; remarks?: string }) =>
    apiClient.post(`${endpoints.sizingJobCards}/${id}/approve`, data),
  
  getPendingSizingForInvoice: (partyId?: number) =>
    apiClient.get(`${endpoints.sizingJobCards}/pending-invoice`, { params: { partyId } }),
  
  // Tax Invoices
  getTaxInvoices: (params?: Record<string, unknown>) =>
    apiClient.get(endpoints.taxInvoices, { params }),
  
  getTaxInvoice: (id: number) =>
    apiClient.get(`${endpoints.taxInvoices}/${id}`),
  
  createTaxInvoice: (data: unknown) =>
    apiClient.post(endpoints.taxInvoices, data),
  
  finalizeTaxInvoice: (id: number) =>
    apiClient.post(`${endpoints.taxInvoices}/${id}/finalize`),
  
  cancelTaxInvoice: (id: number, reason: string) =>
    apiClient.post(`${endpoints.taxInvoices}/${id}/cancel`, reason),
  
  // Dashboard
  getDashboardStats: (financialYearId?: number) =>
    apiClient.get(endpoints.dashboard.stats, { params: { financialYearId } }),
  
  getYarnStock: (partyId?: number, yarnCountId?: number) =>
    apiClient.get(endpoints.dashboard.yarnStock, { params: { partyId, yarnCountId } }),
};
