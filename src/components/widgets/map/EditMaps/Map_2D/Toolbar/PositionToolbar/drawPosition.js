import * as THREE from 'three';
import { SERVER_URL } from '../../../../../../../config/serverConfig.js';

class DrawPosition {
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
            selectedPosition: null,
            hoveredPosition: null,
            previewMesh: null,
            showDialog: false,
            pendingPosition: null,
            // New state for pan and rotate functionality
            isDragging: false,
            isRotating: false,
            dragStartPoint: null,
            dragStartPosition: null,
            rotateStartAngle: 0,
            rotateStartRotation: 0,
            // State for tracking original position data before changes
            originalPositionData: null
        };

        // Position data
        this.positions = [];
        this.positionMeshes = [];
        this.positionLabels = []; // Add array to store text labels
        this.IDCount = 1;

        // Colors for different states
        this.colors = {
            normal: 0x90EE90,      // Light green
            selected: 0x90EE90,    // Light green
            hovered: 0xffff00,     // Yellow
            editing: 0x2196F3      // Blue
        };

        // Dialog callbacks
        this.onPositionCreated = null;
        this.onPositionUpdated = null;
        this.onDialogClose = null;

        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners for keyboard events
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    // Helper function để chuyển đổi quaternion thành góc yaw (similar to Robot.js)
    /** 
     * Convert quaternion to yaw
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
    setDialogCallbacks(onPositionCreated, onPositionUpdated, onDialogClose) {
        this.onPositionCreated = onPositionCreated;
        this.onPositionUpdated = onPositionUpdated;
        this.onDialogClose = onDialogClose;
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

        console.log(`DrawPosition: Mode changed to ${mode}`);
    }

    getMode() { return this.state.mode; }
    isCreateMode() { return this.state.mode === 'create'; }
    isSelectMode() { return this.state.mode === 'select'; }
    isEditMode() { return this.state.mode === 'edit'; }

    // Mouse event handlers
    mouseEventHandle(clientX, clientY) {
        console.log("Position: mouseEventHandle", clientX, clientY);
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log("Position: mouseEventHandle: worldPoint is null");
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
        console.log("Position: handleCreateClick", worldPoint);
        if (!this.isCreateMode()) return;

        // Store the clicked position and show dialog
        this.state.pendingPosition = {
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

        // Show dialog for position creation
        this.showDialog();
    }

    handleSelectClick(worldPoint) {
        console.log('=== handleSelectClick called ===');
        console.log('World point:', worldPoint);
        console.log('Available positions:', this.positions.length);
        
        // Find clicked position
        const positionInfo = this.findClickedPosition(worldPoint);
        console.log('Found position info:', positionInfo);
        
        if (positionInfo) {
            // Select the position
            this.selectPosition(positionInfo);
            console.log('Position selected:', positionInfo.data);
        } else {
            // Clear selection if clicking on empty space
            this.clearSelectedPosition();
            console.log('No position clicked, cleared selection');
        }
    }

    handleEditClick(worldPoint) {
        if (!this.isEditMode()) return;

        // In edit mode, we can modify existing positions
        const clickedPosition = this.findClickedPosition(worldPoint);
        
        if (clickedPosition) {
            this.selectPosition(clickedPosition);
            // Show dialog for editing
           // this.showEditDialog(clickedPosition.data);
        } else {
            this.clearSelectedPosition();
        }
    }

    // New methods for pan and rotate functionality
    startDrag(clientX, clientY) {
        if (!this.isEditMode() || !this.state.selectedPosition) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Save original position data before making changes
        if (!this.state.originalPositionData) {
            this.state.originalPositionData = {
                position: { ...this.state.selectedPosition.data.position },
                orientation: { ...this.state.selectedPosition.data.orientation }
            };
            console.log('Saved original position data:', this.state.originalPositionData);
        }

        // Check if click is on the position mesh (for panning)
        const positionInfo = this.findClickedPosition(worldPoint);
        if (positionInfo && positionInfo.data.id === this.state.selectedPosition.data.id) {
            // Start panning
            this.state.isDragging = true;
            this.state.dragStartPoint = worldPoint;
            this.state.dragStartPosition = {
                x: this.state.selectedPosition.data.position.x,
                y: this.state.selectedPosition.data.position.y
            };
            
            // Change cursor to grabbing
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.cursor = 'grabbing';
            }
            
            console.log('Started dragging position:', this.state.selectedPosition.data.id);
        } else {
            // Start rotating (click outside position)
            this.state.isRotating = true;
            this.state.dragStartPoint = worldPoint;
            this.state.rotateStartAngle = Math.atan2(
                worldPoint.y - this.state.selectedPosition.data.position.y,
                worldPoint.x - this.state.selectedPosition.data.position.x
            );
            this.state.rotateStartRotation = this.state.selectedPosition.data.orientation ? 
                this.quaternionToYaw(
                    this.state.selectedPosition.data.orientation.x || 0,
                    this.state.selectedPosition.data.orientation.y || 0,
                    this.state.selectedPosition.data.orientation.z || 0,
                    this.state.selectedPosition.data.orientation.w || 1
                ) : 0;
            
            // Change cursor to rotate
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.cursor = 'crosshair';
            }
            
            console.log('Started rotating position:', this.state.selectedPosition.data.id);
        }
    }

    updateDrag(clientX, clientY) {
        if (!this.state.isDragging && !this.state.isRotating) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint || !this.state.selectedPosition) return;

        if (this.state.isDragging) {
            // Update position for panning
            const deltaX = worldPoint.x - this.state.dragStartPoint.x;
            const deltaY = worldPoint.y - this.state.dragStartPoint.y;

            const newPosition = {
                x: this.state.dragStartPosition.x + deltaX,
                y: this.state.dragStartPosition.y + deltaY,
                z: this.state.selectedPosition.data.position.z
            };

            // Update position data
            this.state.selectedPosition.data.position = newPosition;

            // Update mesh position
            const mesh = this.positionMeshes.find(m => m.userData.id === this.state.selectedPosition.data.id);
            if (mesh) {
                mesh.position.set(newPosition.x, newPosition.y, newPosition.z);
            }

            // Update label position
            const labelIndex = this.positionLabels.findIndex(label => label.userData.id === this.state.selectedPosition.data.id);
            if (labelIndex !== -1) {
                const labelMesh = this.positionLabels[labelIndex];
                
                // Get robot orientation angle
                const robotAngle = this.state.selectedPosition.data.orientation ? 
                    this.quaternionToYaw(
                        this.state.selectedPosition.data.orientation.x || 0,
                        this.state.selectedPosition.data.orientation.y || 0,
                        this.state.selectedPosition.data.orientation.z || 0,
                        this.state.selectedPosition.data.orientation.w || 1
                    ) : 0;
                
                // Calculate label position based on robot angle
                const labelPosition = this.calculateLabelPosition(robotAngle, this.state.selectedPosition.data.position);
                
                labelMesh.position.set(
                    labelPosition.x,
                    labelPosition.y,
                    labelPosition.z
                );
            }

            console.log('Updated position during drag:', newPosition);
        } else if (this.state.isRotating) {
            // Update rotation
            const currentAngle = Math.atan2(
                worldPoint.y - this.state.selectedPosition.data.position.y,
                worldPoint.x - this.state.selectedPosition.data.position.x
            );
            const deltaAngle = currentAngle - this.state.rotateStartAngle;
            const newRotation = this.state.rotateStartRotation + deltaAngle;

            // Update position orientation (convert yaw back to quaternion)
            this.state.selectedPosition.data.orientation = this.yawToQuaternion(newRotation);

            // Update mesh rotation
            const mesh = this.positionMeshes.find(m => m.userData.id === this.state.selectedPosition.data.id);
            if (mesh) {
                mesh.rotation.z = newRotation;
            }

            // Update label rotation
            const labelIndex = this.positionLabels.findIndex(label => label.userData.id === this.state.selectedPosition.data.id);
            if (labelIndex !== -1) {
                const labelMesh = this.positionLabels[labelIndex];
                
                // Update label rotation to match robot orientation (always parallel)
                // Check if text should be flipped (when on the left side)
                const angleDegrees = (newRotation * 180) / Math.PI;
                const isOnLeftSide = (angleDegrees >= -90 && angleDegrees <= 90);
                
                // If on left side, add 180 degrees to flip the text
                labelMesh.rotation.z = newRotation + (isOnLeftSide ? 0 : Math.PI);
                
                // Recalculate label position based on new angle
                const robotAngle = newRotation;
                const labelPosition = this.calculateLabelPosition(robotAngle, this.state.selectedPosition.data.position);
                
                // Update label position
                labelMesh.position.set(
                    labelPosition.x,
                    labelPosition.y,
                    labelPosition.z
                );
            }

            //console.log('Updated rotation during rotate:', newRotation);
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

    // Dialog management
    showDialog() {
        console.log("Position: showDialog");
        this.state.showDialog = true;
        if (this.onDialogClose) {
            this.onDialogClose(true);
        }
    }

    hideDialog() {
        this.state.showDialog = false;
        this.state.pendingPosition = null;
        this.state.positionBeingEdited = null; // Clear position being edited
        if (this.onDialogClose) {
            this.onDialogClose(false);
        }
    }

    showEditDialog(positionData) {
        this.state.showDialog = true;
        this.state.pendingPosition = positionData;
        
        // Store the position being edited so we can restore selection later
        this.state.positionBeingEdited = positionData;
        
        if (this.onDialogClose) {
            this.onDialogClose(true);
        }
    }

    showSettingsDialog(positionData) {
        console.log('showSettingsDialog called with:', positionData);
        this.state.showDialog = true;
        this.state.pendingPosition = positionData;
        
        // Store the position being edited so we can restore selection later
        this.state.positionBeingEdited = positionData;
        
        if (this.onDialogClose) {
            this.onDialogClose(true);
        }
    }

    // Position creation and management
    createPosition(positionData) {
        
        // Validate position data
        if (!positionData) {
            console.error('createPosition: positionData is null or undefined');
            return null;
        }
        
        if (!positionData.position) {
            console.error('createPosition: positionData.position is missing', positionData);
            return null;
        }
        
        if (!positionData.name) {
            console.error('createPosition: positionData.name is missing', positionData);
            return null;
        }
        
        // Create a new position with the provided data
        const newPosition = {
            id: positionData.id || this.IDCount++, // Use provided ID or generate new one
            name: positionData.name,
            type: positionData.type || 'default',
            position: positionData.position,
            orientation: positionData.orientation || { x: 0, y: 0, z: 0, w: 1 }
        };

        // Create visual representation
        const mesh = this.createPositionMesh(newPosition);

        // Add to data array
        this.positions.push(newPosition);

        // Update IDCount if this position has an ID from server
        if (positionData.id && positionData.id >= this.IDCount) {
            this.IDCount = positionData.id + 1;
        }

        // Call callback if provided
        if (this.onPositionCreated) {
            this.onPositionCreated(newPosition);
        }

        return newPosition;
    }

    updatePosition(positionData) {
        if (!this.state.selectedPosition) {
            console.error('updatePosition: No position selected');
            return;
        }

        const selectedIndex = this.state.selectedPosition.index;
        const originalPosition = this.positions[selectedIndex];
        
        console.log('updatePosition: Original position:', originalPosition);
        console.log('updatePosition: Update data:', positionData);
        
        const updatedPosition = {
            ...originalPosition, // Keep original ID and other properties
            name: positionData.name,
            type: positionData.type,
            position: positionData.position,
            orientation: positionData.orientation
        };

        console.log('updatePosition: Updated position with ID:', updatedPosition.id);

        // Update data array
        this.positions[selectedIndex] = updatedPosition;

        // Update visual representation
        this.updatePositionMesh(updatedPosition);

        console.log('Position updated successfully:', updatedPosition);

        // Call callback if provided
        if (this.onPositionUpdated) {
            this.onPositionUpdated(updatedPosition);
        }

        return updatedPosition;
    }

    createPositionMesh(positionData) {
        console.log('createPositionMesh called with:', positionData);
        
        if (!positionData || !positionData.position) {
            console.error('createPositionMesh: Invalid position data', positionData);
            return;
        }

        // Create geometry based on footprint or default
        let geometry;
        if (this.robotFootprint && this.robotFootprint.points && this.robotFootprint.points.length > 0) {
            // Create shape from footprint
            const shape = new THREE.Shape();
            const points = this.robotFootprint.points;

            // Move to first point
            shape.moveTo(points[0].x, points[0].y);
            
            // Draw edges of footprint
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i].x, points[i].y);
            }
            // Close shape
            shape.lineTo(points[0].x, points[0].y);

            geometry = new THREE.ShapeGeometry(shape);

            // Calculate UV mapping to fill image correctly with shape
            const uvs = geometry.attributes.uv;
            const positions = geometry.attributes.position;

            // Find bounds of geometry
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            for (let i = 0; i < positions.count; i++) {
                minX = Math.min(minX, positions.getX(i));
                maxX = Math.max(maxX, positions.getX(i));
                minY = Math.min(minY, positions.getY(i));
                maxY = Math.max(maxY, positions.getY(i));
            }

            // Update UV coordinates to fill image
            for (let i = 0; i < uvs.count; i++) {
                const posX = positions.getX(i);
                const posY = positions.getY(i);
                uvs.setXY(
                    i,
                    (posX - minX) / (maxX - minX),
                    (posY - minY) / (maxY - minY)
                );
            }

            geometry.attributes.uv.needsUpdate = true;
        } else {
            // Fallback to default rectangle
            geometry = new THREE.PlaneGeometry(0.5, 0.6);
        }

        // Create material with texture (no color overlay for normal state)
        const material = new THREE.MeshBasicMaterial({
            map: this.robotTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.5         // cắt bỏ pixel có alpha < 0.5 để loại phần rìa mờ
        });

        // Flip plane to face camera if needed and reduce thickness illusion
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = 0; // ensure flat on map plane
        
        // Set position
        mesh.position.set(
            positionData.position.x,
            positionData.position.y,
            positionData.position.z ?? 0
        );

        // Set rotation from orientation
        if (positionData.orientation) {
            const yaw = this.quaternionToYaw(
                positionData.orientation.x || 0,
                positionData.orientation.y || 0,
                positionData.orientation.z || 0,
                positionData.orientation.w || 1
            );
            mesh.rotation.z = yaw;
        }

        // Ensure position marker always renders beneath robot (larger z) and does not z-fight
        material.depthTest = true;
        material.depthWrite = true;
        mesh.renderOrder = -1;

        // Store position data in mesh
        mesh.userData = {
            id: positionData.id,
            type: 'position',
            data: positionData
        };

        // Add to scene and arrays
        
        this.scene.add(mesh);
        this.positionMeshes.push(mesh);

        // Create and add position label
        const labelMesh = this.createPositionLabel(positionData);
        this.scene.add(labelMesh);
        this.positionLabels.push(labelMesh);

        console.log('Position mesh created:', mesh);
        return mesh;
    }

    createPositionLabel(positionData) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 256;
        canvas.height = 64;
        
        // Clear canvas (transparent background)
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set text style
        context.fillStyle = '#333333'; // Dark gray color
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text
        const text = positionData.name || `Position ${positionData.id}`;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create geometry (small plane for text)
        const geometry = new THREE.PlaneGeometry(1.5, 0.4);
        
        // Create mesh
        const labelMesh = new THREE.Mesh(geometry, material);
        
        // Get robot orientation angle
        const robotAngle = positionData.orientation ? 
            this.quaternionToYaw(
                positionData.orientation.x || 0,
                positionData.orientation.y || 0,
                positionData.orientation.z || 0,
                positionData.orientation.w || 1
            ) : 0;
        
        // Calculate label position based on robot angle
        const labelPosition = this.calculateLabelPosition(robotAngle, positionData.position);
        
        // Check if text should be flipped (when on the left side)
        const angleDegrees = (robotAngle * 180) / Math.PI;
        const isOnLeftSide = (angleDegrees >= -90 && angleDegrees <= 90);
        
        // Position label relative to robot
        labelMesh.position.set(
            labelPosition.x,
            labelPosition.y,
            labelPosition.z
        );
        
        // Set rotation to match robot orientation (always parallel)
        // If on left side, add 180 degrees to flip the text
        labelMesh.rotation.z = robotAngle + (isOnLeftSide ? 0 : Math.PI);
        
        // Store reference to position data
        labelMesh.userData = {
            id: positionData.id,
            type: 'position_label',
            data: positionData
        };
        
        return labelMesh;
    }

    updatePositionMesh(positionData) {
        const meshIndex = this.positionMeshes.findIndex(mesh => mesh.userData.id === positionData.id);
        if (meshIndex !== -1) {
            const mesh = this.positionMeshes[meshIndex];
            
            // Update position
            mesh.position.set(
                positionData.position.x || 0,
                positionData.position.y || 0,
                positionData.position.z || 0.1
            );
            
            // Update rotation if orientation is provided
            if (positionData.orientation) {
                const orientation = positionData.orientation;
                if (orientation.x !== undefined && orientation.y !== undefined && 
                    orientation.z !== undefined && orientation.w !== undefined) {
                    // Convert quaternion to Euler rotation
                    const quaternion = new THREE.Quaternion(
                        orientation.x,
                        orientation.y,
                        orientation.z,
                        orientation.w
                    );
                    mesh.rotation.setFromQuaternion(quaternion);
                }
            }
            
            // Update user data
            mesh.userData.data = positionData;
            
            // Update corresponding label
            const labelIndex = this.positionLabels.findIndex(label => label.userData.id === positionData.id);
            if (labelIndex !== -1) {
                const labelMesh = this.positionLabels[labelIndex];
                
                // Get robot orientation angle
                const robotAngle = positionData.orientation ? 
                    this.quaternionToYaw(
                        positionData.orientation.x || 0,
                        positionData.orientation.y || 0,
                        positionData.orientation.z || 0,
                        positionData.orientation.w || 1
                    ) : 0;
                
                // Calculate label position based on robot angle
                const labelPosition = this.calculateLabelPosition(robotAngle, positionData.position);
                
                // Update label position
                labelMesh.position.set(
                    labelPosition.x,
                    labelPosition.y,
                    labelPosition.z
                );
                
                // Update label rotation to match robot orientation (always parallel)
                // Check if text should be flipped (when on the left side)
                const angleDegrees = (robotAngle * 180) / Math.PI;
                const isOnLeftSide = (angleDegrees >= -90 && angleDegrees <= 90);
                
                // If on left side, add 180 degrees to flip the text
                labelMesh.rotation.z = robotAngle + (isOnLeftSide ? 0 : Math.PI);
                
                // Update label text if name changed
                this.updateLabelText(labelMesh, positionData);
            }
            
            console.log('Position mesh updated:', positionData);
        }
    }

    updateLabelText(labelMesh, positionData) {
        // Create new canvas with updated text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 256;
        canvas.height = 64;
        
        // Clear canvas (transparent background)
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set text style
        context.fillStyle = '#333333'; // Dark gray color
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text
        const text = positionData.name || `Position ${positionData.id}`;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Update texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Update material
        labelMesh.material.map = texture;
        labelMesh.material.needsUpdate = true;
    }

    findClickedPosition(worldPoint) {
        // Check if click is within any position marker
        for (let i = 0; i < this.positions.length; i++) {
            const positionData = this.positions[i];

            // ==================================================================
            // ==                         SỬA LỖI Ở ĐÂY                        ==
            // ==================================================================

            // 1. Tạo vector vị trí từ dữ liệu ROS
            const posVec = new THREE.Vector3(
                positionData.position.x,
                positionData.position.y,
                positionData.position.z
            );

            // 2. Tạo quaternion từ dữ liệu ROS
            const quat = new THREE.Quaternion(
                positionData.orientation.x,
                positionData.orientation.y,
                positionData.orientation.z,
                positionData.orientation.w
            );

            // 3. Tạo vector tỉ lệ (thường là 1,1,1)
            const scaleVec = new THREE.Vector3(1, 1, 1);

            // 4. Sử dụng compose() để tạo ma trận biến đổi hoàn chỉnh và chính xác
            const matrix = new THREE.Matrix4();
            matrix.compose(posVec, quat, scaleVec);

            // --- Kết thúc phần sửa lỗi ---

            // Biến đổi các điểm footprint theo ma trận đã tạo
            const footprintPoints = this.robotFootprint.points;
            const transformedPoints = footprintPoints.map(point => {
                const pointVector = new THREE.Vector3(point.x, point.y, point.z);
                pointVector.applyMatrix4(matrix);
                return pointVector;
            });

            // Kiểm tra xem điểm click có nằm trong đa giác đã biến đổi không
            const isInside = this.isPointInPolygon(worldPoint, transformedPoints);
            if (isInside) {
                console.log(`Found clicked position at index ${i}:`, positionData);
                return { 
                    index: i,
                    data: positionData,
                    mesh: this.positionMeshes[i]
                };
            }
        }

        // Không tìm thấy vị trí nào được click
        return null;
    }

    selectPosition(positionInfo) {
        // Reset previous selection highlight
        if (this.state.selectedPosition && this.state.selectedPosition.mesh) {
            this.state.selectedPosition.mesh.material.color.setHex(0xffffff);
        }
        
        this.state.selectedPosition = positionInfo;
        
        // Highlight selected position
        if (positionInfo.mesh) {
            positionInfo.mesh.material.color.setHex(this.colors.selected); // Red for selected
        }
        
        // Show edit/delete buttons in toolbar
        if (this.map2D && this.map2D.positionToolbar) {
            this.map2D.positionToolbar.showEditActions(positionInfo.data.id);
        }
        
        console.log('Position selected:', positionInfo.data);
        console.log('Current selectedPosition state:', this.state.selectedPosition);
    }

    clearSelectedPosition() {
        // Reset previous selection highlight to normal (no color overlay)
        if (this.state.selectedPosition && this.state.selectedPosition.mesh) {
            this.state.selectedPosition.mesh.material.color.setHex(0xffffff); // White = no color overlay
        }
        
        // Clear original position data when deselecting
        this.state.originalPositionData = null;
        
        this.state.selectedPosition = null;
        
        // Hide edit/delete buttons in toolbar
        if (this.map2D && this.map2D.positionToolbar) {
            this.map2D.positionToolbar.hideEditActions();
        }
    }

    // Edit selected position
    editSelectedPosition() {
        console.log('=== editSelectedPosition called ===');
        console.log('Current state:', {
            selectedPosition: this.state.selectedPosition,
            mode: this.state.mode,
            isEnabled: this.state.isEnabled,
            positions: this.positions.length,
            positionMeshes: this.positionMeshes.length
        });
        
        if (!this.state.selectedPosition) {
            console.warn('No position selected for editing');
            console.log('Available positions:', this.positions);
            console.log('Available position meshes:', this.positionMeshes);
            return;
        }
        
        if (!this.state.selectedPosition.data) {
            console.error('Selected position has no data property:', this.state.selectedPosition);
            return;
        }
        
        // Save selected position data before changing mode (since setMode calls clearCurrentState)
        const positionDataToEdit = this.state.selectedPosition.data;
        
        // Switch to edit mode
        this.setMode('edit');
        
        // Show edit dialog with saved position data
       // this.showEditDialog(positionDataToEdit);
        
        console.log('Editing position:', positionDataToEdit);
    }

    // Delete selected position
    deleteSelectedPosition() {
        if (!this.state.selectedPosition) {
            console.warn('No position selected for deletion');
            return;
        }
        
        const positionId = this.state.selectedPosition.data.id;
        const positionMesh = this.state.selectedPosition.mesh;
        
        // Remove from scene
        if (positionMesh) {
            this.scene.remove(positionMesh);
            positionMesh.geometry.dispose();
            positionMesh.material.dispose();
        }
        
        // Remove corresponding label
        const labelIndex = this.positionLabels.findIndex(label => label.userData.id === positionId);
        if (labelIndex !== -1) {
            const labelMesh = this.positionLabels[labelIndex];
            this.scene.remove(labelMesh);
            labelMesh.geometry.dispose();
            labelMesh.material.dispose();
            this.positionLabels.splice(labelIndex, 1);
        }
        
        // Remove from data arrays
        const dataIndex = this.positions.findIndex(p => p.id === positionId);
        const meshIndex = this.positionMeshes.findIndex(m => m.userData.id === positionId);
        
        if (dataIndex !== -1) {
            this.positions.splice(dataIndex, 1);
        }
        if (meshIndex !== -1) {
            this.positionMeshes.splice(meshIndex, 1);
        }
        
        // Clear selection
        this.clearSelectedPosition();
        
        console.log('Position deleted:', positionId);
    }

    // Update methods
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
        
        const hoveredPosition = this.findClickedPosition(worldPoint);
        
        // Clear previous hover
        if (this.state.hoveredPosition && this.state.hoveredPosition !== this.state.selectedPosition) {
            this.state.hoveredPosition.mesh.material.color.setHex(0xffffff); // Reset to normal (no color overlay)
        }

        // Set new hover
        if (hoveredPosition && hoveredPosition !== this.state.selectedPosition) {
            hoveredPosition.mesh.material.color.setHex(this.colors.hovered); // Yellow for hovered
            this.state.hoveredPosition = hoveredPosition;
        } else {
            this.state.hoveredPosition = null;
        }
    }

    // Utility methods
    getWorldPosition(clientX, clientY) {
       // console.log('getWorldPosition called with:', clientX, clientY);
       // console.log('mapMesh exists:', !!this.mapMesh);
        
        if (!this.mapMesh) {
            console.warn('getWorldPosition: mapMesh is null, trying Map2D method');
            // Fallback to Map2D's getWorldPosition method
            if (this.map2D && this.map2D.getWorldPosition) {
                return this.map2D.getWorldPosition(clientX, clientY);
            }
            return null;
        }

        const rect = this.renderer.domElement.getBoundingClientRect();
       // console.log('renderer rect:', rect);
        
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;
        //console.log('normalized mouse coordinates:', mouseX, mouseY);

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        const intersects = raycaster.intersectObject(this.mapMesh);
        //console.log('intersects found:', intersects.length);
        
        if (intersects.length > 0) {
            //console.log('intersection point:', intersects[0].point);
            return intersects[0].point;
        }
        
        //console.warn('getWorldPosition: No intersection found, trying Map2D method');
        // Fallback to Map2D's getWorldPosition method
        if (this.map2D && this.map2D.getWorldPosition) {
            return this.map2D.getWorldPosition(clientX, clientY);
        }
        
        return null;
    }

    // State management
    clearCurrentState() {
        console.log('clearCurrentState called, current selectedPosition:', this.state.selectedPosition);
        this.clearSelectedPosition();
        this.clearHoverState();
        this.clearPreview();
        this.hideDialog();
        
        // Hide edit/delete buttons in toolbar
        if (this.map2D && this.map2D.positionToolbar) {
            this.map2D.positionToolbar.hideEditActions();
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

    clearHoverState() {
        if (this.state.hoveredPosition && this.state.hoveredPosition !== this.state.selectedPosition) {
            this.state.hoveredPosition.mesh.material.color.setHex(0xffffff); // Reset to normal (no color overlay)
        }
        this.state.hoveredPosition = null;
    }

    clearPreview() {
        if (this.state.previewMesh) {
            this.scene.remove(this.state.previewMesh);
            this.state.previewMesh.geometry.dispose();
            this.state.previewMesh.material.dispose();
            this.state.previewMesh = null;
        }
    }

    // Enable/disable methods
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
        
        console.log('DrawPosition: Edit mode enabled');
    }

    // Clear and reset methods
    clear() {
        this.clearCurrentState();
        this.clearAllPositions();
    }

    clearAllPositions() {
        // Remove all position meshes from scene
        this.positionMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        // Remove all position labels from scene
        this.positionLabels.forEach(label => {
            this.scene.remove(label);
            label.geometry.dispose();
            label.material.dispose();
        });

        this.positionMeshes = [];
        this.positionLabels = [];
        this.positions = [];
        this.IDCount = 1;
    }

    // Clear only meshes and labels, but keep positions data
    clearPositionMeshesOnly() {
        // Remove all position meshes from scene
        this.positionMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        // Remove all position labels from scene
        this.positionLabels.forEach(label => {
            this.scene.remove(label);
            label.geometry.dispose();
            label.material.dispose();
        });

        this.positionMeshes = [];
        this.positionLabels = [];
        // Note: Do NOT clear this.positions array or this.IDCount
    }

    // Apply positions to map
    applyPositionsToMap() {
        // This method would typically save positions to the server
        console.log('Applying positions to map:', this.positions);
        
        // Update selected position in positions array
        if (this.state.selectedPosition) {
            const positionIndex = this.positions.findIndex(p => p.id === this.state.selectedPosition.data.id);
            if (positionIndex !== -1) {
                // Update the position in the array with current data
                this.positions[positionIndex] = { ...this.state.selectedPosition.data };
                console.log('Updated position in array:', this.positions[positionIndex]);
            }
        }
        
        // Clear original position data after successful apply
        this.state.originalPositionData = null;
        
        // Clear selected position highlight after applying
        this.clearSelectedPosition();
        
        // For now, just return the positions data
        return this.positions;
    }

    // Cancel positions changes
    cancelPositionsToMap() {
        // This method would typically discard changes
        console.log('Canceling positions changes');
        
        // Restore original position data if available
        if (this.state.originalPositionData && this.state.selectedPosition) {
            console.log('Restoring original position data:', this.state.originalPositionData);
            
            // Restore position data
            this.state.selectedPosition.data.position = { ...this.state.originalPositionData.position };
            this.state.selectedPosition.data.orientation = { ...this.state.originalPositionData.orientation };
            
            // Update mesh position and rotation
            const mesh = this.positionMeshes.find(m => m.userData.id === this.state.selectedPosition.data.id);
            if (mesh) {
                mesh.position.set(
                    this.state.originalPositionData.position.x,
                    this.state.originalPositionData.position.y,
                    this.state.originalPositionData.position.z || 0.1
                );
                mesh.rotation.z = this.quaternionToYaw(
                    this.state.originalPositionData.orientation.x || 0,
                    this.state.originalPositionData.orientation.y || 0,
                    this.state.originalPositionData.orientation.z || 0,
                    this.state.originalPositionData.orientation.w || 1
                );
            }
            
            // Update corresponding label
            const labelIndex = this.positionLabels.findIndex(label => label.userData.id === this.state.selectedPosition.data.id);
            if (labelIndex !== -1) {
                const labelMesh = this.positionLabels[labelIndex];
                
                // Get robot orientation angle
                const robotAngle = this.state.originalPositionData.orientation ? 
                    this.quaternionToYaw(
                        this.state.originalPositionData.orientation.x || 0,
                        this.state.originalPositionData.orientation.y || 0,
                        this.state.originalPositionData.orientation.z || 0,
                        this.state.originalPositionData.orientation.w || 1
                    ) : 0;
                
                // Calculate label position based on robot angle
                const labelPosition = this.calculateLabelPosition(robotAngle, this.state.originalPositionData.position);
                
                labelMesh.position.set(
                    labelPosition.x,
                    labelPosition.y,
                    labelPosition.z
                );
                
                // Check if text should be flipped (when on the left side)
                const angleDegrees = (robotAngle * 180) / Math.PI;
                const isOnLeftSide = (angleDegrees >= -90 && angleDegrees <= 90);
                
                // If on left side, add 180 degrees to flip the text
                labelMesh.rotation.z = robotAngle + (isOnLeftSide ? 0 : Math.PI);
            }
            
            // Clear original data
            this.state.originalPositionData = null;
        }
        
        // Clear selected position highlight after canceling
        this.clearSelectedPosition();
        
        // For now, just return the positions data
        return this.positions;
    }

    // Data management
    getAllPositions() {
        console.log('getAllPositions called, positions array:', this.positions);
        
        // Return all positions in the format expected by the server
        const formattedPositions = this.positions.map(position => {
            const formatted = {
                id: position.id,
                name: position.name || `Position-${position.id}`,
                type: position.type || 'Robot position',
                position: {
                    x: position.position.x,
                    y: position.position.y,
                    z: position.position.z || 0
                },
                orientation: {
                    x: position.orientation.x || 0,
                    y: position.orientation.y || 0,
                    z: position.orientation.z || 0,
                    w: position.orientation.w || 1
                }
            };
            console.log('Formatted position:', formatted);
            return formatted;
        });
        
        console.log('getAllPositions returning:', formattedPositions);
        return formattedPositions;
    }

    getCurrentIDCount() {
        return this.IDCount;
    }

    setIDCount(count) {
        this.IDCount = count;
    }



    // Remove position by ID
    removePositionById(id) {
        const index = this.positions.findIndex(pos => pos.id === id);
        if (index !== -1) {
            // Remove from data array
            this.positions.splice(index, 1);

            // Remove from scene
            if (this.positionMeshes[index]) {
                this.scene.remove(this.positionMeshes[index]);
                this.positionMeshes[index].geometry.dispose();
                this.positionMeshes[index].material.dispose();
                this.positionMeshes.splice(index, 1);
            }

            // Remove corresponding label
            const labelIndex = this.positionLabels.findIndex(label => label.userData.id === id);
            if (labelIndex !== -1) {
                const labelMesh = this.positionLabels[labelIndex];
                this.scene.remove(labelMesh);
                labelMesh.geometry.dispose();
                labelMesh.material.dispose();
                this.positionLabels.splice(labelIndex, 1);
            }

            console.log(`Position ${id} removed`);
        }
    }

    // Update position ID (useful after saving to server)
    updatePositionId(oldId, newId) {
        console.log(`Updating position ID from ${oldId} to ${newId}`);
        
        // Find and update position in data array
        const positionIndex = this.positions.findIndex(p => p.id === oldId);
        if (positionIndex !== -1) {
            this.positions[positionIndex].id = newId;
            
            // Update mesh userData
            const mesh = this.positionMeshes[positionIndex];
            if (mesh) {
                mesh.userData.id = newId;
                mesh.userData.data.id = newId;
            }
            
            // Update label userData
            const label = this.positionLabels.find(l => l.userData.id === oldId);
            if (label) {
                label.userData.id = newId;
                label.userData.data.id = newId;
            }
            
            // Update selected position if it's the one being updated
            if (this.state.selectedPosition && this.state.selectedPosition.data.id === oldId) {
                this.state.selectedPosition.data.id = newId;
            }
            
            console.log(`Successfully updated position ID from ${oldId} to ${newId}`);
            return true;
        }
        
        console.warn(`Position with ID ${oldId} not found for ID update`);
        return false;
    }

    // Get pending position data for dialog
    getPendingPosition() {
        return this.state.pendingPosition;
    }

    // Check if dialog should be shown
    shouldShowDialog() {
        return this.state.showDialog;
    }

    // Keyboard event handling
    handleKeyDown(event) {
        if (!this.state.isEnabled) return;

        // Don't handle keyboard events when dialog is open or position is being edited
        if (this.state.showDialog || this.state.positionBeingEdited) {
            console.log('Ignoring keyboard event because dialog is open or position being edited:', event.key);
            return;
        }

        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                if (this.state.selectedPosition) {
                    console.log('Deleting position via keyboard:', this.state.selectedPosition.data.id);
                    this.removePositionById(this.state.selectedPosition.data.id);
                    this.clearSelectedPosition();
                }
                break;
            case 'Escape':
                this.clearCurrentState();
                break;
        }
    }

    // Enable/disable
    enable() {
        this.state.isEnabled = true;
    }

    disable() {
        this.state.isEnabled = false;
        this.clearCurrentState();
    }

    // Cleanup
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);

        // Clear all positions and labels
        this.clearAllPositions();

        // Clear state
        this.state = {
            mode: 'create',
            isEnabled: false,
            isDrawingEnabled: false,
            selectedPosition: null,
            hoveredPosition: null,
            previewMesh: null,
            showDialog: false,
            pendingPosition: null,
            // New state for pan and rotate functionality
            isDragging: false,
            isRotating: false,
            dragStartPoint: null,
            dragStartPosition: null,
            rotateStartAngle: 0,
            rotateStartRotation: 0,
            // State for tracking original position data before changes
            originalPositionData: null
        };

    }

    // Update footprint and texture from Map2D
    updateFootprintAndTexture() {
        if (this.map2D) {
            this.robotFootprint = this.map2D.robotFootprint;
            this.robotTexture = this.map2D.robotTexture;
        }
    }

    // Refresh all position meshes with new footprint/texture
    refreshPositionMeshes() {
        
        // Store current positions
        const currentPositions = [...this.positions];
        
        // Clear only meshes and labels, but keep positions data
        this.clearPositionMeshesOnly();
        
        // Recreate meshes and labels with new footprint/texture
        currentPositions.forEach(positionData => {
            this.createPositionMesh(positionData);
        });
        
    }

    // Update mapMesh reference when map is loaded
    updateMapMesh(mapMesh) {
        this.mapMesh = mapMesh;
    }

    // Get current selected position
    getSelectedPosition() {
        return this.state.selectedPosition;
    }

    // Check if any position is selected
    hasSelectedPosition() {
        return this.state.selectedPosition !== null;
    }

 

    // Restore selection after editing
    restoreSelectionAfterEdit() {
        if (this.state.positionBeingEdited) {
            // Find the position in the data array
            const positionIndex = this.positions.findIndex(p => p.id === this.state.positionBeingEdited.id);
            if (positionIndex !== -1) {
                // Create position info object
                const positionInfo = {
                    index: positionIndex,
                    data: this.positions[positionIndex],
                    mesh: this.positionMeshes[positionIndex]
                };
                
                // Select the position
                this.selectPosition(positionInfo);
                console.log('Selection restored after edit:', positionInfo.data);
            }
            
            // Clear the position being edited
            this.state.positionBeingEdited = null;
        }
    }

    calculateLabelPosition(robotAngle, robotPosition) {
        // Calculate label position based on robot angle
        let labelOffsetX = 0;
        let labelOffsetY = 0;
        
        // Convert angle to degrees for easier comparison
        const angleDegrees = (robotAngle * 180) / Math.PI;
        
        // Determine label position based on angle (flipped)
        if (angleDegrees >= -90 && angleDegrees <= 90) {
            // Text on the left side (90° to -90°)
            labelOffsetX = 0.0; // No X offset
            labelOffsetY = 0.5; // Offset to the left (reduced by half)
        } else {
            // Text on the right side (other angles)
            labelOffsetX = 0.0; // No X offset
            labelOffsetY = -0.5; // Offset to the right (reduced by half)
        }
        
        // Calculate final position with rotation
        const cosAngle = Math.cos(robotAngle);
        const sinAngle = Math.sin(robotAngle);
        
        const finalOffsetX = labelOffsetX * cosAngle - labelOffsetY * sinAngle;
        const finalOffsetY = labelOffsetX * sinAngle + labelOffsetY * cosAngle;
        
        return {
            x: robotPosition.x + finalOffsetX,
            y: robotPosition.y + finalOffsetY,
            z: robotPosition.z + 0.2
        };
    }

    isPointInPolygon(point, polygonPoints) {
        // Ray casting algorithm to check if point is inside polygon
        const x = point.x;
        const y = point.y;
        let inside = false;
        
        const n = polygonPoints.length;
        let j = n - 1; // Last vertex
        
        for (let i = 0; i < n; i++) {
            const xi = polygonPoints[i].x;
            const yi = polygonPoints[i].y;
            const xj = polygonPoints[j].x;
            const yj = polygonPoints[j].y;
            
            // Check if ray from point crosses the edge
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
            
            j = i;
        }
        
        return inside;
    }

    // Load points from database
    async loadPointsFromDatabase() {
        try {
            // Clear existing positions FIRST before any API call
            this.clearAllPositions();
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found for loading points from database');
                return;
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                console.error('No mapId found for loading points from database');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/maps/loadPositionbyMap/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data && data.data && data.data.mapPoint) {

                // Load positions from database
                for (const item of data.data.mapPoint) {
                    const jsonObject = JSON.parse(item.Properties);
                    // Convert from string array to numbers
                    const posx = parseFloat(jsonObject.Position[0]);
                    const posy = parseFloat(jsonObject.Position[1]);
                    const posz = parseFloat(jsonObject.Position[2]);

                    // Create position data in the format expected by DrawPosition tool
                    const positionData = {
                        id: item.ID,
                        name: item.PointName || `Position_${item.ID}`,
                        type: item.PointType || 'Robot position',
                        position: {
                            x: posx,
                            y: posy,
                            z: posz
                        },
                        orientation: {
                            x: parseFloat(jsonObject.Orientation?.[0] || 0),
                            y: parseFloat(jsonObject.Orientation?.[1] || 0),
                            z: parseFloat(jsonObject.Orientation?.[2] || 0),
                            w: parseFloat(jsonObject.Orientation?.[3] || 1)
                        }
                    };

                    // Create position using existing method
                    this.createPosition(positionData);
                }

                console.log(`Loaded ${data.data.mapPoint.length} positions from database`);
            } else {
                console.log('No positions found in database');
            }
        } catch (error) {
            console.error('Error loading points from database:', error);
        }
    }

    // Save positions to database
    async saveToDatabase() {
        try {
            console.log('DrawPosition: Starting save to database...');
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                throw new Error('No mapId found for saving positions');
            }

            // Get all positions from the tool
            const positions = this.getAllPositions();
            console.log('DrawPosition: Saving positions:', positions);

            // Get existing positions from server for comparison
            const existingResponse = await fetch(`${SERVER_URL}/api/maps/loadPositionbyMap/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const existingData = await existingResponse.json();
            const existingPositions = existingData?.data?.mapPoint || [];

            // Step 1: Delete positions from server that don't exist in current map
            const deletePromises = existingPositions.map(async (serverPosition) => {
                const existsInMap = positions.find(mapPosition => mapPosition.id === serverPosition.ID);
                if (!existsInMap) {
                    console.log('DrawPosition: Deleting position from server:', serverPosition.ID);
                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/deletePosition/${serverPosition.ID}`, {
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
                        console.log('DrawPosition: Delete position response:', result);
                    } catch (error) {
                        console.error(`Error deleting position ${serverPosition.ID}:`, error);
                    }
                }
            });
            await Promise.all(deletePromises);

            // Step 2: Update existing positions in server
            const updatePromises = positions.map(async (mapPosition) => {
                const existsInServer = existingPositions.find(serverPosition => serverPosition.ID === mapPosition.id);
                if (existsInServer) {
                    console.log('DrawPosition: Updating position in server:', mapPosition.id);
                    const properties = {
                        Position: [
                            mapPosition.position.x.toString(),
                            mapPosition.position.y.toString(),
                            mapPosition.position.z.toString()
                        ],
                        Orientation: [
                            mapPosition.orientation.x.toString(),
                            mapPosition.orientation.y.toString(),
                            mapPosition.orientation.z.toString(),
                            mapPosition.orientation.w.toString()
                        ]
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/updatePosition/${mapPosition.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                pointName: mapPosition.name,
                                pointType: mapPosition.type,
                                properties: JSON.stringify(properties)
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawPosition: Update position response:', result);
                    } catch (error) {
                        console.error(`Error updating position ${mapPosition.id}:`, error);
                    }
                }
            });
            await Promise.all(updatePromises);

            // Step 3: Insert new positions to server
            const insertPromises = positions.map(async (mapPosition) => {
                const existsInServer = existingPositions.find(serverPosition => serverPosition.ID === mapPosition.id);
                if (!existsInServer) {
                    console.log('DrawPosition: Inserting new position to server:', mapPosition.id);
                    const properties = {
                        Position: [
                            mapPosition.position.x.toString(),
                            mapPosition.position.y.toString(),
                            mapPosition.position.z.toString()
                        ],
                        Orientation: [
                            mapPosition.orientation.x.toString(),
                            mapPosition.orientation.y.toString(),
                            mapPosition.orientation.z.toString(),
                            mapPosition.orientation.w.toString()
                        ]
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/addPosition`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                mapId: mapId,
                                pointName: mapPosition.name,
                                pointType: mapPosition.type,
                                properties: JSON.stringify(properties)
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawPosition: Insert position response:', result);
                        
                        // Update position ID directly in this class if server returns new ID
                        if (result && result.positionId) {
                            const newServerId = result.positionId;
                            // Find and update the position ID in our positions array
                            const positionIndex = this.positions.findIndex(pos => pos.id === mapPosition.id);
                            if (positionIndex !== -1) {
                                this.positions[positionIndex].id = newServerId;
                                console.log(`DrawPosition: Updated position ID from ${mapPosition.id} to ${newServerId}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Error inserting position ${mapPosition.id}:`, error);
                    }
                }
            });
            await Promise.all(insertPromises);

            console.log('DrawPosition: All positions saved successfully');

        } catch (error) {
            console.error('DrawPosition: Error saving to database:', error);
            throw error;
        }
    }
}

export { DrawPosition }; 