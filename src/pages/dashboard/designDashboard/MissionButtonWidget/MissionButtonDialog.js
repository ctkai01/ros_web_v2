import React, { useState, useEffect } from 'react';
import serverConfig from '../../../../config/serverConfig';
import './MissionButtonDialog.css';

const MissionButtonDialog = ({ isOpen, onClose, onSave, onDelete, widget }) => {
  const [missions, setMissions] = useState([]);
  const currentMissionId = widget ? widget.settings.missionId : null;

  const [selectedMissionId, setSelectedMissionId] = useState(currentMissionId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMissions();
      setSelectedMissionId(currentMissionId || '');
    }
  }, [isOpen, currentMissionId]);

  const getCurrentSiteId = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      // Tham khảo từ EditMaps.js - lấy current site ID
      const response = await fetch(`${serverConfig.SERVER_URL}/api/maps/getCurrentSiteId`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('getCurrentSiteId HTTP error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('getCurrentSiteId data', data);
      
      if (data.success && data.data) {
        return data.data; // API trả về trực tiếp site ID
      } else {
        return null;
      }
    } catch (error) {
      console.error('getCurrentSiteId: Error getting current site id:', error);
      return null;
    }
  };

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      // Lấy current site ID trước
      const currentSiteId = await getCurrentSiteId();
      
      if (!currentSiteId) {
        console.warn('No current site ID found, using fallback data');
        throw new Error('No site ID available');
      }

      console.log('Fetching missions for site ID:', currentSiteId);

      // Sử dụng API mới theo site ID
      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/site/${currentSiteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Missions data for site ID', currentSiteId, ':', data);
        
        if (Array.isArray(data)) {
          // Convert format để match với expected format
          const formattedMissions = data.map(mission => ({
            id: mission.ID,
            name: mission.missionName,
            groupId: mission.groupID,
            data: mission.data,
            siteId: mission.IDSite
          }));
          
          console.log('Formatted missions for site ID', currentSiteId, ':', formattedMissions);
          setMissions(formattedMissions);
        } else {
          throw new Error('Invalid missions data format');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch missions:', response.status, errorText);
        throw new Error(`Failed to fetch missions: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
      // Fallback với mock data khi có lỗi
      setMissions([
        { id: 1, name: 'Mission A' },
        { id: 2, name: 'Mission B' },
        { id: 3, name: 'Mission C' },
        { id: 4, name: 'Go to Station 1' },
        { id: 5, name: 'Return to Base' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedMissionId) {
      const selectedMission = missions.find(m => m.id === parseInt(selectedMissionId));
      if (selectedMission) {
        onSave({
          missionId: selectedMission.id,
          missionName: selectedMission.name
        });
      }
    } else {
      onSave(null);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(); // Xóa widget
    } else {
      onSave(null); // Fallback: xóa mission
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  
  const handleKeyDown = (e) => {
    // Prevent Enter key from submitting form and refreshing page
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // On mobile, blur the input to hide virtual keyboard
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur();
      }
    }
  };  

  if (!isOpen) return null;

  return (
    <div className="mission-dialog-overlay">
      <div className="mission-dialog">
        <div className="mission-dialog-header">
          <h3>Mission button</h3>
        </div>
        
        <div className="mission-dialog-content">
          <p>You can start a mission from the dashboard by adding a Mission button widget and selecting a predefined mission.</p>
          
          <div className="mission-field">
            <label>Mission</label>
            <select 
              value={selectedMissionId} 
              onChange={(e) => setSelectedMissionId(e.target.value)}
              disabled={loading}
              onKeyDown={handleKeyDown}
              >
              <option key="no-mission" value="">No mission</option>
              {missions.map((mission, index) => (
                <option key={`mission-${mission.id || `temp-${index}`}`} value={mission.id}>
                  {mission.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mission-dialog-actions">
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
            onKeyDown={handleKeyDown}
          >
            Save
          </button>
          <button 
            className="btn-delete"
            onClick={handleDelete}
            disabled={loading}
            onKeyDown={handleKeyDown}
          >
            Delete
          </button>
          <button 
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
            onKeyDown={handleKeyDown}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionButtonDialog; 