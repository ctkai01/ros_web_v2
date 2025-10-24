import React from 'react';
import './MapWidget.css';
import MapWidgetComponent from './MapWidgetComponent';
import { addResizeSupport } from '../WidgetResizeMixin';

class MapWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = 'map';
    this.title = config.title || 'Map';
    this.settings = config.settings || 'No settings';
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 3;
    this.rowspan = config.rowspan || 3;
    this.displayMode = config.displayMode || 'design';
  }

  generateId() {
    return 'map-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
    return new MapWidget({
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
    return new MapWidget({
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
    return React.createElement(MapWidgetComponent, { widget: this, onEdit });
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return false; // MapWidget uses WidgetRegistry for dialog handling
  }
}

// Thêm resize support và export
export default addResizeSupport(MapWidget); 