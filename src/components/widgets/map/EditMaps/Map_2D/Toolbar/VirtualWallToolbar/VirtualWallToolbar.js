import * as THREE from 'three';
import { DrawVirtualWall } from './drawVirtualWall.js';
import './VirtualWallToolbar.css';

class VirtualWallToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.container = null;
        this.isVisible = false;
        this.currentTool = null;
        this.container_info_bar = null;
        this.retryCount = 0;
        
        // Tool states
        this.tools = {
            drawLine: {
                button: null,
                container: null,
                slider: null,
                isActive: false,
                lineWidth: 4
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
        // Info bar
        this.infoBar = {
            create: null,
            select: null
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
        this.container.className = 'virtual-wall-tools';
        this.container.style.display = 'none';
       
        // Create info bar container
        this.container_info_bar = document.createElement('div');
        this.container_info_bar.className = 'virtual-wall-info-bar';
        this.container_info_bar.style.display = 'none';

        // Create draw line section
        this.createDrawLineSection();

        // Create cursor section
        this.createCursorSection();

        // Create action buttons
        this.createActionButtons();

        // Add sliders directly to main container (before action buttons)
        this.container.appendChild(this.tools.drawLine.slider);

        // Add to map-toolbar instead of map container
        this.addToMapToolbar();

        // Create info bar
        this.createInfoBar();

        // Add to map-info-bar
        this.addToMapInfoBar();
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
                    console.error('No suitable container found for VirtualWallToolbar');
                }
            }
        }
    }

    addToMapInfoBar() {
        // Try multiple selectors with fallback
        let mapInfoBar = document.querySelector('.edit-map-content');
        
        if (!mapInfoBar) {
            mapInfoBar = document.querySelector('.map-info-bar');
        }
        
        if (!mapInfoBar) {
            mapInfoBar = document.querySelector('.record-map-info-bar');
        }
        
        if (!mapInfoBar) {
            // Try to find any suitable container in the edit maps area
            mapInfoBar = document.querySelector('.edit-maps-container') || 
                        document.querySelector('.map-container') ||
                        document.querySelector('.map-content');
        }
        
        if (mapInfoBar) {
            mapInfoBar.appendChild(this.container_info_bar);
        } else {
            console.warn('No suitable container found for VirtualWallToolbar info bar, will retry later');
            // Retry after a short delay with exponential backoff
            if (!this.retryCount) {
                this.retryCount = 0;
            }
            
            if (this.retryCount < 10) { // Max 10 retries
                this.retryCount++;
                setTimeout(() => {
                    this.addToMapInfoBar();
                }, 100 * this.retryCount); // Exponential backoff
            } else {
                console.error('Failed to add VirtualWallToolbar info bar after 10 retries');
            }
        }
    }
    createDrawLineSection() {
        // Draw line button
        this.tools.drawLine.button = this.createButton('Draw Virtual Wall', 'draw-virtual-wall-icon', 'virtual-wall-draw-line-button');
        this.container.appendChild(this.tools.drawLine.button);

        // Slider (will be added to main container in createToolbar)
        this.tools.drawLine.slider = this.createSlider('virtual-wall-draw-line-slider', '4px', 1, 40, 4, 'virtual-wall-draw-line-size-slider');
    }

    createCursorSection() {
        // Cursor button
        this.tools.cursor.button = this.createButton('Select', 'cursor-icon', 'virtual-wall-cursor-button');
        this.container.appendChild(this.tools.cursor.button);
    }

    createActionButtons() {
        // Create action buttons container that will be placed directly on map-toolbar
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'virtual-wall-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'virtual-wall-apply-changes-button');
        this.actionButtons.edit = this.createButton('Edit line', 'virtual-wall-edit-icon', 'virtual-wall-edit-button');
        this.actionButtons.delete = this.createButton('Delete line', 'delete-icon', 'virtual-wall-delete-button');
        
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

        // Use SVG icons for cancel and apply buttons (giống FloorToolbar)
        if (id === 'virtual-wall-cancel-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="15" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="5" x2="5" y2="15" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`;
        } else if (id === 'virtual-wall-apply-changes-button') {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="5,11 9,15 15,6" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }

        button.appendChild(icon);
        return button;
    }

    createSlider(id, defaultValue, min, max, value, inputId, step = 1) {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'tool-slider';
        sliderContainer.id = id;
        sliderContainer.style.display = 'none';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'slider-value';
        valueSpan.textContent = defaultValue;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.defaultValue = value;
        slider.id = inputId;

        sliderContainer.appendChild(valueSpan);
        sliderContainer.appendChild(slider);

        return sliderContainer;
    }

    createInfoBar() {
        // Create info bar for create wall
        this.infoBar.create = document.createElement('div');
        this.infoBar.create.className = 'create-wall-info-bar';
        this.infoBar.create.textContent = 'Click 2 points to create a wall';
        this.infoBar.create.style.display = 'none';
        this.container_info_bar.appendChild(this.infoBar.create);

        // Create info bar for select wall
        this.infoBar.select = document.createElement('div');
        this.infoBar.select.className = 'select-wall-info-bar';
        this.infoBar.select.textContent = 'Click on a start line or end line to select it';
        this.infoBar.select.style.display = 'none';
        this.container_info_bar.appendChild(this.infoBar.select);

    }


    bindEvents() {
        // Draw line button
        this.tools.drawLine.button.addEventListener('click', () => this.handleDrawLine());

        // Draw line slider
        const drawLineSlider = this.tools.drawLine.slider.querySelector('#virtual-wall-draw-line-size-slider');
        drawLineSlider.addEventListener('change', (e) => this.handleDrawLineSize(e));
        drawLineSlider.addEventListener('input', (e) => this.handleDrawLineSize(e));

        // Cursor button
        this.tools.cursor.button.addEventListener('click', () => this.handleCursor());

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesVirtualWall());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
        this.actionButtons.edit.addEventListener('click', () => this.handleEditLine());
        this.actionButtons.delete.addEventListener('click', () => this.handleDeleteLine());
    }

    // Tool handlers
    handleDrawLine() {
        if (this.tools.drawLine.isActive) {
            this.tools.drawLine.isActive = false;
            this.tools.drawLine.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            this.hideInfoBar();
            return;
        }
        
        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.drawLine.isActive = true;
        this.tools.drawLine.button.classList.add('active');
        
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_VIRTUAL_WALL);
        
        // Enable drawing in the DrawVirtualWall tool
        if (this.map2D.toolDrawVirtualWall) {
            this.map2D.toolDrawVirtualWall.enableDrawing();
        }
        
        this.showActionButtons();
        this.infoBar.create.style.display = 'flex';
        this.infoBar.select.style.display = 'none';
    }

    handleDrawLineSize(e) {
        const value = parseInt(e.target.value);
        this.tools.drawLine.lineWidth = value;
        this.tools.drawLine.slider.querySelector('.slider-value').textContent = `${value}px`;
        
        if (this.map2D.toolDrawVirtualWall) {
            this.map2D.toolDrawVirtualWall.setLineWidth(value);
        }
  
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
        
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.SELECT_VIRTUAL_WALL);
        
        this.showActionButtons();
    }

    cancelChangesVirtualWall() {
        this.map2D.cancelMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
        this.hideInfoBar();
    }

    handleApplyChanges() {
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
        this.hideInfoBar();
    }

    handleEditLine() {
        if (this.map2D && this.map2D.toolDrawVirtualWall) {
            this.map2D.toolDrawVirtualWall.editSelectedLine();
            this.hideEditActions();
            this.showActionButtons(); // Show apply/cancel buttons for editing
        }
        this.infoBar.create.style.display = 'none';
        this.infoBar.select.style.display = 'flex';
    }

    handleDeleteLine() {
        this.tools.cursor.isActive = false;
        this.tools.cursor.button.classList.remove('active');
        if (this.map2D && this.map2D.toolDrawVirtualWall) {
            this.map2D.toolDrawVirtualWall.deleteSelectedLine();
            this.hideEditActions();
            this.hideInfoBar();
        }
    }

    // Show edit/delete actions for selected line
    showEditActions(lineId) {
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
        
        // Hide all sliders
        if (this.tools.drawLine.slider) this.tools.drawLine.slider.style.display = 'none';
        
        // Disable select mode if cursor tool was active
        if (this.map2D && this.map2D.toolDrawVirtualWall) {
            this.map2D.toolDrawVirtualWall.clearCurrentState();
            this.map2D.toolDrawVirtualWall.disable();
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

    hideInfoBar() {
        this.infoBar.create.style.display = 'none';
        this.infoBar.select.style.display = 'none';
    }

    // Method to retry adding info bar (can be called externally)
    retryAddInfoBar() {
        if (this.container_info_bar && !this.container_info_bar.parentNode) {
            this.addToMapInfoBar();
        }
    }

    show() {
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
        this.hideInfoBar();
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_VIRTUAL_WALL) {
            this.tools.drawLine.isActive = true;
            this.tools.drawLine.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.CURSOR) {
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

        if (this.container_info_bar && this.container_info_bar.parentNode) {
            this.container_info_bar.parentNode.removeChild(this.container_info_bar);
        }
        this.container_info_bar = null;
    }
}

export { VirtualWallToolbar }; 