// Mixin để thêm resize functionality vào widget classes
export const WidgetResizeMixin = {
  // Update widget size
  updateSize(width, height) {
    // Round to nearest grid unit to prevent jumping
    const gridUnitWidth = Math.round(width / 15) * 15; // 15px is the grid gap
    const gridUnitHeight = Math.round(height / 15) * 15;

    this.properties = {
      ...this.properties,
      width: gridUnitWidth,
      height: gridUnitHeight,
      resized: true,
      originalWidth: width,
      originalHeight: height
    };
    return this;
  },

  // Get widget size
  getSize() {
    if (this.properties && this.properties.resized) {
      return {
        width: this.properties.width,
        height: this.properties.height,
        originalWidth: this.properties.originalWidth,
        originalHeight: this.properties.originalHeight
      };
    }
    return null; // Use default size
  },

  // Check if widget has custom size
  hasCustomSize() {
    return this.properties && this.properties.resized === true;
  }
};

// Function để thêm resize methods vào widget class
export const addResizeSupport = (WidgetClass) => {
  // Thêm methods từ mixin vào prototype
  Object.assign(WidgetClass.prototype, WidgetResizeMixin);
  
  return WidgetClass;
};

export default WidgetResizeMixin; 