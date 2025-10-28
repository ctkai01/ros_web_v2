import * as THREE from 'three';
import { FloorTool } from './floorTool.js';
import './FloorToolbar.css';

class FloorToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.container = null;
        this.isVisible = false;
        this.currentTool = null;
        
        // Tool states
        this.tools = {
            eraser: {
                button: null,
                container: null,
                slider: null,
                isActive: false,
                eraserRadius: 0.2
            },
            polygon: {
                button: null,
                container: null,
                isActive: false,
                polygonWidth: 0.1
            }
        };
        
        // Action buttons
        this.actionButtons = {
            cancel: null,
            apply: null
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
        this.container.className = 'floor-tools';
        this.container.style.display = 'none';

        // Create eraser section
        this.createEraserSection();

        // Create polygon section
        this.createPolygonSection();

        // Add eraser slider to main container (polygon không có slider)
        this.container.appendChild(this.tools.eraser.slider);

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
                    console.error('No suitable container found for FloorToolbar');
                }
            }
        }
    }

    createEraserSection() {
        // Eraser button
        this.tools.eraser.button = this.createButton('Floor Eraser', 'eraser-floor-icon', 'floor-eraser-button');
        this.container.appendChild(this.tools.eraser.button);

        // Setting button (add directly to main container)
        const settingButton = this.createButton('Floor Eraser Setting', 'eraser-floor-setting-icon', 'floor-eraser-setting-button');
        settingButton.style.display = 'none';
        this.container.appendChild(settingButton);

        // Slider (will be added to main container in createToolbar)
        this.tools.eraser.slider = this.createSlider('floor-eraser-slider', '0.2m', 0.05, 0.5, 0.2, 'floor-eraser-size-slider', 0.01);
    }

    createPolygonSection() {
        // Polygon button
        this.tools.polygon.button = this.createButton('Floor Polygon', 'polygon-icon', 'floor-polygon-button');
        this.container.appendChild(this.tools.polygon.button);

        // Không tạo setting button và slider cho polygon
        // this.tools.polygon.slider = this.createSlider('floor-polygon-slider', '0.1m', 0.05, 0.5, 0.1, 'polygon-width-slider', 0.01);
    }

    createActionButtons() {
        // Create action buttons container that will be placed directly on map-toolbar
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'floor-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'floor-apply-changes-button');
        
        // Initially hide action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        
        // Add action buttons directly to the main container
        this.container.appendChild(this.actionButtons.cancel);
        this.container.appendChild(this.actionButtons.apply);
    }

    createButton(title, iconClass, id) {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.title = title;
        button.id = id;

        const icon = document.createElement('span');
        icon.className = `tool-icon ${iconClass}`;

        // Use PNG icons for cancel and apply buttons
        if (id === 'floor-cancel-changes-button') {
            icon.style.backgroundImage = "url('/assets/icons/cancel.png')";
        } else if (id === 'floor-apply-changes-button') {
            icon.style.backgroundImage = "url('/assets/icons/check.png')";
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

    bindEvents() {
        // Eraser button
        this.tools.eraser.button.addEventListener('click', () => this.handleEraser());

        // Eraser setting button
        const eraserSettingBtn = this.container.querySelector('#floor-eraser-setting-button');
        eraserSettingBtn.addEventListener('click', () => this.handleEraserSetting());

        // Eraser slider
        const eraserSlider = this.tools.eraser.slider.querySelector('#floor-eraser-size-slider');
        eraserSlider.addEventListener('change', (e) => this.handleEraserSize(e));
        eraserSlider.addEventListener('input', (e) => this.handleEraserSize(e));

        // Polygon button (không có setting và slider)
        this.tools.polygon.button.addEventListener('click', () => this.handlePolygon());

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesFloor());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
    }

    // Tool handlers
    handleEraser() {
        console.log('FloorToolbar: handleEraser called');

        if (this.tools.eraser.isActive) {
            this.tools.eraser.isActive = false;
            this.tools.eraser.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            return;
        }
        
        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.eraser.isActive = true;
        this.tools.eraser.button.classList.add('active');
        
        // Show eraser setting button
        const eraserSettingBtn = this.container.querySelector('#floor-eraser-setting-button');
        eraserSettingBtn.style.display = 'flex';
        
        console.log('FloorToolbar: Setting tool mode to FLOOR_ERASER');
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.FLOOR_ERASER);
        this.showActionButtons();        
    }

    handleEraserSetting() {
        const slider = this.tools.eraser.slider;
        
        if (slider.style.display === 'none' || slider.style.display === '') {
            slider.style.display = 'flex';
        } else {
            slider.style.display = 'none';
        }
    }

    handleEraserSize(e) {
        const value = parseFloat(e.target.value);
        this.tools.eraser.eraserRadius = value;
        this.tools.eraser.slider.querySelector('.slider-value').textContent = `${value}m`;
        
        if (this.map2D.toolFloorTool) {
            this.map2D.toolFloorTool.setEraserRadius(value);
        }
    }

    handlePolygon() {
        console.log('FloorToolbar: handlePolygon called');

        if (this.tools.polygon.isActive) {
            this.tools.polygon.isActive = false;
            this.tools.polygon.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            return;
        }
        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.polygon.isActive = true;
        this.tools.polygon.button.classList.add('active');
        
        // Polygon không có setting button nên không cần hiển thị/ẩn
        
        console.log('FloorToolbar: Setting tool mode to FLOOR_POLYGON');
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.FLOOR_POLYGON);
        this.showActionButtons();
    }

    handlePolygonWidth(e) {
        // Method removed - polygon không cần setting và slider
    }

    cancelChangesFloor() {
        this.map2D.cancelMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
    }

    handleApplyChanges() {
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllTools();
    }

    // Utility methods
    deactivateAllTools() {
        Object.values(this.tools).forEach(tool => {
            tool.isActive = false;
            if (tool.button) {
                tool.button.classList.remove('active');
            }
        });
        
        // Hide eraser setting button when no tool is active
        const eraserSettingBtn = this.container.querySelector('#floor-eraser-setting-button');
        if (eraserSettingBtn) eraserSettingBtn.style.display = 'none';
        
        // Hide eraser slider
        if (this.tools.eraser.slider) this.tools.eraser.slider.style.display = 'none';
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
        console.log('FloorToolbar: show() called');
        this.isVisible = true;
        // Remove hidden class first, then set display
        this.container.classList.remove('hidden');
        this.container.style.display = 'flex';
        console.log('FloorToolbar: Container display set to flex');
        console.log('FloorToolbar: Container classes:', this.container.className);
    }

    hide() {
        this.isVisible = false;
        // Add hidden class and set display to none immediately
        this.container.classList.add('hidden');
        this.container.style.display = 'none';
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.FLOOR_ERASER) {
            this.tools.eraser.isActive = true;
            this.tools.eraser.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.FLOOR_POLYGON) {
            this.tools.polygon.isActive = true;
            this.tools.polygon.button.classList.add('active');
        }
    }

    // Cleanup
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            console.log('FloorToolbar removed from container');
        }
        this.container = null;
    }
}

export { FloorToolbar }; 