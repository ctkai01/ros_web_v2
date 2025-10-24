import React, { useEffect, useRef } from 'react';
import serverConfig from '../config/serverConfig';

// Singleton WebSocket Manager
class MissionQueueWebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.missionLogs = [];
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.disconnectTimer = null; // <-- THÊM MỚI: Timer để trì hoãn việc ngắt kết nối

  }

  addListener(listener) {
    // CẢI TIẾN: Hủy bỏ mọi lịch trình ngắt kết nối đang chờ
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('MissionQueueWebSocketManager: Error notifying listener:', error);
      }
    });
  }

  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    // Close existing connection if it exists
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = true;

    try {
      // Activate server subscriber first
      await this.activateSubscriber();

      // Initialize WebSocket connection
      this.ws = new WebSocket(serverConfig.WS_URL);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('MissionQueueWebSocketManager: Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('MissionQueueWebSocketManager: WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;

        this.ws = null;

        if (event.code !== 1000 && this.listeners.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`WebSocket closed. Attempting to reconnect in 2 seconds... (Attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), 2000);
        } else {
          console.log("WebSocket connection closed permanently or no listeners remaining.");
        }
      };

    } catch (error) {
      console.error('MissionQueueWebSocketManager: Error connecting:', error);
      this.isConnecting = false;
    }
  }

  handleMessage(message) {
    // Handle mission queue added
    if (message.type === 'mission_queue_added') {
      const added = message.data;

      const formattedData = {
        type: 'mission_queue_added',
        data: {
          queueId: added.id || Date.now(),
          missionId: added.execution_id,
          missionName: added.mission_name,
          name: added.mission_name,
          description: `Mission ${added.mission_name} added to queue`,
          priority: added.priority || 1,
          estimatedDuration: 120,
          status: added.status || 0, // PENDING
          executionUUID: added.execution_id,
          queuedAt: added.timestamp || new Date().toISOString(),
          remainingTime: null
        }
      };

      this.notifyListeners(formattedData);
    }

    // Handle mission queue status updates
    if (message.type === 'mission_queue_status') {
      const statusUpdate = message.data;

      this.notifyListeners({
        type: 'mission_queue_status_update',
        execution_id: statusUpdate.execution_id,
        mission_name: statusUpdate.mission_name,
        status: statusUpdate.status,
        statusName: statusUpdate.statusName,
        timestamp: statusUpdate.timestamp
      });
    }

    // Handle mission logs
    if (message.type === 'missionLog') {
      const logEntry = message.data;

      // Add to mission logs array
      this.missionLogs.push({
        ...logEntry,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
      });

      // Keep only last 100 logs
      if (this.missionLogs.length > 100) {
        this.missionLogs = this.missionLogs.slice(-100);
      }

      this.notifyListeners({
        type: 'mission_log_update',
        logEntry: logEntry,
        allLogs: [...this.missionLogs],
        timestamp: new Date().toISOString()
      });
    }
  }

  async activateSubscriber() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/added/subscriber/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('MissionQueueWebSocketManager: Failed to activate server subscriber');
      }
    } catch (error) {
      console.error('MissionQueueWebSocketManager: Error activating server subscriber:', error);
    }
  }

  async loadInitialData() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.notifyListeners(result.data);
      }
    } catch (error) {
      console.error('MissionQueueWebSocketManager: Error loading initial queue data:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.listeners.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }
}

// Singleton instance
const missionQueueWebSocketManager = new MissionQueueWebSocketManager();

const MissionQueueStatusIndicator = ({
  onQueueUpdate = null,
  onMissionUpdate = null
}) => {
  const listenerRef = useRef(null);

  useEffect(() => {
    // Create listener function
    const listener = (data) => {
      if (data.type === 'mission_queue_added' || !data.type) {
        // Queue data update
        if (onQueueUpdate) {
          onQueueUpdate(data);
        }
      } else {
        // Mission update (status, logs, etc.)
        if (onMissionUpdate) {
          onMissionUpdate(data);
        }
      }
    };

    listenerRef.current = listener;

    // Add listener to manager
    missionQueueWebSocketManager.addListener(listener);

    // Connect if not already connected
    if (missionQueueWebSocketManager.listeners.size === 1) {
      // First listener, load initial data and connect
      missionQueueWebSocketManager.loadInitialData();
      // Use setTimeout to ensure proper cleanup before connecting
      setTimeout(() => {
        missionQueueWebSocketManager.connect();
      }, 100);
    }

    // Cleanup function
    return () => {
      if (listenerRef.current) {
        missionQueueWebSocketManager.removeListener(listenerRef.current);

        // CẢI TIẾN: Trì hoãn việc ngắt kết nối
        if (missionQueueWebSocketManager.listeners.size === 0) {
          // Nếu không còn listener nào, lên lịch ngắt kết nối sau 1 giây
          missionQueueWebSocketManager.disconnectTimer = setTimeout(() => {
            console.log("No listeners for 1 second, disconnecting WebSocket.");
            missionQueueWebSocketManager.disconnect();
          }, 1000); // 1 giây
        }
      }
    };
  }, [onQueueUpdate, onMissionUpdate]);

  // Không render gì cả, chỉ là bridge để gửi data
  return null;
};

export default MissionQueueStatusIndicator; 