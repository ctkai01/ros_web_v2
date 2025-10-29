class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
    this.dialogs = new Map();
    this.globalState = {
      selectedWidgets: [],
      currentEditingWidget: null
    };
    this.updateCallbacks = new Map();
  }

  // Đăng ký widget type
  registerWidget(type, widgetClass) {
    this.widgets.set(type, widgetClass);
  }

  // Đăng ký dialog component cho widget
  registerDialog(type, dialogComponent) {
    this.dialogs.set(type, dialogComponent);
  }

  // Đăng ký callback để cập nhật state
  registerUpdateCallback(callback) {
    const id = Date.now();
    this.updateCallbacks.set(id, callback);
    return id;
  }

  // Gọi tất cả update callbacks
  notifyUpdate() {
    this.updateCallbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback(this.globalState.selectedWidgets);
      }
    });
  }

  // Lấy dialog component
  getDialogComponent(type) {
    return this.dialogs.get(type);
  }

  // Lấy widget class
  getWidget(type) {
    const widget = this.widgets.get(type);
    return widget;
  }

  // Cập nhật global state
  updateGlobalState(newState) {
    this.globalState = { ...this.globalState, ...newState };
    this.notifyUpdate();
  }

  // Handle edit widget
  handleWidgetEdit(widgetId, widget) {
    this.globalState.currentEditingWidget = widget;

    // Check if widget has registered dialog
    const dialogComponent = this.getDialogComponent(widget.type);
    if (dialogComponent) {

      // Create dialog props
      const dialogProps = {
        isOpen: true,
        widget: widget,
        onClose: () => this.handleDialogClose(widgetId),
        onSave: (data) => this.handleWidgetSave(widgetId, data),
        onDelete: () => this.handleWidgetDelete(widgetId)
      };


      return {
        hasDialog: true,
        dialogComponent: dialogComponent,
        dialogProps: dialogProps,
        widget: widget
      };
    }

    return {
      hasDialog: false,
      widget: widget
    };
  }

  // Handle dialog close
  handleDialogClose(widgetId) {
    this.globalState.currentEditingWidget = null;
    this.notifyUpdate();
  }

  // Handle save widget
  handleWidgetSave(widgetId, updatedData) {
    this.notifyUpdate();
  }

  // Handle delete widget
  handleWidgetDelete(widgetId) {
    this.notifyUpdate();
  }
}

// Singleton instance
const widgetRegistry = new WidgetRegistry();

export default widgetRegistry; 