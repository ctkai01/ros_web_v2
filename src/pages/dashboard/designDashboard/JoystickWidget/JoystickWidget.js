import React from 'react';
import './JoystickWidget.css';
import JoystickWidgetComponent from './JoystickWidgetComponent.jsx';
import { addResizeSupport } from '../WidgetResizeMixin';

class JoystickWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'joystick';
    this.title = config.title || 'Joystick';
    this.settings = config.settings || 'No settings';
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 2;
    this.rowspan = config.rowspan || 2;
    this.displayMode = config.displayMode || 'design';
  }

  generateId() {
    return 'joystick-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  isMissionButton() {
    return false;
  }

  isEmpty() {
    return this.type === 'empty';
  }

  updateData(data) {
    return this;
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
    return new JoystickWidget({
      id: this.id,
      title: this.title,
      settings: this.settings,
      position: { ...this.position },
      colspan: this.colspan,
      rowspan: this.rowspan,
      displayMode: this.displayMode,
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
      displayMode: this.displayMode,
    };
  }

  static fromJSON(data) {
    return new JoystickWidget({
      id: data.id,
      title: data.title,
      settings: data.settings,
      position: data.position,
      colspan: data.colspan,
      rowspan: data.rowspan,
      displayMode: data.displayMode,
    });
  }

  render(onEdit) {
    return React.createElement(JoystickWidgetComponent, { widget: this, onEdit });
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // JoystickWidget uses WidgetRegistry for dialog handling
  }
}

// Thêm resize support và export
export default addResizeSupport(JoystickWidget); 