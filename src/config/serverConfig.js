import { getUrls, getConfig, isRemoteAccess } from './appConfig';

const getBrowserProtocol = () => (typeof window !== 'undefined' ? window.location.protocol : 'http:');
const getWsProtocol = () => (getBrowserProtocol() === 'https:' ? 'wss:' : 'ws:');

const serverConfig = {
  // Get configuration from centralized config
  get SERVER_IP() {
    return getConfig().domain;
  },
  
  get SERVER_PORT() {
    return getConfig().server.port;
  },
  
  get WS_PORT() {
    return getConfig().websocket.port;
  },
  
  get ROS_WS_PORT() {
    return getConfig().ros.port;
  },

  // API endpoints
  get SERVER_URL() {
    const urls = getUrls();
    return urls.serverUrl;
  },

  get WS_URL() {
    const urls = getUrls();
    return urls.wsUrl;
  },

  // Authentication endpoints
  get LOGIN_URL() {
    return `${this.SERVER_URL}/api/auth/login`;
  },

  // Hardware monitoring endpoints
  get BATTERY_INFO_URL() {
    return `${this.SERVER_URL}/api/monitoring/battery-info`;
  },
  get COMPUTER_INFO_URL() {
    return `${this.SERVER_URL}/api/monitoring/computer-info`;
  },
  get MOTORS_INFO_URL() {
    return `${this.SERVER_URL}/api/monitoring/motors-info`;
  },
  get SENSORS_INFO_URL() {
    return `${this.SERVER_URL}/api/monitoring/sensors-info`;
  },
  get SELF_INPUTS_INFO_URL() {
    return `${this.SERVER_URL}/api/monitoring/self-inputs-info`;
  },

  // Settings endpoints
  get ROBOT_FOOTPRINT_URL() {
    return `${this.SERVER_URL}/api/settings/footprint`;
  },

  // Joystick endpoints
  get JOYSTICK_MESSAGE_URL() {
    return `${this.SERVER_URL}/api/joystick/message`;
  },
  get JOYSTICK_SEND_MESSAGE_URL() {
    return `${this.SERVER_URL}/api/joystick/send-message`;
  },
};

const SERVER_URL = serverConfig.SERVER_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for API calls with retry
const apiCallWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  try {
    const { method = 'GET', body, data, headers = {} } = options;

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }

    // Use body if provided, otherwise use data
    const requestBody = body || data;

    const response = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...headers
      },
      ...(requestBody ? {
        body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      } : {}),
      credentials: 'same-origin'
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear(); // Clear all auth data
        window.location.href = '/login'; // Redirect to login
        throw new Error('Authentication expired. Please login again.');
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    if (retries > 0 && error.message !== 'Authentication required') {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return apiCallWithRetry(url, options, retries - 1);
    }
    console.error('API call error after retries:', error);
    throw error;
  }
};

export { SERVER_URL, apiCallWithRetry };
export const WS_URL = serverConfig.WS_URL;

export default serverConfig; 