class Widget {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.type = data.type || 'default';
    this.title = data.title || '';
    this.settings = data.settings || '';
    this.position = data.position || { row: 0, col: 0 };
    this.colspan = data.colspan || 1;
    this.rowspan = data.rowspan || 1;
    
    // Mission button specific properties
    this.missionId = data.missionId || null;
    this.missionName = data.missionName || null;
    
    // Other widget type specific properties can be added here
    this.properties = data.properties || {};
  }

  // Update widget settings
  updateSettings(newSettings) {
    this.settings = newSettings;
    return this;
  }

  // Update mission for mission button widgets
  updateMission(missionData) {
    if (this.title === 'Mission button') {
      if (missionData) {
        this.missionId = missionData.id;
        this.missionName = missionData.name;
        this.settings = missionData.name;
      } else {
        this.missionId = null;
        this.missionName = null;
        this.settings = 'No mission';
      }
    }
    return this;
  }

  // Update widget position
  updatePosition(position) {
    this.position = { ...this.position, ...position };
    return this;
  }

  // Update widget colspan
  updateColspan(colspan) {
    this.colspan =  colspan > 1 ? colspan : undefined;;

    return this;
  }

  // Update widget size
  updateSize(width, height) {
    this.properties = {
      ...this.properties,
      width: width,
      height: height,
      resized: true
    };
    return this;
  }

  // Get widget size
  getSize() {
    if (this.properties && this.properties.resized) {
      return {
        width: this.properties.width,
        height: this.properties.height
      };
    }
    return null; // Use default size
  }

  // Check if widget has custom size
  hasCustomSize() {
    return this.properties && this.properties.resized === true;
  }

  // Get widget data for saving
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      settings: this.settings,
      position: this.position,
      colspan: this.colspan,
      missionId: this.missionId,
      missionName: this.missionName,
      properties: this.properties
    };
  }

  // Create widget from JSON data
  static fromJSON(data) {
    return new Widget(data);
  }

  // Check if widget is mission button type
  isMissionButton() {
    return this.title === 'Mission button';
  }

  // Check if widget is empty
  isEmpty() {
    return this.type === 'empty';
  }

  // Clone widget
  clone() {
    return new Widget(this.toJSON());
  }
}

export default Widget; 