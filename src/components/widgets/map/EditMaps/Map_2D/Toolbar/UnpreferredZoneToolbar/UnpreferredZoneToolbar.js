import { DrawUnpreferredZone } from './drawUnpreferredZone.js';
import './UnpreferredZoneToolbar.css';

class UnpreferredZoneToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.container = null;
        this.isVisible = false;
        this.currentTool = null;

        // Tool states
        this.tools = {
            drawZone: {
                button: null,
                isActive: false
            },
            cursor: {
                button: null,
                isActive: false
            }
        };

        // Action buttons
        this.actionButtons = {
            cancel: null,
            apply: null,
            edit: null,
            delete: null
        };

        this.init();
    }

    init() {
        this.createToolbar();
        this.bindEvents();
    }

    createToolbar() {
        // Create main toolbar container
        this.container = document.createElement('div');
        this.container.className = 'unpreferred-zone-tools';
        this.container.style.display = 'none';

        // Create draw zone section
        this.createDrawZoneSection();

        // Create cursor section
        this.createCursorSection();

        // Create action buttons
        this.createActionButtons();

        // Add to map-toolbar instead of map container
        this.addToMapToolbar();
    }

    addToMapToolbar() {
        // Find the toolbar-left-group div
        const toolbarLeftGroup = document.querySelector('.toolbar-left-group');
        if (toolbarLeftGroup) {
            toolbarLeftGroup.appendChild(this.container);
        } else {
            // Fallback to map-toolbar if toolbar-left-group not found
            const mapToolbar = document.querySelector('.map-toolbar');
            if (mapToolbar) {
                mapToolbar.appendChild(this.container);
            } else {
                // Final fallback to map container
                if (this.map2D.container) {
                    this.map2D.container.appendChild(this.container);
                } else {
                    console.error('No suitable container found for UnpreferredZoneToolbar');
                }
            }
        }
    }

    createDrawZoneSection() {
        // Draw zone button
        this.tools.drawZone.button = this.createButton('Draw Unpreferred Zone', 'draw-unpreferredzones-icon', 'unpreferred-zone-draw-button');
        this.container.appendChild(this.tools.drawZone.button);
    }

    createCursorSection() {
        // Cursor button
        this.tools.cursor.button = this.createButton('Cursor', 'cursor-icon', 'unpreferred-zone-cursor-button');
        this.container.appendChild(this.tools.cursor.button);
    }

    createActionButtons() {
        // Create action buttons container that will be placed directly on map-toolbar
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'unpreferred-zone-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'unpreferred-zone-apply-changes-button');
        this.actionButtons.edit = this.createButton('Edit zone', 'unpreferred-zone-edit-icon', 'unpreferred-zone-edit-button');
        this.actionButtons.delete = this.createButton('Delete zone', 'delete-icon', 'unpreferred-zone-delete-button');

        // Initially hide all action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';

        // Add action buttons directly to the main container
        this.container.appendChild(this.actionButtons.cancel);
        this.container.appendChild(this.actionButtons.apply);
        this.container.appendChild(this.actionButtons.edit);
        this.container.appendChild(this.actionButtons.delete);
    }

    createButton(title, iconClass, id) {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.title = title;
        button.id = id;

        const icon = document.createElement('span');
        icon.className = `tool-icon ${iconClass}`;

        // Use SVG icons for cancel and apply buttons (similar to VirtualWallToolbar)
        if (id === 'unpreferred-zone-cancel-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="15" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="5" x2="5" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`;
        } else if (id === 'unpreferred-zone-apply-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="5,11 9,15 15,6" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }

        button.appendChild(icon);
        return button;
    }

    bindEvents() {
        // Draw zone button
        this.tools.drawZone.button.addEventListener('click', () => this.handleDrawZone());

        // Cursor button
        this.tools.cursor.button.addEventListener('click', () => this.handleCursor());

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesUnpreferredZone());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
        this.actionButtons.edit.addEventListener('click', () => this.handleEditZone());
        this.actionButtons.delete.addEventListener('click', () => this.handleDeleteZone());
    }

    // Tool handlers
    handleDrawZone() {
        if (this.tools.drawZone.isActive) {
            this.tools.drawZone.isActive = false;
            this.tools.drawZone.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.drawZone.isActive = true;
        this.tools.drawZone.button.classList.add('active');

        this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_UNPREFERRED_ZONE);

        // Enable drawing in the DrawUnpreferredZone tool
        if (this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.setMode('create');
            this.map2D.toolDrawUnpreferredZone.enable();
        }

        this.showActionButtons();
    }

    handleCursor() {

        if (this.tools.cursor.isActive) {
            this.tools.cursor.isActive = false;
            this.tools.cursor.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.cursor.isActive = true;
        this.tools.cursor.button.classList.add('active');

        this.map2D.setToolMapMode(true, this.map2D.MouseMode.SELECT_UNPREFERRED_ZONE);

        // Enable select mode in the DrawUnpreferredZone tool
        if (this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.setMode('select');
            this.map2D.toolDrawUnpreferredZone.enable();
        }   

        this.showActionButtons();
    }

    cancelChangesUnpreferredZone() {
        this.map2D.cancelMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();

        if (this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.clearCurrentState();
            this.map2D.toolDrawUnpreferredZone.disable();
        }
    }

    handleApplyChanges() {
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
    }

    handleEditZone() {
        if (this.map2D && this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.editSelectedPolygon();
            this.hideEditActions();
            this.showActionButtons(); // Show apply/cancel buttons for editing
        }
    }

    handleDeleteZone() {
        if (this.map2D && this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.deleteSelectedPolygon();
            this.hideEditActions();
        }
    }

    // Show edit/delete actions for selected zone
    showEditActions(zoneId) {
        this.actionButtons.edit.style.display = 'flex';
        this.actionButtons.delete.style.display = 'flex';
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
    }

    // Hide edit/delete actions
    hideEditActions() {
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
    }

    // Utility methods
    deactivateAllTools() {
        Object.values(this.tools).forEach(tool => {
            tool.isActive = false;
            if (tool.button) {
                tool.button.classList.remove('active');
            }
        });

        // Disable select mode if cursor tool was active
        if (this.map2D && this.map2D.toolDrawUnpreferredZone) {
            this.map2D.toolDrawUnpreferredZone.disableSelectMode();
        }
    }

    showActionButtons() {
        this.actionButtons.cancel.style.display = 'flex';
        this.actionButtons.apply.style.display = 'flex';
    }

    hideActionButtons() {
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
    }

    show() {
        console.log('UnpreferredZoneToolbar: show() called');
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.container.classList.remove('hidden');
    }

    hide() {
        this.isVisible = false;
        this.container.classList.add('hidden');
        setTimeout(() => {
            if (!this.isVisible) {
                this.container.style.display = 'none';
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_UNPREFERRED_ZONE) {
            this.tools.drawZone.isActive = true;
            this.tools.drawZone.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.SELECT_UNPREFERRED_ZONE) {
            this.tools.cursor.isActive = true;
            this.tools.cursor.button.classList.add('active');
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

export { UnpreferredZoneToolbar }; 