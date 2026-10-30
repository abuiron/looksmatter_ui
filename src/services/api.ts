// API service for backend communication
// Set VITE_API_BASE_URL (see .env.example) to use another backend; keep the /api suffix.
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'https://looksmatter-bc.onrender.com/api';
// The server that hosts /uploads, used to turn relative upload paths into full URLs.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/** Parsed error body, e.g. { message, code } from the backend. */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

/** Thrown for non-2xx responses; keeps the HTTP status and the parsed response body. */
export class ApiError extends Error {
  status: number;
  data: ApiErrorBody;

  constructor(message: string, status: number, data: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status, error);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginCredentials) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async register(data: RegisterData) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async getProfile() {
    return this.request<any>('/users/me');
  }

  async updateProfile(data: any) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // The backend changes the password on the profile route when both fields are sent.
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Products
  async getProducts(params?: { q?: string; category?: string; page?: number; limit?: number }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<any>(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bulk import — sends the whole array in one request.
  // Returns { importedCount, failedCount, errors, items }.
  async bulkCreateProducts(products: any[]) {
    return this.request<any>('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Favorites
  async getFavorites() {
    return this.request<any>('/users/favorites');
  }

  async addFavorite(productId: string) {
    return this.request<any>(`/users/favorites/${productId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(productId: string) {
    return this.request<any>(`/users/favorites/${productId}`, {
      method: 'DELETE',
    });
  }

  // Cart
  async getCart() {
    return this.request<any>('/users/cart');
  }

  async addToCart(productId: string, qty: number = 1, size: string = '') {
    return this.request<any>('/users/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, qty, size }),
    });
  }

  async updateCartItem(productId: string, qty: number, size: string = '') {
    return this.request<any>(`/users/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ qty, size }),
    });
  }

  async removeFromCart(productId: string, size: string = '') {
    const query = size ? `?size=${encodeURIComponent(size)}` : '';
    return this.request<any>(`/users/cart/${productId}${query}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<any>('/users/cart', {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders() {
    return this.request<any>('/orders/my');
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<any>(`/orders/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateDeliveryDate(id: string, estimatedDeliveryDate: string) {
    return this.request<any>(`/orders/admin/${id}/delivery-date`, {
      method: 'PUT',
      body: JSON.stringify({ estimatedDeliveryDate }),
    });
  }

  async deleteOrder(id: string, message: string) {
    return this.request<any>(`/orders/admin/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ message }),
    });
  }

  async confirmOrderDeletion(id: string) {
    return this.request<any>(`/orders/${id}/confirm`, {
      method: 'DELETE',
    });
  }

  async cancelOrder(id: string) {
    return this.request<any>(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    return this.request<any>(`/orders/admin/${id}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus }),
    });
  }

  // Admin - Users
  async getAllUsers(params?: { page?: number; limit?: number; q?: string }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<any>(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  // Admin - Orders
  async getAllOrders(params?: { page?: number; limit?: number; status?: string; q?: string; startDate?: string; endDate?: string }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<any>(`/orders/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  // PaymentGateway Payment
  async initiatePayment(data: {
    orderId: string;
    amount: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone: string;
    userIP?: string;
  }) {
    return this.request<any>('/payment/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkPaymentStatus(txnRefId: string, orderData?: any) {
    return this.request<any>('/payment/status', {
      method: 'POST',
      body: JSON.stringify({ txnRefId, orderData }),
    });
  }

  async updateOrderPayment(orderId: string, paymentData: {
    txnRefId: string;
    paymentIntentId: string;
    paymentStatus: string;
  }) {
    return this.request<any>(`/payment/update-order/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  // Reports
  async createReport(data: {
    orderId: string;
    type: 'order_issue' | 'payment_issue';
    subject: string;
    notes: string;
    image?: string;
  }) {
    return this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyReports() {
    return this.request<any>('/reports/my');
  }

  async getAllReports(params?: { status?: string; type?: string }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<any>(`/reports/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  async getReport(id: string) {
    return this.request<any>(`/reports/${id}`);
  }

  async updateReportStatus(id: string, status: string, adminNotes?: string) {
    return this.request<any>(`/reports/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  }

  async getReportStats() {
    return this.request<any>('/reports/admin/stats');
  }

  // Image Upload
  async uploadImage(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    // The server answers with a path such as "/uploads/x.jpg"; make it absolute so
    // it still resolves when the storefront is served from a different origin.
    const data = await response.json();
    if (typeof data?.url === 'string' && data.url.startsWith('/')) {
      data.url = `${API_ORIGIN}${data.url}`;
    }
    return data;
  }

  // Admin - User Order Statistics
  async getUserOrderStats(userId: string) {
    return this.request<any>(`/users/${userId}/orders`);
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiService();
export default api;
