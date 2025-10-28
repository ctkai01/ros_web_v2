import * as THREE from 'three';
import { DrawPosition } from './drawPosition.js';
import './PositionToolbar.css';

class PositionToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.container = null;
        this.isVisible = false;
        this.currentTool = null;

        // Tool states
        this.tools = {
            addPosition: {
                button: null,
                isActive: false
            },
            selectPosition: {
                button: null,
                isActive: false
            }
        };

        // Action buttons
        this.actionButtons = {
            cancel: null,
            apply: null,
            edit: null,
            delete: null,
            settings: null
        };

        // Dialog callback - will be set by EditMaps.js
        this.onShowDialog = null;

        this.init();
    }

    init() {
        this.createToolbar();
        this.bindEvents();
    }

    // Set dialog callback from EditMaps.js
    setDialogCallback(callback) {
        this.onShowDialog = callback;
    }

    createToolbar() {
        // Create main toolbar container
        this.container = document.createElement('div');
        this.container.className = 'position-tools';
        this.container.style.display = 'none';

        // Create add position section
        this.createAddPositionSection();

        // Create select position section
        this.createSelectPositionSection();

        // Create action buttons
        this.createActionButtons();

        // Add to map-toolbar
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
                    console.error('No suitable container found for PositionToolbar');
                }
            }
        }
    }

    createAddPositionSection() {
        // Add position button
        this.tools.addPosition.button = this.createButton('Add Position', 'positions-icon', 'position-add-button');
        this.container.appendChild(this.tools.addPosition.button);
    }

    createSelectPositionSection() {
        // Select position button
        this.tools.selectPosition.button = this.createButton('Edit Position', 'cursor-icon', 'position-select-button');
        this.container.appendChild(this.tools.selectPosition.button);
    }

    createActionButtons() {
        // Create action buttons container
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'position-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'position-apply-changes-button');
        this.actionButtons.edit = this.createButton('Edit position', 'position-edit-icon', 'position-edit-button');
        this.actionButtons.delete = this.createButton('Delete position', 'delete-icon', 'position-delete-button');
        this.actionButtons.settings = this.createButton('Position settings', 'settings-icon', 'position-settings-button');

        // Initially hide all action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';
        this.actionButtons.settings.style.display = 'none';

        // Add action buttons to the main container
        this.container.appendChild(this.actionButtons.cancel);
        this.container.appendChild(this.actionButtons.apply);
        this.container.appendChild(this.actionButtons.edit);
        this.container.appendChild(this.actionButtons.delete);
        this.container.appendChild(this.actionButtons.settings);
    }

    createButton(title, iconClass, id) {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.title = title;
        button.id = id;

        const icon = document.createElement('span');
        icon.className = `tool-icon ${iconClass}`;

        // Use SVG icons for buttons
        if (id === 'position-cancel-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="15" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="5" x2="5" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`;
        } else if (id === 'position-apply-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="5,11 9,15 15,6" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        } else if (id === 'position-settings-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#000" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#000" stroke-width="2" fill="none"/></svg>`;
        }

        button.appendChild(icon);
        return button;
    }

    bindEvents() {
        // Add position button
        this.tools.addPosition.button.addEventListener('click', () => this.handleAddPosition());

        // Select position button
        this.tools.selectPosition.button.addEventListener('click', () => this.handleSelectPosition());

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesPosition());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
        this.actionButtons.edit.addEventListener('click', () => this.handleEditPosition());
        this.actionButtons.delete.addEventListener('click', () => this.handleDeletePosition());
        this.actionButtons.settings.addEventListener('click', () => this.handleSettingsPosition());
    }

    // Tool handlers
    handleAddPosition() {
        if (this.tools.addPosition.isActive) {
            this.tools.addPosition.isActive = false;
            this.tools.addPosition.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.addPosition.isActive = true;
        this.tools.addPosition.button.classList.add('active');

        this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_POSITION);

        // Enable drawing in the DrawPosition tool
        if (this.map2D.toolDrawPosition) {
            this.map2D.toolDrawPosition.setMode('create');
            this.map2D.toolDrawPosition.enable();

            // Set up dialog callbacks
            this.map2D.toolDrawPosition.setDialogCallbacks(
                this.handlePositionCreated.bind(this),
                this.handlePositionUpdated.bind(this),
                this.handleDialogClose.bind(this)
            );
        }

        this.showActionButtons();
    }

    handleSelectPosition() {
        // Check if already active to avoid double-click issues
        if (this.tools.selectPosition.isActive) {
            this.tools.selectPosition.isActive = false;
            this.tools.selectPosition.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();

            if (this.map2D.toolDrawPosition) {
                this.map2D.toolDrawPosition.cancelPositionsToMap();
                this.map2D.toolDrawPosition.clearCurrentState();
                this.map2D.toolDrawPosition.disable();
            }
            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.selectPosition.isActive = true;
        this.tools.selectPosition.button.classList.add('active');

        this.map2D.setToolMapMode(true, this.map2D.MouseMode.SELECT_POSITION);

        // Enable select mode in the DrawPosition tool
        if (this.map2D.toolDrawPosition) {
            this.map2D.toolDrawPosition.setMode('select');
            this.map2D.toolDrawPosition.enable();

            // Set up dialog callbacks
            this.map2D.toolDrawPosition.setDialogCallbacks(
                this.handlePositionCreated.bind(this),
                this.handlePositionUpdated.bind(this),
                this.handleDialogClose.bind(this)
            );
        }

        this.showActionButtons();
    }

    // Dialog handlers
    handlePositionCreated(positionData) {
        console.log('Position created:', positionData);
        // Handle position creation - could save to server here
    }

    handlePositionUpdated(positionData) {
        console.log('Position updated:', positionData);
        // Handle position update - could save to server here
    }

    handleDialogClose(shouldShow) {
        if (shouldShow && this.onShowDialog) {
            // Get pending position data from the tool
            const pendingPosition = this.map2D.toolDrawPosition?.getPendingPosition();
            const mode = this.map2D.toolDrawPosition?.getMode() === 'create' ? 'create' : 'edit';

            // Call the callback to show dialog in EditMaps.js
            this.onShowDialog(pendingPosition, mode);
        }
    }

    cancelChangesPosition() {
        this.map2D.setToolMapMode(false);
        this.hideActionButtons();
        this.deactivateAllTools();

        if (this.map2D.toolDrawPosition) {
            this.map2D.toolDrawPosition.cancelPositionsToMap();
            this.map2D.toolDrawPosition.clearCurrentState();
            this.map2D.toolDrawPosition.disable();
        }
    }

    handleApplyChanges() {
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
    }

    handleEditPosition() {
        console.log('handleEditPosition called');
        if (this.map2D && this.map2D.toolDrawPosition) {

            // Check if a position is selected before trying to edit
            if (!this.map2D.toolDrawPosition.hasSelectedPosition()) {
                console.warn('No position selected for editing');
                alert('Please select a position first before editing');
                return;
            }

            const selectedPosition = this.map2D.toolDrawPosition.getSelectedPosition();
            //console.log('Selected position:', selectedPosition);

            this.map2D.toolDrawPosition.editSelectedPosition();

            // Hide edit actions and show apply/cancel buttons after successful edit
            this.hideEditActions();
            this.showActionButtons(); // Show apply/cancel buttons for editing
        } else {
            console.error('Map2D or toolDrawPosition not available');
        }
    }

    handleDeletePosition() {
        if (this.map2D && this.map2D.toolDrawPosition) {
            this.map2D.toolDrawPosition.deleteSelectedPosition();
            this.hideEditActions();
        }
    }

    handleSettingsPosition() {
        console.log('handleSettingsPosition called');
        if (this.map2D && this.map2D.toolDrawPosition) {
            // Check if a position is selected before trying to edit
            if (!this.map2D.toolDrawPosition.hasSelectedPosition()) {
                console.warn('No position selected for settings');
                alert('Please select a position first before opening settings');
                return;
            }

            const selectedPosition = this.map2D.toolDrawPosition.getSelectedPosition();
            console.log('Selected position for settings:', selectedPosition);

            // Show settings dialog for the selected position
            this.map2D.toolDrawPosition.showSettingsDialog(selectedPosition.data);
        } else {
            console.error('Map2D or toolDrawPosition not available');
        }
    }

    // Show edit/delete actions for selected position
    showEditActions(positionId) {
        this.actionButtons.edit.style.display = 'flex';
        this.actionButtons.delete.style.display = 'flex';
        this.actionButtons.settings.style.display = 'flex';
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        console.log('Edit actions shown for position:', positionId);
    }

    // Hide edit/delete actions
    hideEditActions() {
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';
        this.actionButtons.settings.style.display = 'none';
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        console.log('Edit actions hidden');
    }

    // Utility methods
    deactivateAllTools() {
        Object.values(this.tools).forEach(tool => {
            tool.isActive = false;
            if (tool.button) {
                tool.button.classList.remove('active');
            }
        });

        // Disable select mode if select tool was active
        if (this.map2D && this.map2D.toolDrawPosition) {
            this.map2D.toolDrawPosition.disableSelectMode();
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
        console.log('PositionToolbar: show() called');
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_POSITION) {
            this.tools.addPosition.isActive = true;
            this.tools.addPosition.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.SELECT_POSITION) {
            this.tools.selectPosition.isActive = true;
            this.tools.selectPosition.button.classList.add('active');
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

export { PositionToolbar }; 