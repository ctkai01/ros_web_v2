import React from 'react';
import './MissionActionLogWidget.css';
import MissionActionLogWidgetComponent from './MissionActionLogWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class MissionActionLogWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'mission-action-log';
    this.title = config.title || 'Mission Action Log';
    this.settings = config.settings || {maxLogs: 100, autoScroll: true, showTimestamp: true, filterLevel: 'all'};
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 1;
    this.rowspan = config.rowspan || 1;
    this.displayMode = config.displayMode || 'design'; // 'design' hoặc 'display'
  }

  generateId() {
    return 'mission-action-log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Kiểm tra xem widget có phải là mission button không
  isMissionButton() {
    return false;
  }

  // Kiểm tra widget có rỗng không
  isEmpty() {
    return this.type === 'empty';
  }

  updateSettings(settings) {
    if (settings) {
      this.settings ={ maxLogs: settings.maxLogs, autoScroll: settings.autoScroll, showTimestamp: settings.showTimestamp, filterLevel: settings.filterLevel };
    } else {
      this.settings = { maxLogs: 100, autoScroll: true, showTimestamp: true, filterLevel: 'all' };
    }
    return this;
  }

  // Thêm log entry mới
  addLogEntry(entry) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      level: entry.level || 'info', // 'info', 'warning', 'error', 'success'
      message: entry.message || '',
      mission: entry.mission || null,
      action: entry.action || null,
      details: entry.details || null
    };

    this.logEntries.unshift(logEntry); // Thêm vào đầu mảng

    // Giới hạn số lượng log entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(0, this.maxLogEntries);
    }

    console.log('Log entry added:', logEntry);
    return this;
  }

  // Xóa tất cả log entries
  clearLogs() {
    this.logEntries = [];
    console.log('All log entries cleared');
    return this;
  }

  // Lọc log entries theo level
  getFilteredLogs() {
    if (this.filterLevel === 'all') {
      return this.logEntries;
    }
    return this.logEntries.filter(entry => entry.level === this.filterLevel);
  }

  // Cập nhật filter level
  setFilterLevel(level) {
    this.filterLevel = level;
    return this;
  }

  // Bật/tắt auto scroll
  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    return this;
  }

  // Bật/tắt timestamp
  toggleTimestamp() {
    this.showTimestamp = !this.showTimestamp;
    return this;
  }

  // Chuyển sang chế độ Design
  setDesignMode() {
    this.displayMode = 'design';
    return this;
  }

  // Chuyển sang chế độ Display
  setDisplayMode() {
    this.displayMode = 'display';
    return this;
  }

  // Kiểm tra có đang ở chế độ Design không
  isDesignMode() {
    return this.displayMode === 'design';
  }

  // Kiểm tra có đang ở chế độ Display không
  isDisplayMode() {
    return this.displayMode === 'display';
  }

  // Clone widget
  clone() {
    const clonedData = ({
      id: this.id,
      type: this.type,
      title: this.title,
      settings: { ...this.settings },
      position: { ...this.position },
      colspan: this.colspan,
      rowspan: this.rowspan,
      displayMode: this.displayMode,
    });
    return new MissionActionLogWidget(clonedData);
  }

  // Chuyển đổi thành JSON để lưu
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      settings: { ...this.settings },
      position: this.position,
      colspan: this.colspan,
      rowspan: this.rowspan,
      displayMode: this.displayMode,
    };
  }

  // Tạo widget từ JSON
  static fromJSON(data) {
    return new MissionActionLogWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      rowspan: data.rowspan,
      displayMode: data.displayMode,
    });
  }

  // Format timestamp
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  // Get log level icon
  getLogLevelIcon(level) {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '📝';
    }
  }

  // Render component React với 2 chế độ hiển thị
  render(onEdit) {
    return React.createElement(MissionActionLogWidgetComponent, { widget: this, onEdit });
  }

  // Render chế độ Design (mặc định) - trả về JSX
  renderDesignMode() {
    return React.createElement('div', {
      className: 'mission-action-log-widget design-mode',
      'data-widget-id': this.id
    }, [
      React.createElement('div', { className: 'widget-header', key: 'header' }, [
        React.createElement('div', { className: 'widget-info', key: 'info' }, [
          React.createElement('h3', { className: 'widget-title', key: 'title' }, this.title),
          React.createElement('p', { className: 'widget-settings', key: 'settings' },  "No settings")
        ])
      ])
    ]);
  }

  // Render chế độ Display
  renderDisplayMode() {
    const filteredLogs = this.getFilteredLogs();

    return (
      <div 
        className="mission-action-log-widget display-mode"
        data-widget-id={this.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{this.title}</h3>
            <p className="widget-settings">{"No settings"}</p>
          </div>
          
          <div className="log-controls">
            <select 
              value={this.filterLevel} 
              onChange={(e) => this.setFilterLevel(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Logs</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
            
            <button 
              className={`toggle-btn ${this.autoScroll ? 'active' : ''}`}
              onClick={() => this.toggleAutoScroll()}
              title="Auto Scroll"
            >
              📜
            </button>
            
            <button 
              className={`toggle-btn ${this.showTimestamp ? 'active' : ''}`}
              onClick={() => this.toggleTimestamp()}
              title="Show Timestamp"
            >
              🕒
            </button>
            
            <button 
              className="clear-btn"
              onClick={() => this.clearLogs()}
              title="Clear Logs"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className={`log-container ${this.autoScroll ? 'auto-scroll' : ''}`}>
          {filteredLogs.length === 0 ? (
            <div className="no-logs">
              <span className="no-logs-icon">📝</span>
              <span className="no-logs-text">No mission logs yet</span>
            </div>
          ) : (
            filteredLogs.map(entry => (
              <div key={entry.id} className={`log-entry ${entry.level}`}>
                <span className="log-icon">{this.getLogLevelIcon(entry.level)}</span>
                {this.showTimestamp && (
                  <span className="log-timestamp">{this.formatTimestamp(entry.timestamp)}</span>
                )}
                <span className="log-message">{entry.message}</span>
                {entry.mission && (
                  <span className="log-mission">Mission: {entry.mission}</span>
                )}
                {entry.action && (
                  <span className="log-action">Action: {entry.action}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

// Thêm resize support và export
export default addResizeSupport(MissionActionLogWidget); 