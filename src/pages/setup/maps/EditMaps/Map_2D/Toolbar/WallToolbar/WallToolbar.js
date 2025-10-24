import * as THREE from 'three';
import { DrawWall } from './drawWall.js';
import { EraserWall } from './eraserWall.js';
import './WallToolbar.css';

class WallToolbar {
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
            eraser: {
                button: null,
                container: null,
                slider: null,
                isActive: false,
                eraserRadius: 0.2
            }
        };
        
        // Action buttons
        this.actionButtons = {
            cancel: null,
            apply: null
        };
        
        // Info bar
        this.infoBar = {
            create: null,
            eraser: null
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
        this.container.className = 'wall-tools';
        this.container.style.display = 'none';

        // Create draw line section
        this.createDrawLineSection();

        // Create eraser section
        this.createEraserSection();

        // Add sliders directly to main container (before action buttons)
        this.container.appendChild(this.tools.drawLine.slider);
        this.container.appendChild(this.tools.eraser.slider);

        // Create action buttons
        this.createActionButtons();

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
                    console.error('No suitable container found for WallToolbar');
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
            console.warn('No suitable container found for WallToolbar info bar, will retry later');
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
                console.error('Failed to add WallToolbar info bar after 10 retries');
            }
        }
    }

    createDrawLineSection() {
        // Draw line button
        this.tools.drawLine.button = this.createButton('Draw-line', 'draw-line-icon', 'wall-draw-line-button');
        this.container.appendChild(this.tools.drawLine.button);

        // Setting button (add directly to main container)
        const settingButton = this.createButton('Draw-line-setting', 'draw-line-setting-icon', 'wall-draw-line-setting-button');
        settingButton.style.display = 'none';
        this.container.appendChild(settingButton);

        // Slider (will be added to main container in createToolbar)
        this.tools.drawLine.slider = this.createSlider('wall-draw-line-slider', '4px', 1, 40, 4, 'draw-line-size-slider');
    }

    createEraserSection() {
        // Eraser button
        this.tools.eraser.button = this.createButton('Eraser Wall', 'eraser-wall-icon', 'wall-eraser-button');
        this.container.appendChild(this.tools.eraser.button);

        // Setting button (add directly to main container)
        const settingButton = this.createButton('Eraser-setting', 'eraser-wall-setting-icon', 'wall-eraser-setting-button');
        settingButton.style.display = 'none';
        this.container.appendChild(settingButton);

        // Slider (will be added to main container in createToolbar)
        this.tools.eraser.slider = this.createSlider('wall-eraser-line-setting-slider', '0.2m', 0.05, 0.5, 0.2, 'eraser-size-setting-slider', 0.01);
    }

    createActionButtons() {
        // Create action buttons container that will be placed directly on map-toolbar
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'apply-changes-button');
        
        // Initially hide action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        
        // Add action buttons directly to the main container
        this.container.appendChild(this.actionButtons.cancel);
        this.container.appendChild(this.actionButtons.apply);
    }

    createInfoBar() {
        // Create info bar container
        this.container_info_bar = document.createElement('div');
        this.container_info_bar.className = 'wall-info-bar';
        this.container_info_bar.style.display = 'none';

        // Create info bar for draw line
        this.infoBar.create = document.createElement('div');
        this.infoBar.create.className = 'create-wall-info-bar';
        this.infoBar.create.textContent = 'Click to draw wall line';
        this.infoBar.create.style.display = 'none';
        this.container_info_bar.appendChild(this.infoBar.create);

        // Create info bar for eraser
        this.infoBar.eraser = document.createElement('div');
        this.infoBar.eraser.className = 'eraser-wall-info-bar';
        this.infoBar.eraser.textContent = 'Click and drag to erase wall';
        this.infoBar.eraser.style.display = 'none';
        this.container_info_bar.appendChild(this.infoBar.eraser);
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
        // Draw line button
        this.tools.drawLine.button.addEventListener('click', () => this.handleDrawLine());

        // Draw line setting button
        const drawLineSettingBtn = this.container.querySelector('#wall-draw-line-setting-button');
        drawLineSettingBtn.addEventListener('click', () => this.handleDrawLineSetting());

        // Draw line slider
        const drawLineSlider = this.tools.drawLine.slider.querySelector('#draw-line-size-slider');
        drawLineSlider.addEventListener('change', (e) => this.handleDrawLineSize(e));
        drawLineSlider.addEventListener('input', (e) => this.handleDrawLineSize(e));

        // Eraser button
        this.tools.eraser.button.addEventListener('click', () => this.handleEraserWall());

        // Eraser setting button
        const eraserSettingBtn = this.container.querySelector('#wall-eraser-setting-button');
        eraserSettingBtn.addEventListener('click', () => this.handleEraserSetting());

        // Eraser slider
        const eraserSlider = this.tools.eraser.slider.querySelector('#eraser-size-setting-slider');
        eraserSlider.addEventListener('change', (e) => this.handleEraserSize(e));
        eraserSlider.addEventListener('input', (e) => this.handleEraserSize(e));

        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChangesWall());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
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
        
        // Show draw line setting button
        const drawLineSettingBtn = this.container.querySelector('#wall-draw-line-setting-button');
        drawLineSettingBtn.style.display = 'flex';
        
        // Hide eraser setting button
        const eraserSettingBtn = this.container.querySelector('#wall-eraser-setting-button');
        eraserSettingBtn.style.display = 'none';
        
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.DRAW_LINE);
        this.showActionButtons();
        
        // Show info bar
        this.infoBar.create.style.display = 'flex';
        this.infoBar.eraser.style.display = 'none';
        this.container_info_bar.style.display = 'block';
    }

    handleDrawLineSetting() {
        const slider = this.tools.drawLine.slider;
        
        if (slider.style.display === 'none' || slider.style.display === '') {
            slider.style.display = 'flex';
        } else {
            slider.style.display = 'none';
        }
    }

    handleDrawLineSize(e) {
        const value = parseInt(e.target.value);
        this.tools.drawLine.lineWidth = value;
        this.tools.drawLine.slider.querySelector('.slider-value').textContent = `${value}px`;
        
        if (this.map2D.toolDrawWall) {
            this.map2D.toolDrawWall.setLineWidth(value);
        }
    }

    handleEraserWall() {
        if (this.tools.eraser.isActive) {
            this.tools.eraser.isActive = false;
            this.tools.eraser.button.classList.remove('active');
            this.map2D.setToolMapMode(false);
            this.hideActionButtons();
            this.deactivateAllTools();
            this.hideInfoBar();
            return;
        }
        
        this.map2D.cancelMapTool();
        this.deactivateAllTools();
        this.tools.eraser.isActive = true;
        this.tools.eraser.button.classList.add('active');
        
        // Show eraser setting button
        const eraserSettingBtn = this.container.querySelector('#wall-eraser-setting-button');
        eraserSettingBtn.style.display = 'flex';
        
        // Hide draw line setting button
        const drawLineSettingBtn = this.container.querySelector('#wall-draw-line-setting-button');
        drawLineSettingBtn.style.display = 'none';
        
        this.map2D.setToolMapMode(true, this.map2D.MouseMode.ERASE);
        this.showActionButtons();
        
        // Show info bar
        this.infoBar.eraser.style.display = 'flex';
        this.infoBar.create.style.display = 'none';
        this.container_info_bar.style.display = 'block';
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
        
        if (this.map2D.toolEraserWall) {
            this.map2D.toolEraserWall.setEraserRadius(value);
        }
    }

    cancelChangesWall() {
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

    // Utility methods
    deactivateAllTools() {
        Object.values(this.tools).forEach(tool => {
            tool.isActive = false;
            if (tool.button) {
                tool.button.classList.remove('active');
            }
        });
        
        // Hide all setting buttons when no tool is active
        const drawLineSettingBtn = this.container.querySelector('#wall-draw-line-setting-button');
        const eraserSettingBtn = this.container.querySelector('#wall-eraser-setting-button');
        
        if (drawLineSettingBtn) drawLineSettingBtn.style.display = 'none';
        if (eraserSettingBtn) eraserSettingBtn.style.display = 'none';
        
        // Hide all sliders
        if (this.tools.drawLine.slider) this.tools.drawLine.slider.style.display = 'none';
        if (this.tools.eraser.slider) this.tools.eraser.slider.style.display = 'none';
        
        // Hide info bar
        this.hideInfoBar();
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
        if (this.map2D.currentMouseMode === this.map2D.MouseMode.DRAW_LINE) {
            this.tools.drawLine.isActive = true;
            this.tools.drawLine.button.classList.add('active');
        } else if (this.map2D.currentMouseMode === this.map2D.MouseMode.ERASE) {
            this.tools.eraser.isActive = true;
            this.tools.eraser.button.classList.add('active');
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

    hideInfoBar() {
        this.infoBar.create.style.display = 'none';
        this.infoBar.eraser.style.display = 'none';
        this.container_info_bar.style.display = 'none';
    }

    // Method to retry adding info bar (can be called externally)
    retryAddInfoBar() {
        if (this.container_info_bar && !this.container_info_bar.parentNode) {
            this.addToMapInfoBar();
        }
    }
}

export { WallToolbar }; 