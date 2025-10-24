import React from 'react';
import './MissionButtonGroupWidget.css';
import MissionButtonGroupWidgetComponent from './MissionButtonGroupWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class MissionButtonGroupWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'mission-button-group';
    this.title = config.title || 'Mission Button Group';
    this.settings = config.settings || { 
      groupId: null,
      groupName: null,
      missions: []
    };
    this.colspan = config.colspan || 2;
    this.rowspan = config.rowspan || 1;
    this.position = config.position || { row: 0, col: 0 };
    this.displayMode = config.displayMode || 'design'; // 'design' hoặc 'display'
    this.properties = config.properties || {}; // Add properties for resize support
  }

  generateId() {
    return 'mission-button-group-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Kiểm tra xem widget có phải là mission button group không
  isMissionButtonGroup() {
    return this.type === 'mission-button-group';
  }

  // Kiểm tra widget có rỗng không
  isEmpty() {
    return this.type === 'empty';
  }

  // Cập nhật settings
  updateSettings(settings) {
    console.log("MissionButtonGroup settings:", settings);
    if (settings) {
      this.settings = {
        groupId: settings.groupId || null,
        groupName: settings.groupName || null
      };
    } else {
      this.settings = {
        groupId: null,
        groupName: null
      };
    }
    return this;
  }

  // Thêm mission vào group
  addMission(mission) {
    if (!this.settings.missions) {
      this.settings.missions = [];
    }
    this.settings.missions.push({
      missionId: mission.missionId,
      missionName: mission.missionName,
      buttonText: mission.buttonText || mission.missionName
    });
    return this;
  }

  // Xóa mission khỏi group
  removeMission(missionId) {
    if (this.settings.missions) {
      this.settings.missions = this.settings.missions.filter(
        mission => mission.missionId !== missionId
      );
    }
    return this;
  }

  // Bắt đầu thực thi mission
  startMission(missionId) {
    const mission = this.settings.missions?.find(m => m.missionId === missionId);
    if (!mission) {
      console.warn('Mission not found in group:', missionId);
      return false;
    }

    console.log('Starting mission from group:', mission.missionName, 'for widget:', this.id);
    
    // TODO: Gọi API để bắt đầu mission
    // fetch(`${serverConfig.SERVER_URL}/api/missions/${missionId}/start`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return true;
  }

  // Dừng thực thi mission
  stopMission(missionId) {
    const mission = this.settings.missions?.find(m => m.missionId === missionId);
    if (!mission) {
      console.warn('Mission not found in group:', missionId);
      return false;
    }

    console.log('Stopping mission from group:', mission.missionName, 'for widget:', this.id);
    
    // TODO: Gọi API để dừng mission
    // fetch(`${serverConfig.SERVER_URL}/api/missions/${missionId}/stop`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return true;
  }

  // Cập nhật trạng thái thực thi cho mission
  updateMissionExecutionStatus(missionId, status) {
    const mission = this.settings.groupId?.find(m => m.missionId === missionId);
    if (mission) {
      mission.isExecuting = status.isExecuting || false;
      mission.isActive = status.isActive || false;
      mission.lastExecuted = status.lastExecuted || mission.lastExecuted;
      mission.executionCount = status.executionCount || mission.executionCount;
    }
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // MissionButtonGroupWidget uses external dialog in DesignDashboard
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
    return new MissionButtonGroupWidget({
      id: this.id,
      title: this.title,
      settings: {
        groupId: this.settings.groupId,
        groupName: this.settings.groupName,
        missions: this.settings.missions ? [...this.settings.missions] : []
      },
      colspan: this.colspan,
      rowspan: this.rowspan,
      position: { ...this.position },
      displayMode: this.displayMode,
      properties: this.properties ? { ...this.properties } : {},
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
      displayMode: this.displayMode,
      properties: this.properties,
    };
  }

  // Tạo widget từ JSON
  static fromJSON(data) {
    return new MissionButtonGroupWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      rowspan: data.rowspan,
      displayMode: data.displayMode,
      properties: data.properties,
    });
  }

  // Render component React với 2 chế độ hiển thị
  render(onEdit) {
    return React.createElement(MissionButtonGroupWidgetComponent, { widget: this, onEdit });
  }
}

export default addResizeSupport(MissionButtonGroupWidget); 