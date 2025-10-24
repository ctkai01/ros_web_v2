import React from 'react';
import './IOStatusWidget.css';
import IOStatusWidgetComponent from './IOStatusWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class IOStatusWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = config.type || 'io-status';
    this.title = config.title || 'I/O Status';
    this.settings = config.settings || 'No settings';
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 1;
    this.size = config.size || { width: 'auto', height: 'auto' };
    this.displayMode = config.displayMode || 'design';
    this.ioType = config.ioType || 'digital'; // 'digital', 'analog'
    this.ioDirection = config.ioDirection || 'input'; // 'input', 'output', 'bidirectional'
    this.channels = config.channels || this.createDefaultChannels();
    this.updateInterval = config.updateInterval || 1000; // ms
    this.isMonitoring = config.isMonitoring !== undefined ? config.isMonitoring : false;
    this.lastUpdate = config.lastUpdate || null;
    this.properties = config.properties || {}; // Thêm properties để lưu resize info
  }

  generateId() {
    return 'io-status-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  createDefaultChannels() {
    const channels = [];
    const channelCount = this.ioType === 'digital' ? 8 : 4;
    
    for (let i = 0; i < channelCount; i++) {
      channels.push({
        id: i,
        name: `CH${i + 1}`,
        value: this.ioType === 'digital' ? false : 0,
        unit: this.ioType === 'digital' ? '' : 'V',
        status: 'normal', // 'normal', 'warning', 'error'
        enabled: true,
        description: `Channel ${i + 1}`,
        lastChanged: new Date()
      });
    }
    
    return channels;
  }

  isMissionButton() {
    return false;
  }

  isEmpty() {
    return this.type === 'empty';
  }

  // Update channel value
  updateChannel(channelId, value) {
    const channel = this.channels.find(ch => ch.id === channelId);
    if (channel) {
      const oldValue = channel.value;
      channel.value = value;
      channel.lastChanged = new Date();
      
      // Auto-detect status based on value
      if (this.ioType === 'digital') {
        channel.status = 'normal';
      } else {
        // Analog value status detection
        if (value < 0.5) {
          channel.status = 'error';
        } else if (value > 4.5) {
          channel.status = 'warning';
        } else {
          channel.status = 'normal';
        }
      }
      
      console.log(`Channel ${channel.name} updated: ${oldValue} -> ${value}`);
      return true;
    }
    return false;
  }

  // Set channel output value (for output channels)
  setChannelOutput(channelId, value) {
    if (this.ioDirection === 'input') {
      console.warn('Cannot set output on input-only widget');
      return false;
    }
    
    return this.updateChannel(channelId, value);
  }

  // Toggle digital channel
  toggleChannel(channelId) {
    if (this.ioType !== 'digital') {
      console.warn('Cannot toggle non-digital channel');
      return false;
    }
    
    const channel = this.channels.find(ch => ch.id === channelId);
    if (channel) {
      return this.updateChannel(channelId, !channel.value);
    }
    return false;
  }

  // Enable/disable channel
  setChannelEnabled(channelId, enabled) {
    const channel = this.channels.find(ch => ch.id === channelId);
    if (channel) {
      channel.enabled = enabled;
      console.log(`Channel ${channel.name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  // Rename channel
  renameChannel(channelId, newName) {
    const channel = this.channels.find(ch => ch.id === channelId);
    if (channel) {
      const oldName = channel.name;
      channel.name = newName;
      console.log(`Channel renamed: ${oldName} -> ${newName}`);
      return true;
    }
    return false;
  }

  // Start monitoring
  startMonitoring() {
    if (!this.isMonitoring) {
      this.isMonitoring = true;
      this.lastUpdate = new Date();
      console.log('I/O monitoring started');
      return true;
    }
    return false;
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.isMonitoring) {
      this.isMonitoring = false;
      console.log('I/O monitoring stopped');
      return true;
    }
    return false;
  }

  // Get channel statistics
  getChannelStats() {
    const stats = {
      total: this.channels.length,
      enabled: this.channels.filter(ch => ch.enabled).length,
      disabled: this.channels.filter(ch => !ch.enabled).length,
      normal: this.channels.filter(ch => ch.status === 'normal').length,
      warning: this.channels.filter(ch => ch.status === 'warning').length,
      error: this.channels.filter(ch => ch.status === 'error').length
    };
    
    if (this.ioType === 'digital') {
      stats.high = this.channels.filter(ch => ch.value === true).length;
      stats.low = this.channels.filter(ch => ch.value === false).length;
    }
    
    return stats;
  }

  // Get channel value display
  getChannelDisplay(channel) {
    if (this.ioType === 'digital') {
      return channel.value ? 'HIGH' : 'LOW';
    } else {
      return `${channel.value.toFixed(2)}${channel.unit}`;
    }
  }

  // Get channel icon
  getChannelIcon(channel) {
    if (this.ioType === 'digital') {
      if (!channel.enabled) return '⚫';
      return channel.value ? '🟢' : '🔴';
    } else {
      if (!channel.enabled) return '⚫';
      switch (channel.status) {
        case 'normal': return '🟢';
        case 'warning': return '🟡';
        case 'error': return '🔴';
        default: return '⚪';
      }
    }
  }

  // Get status icon
  getStatusIcon() {
    const stats = this.getChannelStats();
    if (stats.error > 0) return '🔴';
    if (stats.warning > 0) return '🟡';
    return '🟢';
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
    return new IOStatusWidget({
      id: this.id,
      type: this.type,
      title: this.title,
      settings: this.settings,
      position: { ...this.position },
      colspan: this.colspan,
      size: { ...this.size },
      displayMode: this.displayMode,
      ioType: this.ioType,
      ioDirection: this.ioDirection,
      channels: this.channels.map(ch => ({ ...ch })),
      updateInterval: this.updateInterval,
      isMonitoring: this.isMonitoring,
      lastUpdate: this.lastUpdate,
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
      size: this.size,
      displayMode: this.displayMode,
      ioType: this.ioType,
      ioDirection: this.ioDirection,
      channels: this.channels,
      updateInterval: this.updateInterval,
      isMonitoring: this.isMonitoring,
      lastUpdate: this.lastUpdate,
      properties: this.properties // Thêm properties vào JSON
    };
  }

  static fromJSON(data) {
    return new IOStatusWidget({
      id: data.id,
      type: data.type,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      size: data.size,
      displayMode: data.displayMode,
      ioType: data.ioType,
      ioDirection: data.ioDirection,
      channels: data.channels,
      updateInterval: data.updateInterval,
      isMonitoring: data.isMonitoring,
      lastUpdate: data.lastUpdate,
      properties: data.properties // Thêm properties từ JSON
    });
  }

  render(onEdit) {
    return React.createElement(IOStatusWidgetComponent, { widget: this, onEdit });
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // IOStatusWidget doesn't have complex edit requirements
  }

  renderDesignMode() {
    return (
      <div 
        className="io-status-widget design-mode"
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
        </div>
        
        <div className="io-content design-preview">
          <div className="channel-grid sample">
            <div className="channel-item sample">
              <span className="channel-icon">🟢</span>
              <span className="channel-name">CH1</span>
              <span className="channel-value">HIGH</span>
            </div>
            <div className="channel-item sample">
              <span className="channel-icon">🔴</span>
              <span className="channel-name">CH2</span>
              <span className="channel-value">LOW</span>
            </div>
            <div className="channel-item sample">
              <span className="channel-icon">🟡</span>
              <span className="channel-name">CH3</span>
              <span className="channel-value">3.2V</span>
            </div>
            <div className="channel-item sample">
              <span className="channel-icon">⚫</span>
              <span className="channel-name">CH4</span>
              <span className="channel-value">OFF</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderDisplayMode() {
    const stats = this.getChannelStats();
    
    return (
      <div 
        className={`io-status-widget display-mode ${this.ioType} ${this.ioDirection}`}
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{this.settings}</p>
          </div>
          
          <div className="widget-status">
            <span className="status-icon">{this.getStatusIcon()}</span>
            <span className="status-text">{this.isMonitoring ? 'Monitoring' : 'Stopped'}</span>
          </div>
        </div>
        
        <div className="io-controls">
          <button 
            className={`control-btn ${this.isMonitoring ? 'stop' : 'start'}`}
            onClick={() => this.isMonitoring ? this.stopMonitoring() : this.startMonitoring()}
            title={this.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          >
            {this.isMonitoring ? '⏹️' : '▶️'}
          </button>
          
          <div className="io-info">
            <span className="io-type">{this.ioType.toUpperCase()}</span>
            <span className="io-direction">{this.ioDirection.toUpperCase()}</span>
          </div>
          
          <div className="channel-stats">
            <span className="stat-item">Total: {stats.total}</span>
            {stats.error > 0 && <span className="stat-item error">Error: {stats.error}</span>}
            {stats.warning > 0 && <span className="stat-item warning">Warning: {stats.warning}</span>}
          </div>
        </div>
        
        <div className="io-content">
          <div className={`channel-grid ${this.ioType}`}>
            {this.channels.map(channel => (
              <div 
                key={channel.id}
                className={`channel-item ${channel.status} ${!channel.enabled ? 'disabled' : ''}`}
              >
                <span className="channel-icon">{this.getChannelIcon(channel)}</span>
                <div className="channel-details">
                  <span className="channel-name">{channel.name}</span>
                  <span className="channel-value">{this.getChannelDisplay(channel)}</span>
                  {channel.description && (
                    <span className="channel-description">{channel.description}</span>
                  )}
                </div>
                
                {this.ioDirection !== 'input' && channel.enabled && (
                  <div className="channel-controls">
                    {this.ioType === 'digital' ? (
                      <button 
                        className={`toggle-btn ${channel.value ? 'on' : 'off'}`}
                        onClick={() => this.toggleChannel(channel.id)}
                        title="Toggle"
                      >
                        {channel.value ? 'ON' : 'OFF'}
                      </button>
                    ) : (
                      <input 
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={channel.value}
                        onChange={(e) => this.setChannelOutput(channel.id, parseFloat(e.target.value))}
                        className="analog-slider"
                      />
                    )}
                  </div>
                )}
                
                <button 
                  className={`enable-btn ${channel.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => this.setChannelEnabled(channel.id, !channel.enabled)}
                  title={channel.enabled ? 'Disable' : 'Enable'}
                >
                  {channel.enabled ? '🔓' : '🔒'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

// Thêm resize support và export
export default addResizeSupport(IOStatusWidget); 