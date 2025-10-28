import * as THREE from 'three';
import { SERVER_URL } from '../../../../../../../config/serverConfig.js';

class DrawMarkers {
    constructor(scene, camera, renderer, mapMesh, mapInfo, map2D) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;
        this.map2D = map2D;


        // Get footprint and texture from Map2D
        this.robotFootprint = map2D.robotFootprint;
        this.robotTexture = map2D.robotTexture;

        // State management
        this.state = {
            mode: 'create', // 'create', 'select', 'edit'
            isEnabled: false,
            isDrawingEnabled: false,
            selectedMarker: null,
            hoveredMarker: null,
            previewMesh: null,
            showDialog: false,
            pendingMarker: null,
            // New state for pan and rotate functionality
            isDragging: false,
            isRotating: false,
            dragStartPoint: null,
            dragStartPosition: null,
            rotateStartAngle: 0,
            rotateStartRotation: 0,
            // State for tracking original marker data before changes
            originalMarkerData: null
        };

        // Marker data
        this.markers = [];
        this.markerMeshes = [];
        this.IDCount = 1;

        // Colors for different states
        this.colors = {
            normal: 0x3498db,      // Blue
            selected: 0xe74c3c,    // Red
            hovered: 0xffff00,     // Yellow
            editing: 0x2196F3      // Blue
        };

        // Dialog callbacks
        this.onMarkerCreated = null;
        this.onMarkerUpdated = null;
        this.onDialogClose = null;

        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners for keyboard events
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Convert quaternion to yaw angle
     * @param {number} x - Quaternion x
     * @param {number} y - Quaternion y
     * @param {number} z - Quaternion z
     * @param {number} w - Quaternion w
     * @returns {number} Yaw angle in radians
     */
    quaternionToYaw(x, y, z, w) {
        // Validate input parameters
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number' || typeof w !== 'number') {
            console.error('Invalid quaternion parameters:', { x, y, z, w });
            return 0;
        }
        
        // Check for NaN or infinite values
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w) ||
            !isFinite(x) || !isFinite(y) || !isFinite(z) || !isFinite(w)) {
            console.error('Quaternion contains NaN or infinite values:', { x, y, z, w });
            return 0;
        }
        
        // Chuyển đổi quaternion thành góc Euler (yaw)
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        return Math.atan2(siny_cosp, cosy_cosp);
    }

    /**
     * Convert yaw angle to quaternion
     * @param {number} yaw - Yaw angle in radians
     * @returns {Object} Quaternion {x, y, z, w}
     */
    yawToQuaternion(yaw) {
        // Validate input
        if (typeof yaw !== 'number' || isNaN(yaw) || !isFinite(yaw)) {
            console.error('Invalid yaw angle:', yaw);
            return { x: 0, y: 0, z: 0, w: 1 };
        }
        
        // Convert yaw to quaternion (rotation around Z-axis)
        const halfYaw = yaw * 0.5;
        return {
            x: 0,
            y: 0,
            z: Math.sin(halfYaw),
            w: Math.cos(halfYaw)
        };
    }

    // Set dialog callbacks
    setDialogCallbacks(onCreated, onUpdated, onClose) {
        this.onMarkerCreated = onCreated;
        this.onMarkerUpdated = onUpdated;
        this.onDialogClose = onClose;
    }

    // Mode management
    setMode(mode) {
        if (this.state.mode === mode) return;

        // Clean up previous mode
        // this.clearCurrentState();

        // Set new mode
        this.state.mode = mode;

        // Initialize mode-specific state
        switch (mode) {
            case 'create':
                this.enableDrawing();
                break;
            case 'select':
                this.enableSelectMode();
                break;
            case 'edit':
                this.enableEditMode();
                break;
        }

        console.log(`DrawMarkers: Mode changed to ${mode}`);
    }

    getMode() { return this.state.mode; }
    isCreateMode() { return this.state.mode === 'create'; }
    isSelectMode() { return this.state.mode === 'select'; }
    isEditMode() { return this.state.mode === 'edit'; }

    // Enable/disable the tool
    enable() {
        this.state.isEnabled = true;
        this.bindEvents();
        console.log('DrawMarkers enabled');
    }

    disable() {
        this.state.isEnabled = false;
        this.unbindEvents();
        console.log('DrawMarkers disabled');
    }

    // Enable/disable drawing mode
    enableDrawing() {
        this.state.isDrawingEnabled = true;
        this.state.isEnabled = true;
    }

    disableDrawing() {
        this.state.isDrawingEnabled = false;
    }

    isDrawingEnabled() {
        return this.state.isDrawingEnabled;
    }

    enableSelectMode() {
        this.state.isEnabled = true;
        this.disableDrawing();
    }

    disableSelectMode() {
        this.state.isEnabled = false;
    }

    enableEditMode() {
        this.state.isEnabled = true;
        this.disableDrawing();
        
        // Set cursor for edit mode
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.cursor = 'grab';
        }
        
        console.log('DrawMarkers: Edit mode enabled');
    }

    // Event handling - removed since Map2D handles events
    bindEvents() {
        // Events are handled by Map2D, not here
    }

    unbindEvents() {
        // Events are handled by Map2D, not here
    }

    // Mouse event handlers for Map2D integration
    mouseEventHandle(clientX, clientY) {
        console.log("Marker: mouseEventHandle", clientX, clientY);
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log("Marker: mouseEventHandle: worldPoint is null");
            return;
        }

        switch (this.state.mode) {
            case 'create':
                this.handleCreateClick(worldPoint);
                break;
            case 'select':
                this.handleSelectClick(worldPoint);
                break;
            case 'edit':
                // In edit mode, start drag or rotate operation
                this.startDrag(clientX, clientY);
                break;
        }
    }

    handleCreateClick(worldPoint) {
        console.log("Marker: handleCreateClick", worldPoint);
        if (!this.isCreateMode()) return;

        // Store the clicked position and show dialog
        this.state.pendingMarker = {
            position: {
                x: worldPoint.x,
                y: worldPoint.y,
                z: worldPoint.z || 0.1
            },
            orientation: {
                x: 0,
                y: 0,
                z: 0,
                w: 1
            }
        };

        // Show dialog for marker creation
        this.showDialog();
    }

    handleSelectClick(worldPoint) {
        console.log('=== handleSelectClick called ===');
        console.log('World point:', worldPoint);
        console.log('Available markers:', this.markers.length);
        
        // Find clicked marker
        const markerInfo = this.findClickedMarker(worldPoint);
        console.log('Found marker info:', markerInfo);
        
        if (markerInfo) {
            // Select the marker
            this.selectMarker(markerInfo);
            console.log('Marker selected:', markerInfo.data);
        } else {
            // Clear selection if clicking on empty space
            this.clearSelectedMarker();
            console.log('No marker clicked, cleared selection');
        }
    }

    handleEditClick(worldPoint) {
        if (!this.isEditMode()) return;

        // In edit mode, we can modify existing markers
        const clickedMarker = this.findClickedMarker(worldPoint);
        
        if (clickedMarker) {
            this.selectMarker(clickedMarker);
            // Show dialog for editing
            this.showEditDialog(clickedMarker.data);
        } else {
            this.clearSelectedMarker();
        }
    }

    handleKeyDown(event) {
        if (!this.state.isEnabled) return;

        switch (event.key) {
            case 'Escape':
                this.clearCurrentState();
                break;
            case 'Delete':
                this.deleteSelectedMarker();
                break;
        }
    }

    // Utility methods
    getWorldPosition(clientX, clientY) {
        if (!this.mapMesh) {
            // Fallback to Map2D's getWorldPosition method
            if (this.map2D && this.map2D.getWorldPosition) {
                return this.map2D.getWorldPosition(clientX, clientY);
            }
            return null;
        }

        const rect = this.renderer.domElement.getBoundingClientRect();
        
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        const intersects = raycaster.intersectObject(this.mapMesh);
        
        if (intersects.length > 0) {
            return intersects[0].point;
        }
        
        // Fallback to Map2D's getWorldPosition method
        if (this.map2D && this.map2D.getWorldPosition) {
            return this.map2D.getWorldPosition(clientX, clientY);
        }
        
        return null;
    }

    // Dialog management
    showDialog() {
        console.log("Marker: showDialog");
        this.state.showDialog = true;
        if (this.onDialogClose) {
            this.onDialogClose(true);
        }
    }

    hideDialog() {
        this.state.showDialog = false;
        this.state.pendingMarker = null;
        this.state.markerBeingEdited = null; // Clear marker being edited
        if (this.onDialogClose) {
            this.onDialogClose(false);
        }
    }

    showEditDialog(markerData) {
        this.state.showDialog = true;
        this.state.pendingMarker = markerData;
        
        // Store the marker being edited so we can restore selection later
        this.state.markerBeingEdited = markerData;
        
        if (this.onDialogClose) {
            this.onDialogClose(true);
        }
    }

    // Create marker from data (for dialog)
    createMarkerFromData(markerData) {
        console.log('Creating marker from data:', markerData);

        // Validate marker data
        if (!markerData || !markerData.name || !markerData.position) {
            console.error('Invalid marker data:', markerData);
            return null;
        }

        // Convert position to THREE.Vector3
        const position = new THREE.Vector3(
            markerData.position.x || 0,
            markerData.position.y || 0,
            markerData.position.z || 0.1
        );

        // Ensure orientation is always present
        const orientation = markerData.orientation || {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        };

        const marker = {
            id: markerData.id,
            position: position,
            name: markerData.name,
            type: markerData.type || 'V-marker',
            arucoId: markerData.arucoId,
            orientation: orientation,
            offsetY: markerData.offsetY || 0,
            offsetOrientation: markerData.offsetOrientation || 0
        };

        this.markers.push(marker);
        this.createMarkerMesh(marker);

        console.log('Marker created from data:', marker);

        // Call callback if available
        if (this.onMarkerCreated) {
            this.onMarkerCreated(marker);
        }

        return marker;
    }

    // Marker selection
    selectMarker(markerInfo) {
        // Reset previous selection highlight
        if (this.state.selectedMarker && this.state.selectedMarker.mesh) {
            this.state.selectedMarker.mesh.material.color.setHex(0xffffff);
        }
        
        this.state.selectedMarker = markerInfo.data;
        
        // Highlight selected marker
        if (markerInfo.mesh) {
            markerInfo.mesh.material.color.setHex(this.colors.selected); // Red for selected
        }
        
        // Show edit/delete buttons in toolbar
        if (this.map2D && this.map2D.markersToolbar) {
            this.map2D.markersToolbar.showEditActions(markerInfo.data.id);
        }
        
        console.log('Marker selected:', markerInfo.data);
        console.log('Current selectedMarker state:', this.state.selectedMarker);
    }

    clearSelectedMarker() {
        // Reset previous selection highlight to normal (no color overlay)
        if (this.state.selectedMarker) {
            // Find the mesh for the selected marker
            const meshIndex = this.markerMeshes.findIndex(mesh => mesh.userData.markerId === this.state.selectedMarker.id);
            if (meshIndex !== -1) {
                this.markerMeshes[meshIndex].material.color.setHex(0xffffff); // White = no color overlay
            }
        }
        
        // Clear original marker data when deselecting
        this.state.originalMarkerData = null;
        
        this.state.selectedMarker = null;
        
        // Hide edit/delete buttons in toolbar
        if (this.map2D && this.map2D.markersToolbar) {
            this.map2D.markersToolbar.hideEditActions();
        }
    }

    // New methods for pan and rotate functionality
    startDrag(clientX, clientY) {
        if (!this.isEditMode() || !this.state.selectedMarker) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Save original marker data before making changes
        if (!this.state.originalMarkerData) {
            this.state.originalMarkerData = {
                position: { ...this.state.selectedMarker.position },
                orientation: { ...this.state.selectedMarker.orientation }
            };
            console.log('Saved original marker data:', this.state.originalMarkerData);
        }

        // Check if click is on the marker mesh (for panning)
        const markerInfo = this.findClickedMarker(worldPoint);
        if (markerInfo && markerInfo.data.id === this.state.selectedMarker.id) {
            // Start panning
            this.state.isDragging = true;
            this.state.dragStartPoint = worldPoint;
            this.state.dragStartPosition = {
                x: this.state.selectedMarker.position.x,
                y: this.state.selectedMarker.position.y
            };
            
            // Change cursor to grabbing
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.cursor = 'grabbing';
            }
            
            console.log('Started dragging marker:', this.state.selectedMarker.id);
        } else {
            // Start rotating (click outside marker)
            this.state.isRotating = true;
            this.state.dragStartPoint = worldPoint;
            this.state.rotateStartAngle = Math.atan2(
                worldPoint.y - this.state.selectedMarker.position.y,
                worldPoint.x - this.state.selectedMarker.position.x
            );
            this.state.rotateStartRotation = this.state.selectedMarker.orientation ? 
                this.quaternionToYaw(
                    this.state.selectedMarker.orientation.x || 0,
                    this.state.selectedMarker.orientation.y || 0,
                    this.state.selectedMarker.orientation.z || 0,
                    this.state.selectedMarker.orientation.w || 1
                ) : 0;
            
            // Change cursor to rotate
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.cursor = 'crosshair';
            }
            
            console.log('Started rotating marker:', this.state.selectedMarker.id);
        }
    }

    updateDrag(clientX, clientY) {
        if (!this.state.isDragging && !this.state.isRotating) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint || !this.state.selectedMarker) return;

        if (this.state.isDragging) {
            // Update position for panning
            const deltaX = worldPoint.x - this.state.dragStartPoint.x;
            const deltaY = worldPoint.y - this.state.dragStartPoint.y;

            const newPosition = {
                x: this.state.dragStartPosition.x + deltaX,
                y: this.state.dragStartPosition.y + deltaY,
                z: this.state.selectedMarker.position.z
            };

            // Update marker data
            this.state.selectedMarker.position = newPosition;

            // Update mesh position
            const mesh = this.markerMeshes.find(m => m.userData.markerId === this.state.selectedMarker.id);
            if (mesh) {
                mesh.position.set(newPosition.x, newPosition.y, newPosition.z);
            }

            console.log('Updated marker during drag:', newPosition);
        } else if (this.state.isRotating) {
            // Update rotation
            const currentAngle = Math.atan2(
                worldPoint.y - this.state.selectedMarker.position.y,
                worldPoint.x - this.state.selectedMarker.position.x
            );
            const deltaAngle = currentAngle - this.state.rotateStartAngle;
            const newRotation = this.state.rotateStartRotation + deltaAngle;

            // Update marker orientation (convert yaw back to quaternion)
            this.state.selectedMarker.orientation = this.yawToQuaternion(newRotation);

            // Update mesh rotation
            const mesh = this.markerMeshes.find(m => m.userData.markerId === this.state.selectedMarker.id);
            if (mesh) {
                mesh.rotation.z = newRotation;
            }

            console.log('Updated rotation during rotate:', newRotation);
        }
    }

    stopDrag() {
        if (this.state.isDragging || this.state.isRotating) {
            console.log('Stopped drag/rotate operation');
            this.state.isDragging = false;
            this.state.isRotating = false;
            this.state.dragStartPoint = null;
            this.state.dragStartPosition = null;
            this.state.rotateStartAngle = 0;
            this.state.rotateStartRotation = 0;
        }
    }

    // Edit selected marker
    editSelectedMarker() {
        console.log('=== editSelectedMarker called ===');
        console.log('Current state:', {
            selectedMarker: this.state.selectedMarker,
            mode: this.state.mode,
            isEnabled: this.state.isEnabled,
            markers: this.markers.length,
            markerMeshes: this.markerMeshes.length
        });
        
        if (!this.state.selectedMarker) {
            console.warn('No marker selected for editing');
            console.log('Available markers:', this.markers);
            console.log('Available marker meshes:', this.markerMeshes);
            return;
        }

        if (!this.state.selectedMarker) {
            console.error('Selected marker is null:', this.state.selectedMarker);
            return;
        }
        
        // Save selected marker data before changing mode (since setMode calls clearCurrentState)
        const markerDataToEdit = this.state.selectedMarker;
        
        // Switch to edit mode
        this.setMode('edit');
        
        // Show edit dialog with saved marker data
        this.showEditDialog(markerDataToEdit);
        
        console.log('Editing marker:', markerDataToEdit);
    }

    // Delete selected marker
    deleteSelectedMarker() {
        if (!this.state.selectedMarker) {
            console.warn('No marker selected for deletion');
            return;
        }

        const markerId = this.state.selectedMarker.id;
        const markerMesh = this.state.selectedMarker.mesh;
        
        // Remove from scene
        if (markerMesh) {
            this.scene.remove(markerMesh);
            markerMesh.geometry.dispose();
            markerMesh.material.dispose();
        }
        
        // Remove from data arrays
        const dataIndex = this.markers.findIndex(m => m.id === markerId);
        const meshIndex = this.markerMeshes.findIndex(m => m.userData.markerId === markerId);
        
        if (dataIndex !== -1) {
            this.markers.splice(dataIndex, 1);
        }
        if (meshIndex !== -1) {
            this.markerMeshes.splice(meshIndex, 1);
        }
        
        // Clear selection
        this.clearSelectedMarker();
        
        console.log('Marker deleted:', markerId);
    }

    // Mesh creation and management
    createMarkerMesh(marker) {
        // Load texture based on marker type
        const textureLoader = new THREE.TextureLoader();
        let texturePath;
        
        if (marker.type === 'Aruco-marker') {
            texturePath = '/assets/icons/aruco_pattern.png';
        } else {
            texturePath = '/assets/icons/pattern.png';
        }
        
        const texture = textureLoader.load(texturePath);
        
        // Create plane geometry with fixed width of 0.56m
        const width = 0.56;
        const height = width; // Keep 1:1 aspect ratio
        const geometry = new THREE.PlaneGeometry(width, height);
        
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(marker.position);
        
        // Convert orientation quaternion to mesh rotation
        if (marker.orientation) {
            const yaw = this.quaternionToYaw(
                marker.orientation.x || 0,
                marker.orientation.y || 0,
                marker.orientation.z || 0,
                marker.orientation.w || 1
            );
            mesh.rotation.z = yaw;
        }
        
        mesh.userData = { markerId: marker.id, type: 'marker' };
        
        this.scene.add(mesh);
        this.markerMeshes.push(mesh);
        
        return mesh;
    }



    updateMarkerMesh(marker) {
        const markerIndex = this.markers.findIndex(m => m.id === marker.id);
        if (markerIndex === -1) return;

        console.log('updateMarkerMesh called with marker:', marker);

        const mesh = this.markerMeshes[markerIndex];
        if (mesh) {
            // Update position
            mesh.position.copy(marker.position);
            
            // Update rotation from orientation quaternion
            if (marker.orientation) {
                // Convert quaternion to yaw (rotation around Z axis)
                const yaw = this.quaternionToYaw(
                    marker.orientation.x,
                    marker.orientation.y,
                    marker.orientation.z,
                    marker.orientation.w
                );
                console.log('yaw', yaw);
                mesh.rotation.z = yaw;
            }
            
            // Update texture if marker type changed
            const currentType = this.markers[markerIndex].type;
            if (marker.type !== currentType) {
                const textureLoader = new THREE.TextureLoader();
                let texturePath;
                
                if (marker.type === 'Aruco-marker') {
                    texturePath = '/assets/icons/aruco_pattern.png';
                } else {
                    texturePath = '/assets/icons/pattern.png';
                }
                
                const newTexture = textureLoader.load(texturePath);
                mesh.material.map = newTexture;
                mesh.material.needsUpdate = true;
                console.log(`Updated texture for marker ${marker.id} from ${currentType} to ${marker.type}`);
            }
            
            // Update marker data in the markers array
            this.markers[markerIndex] = {
                ...this.markers[markerIndex],
                ...marker
            };
            
            console.log(`Updated marker mesh for marker ${marker.id}:`, marker);
        }
    }





    // Utility methods
    findClickedMarker(worldPoint) {
        // Check if click is within any marker
        for (let i = 0; i < this.markers.length; i++) {
            const marker = this.markers[i];
            const mesh = this.markerMeshes[i];

            // Simple distance check for marker selection
            const distance = worldPoint.distanceTo(marker.position);
            if (distance < 0.3) { // Selection radius
                console.log(`Found clicked marker at index ${i}:`, marker);
                return { 
                    index: i,
                    data: marker,
                    mesh: mesh
                };
            }
        }

        // No marker found
        return null;
    }



    getSelectedMarker() {
        return this.state.selectedMarker;
    }

    setDialogCallbacks(onCreated, onUpdated, onClose) {
        this.onMarkerCreated = onCreated;
        this.onMarkerUpdated = onUpdated;
        this.onDialogClose = onClose;
    }

    hasSelectedMarker() {
        return this.state.selectedMarker !== null;
    }

    getPendingMarker() {
        return this.state.pendingMarker;
    }

    clearCurrentState() {
        console.log('clearCurrentState called, current selectedMarker:', this.state.selectedMarker);
        this.clearSelectedMarker();
        this.clearHoverState();
        this.clearPreview();
        this.hideDialog();
        
        // Hide edit/delete buttons in toolbar
        if (this.map2D && this.map2D.markersToolbar) {
            this.map2D.markersToolbar.hideEditActions();
        }
    }

    clearHoverState() {
        if (this.state.hoveredMarker && this.state.hoveredMarker !== this.state.selectedMarker) {
            this.state.hoveredMarker.mesh.material.color.setHex(0xffffff); // Reset to normal (no color overlay)
        }
        this.state.hoveredMarker = null;
    }

    clearPreview() {
        if (this.state.previewMesh) {
            this.scene.remove(this.state.previewMesh);
            if (this.state.previewMesh.geometry) {
                this.state.previewMesh.geometry.dispose();
            }
            if (this.state.previewMesh.material) {
                this.state.previewMesh.material.dispose();
            }
            this.state.previewMesh = null;
        }
    }



    // Update marker from data (for dialog)
    updateMarker(markerData) {
        console.log('Updating marker with data:', markerData);

        // Find marker by ID (correct way)
        const markerIndex = this.markers.findIndex(m => m.id === markerData.id);
        
        if (markerIndex === -1) {
            console.error('Marker not found for update:', markerData.id);
            return null;
        }

        const marker = this.markers[markerIndex];

        // Update position
        if (markerData.position) {
            marker.position.set(
                markerData.position.x || 0,
                markerData.position.y || 0,
                markerData.position.z || 0.1
            );
        }

        // Update marker properties directly
        marker.name = markerData.name;
        marker.type = markerData.type || marker.type || 'V-marker';
        marker.arucoId = markerData.arucoId;
        marker.orientation = markerData.orientation || marker.orientation || {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        };
        marker.offsetY = markerData.offsetY || 0;
        marker.offsetOrientation = markerData.offsetOrientation || 0;

        // Update mesh
        this.updateMarkerMesh(marker);

        console.log('Marker updated:', marker);

        // Clear selection highlight after successful update
        this.clearSelectedMarker();

        // Call callback if available
        if (this.onMarkerUpdated) {
            this.onMarkerUpdated(marker);
        }

        return marker;
    }

    // Delete marker by data (for dialog)
    deleteMarker(markerData) {
        console.log('Deleting marker with data:', markerData);

        // Find marker by ID (correct way)
        const markerIndex = this.markers.findIndex(m => m.id === markerData.id);
        
        if (markerIndex === -1) {
            console.error('Marker not found for deletion:', markerData.id);
            return false;
        }

        // Remove mesh
        if (this.markerMeshes[markerIndex]) {
            this.scene.remove(this.markerMeshes[markerIndex]);
        }

        // Remove from arrays
        this.markers.splice(markerIndex, 1);
        this.markerMeshes.splice(markerIndex, 1);

        // Clear selection if this was the selected marker
        if (this.state.selectedMarker && this.state.selectedMarker.id === markerData.id) {
            this.clearSelectedMarker();
        }

        console.log('Marker deleted successfully');

        return true;
    }

    // Clear all markers from scene and memory
    clearAllMarkers() {
        console.log('Clearing all markers');
        
        // Remove all marker meshes from scene and dispose resources
        this.markerMeshes.forEach(mesh => {
            if (mesh) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        });
        
        // Clear arrays
        this.markers = [];
        this.markerMeshes = [];
        
        console.log('All markers cleared');
    }

    // Load markers from server data
    loadMarkersFromServerData(serverMarkers) {
        console.log('Loading markers from server data:', serverMarkers);
        
        // Clear existing markers first
        this.clearAllMarkers();
        
        // Load markers from server
        serverMarkers.forEach(serverMarker => {
            try {
                // Parse properties if it's a string
                let properties = serverMarker.Properties;
                if (typeof properties === 'string') {
                    properties = JSON.parse(properties);
                }
                
                console.log('Parsed properties:', properties);
                
                const markerData = {
                    id: serverMarker.ID || `marker_${Date.now()}`,
                    name: serverMarker.MarkerName,
                    type: serverMarker.Type === 0 ? 'V-marker' : 'Aruco-marker',
                    arucoId: serverMarker.Type === 1 ? (properties.ArucoId || 0) : undefined,
                    position: {
                        x: parseFloat(properties.Position[0]),
                        y: parseFloat(properties.Position[1]),
                        z: parseFloat(properties.Position[2])
                    },
                    orientation: {
                        x: parseFloat(properties.Orientation[0]),
                        y: parseFloat(properties.Orientation[1]),
                        z: parseFloat(properties.Orientation[2]),
                        w: parseFloat(properties.Orientation[3])
                    },
                    offsetY: parseFloat(properties.OffsetY) || 0,
                    offsetOrientation: parseFloat(properties.OffsetOrientation) || 0
                };
                
                this.createMarkerFromData(markerData);
            } catch (error) {
                console.error('Error loading marker from server data:', error, serverMarker);
            }
        });
        
        console.log('Markers loaded from server:', this.markers.length);
    }

    // Get all markers (for sync with server)
    getAllMarkers() {
        console.log('getAllMarkers: Markers:', this.markers);
        return this.markers.map(marker => ({
            id: marker.id,
            name: marker.name,
            type: marker.type,
            arucoId: marker.arucoId,
            position: marker.position,
            orientation: marker.orientation || {
                x: 0,
                y: 0,
                z: 0,
                w: 1
            },
            offsetY: marker.offsetY || 0,
            offsetOrientation: marker.offsetOrientation || 0
        }));
    }

    // Update marker ID (for sync with server)
    updateMarkerId(oldId, newServerId) {
        const marker = this.markers.find(m => m.id === oldId);
        if (marker) {
            marker.id = newServerId;
            console.log(`Updated marker ID from ${oldId} to ${newServerId}`);
        }
    }

    // Mouse event handling for Map2D integration
    mouseEventHandle(clientX, clientY) {
        console.log("Marker: mouseEventHandle", clientX, clientY);
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log("Marker: mouseEventHandle: worldPoint is null");
            return;
        }

        switch (this.state.mode) {
            case 'create':
                this.handleCreateClick(worldPoint);
                break;
            case 'select':
                this.handleSelectClick(worldPoint);
                break;
            case 'edit':
                // In edit mode, start drag or rotate operation
                this.startDrag(clientX, clientY);
                break;
        }
    }

    updateNodePosition(clientX, clientY) {
        if (!this.state.isEnabled) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Handle drag and rotate operations in edit mode
        if (this.isEditMode() && (this.state.isDragging || this.state.isRotating)) {
            this.updateDrag(clientX, clientY);
            return;
        }

        // Update preview if in create mode
        if (this.isCreateMode() && this.state.previewMesh) {
            this.state.previewMesh.position.set(worldPoint.x, worldPoint.y, worldPoint.z);
        }

        // Update hover state only in create mode, not in select mode
        if (this.isCreateMode()) {
            this.updateHoverState(worldPoint);
        }
    }

    updateHoverState(worldPoint) {
        // Only show hover effects in create mode, not in select mode
        if (this.isSelectMode()) {
            return;
        }
        
        const hoveredMarker = this.findClickedMarker(worldPoint);
        
        // Clear previous hover
        if (this.state.hoveredMarker && this.state.hoveredMarker !== this.state.selectedMarker) {
            this.state.hoveredMarker.mesh.material.color.setHex(0xffffff); // Reset to normal (no color overlay)
        }

        // Set new hover
        if (hoveredMarker && hoveredMarker !== this.state.selectedMarker) {
            hoveredMarker.mesh.material.color.setHex(this.colors.hovered); // Yellow for hovered
            this.state.hoveredMarker = hoveredMarker;
        } else {
            this.state.hoveredMarker = null;
        }
    }

    resetCursor() {
        // Stop any ongoing drag or rotate operations
        this.stopDrag();
        
        // Reset cursor style based on current mode
        if (this.renderer && this.renderer.domElement) {
            if (this.isEditMode()) {
                this.renderer.domElement.style.cursor = 'grab';
            } else {
                this.renderer.domElement.style.cursor = 'default';
            }
        }
    }

    // Cleanup
    dispose() {
        this.unbindEvents();
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Remove all meshes
        this.markerMeshes.forEach(mesh => {
            if (mesh && mesh.parent) {
                mesh.parent.remove(mesh);
            }
        });
        
        this.clearPreview();
        
        this.markers = [];
        this.markerMeshes = [];
        
        console.log('DrawMarkers disposed');
    }

    // Load markers from database
    async loadMarkersFromDatabase() {
        try {
            // Clear existing markers FIRST before any API call
            this.clearAllMarkers();
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found for loading markers from database');
                return;
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                console.error('No mapId found for loading markers from database');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/markers/map/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data && Array.isArray(data)) {
                // Use existing method to load markers
                this.loadMarkersFromServerData(data);
                console.log(`Loaded ${data.length} markers from database`);
            } else {
                console.log('No markers found in database');
            }
        } catch (error) {
            console.error('Error loading markers from database:', error);
        }
    }

    // Save markers to database
    async saveToDatabase() {
        try {
            console.log('DrawMarkers: Starting save to database...');
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                throw new Error('No mapId found for saving markers');
            }

            // Get all markers from the tool
            const markers = this.getAllMarkers();
            console.log('DrawMarkers: Saving markers:', markers);

            // Get existing markers from server for comparison
            const existingResponse = await fetch(`${SERVER_URL}/api/markers/map/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const existingData = await existingResponse.json();
            const existingMarkers = Array.isArray(existingData) ? existingData : [];

            // Step 1: Delete markers from server that don't exist in current map
            const deletePromises = existingMarkers.map(async (serverMarker) => {
                const existsInMap = markers.find(mapMarker => mapMarker.id === serverMarker.ID);
                if (!existsInMap) {
                    console.log('DrawMarkers: Deleting marker from server:', serverMarker.ID);
                    try {
                        const response = await fetch(`${SERVER_URL}/api/markers/${serverMarker.ID}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawMarkers: Delete marker response:', result);
                    } catch (error) {
                        console.error(`Error deleting marker ${serverMarker.ID}:`, error);
                    }
                }
            });
            await Promise.all(deletePromises);

            // Step 2: Update existing markers in server
            const updatePromises = markers.map(async (mapMarker) => {
                const existsInServer = existingMarkers.find(serverMarker => serverMarker.ID === mapMarker.id);
                if (existsInServer) {
                    console.log('DrawMarkers: Updating marker in server:', mapMarker.id);
                    const properties = {
                        Position: [
                            mapMarker.position.x.toString(),
                            mapMarker.position.y.toString(),
                            mapMarker.position.z.toString()
                        ],
                        Orientation: [
                            mapMarker.orientation.x.toString(),
                            mapMarker.orientation.y.toString(),
                            mapMarker.orientation.z.toString(),
                            mapMarker.orientation.w.toString()
                        ],
                        ArucoID: mapMarker.arucoId ? mapMarker.arucoId.toString() : '0'
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/markers/${mapMarker.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: mapMarker.name || `Marker-${mapMarker.id}`,
                                type: mapMarker.type === 'Aruco-marker' ? 1 : 0,
                                properties: properties
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawMarkers: Update marker response:', result);
                    } catch (error) {
                        console.error(`Error updating marker ${mapMarker.id}:`, error);
                    }
                }
            });
            await Promise.all(updatePromises);

            // Step 3: Insert new markers to server
            const insertPromises = markers.map(async (mapMarker) => {
                const existsInServer = existingMarkers.find(serverMarker => serverMarker.ID === mapMarker.id);
                if (!existsInServer) {
                    console.log('DrawMarkers: Inserting new marker to server:', mapMarker.id);
                    const properties = {
                        Position: [
                            mapMarker.position.x.toString(),
                            mapMarker.position.y.toString(),
                            mapMarker.position.z.toString()
                        ],
                        Orientation: [
                            mapMarker.orientation.x.toString(),
                            mapMarker.orientation.y.toString(),
                            mapMarker.orientation.z.toString(),
                            mapMarker.orientation.w.toString()
                        ],
                        ArucoID: mapMarker.arucoId ? mapMarker.arucoId.toString() : '0'
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/markers`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                idMap: mapId,
                                name: mapMarker.name || `Marker-${mapMarker.id}`,
                                type: mapMarker.type === 'Aruco-marker' ? 1 : 0,
                                properties: properties
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawMarkers: Insert marker response:', result);
                        
                        // Update marker ID directly in this class if server returns new ID
                        if (result && result.markerId) {
                            const newServerId = result.markerId;
                            // Find and update the marker ID in our markers array
                            const markerIndex = this.markers.findIndex(m => m.id === mapMarker.id);
                            if (markerIndex !== -1) {
                                this.markers[markerIndex].id = newServerId;
                                console.log(`DrawMarkers: Updated marker ID from ${mapMarker.id} to ${newServerId}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Error inserting marker ${mapMarker.id}:`, error);
                    }
                }
            });
            await Promise.all(insertPromises);

            console.log('DrawMarkers: All markers saved successfully');

        } catch (error) {
            console.error('DrawMarkers: Error saving to database:', error);
            throw error;
        }
    }
}

export { DrawMarkers };
