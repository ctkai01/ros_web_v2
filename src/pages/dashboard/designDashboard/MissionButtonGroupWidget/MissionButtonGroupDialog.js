import React, { useState, useEffect } from 'react';
import serverConfig from '../../../../config/serverConfig';
import './MissionButtonGroupDialog.css';

const MissionButtonGroupDialog = ({ isOpen, onClose, onSave, onDelete, widget }) => {
  const [groups, setGroups] = useState([]);
  const currentGroupId = widget ? widget.settings.groupId : null;

  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setSelectedGroupId(currentGroupId || '');
    }
  }, [isOpen, currentGroupId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      console.log('Fetching groups from database');

      // Truy vấn groups từ database
      const response = await fetch(`${serverConfig.SERVER_URL}/api/groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Groups data from server:', data);
        
        if (Array.isArray(data)) {
          // Convert format để match với expected format
          const formattedGroups = data.map(group => ({
            id: group.ID,
            name: group.groupName
          }));
          
          console.log('Formatted groups:', formattedGroups);
          setGroups(formattedGroups);
        } else {
          throw new Error('Invalid groups data format');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch groups:', response.status, errorText);
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Fallback với mock data khi có lỗi
      setGroups([
        { id: 1, name: 'Group A' },
        { id: 2, name: 'Group B' },
        { id: 3, name: 'Group C' },
        { id: 4, name: 'Patrol Group' },
        { id: 5, name: 'Delivery Group' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedGroupId) {
      const selectedGroup = groups.find(g => g.id === parseInt(selectedGroupId));
      if (selectedGroup) {
        onSave({
          groupId: selectedGroup.id,
          groupName: selectedGroup.name
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
      onSave(null); // Fallback: xóa group
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
          <h3>Mission button group</h3>
        </div>
        
        <div className="mission-dialog-content">
          <p>You can start a mission group from the dashboard by adding a Mission Button Group widget and selecting a predefined group.</p>
          
          <div className="mission-field">
            <label>Group</label>
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={loading}
              onKeyDown={handleKeyDown}
            >
              <option key="no-group" value="">No group</option>
              {groups.map((group, index) => (
                <option key={`group-${group.id || `temp-${index}`}`} value={group.id}>
                  {group.name}
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

export default MissionButtonGroupDialog; 