import React, { useState, useEffect } from 'react';
import './MissionActionLogDialog.css';

const MissionActionLogDialog = ({ isOpen, onClose, onSave, onDelete, widget }) => {
  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState('');
  const [maxLogs, setMaxLogs] = useState(100);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    if (isOpen && widget) {
      setTitle(widget.title || 'Mission Action Log');
      setSettings(widget.settings || 'Display mission action logs');
     const settings = widget.settings;
     
          setMaxLogs(settings.limit || 100);
          setAutoScroll(settings.autoScroll || true);
          setShowTimestamp(settings.showTimestamp || true);
          setFilterLevel(settings.filterLevel || 'all');
    
    }
  }, [isOpen, widget]);

  const handleSave = () => {
    const updatedWidget = {
      ...widget,
      title: title,
      settings: {
        limit: maxLogs,
        autoScroll: autoScroll,
        showTimestamp: showTimestamp,
        filterLevel: filterLevel
      }
    };

    console.log('💾 Saving MissionActionLogWidget:', updatedWidget);
    onSave(updatedWidget);
    onClose();
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete(); // Delete widget
    } else {
      onSave(null); // Fallback: remove map
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="mission-action-log-dialog-overlay">
      <div className="mission-action-log-dialog">
        <div className="dialog-header">
          <h3>Edit Mission Action Log Widget</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="dialog-content">

          <div className="form-group">
            <label htmlFor="max-logs">Maximum Logs:</label>
            <input
              id="max-logs"
              type="number"
              min="10"
              max="1000"
              value={maxLogs}
              onChange={(e) => setMaxLogs(parseInt(e.target.value) || 100)}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto Scroll to Latest Logs
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
              />
              Show Timestamps
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="filter-level">Default Filter Level:</label>
            <select
              id="filter-level"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">All Logs</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>

        <div className="map-dialog-actions">
          <button
            className="btn-save"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="btn-delete"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            className="btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionActionLogDialog; 