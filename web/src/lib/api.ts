// API Client for BaseAPI Hotels Backend

const API_BASE_URL = 'http://localhost:6953';

interface ApiResponse<T> {
  data: T;
}

interface ErrorResponse {
  error: string;
  requestId: string;
  errors?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadSessionId();
  }

  private loadSessionId(): void {
    this.sessionId = localStorage.getItem('BASEAPISESSID');
  }

  private saveSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    localStorage.setItem('BASEAPISESSID', sessionId);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add session cookie if available
    if (this.sessionId) {
      headers['Cookie'] = `BASEAPISESSID=${this.sessionId}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    const response = await fetch(url, config);

    // Extract session ID from Set-Cookie header if present
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) {
      const sessionMatch = setCookie.match(/BASEAPISESSID=([^;]+)/);
      if (sessionMatch) {
        this.saveSessionId(sessionMatch[1]);
      }
    }

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Auth endpoints
  async signup(name: string, email: string, password: string) {
    return this.post('/auth/signup', { name, email, password });
  }

  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getMe() {
    return this.get('/me');
  }

  // Search endpoints
  async createSearch(params: {
    location_id: string;
    starts_on: string;
    ends_on: string;
    capacity: number;
  }): Promise<ApiResponse<{ search_id: string }>> {
    return this.post('/search', params);
  }

  async getSearch(searchId: string): Promise<ApiResponse<SearchResult>> {
    return this.get(`/search/${searchId}`);
  }
}

// Types based on API responses
export interface Hotel {
  id: string;
  title: string;
  description: string;
  location_id: string;
  star_rating: number;
  created_at: string;
  updated_at: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  hotel_id: string;
  category: string;
  description: string;
  capacity: number;
  created_at: string;
  updated_at: string;
  offers: Offer[];
}

export interface Offer {
  id: string;
  room_id: string;
  price: number;
  discount: number;
  effective_price: number;
  availability: number;
  starts_on: string;
  ends_on: string;
  created_at: string;
  updated_at: string;
}

export interface Search {
  id: string;
  user_id: string;
  location_id: string;
  starts_on: string;
  ends_on: string;
  capacity: number;
  status: string;
  results: number;
}

export interface SearchResult {
  search: Search;
  hotels: Hotel[];
}

export const apiClient = new ApiClient();
