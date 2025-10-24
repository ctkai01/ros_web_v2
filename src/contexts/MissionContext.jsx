import React, { createContext, useContext, useState, useEffect } from 'react';
import { SERVER_URL } from '../config/serverConfig';

const MissionContext = createContext();

export const useMissionContext = () => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMissionContext must be used within a MissionProvider');
  }
  return context;
};

export const MissionProvider = ({ children }) => {
  const [missionStatus, setMissionStatus] = useState('IDLE');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);

  // Load mission status from server
  const loadMissionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('MissionContext: No token found');
        return;
      }

      const response = await fetch(`${SERVER_URL}/api/robot/mission-state`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const status = result.data.status;
        setMissionStatus(status);
        
        // If mission is running, get current mission details
        if (status === 'RUNNING' || status === 'PAUSED') {
          await loadCurrentMission();
        } else {
          setCurrentMission(null);
        }
      }
    } catch (error) {
      console.error('MissionContext: Error loading mission status:', error);
    }
  };

  // Load current mission details
  const loadCurrentMission = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${SERVER_URL}/api/missions/queue/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.missions && result.data.missions.length > 0) {
        // Get the first mission in queue (currently executing)
        // Status: 0=Pending, 1=Running, 2=Paused, 3=Completed, 4=Failed, 5=Cancelled
        const executingMission = result.data.missions.find(mission => 
          mission.status === 1 || mission.status === 2
        );
        
        if (executingMission) {
          setCurrentMission(executingMission);
        }
      }
    } catch (error) {
      console.error('MissionContext: Error loading current mission:', error);
    }
  };

  // Send mission command
  const sendMissionCommand = async (command) => {
    if (isLoading) return false;
    
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      let endpoint = '';
      
      switch (command) {
        case 'START':
          endpoint = '/api/robot/start-mission';
          break;
        case 'PAUSE':
          endpoint = '/api/robot/pause-mission';
          break;
        case 'RESUME':
          endpoint = '/api/robot/resume-mission';
          break;
        default:
          console.warn('MissionContext: Unknown command:', command);
          setIsLoading(false);
          return false;
      }

      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('MissionContext: Mission command sent successfully:', result.data);
        
        // Update UI immediately for pause/resume
        if (command === 'PAUSE') {
          setMissionStatus('PAUSED');
        } else if (command === 'RESUME') {
          setMissionStatus('RUNNING');
        } else if (command === 'START') {
          // Reload status after start command
          setTimeout(() => {
            loadMissionStatus();
          }, 1000);
        }
        return true;
      } else {
        console.error('MissionContext: Mission command failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('MissionContext: Error sending mission command:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial status on mount
  useEffect(() => {
    loadMissionStatus();
  }, []);

  const value = {
    missionStatus,
    isLoading,
    currentMission,
    loadMissionStatus,
    sendMissionCommand
  };

  return (
    <MissionContext.Provider value={value}>
      {children}
    </MissionContext.Provider>
  );
}; 