import { DrawPreferredZone } from "./drawPreferredZone.js";
import "./PreferredZoneToolbar.css";

class PreferredZoneToolbar {
  constructor(map2D) {
    this.map2D = map2D;
    this.container = null;
    this.isVisible = false;
    this.currentTool = null;
    this.lineSettingsPopup = null;
    this.optionButtons = [];
    // Tool states
    this.tools = {
      drawZone: {
        button: null,
        isActive: false,
      },
      cursor: {
        button: null,
        isActive: false,
      },
      lineSettings: {
        button: null,
        isActive: false,
      },
    };

    // Action buttons
    this.actionButtons = {
      cancel: null,
      apply: null,
      edit: null,
      delete: null,
    };

    this.init();
  }

  init() {
    this.createToolbar();
    this.bindEvents();
  }

  createToolbar() {
    // Create main toolbar container
    this.container = document.createElement("div");
    this.container.className = "preferred-zone-tools";
    this.container.style.display = "none";

    // Create draw zone section
    this.createDrawZoneSection();

    // Create line settings section
    this.createLineSettingsSection();

    // Create cursor section
    this.createCursorSection();

    // Create action buttons
    this.createActionButtons();

    // Add to map-toolbar instead of map container
    this.addToMapToolbar();
  }

  addToMapToolbar() {
    // Find the toolbar-left-group div
    const toolbarLeftGroup = document.querySelector(".toolbar-left-group");
    if (toolbarLeftGroup) {
      toolbarLeftGroup.appendChild(this.container);
    } else {
      // Fallback to map-toolbar if toolbar-left-group not found
      const mapToolbar = document.querySelector(".map-toolbar");
      if (mapToolbar) {
        mapToolbar.appendChild(this.container);
      } else {
        // Final fallback to map container
        if (this.map2D.container) {
          this.map2D.container.appendChild(this.container);
        } else {
          console.error("No suitable container found for PreferredZoneToolbar");
        }
      }
    }
  }

  createDrawZoneSection() {
    // Draw zone button

    this.tools.drawZone.button = this.createButton(
      "Draw Preferred Zone",
      "draw-preferredzones-icon",
      "preferred-zone-draw-button"
    );
    this.container.appendChild(this.tools.drawZone.button);
  }

  createLineSettingsSection() {
    // Draw zone button

    this.tools.lineSettings.button = this.createButton(
      "Lines Settings",
      "line-settings-preferredzones-icon",
      "preferred-zone-line-settings-button"
    );
    this.container.appendChild(this.tools.lineSettings.button);

    this.lineSettingsPopup = document.createElement("div");
    this.lineSettingsPopup.className = "line-settings-popup"; // Class để style CSS
    this.lineSettingsPopup.style.display = "none"; // Ban đầu ẩn đi

    // Tiêu đề popup
    const title = document.createElement("h3");
    title.textContent = "Line Settings";
    this.lineSettingsPopup.appendChild(title);

    // Danh sách các tùy chọn
    const options = [
      { name: "Thin Line", style: { color: "blue", width: 2 } },
      { name: "Medium Line", style: { color: "green", width: 5 } },
      { name: "Thick Line (Wall)", style: { color: "red", width: 10 } },
    ];

    options.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.className = "line-option-button";
      optionButton.textContent = option.name;
      optionButton.addEventListener("click", () => {
        // Khi một tùy chọn được click
        console.log("Selected line style:", option.style);
        // Gọi đến tool vẽ để áp dụng style mới
        // if (this.map2D.tool

        this.map2D.toolDrawPreferredZone.setCurrentStyle(option.style);
        // }
        // // Sau khi chọn thì ẩn popup đi
        this.lineSettingsPopup.style.display = "none";
      });
      this.lineSettingsPopup.appendChild(optionButton);
      optionButton.dataset.style = JSON.stringify(option.style);
      this.optionButtons.push(optionButton);
    });

    // Thêm nút đóng popup
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "close-popup-button";
    closeButton.addEventListener("click", () => {
      this.lineSettingsPopup.style.display = "none";
    });
    this.lineSettingsPopup.appendChild(closeButton);

    // Thêm popup vào container chính của toolbar
    this.container.appendChild(this.lineSettingsPopup);
  }

  createCursorSection() {
    // Cursor button
    this.tools.cursor.button = this.createButton(
      "Cursor",
      "cursor-icon",
      "preferred-zone-cursor-button"
    );
    this.container.appendChild(this.tools.cursor.button);
  }

  createActionButtons() {
    // Create action buttons container that will be placed directly on map-toolbar
    this.actionButtons.cancel = this.createButton(
      "Cancel changes",
      "cancel-changes-icon",
      "preferred-zone-cancel-changes-button"
    );
    this.actionButtons.apply = this.createButton(
      "Apply changes",
      "apply-changes-icon",
      "preferred-zone-apply-changes-button"
    );
    this.actionButtons.edit = this.createButton(
      "Edit zone",
      "preferred-zone-edit-icon",
      "preferred-zone-edit-button"
    );
    this.actionButtons.delete = this.createButton(
      "Delete zone",
      "delete-icon",
      "preferred-zone-delete-button"
    );

    // Initially hide all action buttons
    this.actionButtons.cancel.style.display = "none";
    this.actionButtons.apply.style.display = "none";
    this.actionButtons.edit.style.display = "none";
    this.actionButtons.delete.style.display = "none";

    // Add action buttons directly to the main container
    this.container.appendChild(this.actionButtons.cancel);
    this.container.appendChild(this.actionButtons.apply);
    this.container.appendChild(this.actionButtons.edit);
    this.container.appendChild(this.actionButtons.delete);
  }

  createButton(title, iconClass, id) {
    const button = document.createElement("button");
    button.className = "tool-button";
    button.title = title;
    button.id = id;

    const icon = document.createElement("span");
    icon.className = `tool-icon ${iconClass}`;

    // Use SVG icons for cancel and apply buttons (similar to VirtualWallToolbar)
    if (id === "preferred-zone-cancel-changes-button") {
      icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="15" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="5" x2="5" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`;
    } else if (id === "preferred-zone-apply-changes-button") {
      icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="5,11 9,15 15,6" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    button.appendChild(icon);
    return button;
  }

  bindEvents() {
    // Draw zone button
    this.tools.drawZone.button.addEventListener("click", () =>
      this.handleDrawZone()
    );

    this.tools.lineSettings.button.addEventListener("click", () =>
      this.handleLineSettings()
    );

    // Cursor button
    this.tools.cursor.button.addEventListener("click", () =>
      this.handleCursor()
    );

    // Action buttons
    this.actionButtons.cancel.addEventListener("click", () =>
      this.cancelChangesPreferredZone()
    );
    this.actionButtons.apply.addEventListener("click", () =>
      this.handleApplyChanges()
    );
    this.actionButtons.edit.addEventListener("click", () =>
      this.handleEditZone()
    );
    this.actionButtons.delete.addEventListener("click", () =>
      this.handleDeleteZone()
    );
  }

  // Tool handlers
  handleDrawZone() {
    console.log("[Preferred Zone] handleDrawZone");

    if (this.tools.drawZone.isActive) {
      this.tools.drawZone.isActive = false;
      this.tools.drawZone.button.classList.remove("active");
      this.map2D.setToolMapMode(false);
      this.hideActionButtons();
      this.deactivateAllTools();
      return;
    }

    this.map2D.cancelMapTool();
    this.deactivateAllTools();
    this.tools.drawZone.isActive = true;
    this.tools.drawZone.button.classList.add("active");

    this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_PREFERRED_ZONE);

    // Enable drawing in the DrawPreferredZone tool
    if (this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.setMode("create");
      this.map2D.toolDrawPreferredZone.enable();
    }

    this.showActionButtons();
  }

  handleLineSettings() {
    console.log("[Preferred Zone] handleLineSettings");
    if (this.lineSettingsPopup.style.display === "none") {
      this.lineSettingsPopup.style.display = "block"; // Hiện popup
      const currentStyle = this.map2D.toolDrawPreferredZone.getCurrentStyle();
      const currentStyleStr = JSON.stringify(currentStyle);
      console.log("Current line style:", currentStyle);
      this.optionButtons.forEach((btn) => {
        // So sánh style của nút với style hiện tại
        console.log("Button style:", btn);
        if (btn.dataset.style === currentStyleStr) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    } else {
      this.lineSettingsPopup.style.display = "none"; // Ẩn popup
    }
  }

  handleCursor() {
    if (this.tools.cursor.isActive) {
      this.tools.cursor.isActive = false;
      this.tools.cursor.button.classList.remove("active");
      this.map2D.setToolMapMode(false);
      this.hideActionButtons();
      this.deactivateAllTools();
      return;
    }

    this.map2D.cancelMapTool();
    this.deactivateAllTools();
    this.tools.cursor.isActive = true;
    this.tools.cursor.button.classList.add("active");

    this.map2D.setToolMapMode(true, this.map2D.MouseMode.SELECT_PREFERRED_ZONE);

    // Enable select mode in the DrawPreferredZone tool
    if (this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.setMode("select");
      this.map2D.toolDrawPreferredZone.enable();
    }

    this.showActionButtons();
  }

  cancelChangesPreferredZone() {
    this.map2D.cancelMapTool();
    this.hideActionButtons();
    this.deactivateAllTools();

    if (this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.clearCurrentState();
      this.map2D.toolDrawPreferredZone.disable();
    }
  }

  handleApplyChanges() {
    console.log("[Preferred Zone] handleApplyChanges");
    this.map2D.applyMapTool();
    this.hideActionButtons();
    this.deactivateAllTools();
  }

  handleEditZone() {
    if (this.map2D && this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.editSelectedLine();
      // this.map2D.toolDrawPreferredZone.editSelectedPolygon();
      this.hideEditActions();
      this.showActionButtons(); // Show apply/cancel buttons for editing
    }
  }

  handleDeleteZone() {
    if (this.map2D && this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.deleteSelectedLine();
      this.hideEditActions();
    }
  }

  // Show edit/delete actions for selected zone
  showEditActions(zoneId) {
    this.actionButtons.edit.style.display = "flex";
    this.actionButtons.delete.style.display = "flex";
    this.actionButtons.cancel.style.display = "none";
    this.actionButtons.apply.style.display = "none";
  }

  // Hide edit/delete actions
  hideEditActions() {
    this.actionButtons.edit.style.display = "none";
    this.actionButtons.delete.style.display = "none";
    this.actionButtons.cancel.style.display = "none";
    this.actionButtons.apply.style.display = "none";
  }

  // Utility methods
  deactivateAllTools() {
    Object.values(this.tools).forEach((tool) => {
      tool.isActive = false;
      if (tool.button) {
        tool.button.classList.remove("active");
      }
    });

    // Disable select mode if cursor tool was active
    if (this.map2D && this.map2D.toolDrawPreferredZone) {
      this.map2D.toolDrawPreferredZone.disableSelectMode();
    }
  }

  showActionButtons() {
    this.actionButtons.cancel.style.display = "flex";
    this.actionButtons.apply.style.display = "flex";
  }

  hideActionButtons() {
    this.actionButtons.cancel.style.display = "none";
    this.actionButtons.apply.style.display = "none";
  }

  show() {
    console.log("PreferredZoneToolbar: show() called");
    this.isVisible = true;
    this.container.style.display = "flex";
    this.container.classList.remove("hidden");
  }

  hide() {
    this.isVisible = false;
    this.container.classList.add("hidden");
    setTimeout(() => {
      if (!this.isVisible) {
        this.container.style.display = "none";
      }
    }, 300);
    this.deactivateAllTools();
    this.hideActionButtons();
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Get current tool state
  getCurrentTool() {
    return this.currentTool;
  }

  // Update tool states based on map2D state
  updateFromMap2D() {
    if (
      this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_PREFERRED_ZONE
    ) {
      this.tools.drawZone.isActive = true;
      this.tools.drawZone.button.classList.add("active");
    } else if (
      this.map2D.currentMouseMode === this.map2D.MouseMode.SELECT_PREFERRED_ZONE
    ) {
      this.tools.cursor.isActive = true;
      this.tools.cursor.button.classList.add("active");
    }
  }

  // Cleanup
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

export { PreferredZoneToolbar };
