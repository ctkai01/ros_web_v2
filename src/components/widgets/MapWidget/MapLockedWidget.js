import React from "react";
import { addResizeSupport } from "../../common/WidgetResizeMixin.js";
import "./MapWidget.css";
import MapWidgetComponent from "./MapWidgetComponent.jsx";

class MapLockedWidget {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.type = "map-locked";
    this.title = config.title || "Map Locked";
    this.position = config.position || { row: 0, col: 0 };
    this.colspan = config.colspan || 3;
    this.rowspan = config.rowspan || 3;
    this.size = config.size || { width: "auto", height: "auto" };
    this.displayMode = config.displayMode || "design";

    this.settings = config.settings || {
      mapId: config.mapId || null,
      mapName: config.mapName || null,
    };
  }

  generateId() {
    return (
      "map-locked-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
    );
  }

  isMissionButton() {
    return false;
  }

  isEmpty() {
    return this.type === "empty";
  }

  // Update map selection
  updateSettings(settings) {
    console.log("🎭 MapLockedWidget: updateMap called with mapData:", settings);
    if (settings) {
      this.settings.mapId = settings.mapId;
      this.settings.mapName = settings.mapName;
    } else {
      this.settings.mapId = null;
      this.settings.mapName = null;
    }
    return this;
  }

  // Check if map is locked to a specific map
  isMapLocked() {
    return this.mapId !== null && this.mapName !== null;
  }

  // Get map info
  getMapInfo() {
    return {
      id: this.mapId,
      name: this.mapName,
    };
  }

  // Set widget mode
  setDesignMode() {
    this.displayMode = "design";
    return this;
  }

  setDisplayMode() {
    this.displayMode = "display";
    return this;
  }

  isDesignMode() {
    return this.displayMode === "design";
  }

  isDisplayMode() {
    return this.displayMode === "display";
  }

  // Update widget position
  updatePosition(position) {
    this.position = { ...this.position, ...position };
    return this;
  }

  // Update widget colspan
  updateColspan(colspan) {
    this.colspan = colspan > 1 ? colspan : 1;

    return this;
  }

  // Clone widget
  clone() {
    const clonedData = {
      id: this.id,
      type: this.type,
      title: this.title,
      settings: { ...this.settings },
      position: { ...this.position },
      colspan: this.colspan,
      rowspan: this.rowspan,
      size: { ...this.size },
      displayMode: this.displayMode,
    };

    return new MapLockedWidget(clonedData);
  }

  // Convert to JSON for saving
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      settings: { ...this.settings },
      position: this.position,
      colspan: this.colspan,
      rowspan: this.rowspan,
      size: this.size,
      displayMode: this.displayMode,
    };
  }

  // Create from JSON data
  static fromJSON(data) {
    return new MapLockedWidget(data);
  }

  // Render widget - look exactly like MapWidget
  render(onEdit) {
    // Use the same component structure as MapWidget but with map-locked specific logic
    if (this.displayMode === "display") {
      return this.renderDisplayMode(onEdit);
    } else {
      return this.renderDesignMode(onEdit);
    }
  }

  // Check if widget can handle its own edit
  canHandleOwnEdit() {
    return true; // MapLockedWidget handles its own dialog internally
  }

  renderDesignMode(onEdit) {
    return React.createElement(
      "div",
      {
        className: "map-widget design-mode",
        "data-widget-id": this.id,
      },
      [
        React.createElement(
          "div",
          { key: "header", className: "widget-header" },
          [
            React.createElement(
              "div",
              { key: "info", className: "widget-info" },
              [
                React.createElement(
                  "h3",
                  { key: "title", className: "widget-title" },
                  this.title
                ),
                React.createElement(
                  "p",
                  { key: "settings", className: "widget-settings" },
                  this.settings
                    ? this.settings.mapId
                      ? this.settings.mapName
                      : "No map selected"
                    : "No settings"
                ),
              ]
            ),
          ]
        ),
        onEdit &&
          React.createElement(
            "button",
            {
              key: "edit-btn",
              className: "widget-edit-btn",
              onClick: () => onEdit(this.id),
              title: "Edit map selection",
            },
            React.createElement("span", { className: "edit-icon" })
          ),
      ]
    );
  }

  renderDisplayMode(onEdit) {
    return React.createElement(
      "div",
      {
        className: "map-widget display-mode",
        "data-widget-id": this.id,
      },
      [
        React.createElement(
          "div",
          { key: "header", className: "widget-header" },
          [
            React.createElement(
              "div",
              { key: "info", className: "widget-info" },
              [
                React.createElement(
                  "h3",
                  { key: "title", className: "widget-title" },
                  this.title
                ),
                React.createElement(
                  "p",
                  { key: "settings", className: "widget-settings" },
                  this.settings
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "controls", className: "map-controls" },
              [
                React.createElement(
                  "button",
                  {
                    key: "zoom-in",
                    className: "zoom-in-btn",
                    onClick: () => this.zoomIn(),
                    title: "Zoom In",
                  },
                  "🔍+"
                ),
                React.createElement(
                  "button",
                  {
                    key: "zoom-out",
                    className: "zoom-out-btn",
                    onClick: () => this.zoomOut(),
                    title: "Zoom Out",
                  },
                  "🔍-"
                ),
                React.createElement(
                  "button",
                  {
                    key: "reset",
                    className: "reset-view-btn",
                    onClick: () => this.resetZoom(),
                    title: "Reset View",
                  },
                  "🎯"
                ),
                React.createElement(
                  "button",
                  {
                    key: "grid",
                    className: `grid-btn ${this.showGrid ? "active" : ""}`,
                    onClick: () => this.toggleGrid(),
                    title: "Toggle Grid",
                  },
                  "⚏"
                ),
              ]
            ),
          ]
        ),
        this.isMapLocked()
          ? React.createElement(MapWidgetComponent, {
              key: "map-content",
              widget: this,
              onEdit: onEdit,
            })
          : React.createElement(
              "div",
              { key: "no-map", className: "no-map-selected" },
              [
                React.createElement("p", { key: "text" }, "No map selected"),
                React.createElement(
                  "button",
                  {
                    key: "select-btn",
                    className: "select-map-btn",
                    onClick: () => onEdit && onEdit(this.id),
                  },
                  "Select Map"
                ),
              ]
            ),
      ]
    );
  }
}

// Add resize support
addResizeSupport(MapLockedWidget);

export default MapLockedWidget;
