import * as THREE from 'three';
import { DrawPoseEstimate } from './drawPoseEstimate.js';
import { DrawNavGoal } from './drawNavGoal.js';
import './NavigateToolbar.css';

 class NavigateToolbar {
    constructor(map2D) {
        this.map2D = map2D;
        this.isVisible = false;
        this.container = null;
        this.buttons = {
            PoseEstimate: null,
            NavGoal: null
        };

        // Action buttons
        this.actionButtons = {
            cancel: null,
            apply: null,
        };
        
        // Toolbar state
        this.currentMode = 'none';
        this.isActive = false;

        // Pose estimate callback - will be set by EditMaps.js
        this.onPoseEstimate = null;
        
        // Navigation goal callback - will be set by EditMaps.js
        this.onNavGoal = null;
        
        // Create toolbar
        this.createToolbar();

        // Add to map-toolbar
        this.addToMapToolbar();
    }

    /**
     * Create the navigation toolbar
     */
    createToolbar() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'navigate-tools';
        this.container.style.display = 'none';

        // Create buttons (placeholder for now)
        this.buttons.PoseEstimate = this.createButton('2D Pose Estimate', 'pose-estimate-icon', 'pose-estimate-button');
        this.container.appendChild(this.buttons.PoseEstimate);
        this.buttons.NavGoal = this.createButton('2D Nav Goal', 'nav-goal-icon', 'nav-goal-button');
        this.container.appendChild(this.buttons.NavGoal);


        // Create action buttons
        this.createActionButtons();

        // Add event listeners
        this.buttons.PoseEstimate.addEventListener('click', () => this.handleButtonClick('pose-estimate', this.buttons.PoseEstimate));
        this.buttons.NavGoal.addEventListener('click', () => this.handleButtonClick('nav-goal', this.buttons.NavGoal));

        // Bind action button events
        this.bindActionEvents();
    }

    /**
     * Create a button for the navigation toolbar
     * @param {HTMLElement} container - The container to add the button to
     * @param {string} id - Button ID
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     */
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

    createActionButtons() {
        // Create action buttons container that will be placed directly on map-toolbar
        this.actionButtons.cancel = this.createButton('Cancel changes', 'cancel-changes-icon', 'navigate-cancel-changes-button');
        this.actionButtons.apply = this.createButton('Apply changes', 'apply-changes-icon', 'navigate-apply-changes-button');

        // Initially hide all action buttons
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
        
        // Add action buttons directly to the main container
        this.container.appendChild(this.actionButtons.cancel);
        this.container.appendChild(this.actionButtons.apply);
    }

    bindActionEvents() {
        // Action buttons
        this.actionButtons.cancel.addEventListener('click', () => this.cancelChanges());
        this.actionButtons.apply.addEventListener('click', () => this.handleApplyChanges());
    }

    addToMapToolbar() {
        // Find the toolbar-left-group div
        const toolbarRightGroup = document.querySelector('.toolbar-right-group');
        if (toolbarRightGroup) {
            toolbarRightGroup.appendChild(this.container);
        } else {
            // Fallback to map-toolbar if toolbar-left-group not found
            const mapToolbar = document.querySelector('.map-toolbar');
            if (mapToolbar) {
                mapToolbar.appendChild(this.container);
            }
        }
    }

    /**
     * Handle button click
     * @param {string} buttonId - Button ID
     * @param {HTMLElement} button - Button element
     */
    handleButtonClick(buttonId, button) {
        // Remove active class from all buttons
        Object.values(this.buttons).forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        this.currentMode = buttonId;
        this.isActive = true;

        // Show action buttons when a tool is activated
        this.showActionButtons();

        // Handle specific button functionality
        if (buttonId === 'pose-estimate') {
            this.handlePoseEstimateClick();
        } else if (buttonId === 'nav-goal') {
            this.handleNavGoalClick();
        } 
    }

    /**
     * Handle 2D Pose Estimate button click
     */
    handlePoseEstimateClick() {
        
        // Set map to pose estimation mode
        if (this.map2D) {
            this.map2D.setToolMapMode(true, this.map2D.MouseMode.POSE_ESTIMATE);
        }
    }

    /**
     * Handle 2D Nav Goal button click
     */
    handleNavGoalClick() {
        
        // Set map to navigation goal mode
        if (this.map2D) {
            this.map2D.setToolMapMode(true, this.map2D.MouseMode.NAV_GOAL);
        }
    }



    /**
     * Cancel changes and reset toolbar state
     */
    cancelChanges() {
        this.map2D.cancelMapTool();
        this.hideActionButtons();
        this.deactivateAllButtons();
        
    }

    /**
     * Apply changes and reset toolbar state
     */
    handleApplyChanges() {
        
        // Check if we're in pose estimate mode
        if (this.currentMode === 'pose-estimate') {
            
            // Get pose estimate data from the tool
            let poseEstimateData = null;
            if (this.map2D.toolDrawPoseEstimate) {
                poseEstimateData = this.map2D.toolDrawPoseEstimate.getPoseEstimate();
            } else {
                console.warn('NavigateToolbar: toolDrawPoseEstimate not available');
            }
            
            // Trigger pose estimate callback
            if (this.onPoseEstimate) {
                this.onPoseEstimate(poseEstimateData);
            } else {
                console.warn('NavigateToolbar: Pose estimate callback not set');                
            }
        } 
        // Check if we're in navigation goal mode
        else if (this.currentMode === 'nav-goal') {
            
            // Get navigation goal data from the tool
            let navGoalData = null;
            if (this.map2D.toolDrawNavGoal) {
                navGoalData = this.map2D.toolDrawNavGoal.getNavGoal();
            } else {
                console.warn('NavigateToolbar: toolDrawNavGoal not available');
            }
            
            // Trigger navigation goal callback
            if (this.onNavGoal) {
                this.onNavGoal(navGoalData);
            } else {
                console.warn('NavigateToolbar: Navigation goal callback not set');                
            }
        } else {
            console.log('NavigateToolbar: Not in pose estimate or nav goal mode, currentMode =', this.currentMode);
        }
        
        if(this.map2D.toolDrawPoseEstimate){
            this.map2D.toolDrawPoseEstimate.applyPoseEstimatesToMap();
        }
        if(this.map2D.toolDrawNavGoal){
            this.map2D.toolDrawNavGoal.applyNavGoalToMap();
        }
        this.map2D.applyMapTool();
        this.hideActionButtons();
        this.deactivateAllButtons();
        
    }

    /**
     * Show action buttons (cancel/apply)
     */
    showActionButtons() {
        this.actionButtons.cancel.style.display = 'flex';
        this.actionButtons.apply.style.display = 'flex';
    }

    /**
     * Hide action buttons
     */
    hideActionButtons() {
        this.actionButtons.cancel.style.display = 'none';
        this.actionButtons.apply.style.display = 'none';
    }

    /**
     * Show the navigation toolbar
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.isVisible = true;
        } else {
            console.warn('NavigateToolbar: container is null');
        }
    }

    /**
     * Hide the navigation toolbar
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
            this.deactivateAllButtons();
            this.hideActionButtons();
        }
    }

    /**
     * Toggle toolbar visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Deactivate all buttons
     */
    deactivateAllButtons() {
        Object.values(this.buttons).forEach(btn => {
            btn.classList.remove('active');
        });
        this.currentMode = 'none';
        this.isActive = false;
        
        // Disable drawing tools
        if (this.map2D.toolDrawPoseEstimate) {
            this.map2D.toolDrawPoseEstimate.disable();
        }
        if (this.map2D.toolDrawNavGoal) {
            this.map2D.toolDrawNavGoal.disable();
        }
        if (this.map2D) {
            this.map2D.setToolMapMode(false, this.map2D.MouseMode.NONE);
        }
        if(this.map2D.robot){
            this.map2D.robot.show();
        }
    }

    /**
     * Update button text
     * @param {string} buttonId - Button ID
     * @param {string} text - New text
     */
    updateButtonText(buttonId, text) {
        if (this.buttons[buttonId]) {
            this.buttons[buttonId].textContent = text;
        }
    }

    /**
     * Enable/disable button
     * @param {string} buttonId - Button ID
     * @param {boolean} enabled - Whether to enable the button
     */
    setButtonEnabled(buttonId, enabled) {
        if (this.buttons[buttonId]) {
            this.buttons[buttonId].disabled = !enabled;
            this.buttons[buttonId].style.opacity = enabled ? '1' : '0.5';
            this.buttons[buttonId].style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Get current mode
     * @returns {string} Current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Check if toolbar is active
     * @returns {boolean} Whether toolbar is active
     */
    isToolbarActive() {
        return this.isActive;
    }

    /**
     * Set pose estimate callback
     * @param {Function} callback - Callback function for pose estimate
     */
    setPoseEstimateCallback(callback) {
        this.onPoseEstimate = callback;
    }

    /**
     * Set navigation goal callback
     * @param {Function} callback - Callback function for navigation goal
     */
    setNavGoalCallback(callback) {
        this.onNavGoal = callback;
    }

    /**
     * Dispose of the toolbar
     */
    dispose() {
        try {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            
            this.container = null;
            this.buttons = {};
            this.actionButtons = {};
            this.map2D = null;
            this.onPoseEstimate = null;
            this.onNavGoal = null;
        } catch (error) {
            console.error('Error disposing navigate toolbar:', error);
        }
    }
} 
export  {NavigateToolbar};