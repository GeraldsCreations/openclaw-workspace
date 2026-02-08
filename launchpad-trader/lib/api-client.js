/**
 * LaunchPad API Client
 * Handles all HTTP communication with the LaunchPad backend
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_BASE_URL = 'https://launchpad-backend-production-e95b.up.railway.app';
const API_VERSION = 'v1';

class LaunchPadAPIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || API_BASE_URL;
    this.authToken = options.authToken || null;
    
    // Create axios instance with retry logic
    this.client = axios.create({
      baseURL: `${this.baseURL}/${API_VERSION}`,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure automatic retries for transient failures
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors and 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status >= 500 && error.response?.status < 600);
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Handle rate limiting
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.data?.retryAfter || 60;
          console.warn(`⚠️  Rate limited. Retry after ${retryAfter} seconds.`);
          error.retryAfter = retryAfter;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate with wallet signature
   * @param {string} walletAddress - Solana wallet address
   * @param {string} signature - Signed message (base58)
   * @param {string} message - Original message that was signed
   * @returns {Promise<{token: string, user: object}>}
   */
  async authenticateWallet(walletAddress, signature, message) {
    try {
      const response = await this.client.post('/auth/wallet', {
        walletAddress,
        signature,
        message,
      });

      if (response.data.token) {
        this.setAuthToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Wallet authentication failed');
    }
  }

  // ==================== TOKENS ====================

  /**
   * Get all tokens
   * @param {object} options - Query options
   * @param {number} options.limit - Max results (default: 100)
   * @param {number} options.offset - Pagination offset
   * @returns {Promise<{tokens: array, total: number}>}
   */
  async getTokens(options = {}) {
    try {
      const response = await this.client.get('/tokens', {
        params: {
          limit: options.limit || 100,
          offset: options.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch tokens');
    }
  }

  /**
   * Get token by mint address
   * @param {string} mintAddress - Token mint address
   * @returns {Promise<{token: object}>}
   */
  async getToken(mintAddress) {
    try {
      const response = await this.client.get(`/tokens/${mintAddress}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error, `Failed to fetch token ${mintAddress}`);
    }
  }

  /**
   * Create new token (requires authentication)
   * @param {object} tokenData - Token creation parameters
   * @param {string} tokenData.name - Token name
   * @param {string} tokenData.symbol - Token symbol
   * @param {string} tokenData.description - Token description
   * @param {string} tokenData.imageUrl - Token image URL
   * @param {number} tokenData.initialMarketCap - Initial market cap
   * @param {number} tokenData.migrationMarketCap - Migration threshold
   * @param {object} tokenData.metadata - Additional metadata (website, twitter, telegram)
   * @returns {Promise<{success: boolean, token: object}>}
   */
  async createToken(tokenData) {
    this._requireAuth();
    try {
      const response = await this.client.post('/tokens/create', tokenData);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Token creation failed');
    }
  }

  // ==================== TRADING ====================

  /**
   * Buy tokens
   * @param {string} tokenMint - Token mint address
   * @param {number} amountSol - Amount of SOL to spend
   * @param {number} slippage - Slippage tolerance (default: 0.5)
   * @returns {Promise<{success: boolean, transaction: object}>}
   */
  async buyToken(tokenMint, amountSol, slippage = 0.5) {
    this._requireAuth();
    try {
      const response = await this.client.post('/trading/buy', {
        tokenMint,
        amountSol,
        slippage,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Buy transaction failed');
    }
  }

  /**
   * Sell tokens
   * @param {string} tokenMint - Token mint address
   * @param {number} amountTokens - Amount of tokens to sell
   * @param {number} slippage - Slippage tolerance (default: 0.5)
   * @returns {Promise<{success: boolean, transaction: object}>}
   */
  async sellToken(tokenMint, amountTokens, slippage = 0.5) {
    this._requireAuth();
    try {
      const response = await this.client.post('/trading/sell', {
        tokenMint,
        amountTokens,
        slippage,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Sell transaction failed');
    }
  }

  /**
   * Get trading quote
   * @param {string} tokenMint - Token mint address
   * @param {object} options - Quote options
   * @param {number} options.amountSol - SOL amount for buy quote
   * @param {number} options.amountTokens - Token amount for sell quote
   * @param {number} options.slippage - Slippage tolerance
   * @returns {Promise<{quote: object}>}
   */
  async getQuote(tokenMint, options = {}) {
    try {
      const response = await this.client.get('/trading/quote', {
        params: {
          tokenMint,
          ...options,
        },
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to get quote');
    }
  }

  // ==================== REWARDS ====================

  /**
   * Check claimable rewards
   * @param {string} walletAddress - Wallet address to check
   * @returns {Promise<{rewards: object}>}
   */
  async checkRewards(walletAddress) {
    try {
      const response = await this.client.get(`/rewards/check/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to check rewards');
    }
  }

  /**
   * Claim rewards
   * @param {string} tokenMint - Token mint to claim rewards from
   * @returns {Promise<{success: boolean, transaction: object}>}
   */
  async claimRewards(tokenMint) {
    this._requireAuth();
    try {
      const response = await this.client.post('/rewards/claim', { tokenMint });
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to claim rewards');
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get platform overview
   * @returns {Promise<{analytics: object}>}
   */
  async getOverview() {
    try {
      const response = await this.client.get('/analytics/overview');
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch analytics overview');
    }
  }

  /**
   * Get token analytics
   * @param {string} mintAddress - Token mint address
   * @returns {Promise<{analytics: object}>}
   */
  async getTokenAnalytics(mintAddress) {
    try {
      const response = await this.client.get(`/analytics/token/${mintAddress}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error, `Failed to fetch analytics for ${mintAddress}`);
    }
  }

  // ==================== PRIVATE HELPERS ====================

  _requireAuth() {
    if (!this.authToken) {
      throw new Error('Authentication required. Please authenticate with wallet first.');
    }
  }

  _handleError(error, message) {
    if (error.response) {
      // API returned error response
      const apiError = new Error(
        `${message}: ${error.response.data?.message || error.response.data?.error || error.message}`
      );
      apiError.statusCode = error.response.status;
      apiError.data = error.response.data;
      apiError.retryAfter = error.retryAfter;
      return apiError;
    } else if (error.request) {
      // No response received
      return new Error(`${message}: Network error - no response from server`);
    } else {
      // Other error
      return new Error(`${message}: ${error.message}`);
    }
  }
}

export default LaunchPadAPIClient;
