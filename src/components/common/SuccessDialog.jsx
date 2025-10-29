import React from 'react';
import './SuccessDialog.css';

const SuccessDialog = ({ 
  visible, 
  title = "Success", 
  message = "Operation completed successfully!", 
  details = "",
  onClose,
  buttonText = "OK"
}) => {
  if (!visible) return null;

  return (
    <div className="success-dialog-overlay" onClick={onClose}>
      <div className="success-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="success-dialog-header">
          <div className="success-icon">✓</div>
          <h3>{title}</h3>
        </div>
        <div className="success-dialog-body">
          <p>{message}</p>
          {details && <p className="success-details">{details}</p>}
        </div>
        <div className="success-dialog-footer">
          <button 
            className="success-dialog-button"
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog; 