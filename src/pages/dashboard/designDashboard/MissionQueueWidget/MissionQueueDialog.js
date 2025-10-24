import React from 'react';
import './MissionQueueDialog.css';

const MissionQueueDialog = ({ widget, onSave, onClose, onDelete }) => {
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="mission-queue-dialog-overlay">
      <div className="mission-queue-dialog">
        <div className="dialog-header">
          <h2>Mission Queue Widget</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="dialog-content">
          <div className="widget-info">
            <div className="info-section">
              <p>
                The Mission Queue Widget displays and manages a list of missions that are queued for execution. 
                It provides real-time status updates and allows users to monitor mission progress.
              </p>
            </div>

           
          </div>
        </div>

        <div className="dialog-actions">
          <button 
            className="btn-save"
            onClick={handleClose}
          >
            Close
          </button>
          <button 
            className="btn-delete"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button 
            className="btn-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionQueueDialog; 