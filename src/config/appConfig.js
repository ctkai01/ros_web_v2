// Client configuration that reads from root config.json
let config = {
  domain: 'ntu-amr-1.local',
  server: { port: 3000, host: '0.0.0.0' },
  client: { port: 8080, host: '0.0.0.0' },
  websocket: { port: 8081, host: '0.0.0.0' },
  ros: { port: 8080, host: '0.0.0.0' }
};

// Try to load config from root config.json
const loadConfig = async () => {
  try {
    const response = await fetch('/config.json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const loadedConfig = await response.json();
      console.log('Loaded config from /config.json:', loadedConfig)
      config = { ...config, ...loadedConfig }; // Merge with fallback
    }
  } catch (error) {
    console.warn('Could not load config.json, using fallback config');
  }
};

// Initialize config (non-blocking)
loadConfig();

// Generate URLs based on current environment
const getUrls = () => {
  // Ensure config has all required properties
  const safeConfig = {
    domain: config.domain || 'ntu-amr-1.local',
    server: { port: config.server?.port || 3000, host: config.server?.host || '0.0.0.0' },
    client: { port: config.client?.port || 8080, host: config.client?.host || '0.0.0.0' },
    websocket: { port: config.websocket?.port || 8081, host: config.websocket?.host || '0.0.0.0' },
    ros: { port: config.ros?.port || 8080, host: config.ros?.host || '0.0.0.0' }
  };
  
  const domain = safeConfig.domain;
  const isDev = typeof window !== 'undefined' && window.location.port === '8080';
  
  if (isDev) {
    // Development mode - use current hostname for API, domain for WebSocket
    const currentHost = window.location.hostname;
    return {
      serverUrl: `http://${currentHost}:${safeConfig.server.port}`,
      wsUrl: `ws://${domain}:${safeConfig.websocket.port}`,
      rosUrl: `ws://${domain}:${safeConfig.ros.port}`
    };
  } else {
    // Production mode - use domain for everything
    return {
      serverUrl: `http://${domain}:${safeConfig.server.port}`,
      wsUrl: `ws://${domain}:${safeConfig.websocket.port}`,
      rosUrl: `ws://${domain}:${safeConfig.ros.port}`
    };
  }
};

// Get current configuration
const getConfig = () => {
  return {
    domain: config.domain || 'ntu-amr-1.local',
    server: { port: config.server?.port || 3000, host: config.server?.host || '0.0.0.0' },
    client: { port: config.client?.port || 8080, host: config.client?.host || '0.0.0.0' },
    websocket: { port: config.websocket?.port || 8081, host: config.websocket?.host || '0.0.0.0' },
    ros: { port: config.ros?.port || 8080, host: config.ros?.host || '0.0.0.0' }
  };
};

// Check if running on remote access
const isRemoteAccess = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && 
         hostname !== '127.0.0.1' && 
         !hostname.startsWith('192.168.');
};

export { getUrls, getConfig, isRemoteAccess };
export default config;
