import React from 'react';
import './JoystickDialog.css';

const JoystickDialog = (props) => {
  const { isOpen = false, onClose = () => {}, onSave = () => {}, onDelete = () => {}, widget = null } = props || {};
  
  if (!isOpen) return null;

  return (
    <div className="joystick-dialog-overlay">
      <div className="joystick-dialog">
        <div className="joystick-dialog-header">
          <h3>Joystick Widget Settings</h3>
        </div>
        <div className="joystick-dialog-content">
          <p>A Joystick widget allows you to control the robot's movement directly from the dashboard. You can use the joystick to navigate the robot manually.</p>
        </div>
        <div className="joystick-dialog-actions">
          <button className="btn-save" onClick={onClose}>Close</button>
          <button className="btn-delete" onClick={onDelete}>Delete</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default JoystickDialog; 