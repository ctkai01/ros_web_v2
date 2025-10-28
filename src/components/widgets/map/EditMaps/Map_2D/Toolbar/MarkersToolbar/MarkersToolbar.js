import { DrawMarkers } from './drawMarkers.js';
import './MarkersToolbar.css';

class MarkersToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.container = null;
        this.isVisible = false;
        this.currentTool = null;

        // Tool states
        this.tools = {
            addMarker: {
                button: null,
                isActive: false
            },
            selectMarker: {
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
        this.container.className = 'markers-tools';
        this.container.style.display = 'none';

        // Create add marker section
        this.createAddMarkerSection();

        // Create select marker section
        this.createSelectMarkerSection();

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
                    console.error('No suitable container found for MarkersToolbar');
                }
            }
        }
    }

    createAddMarkerSection() {
        // Add marker button
        this.tools.addMarker.button = this.createButton('Add Marker', 'marker-icon', 'marker-add-button');
        this.container.appendChild(this.tools.addMarker.button);
    }

    createSelectMarkerSection() {
        // Select marker button
        this.tools.selectMarker.button = this.createButton('Select Marker', 'cursor-icon', 'marker-select-button');
        this.container.appendChild(this.tools.selectMarker.button);
    }

    createActionButtons() {
        // Create action buttons container
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'marker-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'marker-apply-changes-button');
        this.actionButtons.edit = this.createButton('Edit marker', 'marker-edit-icon', 'marker-edit-button');
        this.actionButtons.delete = this.createButton('Delete marker', 'delete-icon', 'marker-delete-button');
        
        // Initially hide all action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';
        
        // Add action buttons to the main container
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


        button.appendChild(icon);
        return button;
    }

    bindEvents() {
        // Add marker button
        this.tools.addMarker.button.addEventListener('click', () => this.handleAddMarker());

        // Select marker button
        this.tools.selectMarker.button.addEventListener('click', () => this.handleSelectMarker());

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesMarker());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
        this.actionButtons.edit.addEventListener('click', () => this.handleEditMarker());
        this.actionButtons.delete.addEventListener('click', () => this.handleDeleteMarker());
    }

    // Tool handlers
    handleAddMarker() {
        if (this.tools.addMarker.isActive) {
            this.tools.addMarker.isActive = false;
            this.tools.addMarker.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.deactivateAllTools();
            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.addMarker.isActive = true;
        this.tools.addMarker.button.classList.add('active');
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_MARKER);
        
        // Show dialog immediately for marker creation
        if (this.onShowDialog) {
            this.onShowDialog(null, 'create');
        }
        
        // No need to show action buttons for add marker - dialog handles everything
    }

    handleSelectMarker() {
        if (this.tools.selectMarker.isActive) {
            this.tools.selectMarker.isActive = false;
            this.tools.selectMarker.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.hideEditActions();
            this.deactivateAllTools();
            this.map2D.toolDrawMarkers.clearCurrentState();

            return;
        }

        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.selectMarker.isActive = true;
        this.tools.selectMarker.button.classList.add('active');
        
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.SELECT_MARKER);
        
        // Enable select mode in the DrawMarkers tool
        if (this.map2D.toolDrawMarkers) {
            this.map2D.toolDrawMarkers.setMode('select');
            this.map2D.toolDrawMarkers.enable();
            
            // Set up dialog callbacks
            this.map2D.toolDrawMarkers.setDialogCallbacks(
                this.handleMarkerCreated.bind(this),
                this.handleMarkerUpdated.bind(this),
                this.handleDialogClose.bind(this)
            );
        }
        
        this.showActionButtons();
    }

    // Dialog handlers
    handleMarkerCreated(markerData) {
        console.log('Marker created:', markerData);
        // Handle marker creation - could save to server here
    }

    handleMarkerUpdated(markerData) {
        console.log('Marker updated:', markerData);
        // Handle marker update - could save to server here
    }

    handleDialogClose(shouldShow) {
        if (shouldShow && this.onShowDialog) {
            // Get pending marker data from the tool
            const pendingMarker = this.map2D.toolDrawMarkers?.getPendingMarker();
            const mode = this.map2D.toolDrawMarkers?.getMode() === 'create' ? 'create' : 'edit';
            
            // Call the callback to show dialog in EditMaps.js
            this.onShowDialog(pendingMarker, mode);
        }
    }

    cancelChangesMarker() {
        this.map2D.cancelMapTool();
        this.hideActionButtons();
        this.hideEditActions();
        this.deactivateAllTools();
        
        if (this.map2D.toolDrawMarkers) {
            this.map2D.toolDrawMarkers.clearCurrentState();
            this.map2D.toolDrawMarkers.disable();
        }
    }

    handleApplyChanges() {
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
    }

    handleEditMarker() {
        console.log('handleEditMarker called');
        if (this.map2D && this.map2D.toolDrawMarkers) {
            // Debug current state
            
            // Check if a marker is selected before trying to edit
            if (!this.map2D.toolDrawMarkers.hasSelectedMarker()) {
                console.warn('No marker selected for editing');
                alert('Please select a marker first before editing');
                return;
            }
            
            const selectedMarker = this.map2D.toolDrawMarkers.getSelectedMarker();
            
            this.map2D.toolDrawMarkers.editSelectedMarker();
            
            // Hide edit actions and show apply/cancel buttons after successful edit
            this.hideEditActions();
            this.showActionButtons(); // Show apply/cancel buttons for editing
        } else {
            console.error('Map2D or toolDrawMarkers not available');
        }
    }

    handleDeleteMarker() {
        if (this.map2D && this.map2D.toolDrawMarkers) {
            // Check if a marker is selected before trying to delete
            if (!this.map2D.toolDrawMarkers.hasSelectedMarker()) {
                console.warn('No marker selected for deletion');
                alert('Please select a marker first before deleting');
                return;
            }
            
            const selectedMarker = this.map2D.toolDrawMarkers.getSelectedMarker();
            console.log('Selected marker for deletion:', selectedMarker);
            
            // Show delete confirmation dialog
            if (this.onShowDialog) {
                this.onShowDialog(selectedMarker, 'delete');
            }
        } else {
            console.error('Map2D or toolDrawMarkers not available');
        }
    }



    // Show edit/delete actions for selected marker
    showEditActions(markerId) {
        this.actionButtons.edit.style.display = 'flex';
        this.actionButtons.delete.style.display = 'flex';
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        console.log('Edit actions shown for marker:', markerId);
    }

    // Hide edit/delete actions
    hideEditActions() {
        this.actionButtons.edit.style.display = 'none';
        this.actionButtons.delete.style.display = 'none';
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
        if (this.map2D && this.map2D.toolDrawMarkers) {
            this.map2D.toolDrawMarkers.disableSelectMode();
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
        console.log('DockToolbar: show() called');
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_MARKER) {
            this.tools.addMarker.isActive = true;
            this.tools.addMarker.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.SELECT_MARKER) {
            this.tools.selectMarker.isActive = true;
            this.tools.selectMarker.button.classList.add('active');
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

export { MarkersToolbar };
