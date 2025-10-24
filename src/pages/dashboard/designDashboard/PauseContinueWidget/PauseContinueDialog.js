import React from 'react';
import './PauseContinueDialog.css';

const PauseContinueDialog = (props) => {
  // Safely destructure props with defaults
  const { 
    isOpen = false, 
    onClose = () => {}, 
    onSave = () => {}, 
    onDelete = () => {},
    widget = null 
  } = props || {};

  console.log('🎭 PauseContinueDialog: Render called with props:', props);
  console.log('🎭 PauseContinueDialog: isOpen:', isOpen);
  console.log('🎭 PauseContinueDialog: props keys:', props ? Object.keys(props) : 'null');
  
  if (!isOpen) {
    console.log('🎭 PauseContinueDialog: Not open, returning null');
    return null;
  }

  console.log('🎭 PauseContinueDialog: Rendering dialog overlay');

  return (
    <div className="pause-continue-dialog-overlay">
      <div className="pause-continue-dialog">
        <div className="pause-continue-dialog-header">
          <h3>Mission Control Widget Settings</h3>
        </div>
        
        <div className="pause-continue-dialog-content">
          <p>A Mission Control widget allows you to start, pause, and resume robot missions directly from the dashboard. The widget automatically syncs with the robot's current mission status and provides real-time control capabilities.</p>
        </div>

        <div className="pause-continue-dialog-actions">
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

export default PauseContinueDialog; 