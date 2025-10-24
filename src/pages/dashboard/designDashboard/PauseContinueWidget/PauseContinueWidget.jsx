import React from 'react';
import './PauseContinueWidget.css';
import PauseContinueWidgetComponent from './PauseContinueWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class PauseContinueWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'pause-continue';
    this.title = config.title || 'Mission Control';
    this.settings = config.settings || 'Pause/Continue Mission';
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 1;
    this.size = config.size || { width: 'auto', height: 'auto' };
    this.displayMode = config.displayMode || 'design';
    this.missionStatus = config.missionStatus || 'IDLE'; // IDLE, RUNNING, PAUSED
    this.properties = config.properties || {};
  }

  generateId() {
    return 'pause-continue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  isMissionButton() {
    return false;
  }

  isEmpty() {
    return this.type === 'empty';
  }

  // Update mission status
  updateMissionStatus(status) {
    this.missionStatus = status;
  }

  // Get current status
  getStatus() {
    return this.missionStatus;
  }

  // Get action button text
  getActionText() {
    switch (this.missionStatus) {
      case 'IDLE':
        return 'Start Mission';
      case 'RUNNING':
        return 'Pause Mission';
      case 'PAUSED':
        return 'Resume Mission';
      default:
        return 'Unknown';
    }
  }

  // Get action icon
  getActionIcon() {
    switch (this.missionStatus) {
      case 'IDLE':
        return 'play.png';
      case 'RUNNING':
        return 'pause.png';
      case 'PAUSED':
        return 'resume.png';
      default:
        return 'play.png';
    }
  }

  // Check if widget is enabled (can perform actions)
  isEnabled() {
    return this.missionStatus !== 'UNKNOWN';
  }

  setDesignMode() {
    this.displayMode = 'design';
    return this;
  }

  setDisplayMode() {
    this.displayMode = 'display';
    return this;
  }

  isDesignMode() {
    return this.displayMode === 'design';
  }

  isDisplayMode() {
    return this.displayMode === 'display';
  }

  clone() {
    return new PauseContinueWidget({
      id: this.id,
      title: this.title,
      settings: this.settings,
      position: { ...this.position },
      colspan: this.colspan,
      size: { ...this.size },
      displayMode: this.displayMode,
      missionStatus: this.missionStatus,
      properties: { ...this.properties }
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      settings: this.settings,
      position: this.position,
      colspan: this.colspan,
      size: this.size,
      displayMode: this.displayMode,
      missionStatus: this.missionStatus,
      properties: this.properties
    };
  }

  static fromJSON(data) {
    return new PauseContinueWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      size: data.size,
      displayMode: data.displayMode,
      missionStatus: data.missionStatus || 'IDLE',
      properties: data.properties
    });
  }

  render(onEdit) {
    return React.createElement(PauseContinueWidgetComponent, { widget: this, onEdit });
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return true; // PauseContinueWidget has its own edit dialog
  }

  renderDesignMode() {
    return (
      <div 
        className="pause-continue-widget design-mode"
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
        </div>
        
        <div className="pause-continue-content design-preview">
          <div className="action-button-preview">
            <span className="action-icon">⏸️</span>
            <span className="action-text">Pause</span>
          </div>
          <div className="status-indicator preview">
            <span className="status-text">Running</span>
          </div>
        </div>
      </div>
    );
  }

  renderDisplayMode() {
    const status = this.getStatus();
    
    return (
      <div 
        className={`pause-continue-widget display-mode ${status}`}
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
          
          <div className="widget-stats">
            <span className="action-count">Actions: {this.actionCount}</span>
            {this.lastAction && (
              <span className="last-action">Last: {this.lastAction}</span>
            )}
          </div>
        </div>
        
        <div className="pause-continue-content">
          <button 
            className={`action-button ${status}`}
            onClick={() => this.toggle()}
            disabled={!this.isEnabled}
            title={this.getActionText()}
          >
            <span className="action-icon">{this.getActionIcon()}</span>
            <span className="action-text">{this.getActionText()}</span>
          </button>
          
          <div className={`status-indicator ${status}`}>
            <span className="status-dot"></span>
            <span className="status-text">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          
          <div className="control-buttons">
            <button 
              className="reset-btn"
              onClick={() => this.reset()}
              title="Reset"
            >
              🔄
            </button>
            <button 
              className={`enable-btn ${this.isEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => this.setEnabled(!this.isEnabled)}
              title={this.isEnabled ? 'Disable' : 'Enable'}
            >
              {this.isEnabled ? '🔓' : '🔒'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Thêm resize support và export
export default addResizeSupport(PauseContinueWidget); 