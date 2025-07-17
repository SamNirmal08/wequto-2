// API Client for Serenity Dashboard
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = localStorage.getItem('serenity-token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('serenity-token', token);
    } else {
      localStorage.removeItem('serenity-token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Todo methods
  async getTodos() {
    return this.request('/todos');
  }

  async createTodo(todoData) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  }

  async updateTodo(id, updates) {
    return this.request(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTodo(id) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async getTodoStats() {
    return this.request('/todos/stats');
  }

  // Weather methods
  async getWeather(city) {
    return this.request(`/weather/${encodeURIComponent(city)}`);
  }

  async getWeatherForecast(city) {
    return this.request(`/weather/${encodeURIComponent(city)}/forecast`);
  }

  // Quote methods
  async getRandomQuote() {
    return this.request('/quotes/random');
  }

  async getAllQuotes() {
    return this.request('/quotes');
  }

  // User methods
  async updatePreferences(preferences) {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create global instance
const apiClient = new ApiClient();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}