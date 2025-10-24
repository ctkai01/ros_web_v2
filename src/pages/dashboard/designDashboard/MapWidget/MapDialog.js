import React from 'react';
import './MapDialog.css';

const MapDialog = (props) => {
  // Safely destructure props with defaults
  const { 
    isOpen = false, 
    onClose = () => {}, 
    onSave = () => {}, 
    onDelete = () => {},
    widget = null 
  } = props || {};

  console.log('🎭 MapDialog: Render called with props:', props);
  console.log('🎭 MapDialog: isOpen:', isOpen);
  console.log('🎭 MapDialog: props keys:', props ? Object.keys(props) : 'null');
  
  if (!isOpen) {
    console.log('🎭 MapDialog: Not open, returning null');
    return null;
  }

  console.log('🎭 MapDialog: Rendering dialog overlay');

  return (
    <div className="map-dialog-overlay">
      <div className="map-dialog">
        <div className="map-dialog-header">
          <h3>Map Widget Settings</h3>
        </div>
        
        <div className="map-dialog-content">
          <p>A Map widget makes the active map visible on the dashboard. You can add and edit positions and markers in the widget and adjust the robot's position.</p>
        </div>

        <div className="map-dialog-actions">
          <button 
            className="btn-save"
            onClick={onClose}
          >
            Close
          </button>
          <button 
            className="btn-delete"
            onClick={onDelete}
          >
            Delete
          </button>
          <button 
            className="btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapDialog; 