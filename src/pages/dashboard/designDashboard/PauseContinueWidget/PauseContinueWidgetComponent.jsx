import React, { useEffect, useRef, useState } from 'react';
import './PauseContinueWidget.css';
import { useMissionContext } from '../../../../contexts/MissionContext';
import { SERVER_URL } from '../../../../config/serverConfig';

const PauseContinueWidgetComponent = ({ widget, onEdit }) => {
  const widgetRef = useRef(null);
  const { missionStatus, isLoading, sendMissionCommand } = useMissionContext();
  const [localMissionStatus, setLocalMissionStatus] = useState('IDLE');

  // Apply saved size when component mounts
  useEffect(() => {
    if (widgetRef.current && widget.properties && widget.properties.resized) {
      const element = widgetRef.current;
      element.style.width = `${widget.properties.width}px`;
      element.style.height = `${widget.properties.height}px`;
      element.style.minWidth = `${widget.properties.width}px`;
      element.style.minHeight = `${widget.properties.height}px`;
      

    }
  }, [widget.properties]);

  // Load initial mission status when component mounts
  useEffect(() => {
    const loadInitialStatus = async () => {
      if (widget.isDesignMode()) {
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('PauseContinueWidget: No token found');
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
          setLocalMissionStatus(status);
          widget.updateMissionStatus(status);
        }
      } catch (error) {
        console.error('PauseContinueWidget: Error loading initial mission status:', error);
      }
    };

    loadInitialStatus();
  }, [widget]);

  // Update local status when context changes
  useEffect(() => {
    setLocalMissionStatus(missionStatus);
    widget.updateMissionStatus(missionStatus);
  }, [missionStatus, widget]);

  // Handle mission button click - only in display mode
  const handleMissionClick = async () => {
    // Don't allow clicks in design mode
    if (widget.isDesignMode()) {
      return;
    }
    
    if (isLoading) return;
    
    
    let command = '';
    switch (localMissionStatus) {
      case 'IDLE':
        command = 'START';
        break;
      case 'RUNNING':
        command = 'PAUSE';
        break;
      case 'PAUSED':
        command = 'RESUME';
        break;
      default:
        console.warn('PauseContinueWidget: Unknown mission status:', localMissionStatus);
        return;
    }

    await sendMissionCommand(command);
  };

  if (widget.isDesignMode()) {
    return (
      <div 
        ref={widgetRef}
        className="pause-continue-widget design-mode"
        data-widget-id={widget.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{widget.title}</h3>
            <p className="widget-settings">{widget.settings}</p>
          </div>
        </div>
        
        {/* Edit button */}
        {onEdit && (
          <button 
            className="widget-edit-btn"
            onClick={() => onEdit(widget.id)}
            title="Edit Widget"
          >
            <span className="edit-icon"></span>
          </button>
        )}
      </div>
    );
  }

  // Display mode
  const status = localMissionStatus;
  const actionText = widget.getActionText();
  const actionIcon = widget.getActionIcon();
  
  return (
    <div 
      ref={widgetRef}
      className={`pause-continue-widget display-mode ${status.toLowerCase()}`}
      data-widget-id={widget.id}
    >
      
              <div className="pause-continue-content">
          <button 
            className={`action-button ${status.toLowerCase()} ${isLoading ? 'loading' : ''}`}
            onClick={handleMissionClick}
            disabled={isLoading || !widget.isEnabled() || widget.isDesignMode()}
            title={widget.isDesignMode() ? 'Edit widget to configure' : actionText}
          >
            <span 
              className="action-icon"
              style={{
                backgroundImage: `url(/assets/icons/${actionIcon})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '24px',
                height: '24px',
                display: 'inline-block'
              }}
            ></span>
            <span className="action-text">{actionText}</span>
            {isLoading && <span className="loading-spinner"></span>}
          </button>
        
      </div>
    </div>
  );
};

export default PauseContinueWidgetComponent; 