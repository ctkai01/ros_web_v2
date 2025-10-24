import React from 'react';
import './MissionQueueWidget.css';
import MissionQueueWidgetComponent from './MissionQueueWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class MissionQueueWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'mission-queue';
    this.title = config.title || 'Mission Queue';
    this.settings = config.settings || 'No settings';
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 1;
    this.rowspan = config.rowspan || 1;
    this.size = config.size || { width: 'auto', height: 'auto' };
    this.displayMode = config.displayMode || 'design';
    this.missions = config.missions || [];
    this.currentMissionIndex = config.currentMissionIndex || 0;
    this.maxQueueSize = config.maxQueueSize || 10;
    this.autoExecute = config.autoExecute !== undefined ? config.autoExecute : true;
    this.isExecuting = config.isExecuting !== undefined ? config.isExecuting : false;
    this.properties = config.properties || {}; // Thêm properties để lưu resize info
  }

  generateId() {
    return 'mission-queue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  isMissionButton() {
    return false;
  }

  isEmpty() {
    return this.type === 'empty';
  }

  // Add mission to queue
  addMission(mission) {
    if (this.missions.length >= this.maxQueueSize) {
      console.warn('Mission queue is full');
      return false;
    }

    const missionItem = {
      id: Date.now() + Math.random(),
      name: mission.name || 'Unnamed Mission',
      priority: mission.priority || 'normal', // 'high', 'normal', 'low'
      status: 'pending', // 'pending', 'executing', 'completed', 'failed', 'cancelled'
      addedAt: new Date(),
      estimatedDuration: mission.estimatedDuration || null,
      description: mission.description || '',
      progress: 0
    };

    this.missions.push(missionItem);
    console.log('Mission added to queue:', missionItem.name);
    return true;
  }

  // Remove mission from queue
  removeMission(missionId) {
    const index = this.missions.findIndex(m => m.id === missionId);
    if (index !== -1) {
      const removedMission = this.missions.splice(index, 1)[0];
      console.log('Mission removed from queue:', removedMission.name);
      
      // Adjust current index if needed
      if (index < this.currentMissionIndex) {
        this.currentMissionIndex--;
      }
      
      return true;
    }
    return false;
  }

  // Move mission up in queue
  moveMissionUp(missionId) {
    const index = this.missions.findIndex(m => m.id === missionId);
    if (index > 0) {
      [this.missions[index], this.missions[index - 1]] = [this.missions[index - 1], this.missions[index]];
      return true;
    }
    return false;
  }

  // Move mission down in queue
  moveMissionDown(missionId) {
    const index = this.missions.findIndex(m => m.id === missionId);
    if (index < this.missions.length - 1 && index !== -1) {
      [this.missions[index], this.missions[index + 1]] = [this.missions[index + 1], this.missions[index]];
      return true;
    }
    return false;
  }

  // Get current mission
  getCurrentMission() {
    return this.missions[this.currentMissionIndex] || null;
  }

  // Get next mission
  getNextMission() {
    return this.missions[this.currentMissionIndex + 1] || null;
  }

  // Start executing queue
  startExecution() {
    if (this.missions.length > 0 && !this.isExecuting) {
      this.isExecuting = true;
      const currentMission = this.getCurrentMission();
      if (currentMission) {
        currentMission.status = 'executing';
        console.log('Started executing mission:', currentMission.name);
      }
      return true;
    }
    return false;
  }

  // Stop execution
  stopExecution() {
    this.isExecuting = false;
    const currentMission = this.getCurrentMission();
    if (currentMission && currentMission.status === 'executing') {
      currentMission.status = 'pending';
      console.log('Stopped executing mission:', currentMission.name);
    }
    return true;
  }

  // Complete current mission and move to next
  completeCurrentMission() {
    const currentMission = this.getCurrentMission();
    if (currentMission) {
      currentMission.status = 'completed';
      currentMission.progress = 100;
      console.log('Mission completed:', currentMission.name);
      
      this.currentMissionIndex++;
      
      // Auto start next mission if enabled
      if (this.autoExecute && this.currentMissionIndex < this.missions.length) {
        const nextMission = this.getCurrentMission();
        if (nextMission) {
          nextMission.status = 'executing';
          console.log('Auto-started next mission:', nextMission.name);
        }
      } else {
        this.isExecuting = false;
      }
      
      return true;
    }
    return false;
  }

  // Fail current mission
  failCurrentMission(reason = '') {
    const currentMission = this.getCurrentMission();
    if (currentMission) {
      currentMission.status = 'failed';
      currentMission.failureReason = reason;
      console.log('Mission failed:', currentMission.name, reason);
      this.isExecuting = false;
      return true;
    }
    return false;
  }

  // Clear completed missions
  clearCompleted() {
    const initialLength = this.missions.length;
    this.missions = this.missions.filter(m => m.status !== 'completed');
    const removedCount = initialLength - this.missions.length;
    
    // Adjust current index
    this.currentMissionIndex = Math.max(0, this.currentMissionIndex - removedCount);
    
    console.log(`Cleared ${removedCount} completed missions`);
    return removedCount;
  }

  // Clear all missions
  clearAll() {
    this.missions = [];
    this.currentMissionIndex = 0;
    this.isExecuting = false;
    console.log('All missions cleared');
    return true;
  }

  // Get queue statistics
  getStats() {
    const stats = {
      total: this.missions.length,
      pending: this.missions.filter(m => m.status === 'pending').length,
      executing: this.missions.filter(m => m.status === 'executing').length,
      completed: this.missions.filter(m => m.status === 'completed').length,
      failed: this.missions.filter(m => m.status === 'failed').length,
      cancelled: this.missions.filter(m => m.status === 'cancelled').length
    };
    return stats;
  }

  // Get mission icon based on status
  getMissionIcon(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'executing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⏹️';
      default: return '📋';
    }
  }

  // Get priority icon
  getPriorityIcon(priority) {
    switch (priority) {
      case 'high': return '🔴';
      case 'normal': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
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
    return new MissionQueueWidget({
      id: this.id,
      title: this.title,
      settings: this.settings,
      position: { ...this.position },
      colspan: this.colspan,
      size: { ...this.size },
      displayMode: this.displayMode,
      missions: [...this.missions.map(m => ({ ...m }))],
      currentMissionIndex: this.currentMissionIndex,
      maxQueueSize: this.maxQueueSize,
      autoExecute: this.autoExecute,
      isExecuting: this.isExecuting,
      properties: { ...this.properties } // Thêm properties vào clone
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
      rowspan: this.rowspan,
      size: this.size,
      displayMode: this.displayMode,
      missions: this.missions,
      currentMissionIndex: this.currentMissionIndex,
      maxQueueSize: this.maxQueueSize,
      autoExecute: this.autoExecute,
      isExecuting: this.isExecuting,
      properties: this.properties // Thêm properties vào JSON
    };
  }

  static fromJSON(data) {
    return new MissionQueueWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      rowspan: data.rowspan,
      size: data.size,
      displayMode: data.displayMode,
      missions: data.missions,
      currentMissionIndex: data.currentMissionIndex,
      maxQueueSize: data.maxQueueSize,
      autoExecute: data.autoExecute,
      isExecuting: data.isExecuting,
      properties: data.properties // Thêm properties từ JSON
    });
  }

  render(onEdit) {
    return React.createElement(MissionQueueWidgetComponent, { widget: this, onEdit });
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // MissionQueueWidget doesn't have complex edit requirements
  }

  renderDesignMode() {
    return (
      <div 
        className="mission-queue-widget design-mode"
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
        </div>
        
        <div className="queue-content design-preview">
          <div className="queue-item sample">
            <span className="mission-icon">⏳</span>
            <span className="mission-name">Sample Mission 1</span>
            <span className="priority-icon">🔴</span>
          </div>
          <div className="queue-item sample executing">
            <span className="mission-icon">🔄</span>
            <span className="mission-name">Sample Mission 2</span>
            <span className="priority-icon">🟡</span>
          </div>
          <div className="queue-item sample">
            <span className="mission-icon">⏳</span>
            <span className="mission-name">Sample Mission 3</span>
            <span className="priority-icon">🟢</span>
          </div>
        </div>
      </div>
    );
  }

  renderDisplayMode() {
    const stats = this.getStats();
    
    return (
      <div 
        className="mission-queue-widget display-mode"
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
          
          <div className="queue-stats">
            <span className="stat-item">Total: {stats.total}</span>
            <span className="stat-item pending">Pending: {stats.pending}</span>
            {stats.executing > 0 && <span className="stat-item executing">Executing: {stats.executing}</span>}
          </div>
        </div>
        
        <div className="queue-controls">
          <button 
            className={`control-btn ${this.isExecuting ? 'stop' : 'start'}`}
            onClick={() => this.isExecuting ? this.stopExecution() : this.startExecution()}
            disabled={this.missions.length === 0}
            title={this.isExecuting ? 'Stop Execution' : 'Start Execution'}
          >
            {this.isExecuting ? '⏹️' : '▶️'}
          </button>
          
          <button 
            className="control-btn clear"
            onClick={() => this.clearCompleted()}
            disabled={stats.completed === 0}
            title="Clear Completed"
          >
            🗑️
          </button>
          
          <button 
            className="control-btn add"
            onClick={() => this.addMission({ name: 'New Mission', priority: 'normal' })}
            disabled={this.missions.length >= this.maxQueueSize}
            title="Add Mission"
          >
            ➕
          </button>
        </div>
        
        <div className="queue-content">
          {this.missions.length === 0 ? (
            <div className="empty-queue">
              <span className="empty-icon">📋</span>
              <span className="empty-text">No missions in queue</span>
            </div>
          ) : (
            this.missions.map((mission, index) => (
              <div 
                key={mission.id} 
                className={`queue-item ${mission.status} ${index === this.currentMissionIndex ? 'current' : ''}`}
              >
                <span className="mission-icon">{this.getMissionIcon(mission.status)}</span>
                <div className="mission-details">
                  <span className="mission-name">{mission.name}</span>
                  {mission.description && (
                    <span className="mission-description">{mission.description}</span>
                  )}
                  {mission.status === 'executing' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <span className="priority-icon" title={`Priority: ${mission.priority}`}>
                  {this.getPriorityIcon(mission.priority)}
                </span>
                
                <div className="mission-actions">
                  <button 
                    className="action-btn up"
                    onClick={() => this.moveMissionUp(mission.id)}
                    disabled={index === 0 || mission.status === 'executing'}
                    title="Move Up"
                  >
                    ⬆️
                  </button>
                  <button 
                    className="action-btn down"
                    onClick={() => this.moveMissionDown(mission.id)}
                    disabled={index === this.missions.length - 1 || mission.status === 'executing'}
                    title="Move Down"
                  >
                    ⬇️
                  </button>
                  <button 
                    className="action-btn remove"
                    onClick={() => this.removeMission(mission.id)}
                    disabled={mission.status === 'executing'}
                    title="Remove"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

// Thêm resize support và export
export default addResizeSupport(MissionQueueWidget); 