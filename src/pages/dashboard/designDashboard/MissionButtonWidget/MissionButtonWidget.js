import React from 'react';
import './MissionButtonWidget.css';
import MissionButtonWidgetComponent from './MissionButtonWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class MissionButtonWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'mission-button';
    this.title = config.title || 'Mission Button';
    this.settings = config.settings || { missionId: null, missionName: null };
    this.colspan = config.colspan || 1;
    this.rowspan = config.rowspan || 1;
    this.position = config.position || { row: 0, col: 0 };
    this.size = config.size || { width: 'auto', height: 'auto' };
    this.displayMode = config.displayMode || 'design'; // 'design' hoặc 'display'
  }

  generateId() {
    return 'mission-button-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Kiểm tra xem widget có phải là mission button không
  isMissionButton() {
    return this.type === 'mission-button';
  }

  // Kiểm tra widget có rỗng không
  isEmpty() {
    return this.type === 'empty';
  }

  // Cập nhật mission
  updateSettings(settings) {
    console.log("settings:", settings)
    if (settings) {
      this.settings ={ missionId: settings.missionId, missionName: settings.missionName };
    } else {
      this.settings = { missionId: null, missionName: null };
    }
    return this;
  }

  // Bắt đầu thực thi mission
  startMission() {
    if (!this.missionId) {
      console.warn('No mission assigned to widget:', this.id);
      return false;
    }

    this.isExecuting = true;
    this.isActive = true;
    console.log('Starting mission:', this.missionName, 'for widget:', this.id);
    
    // TODO: Gọi API để bắt đầu mission
    // fetch(`${serverConfig.SERVER_URL}/api/missions/${this.missionId}/start`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return true;
  }

  // Dừng thực thi mission
  stopMission() {
    this.isExecuting = false;
    this.isActive = false;
    console.log('Stopping mission:', this.missionName, 'for widget:', this.id);
    
    // TODO: Gọi API để dừng mission
    // fetch(`${serverConfig.SERVER_URL}/api/missions/${this.missionId}/stop`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' }
    // });
  }

  // Cập nhật trạng thái thực thi
  updateExecutionStatus(status) {
    this.isExecuting = status.isExecuting || false;
    this.isActive = status.isActive || false;
    this.lastExecuted = status.lastExecuted || this.lastExecuted;
    this.executionCount = status.executionCount || this.executionCount;
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // MissionButtonWidget uses external dialog in DesignDashboard
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

  // Update widget size (từ Widget base class)
  updateSize(width, height) {
    this.properties = {
      ...this.properties,
      width: width,
      height: height,
      resized: true
    };
    return this;
  }

  // Get widget size (từ Widget base class)
  getSize() {
    if (this.properties && this.properties.resized) {
      return {
        width: this.properties.width,
        height: this.properties.height
      };
    }
    return null; // Use default size
  }

  // Check if widget has custom size (từ Widget base class)
  hasCustomSize() {
    return this.properties && this.properties.resized === true;
  }

  // Clone widget
  clone() {
    return new MissionButtonWidget({
      id: this.id,
      title: this.title,
      settings: this.settings,
      colspan: this.colspan,
      rowspan: this.rowspan,
      position: { ...this.position },
      size: { ...this.size },
      displayMode: this.displayMode,
    });
  }

  // Chuyển đổi thành JSON để lưu
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
    };
  }

  // Tạo widget từ JSON
  static fromJSON(data) {
    return new MissionButtonWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      rowspan: data.rowspan,
      size: data.size,
      displayMode: data.displayMode,
    });
  }

  // Render component React với 2 chế độ hiển thị
  render(onEdit) {
    return React.createElement(MissionButtonWidgetComponent, { widget: this, onEdit });
  }
}

export default addResizeSupport(MissionButtonWidget); 