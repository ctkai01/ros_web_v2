import * as THREE from 'three';

class DrawNavGoal {
    constructor(scene, camera, renderer, mapMesh, mapInfo, map2D) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;
        this.map2D = map2D;

        // Robot data from Map2D
        this.robot = map2D.robot;
        this.robotFootprint = null;
        this.robotTexture = null;

        // Navigation goal data
        this.navGoal = null;
        this.robotMesh = null;
        this.coordinateFrame = null;

        // State management
        this.state = {
            mode: 'create', // 'create', 'select', 'pan', 'rotate'
            isEnabled: false,
            isDrawingEnabled: false,
            isSelected: false,
            isDragging: false,
            isRotating: false,
            dragStartPoint: null,
            dragStartPosition: null,
            rotateStartAngle: 0,
            rotateStartRotation: 0,
            originalGoalData: null,
            meshCreated: false // Flag to ensure meshes are only created once
        };

        // Colors for different states
        this.colors = {
            normal: 0xff0000,      // Red
            selected: 0xffff00,    // Yellow
            hovered: 0x00ffff,     // Cyan
            editing: 0xff8800      // Orange
        };

        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners for keyboard events
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Load robot data from Map2D
        this.loadRobotData();
    }

    loadRobotData() {
        if (this.robot) {
            this.robotFootprint = this.robot.footprint;
            this.robotTexture = this.robot.texture;
            console.log('Robot data loaded from Map2D');
        } else {
            console.warn('Robot not available in Map2D');
        }
    }

    createInitialNavGoal(worldPoint) {
        // Create navigation goal at the clicked point
        this.navGoal = {
            id: 1,
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
            },
            timestamp: Date.now()
        };

        // Create meshes only if not already created
        if (!this.state.meshCreated) {
            // Create robot mesh
            this.createRobotMesh();
            
            // Create coordinate frame
            this.createCoordinateFrame();
            
            this.state.meshCreated = true;
        }

        console.log('Initial navigation goal created at:', this.navGoal);
    }

    createRobotMesh() {
        if (!this.robotFootprint || !this.robotTexture) {
            console.warn('Robot footprint or texture not available');
            return;
        }

        // Create shape from footprint
        const shape = new THREE.Shape();
        const points = this.robotFootprint.points;

        // Move to first point
        shape.moveTo(points[0].x, points[0].y);
        
        // Draw footprint edges
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        
        // Close shape
        shape.lineTo(points[0].x, points[0].y);

        const geometry = new THREE.ShapeGeometry(shape);

        // Calculate UV mapping
        const uvs = geometry.attributes.uv;
        const positions = geometry.attributes.position;

        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < positions.count; i++) {
            minX = Math.min(minX, positions.getX(i));
            maxX = Math.max(maxX, positions.getX(i));
            minY = Math.min(minY, positions.getY(i));
            maxY = Math.max(maxY, positions.getY(i));
        }

        // Update UV coordinates
        for (let i = 0; i < uvs.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            uvs.setXY(
                i,
                (x - minX) / (maxX - minX),
                (y - minY) / (maxY - minY)
            );
        }

        geometry.attributes.uv.needsUpdate = true;

        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: this.robotTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        // Create mesh
        this.robotMesh = new THREE.Mesh(geometry, material);
        
        // Set position and rotation
        this.updateRobotTransform();

        // Add to scene
        this.scene.add(this.robotMesh);

        console.log('Robot mesh created for navigation goal');
    }



    createCoordinateFrame() {
        this.coordinateFrame = new THREE.Group();
        const axisLength = 0.3;
        const axisWidth = 0.01;

        // X axis (red)
        const xGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.position.x = axisLength / 2;

        // Y axis (green)
        const yGeometry = new THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yAxis = new THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = axisLength / 2;

        // Arrows
        const xArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.04, 8),
            xMaterial
        );
        xArrow.position.x = axisLength;
        xArrow.rotation.z = -Math.PI / 2;

        const yArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.04, 8),
            yMaterial
        );
        yArrow.position.y = axisLength;

        this.coordinateFrame.add(xAxis, yAxis, xArrow, yArrow);
        
        // Set position relative to robot
        this.updateCoordinateFrameTransform();

        this.scene.add(this.coordinateFrame);

        console.log('Coordinate frame created');
    }

    updateRobotTransform() {
        if (!this.robotMesh || !this.navGoal) return;

        // Set position
        this.robotMesh.position.set(
            this.navGoal.position.x,
            this.navGoal.position.y,
            this.navGoal.position.z
        );

        // Set rotation
        const quaternion = new THREE.Quaternion(
            this.navGoal.orientation.x,
            this.navGoal.orientation.y,
            this.navGoal.orientation.z,
            this.navGoal.orientation.w
        );
        // flip yaw
        const yaw = this.getYawFromQuaternion(quaternion);
        this.robotMesh.position.set(this.navGoal.position.x, this.navGoal.position.y, this.navGoal.position.z);
        this.robotMesh.rotation.z = yaw;
    }



    updateCoordinateFrameTransform() {
        if (!this.coordinateFrame || !this.navGoal) return;

        // Set position
        this.coordinateFrame.position.set(
            this.navGoal.position.x,
            this.navGoal.position.y,
            this.navGoal.position.z + 0.1
        );

        // Set rotation
        const quaternion = new THREE.Quaternion(
            this.navGoal.orientation.x,
            this.navGoal.orientation.y,
            this.navGoal.orientation.z,
            this.navGoal.orientation.w
        );
        this.coordinateFrame.setRotationFromQuaternion(quaternion);
    }

    // Mode management
    setMode(mode) {
        if (['create', 'select', 'pan', 'rotate'].includes(mode)) {
            this.state.mode = mode;
            console.log(`Nav goal mode set to: ${mode}`);
        } else {
            console.warn(`Invalid mode: ${mode}`);
        }
    }

    getMode() { return this.state.mode; }
    isCreateMode() { return this.state.mode === 'create'; }
    isSelectMode() { return this.state.mode === 'select'; }
    isPanMode() { return this.state.mode === 'pan'; }
    isRotateMode() { return this.state.mode === 'rotate'; }

    // Mouse event handlers
    mouseEventHandle(clientX, clientY) {
        console.log("NavGoal: mouseEventHandle", clientX, clientY);
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log("NavGoal: mouseEventHandle: worldPoint is null");
            return;
        }

        switch (this.state.mode) {
            case 'create':
                this.handleCreateClick(worldPoint);
                break;
            case 'select':
                this.handleSelectClick(worldPoint);
                break;
            case 'pan':
                this.startPan(worldPoint);
                break;
            case 'rotate':
                this.startRotate(worldPoint);
                break;
        }
    }

    handleCreateClick(worldPoint) {
        console.log('NavGoal: handleCreateClick', worldPoint);
        
        // Create initial navigation goal at clicked point
        this.createInitialNavGoal(worldPoint);
        
        // Select the navigation goal and switch to select mode
        this.selectNavGoal();
        this.enableSelectMode();
        
        console.log('Navigation goal created and switched to select mode');
    }

    handleSelectClick(worldPoint) {
        console.log('NavGoal: handleSelectClick', worldPoint);
        
        // Check if clicking on robot
        if (this.isClickOnRobot(worldPoint)) {
            // Clicking on robot mesh triggers pan mode
            this.enablePanMode();
            this.startPanFromSelect(worldPoint);
            console.log('Navigation goal pan mode enabled (clicked on robot)');
        } else {
            // Clicking outside robot triggers rotate mode
            this.enableRotateMode();
            this.startRotateFromSelect(worldPoint);
            console.log('Navigation goal rotate mode enabled (clicked outside robot)');
        }
    }

    findClickedNavGoal(worldPoint) {
        if (!this.robotFootprint || !this.navGoal) return null;

        // ==================================================================
        // ==                         SỬA LỖI Ở ĐÂY                        ==
        // ==================================================================

        // 1. Tạo vector vị trí từ dữ liệu nav goal
        const posVec = new THREE.Vector3(
            this.navGoal.position.x,
            this.navGoal.position.y,
            this.navGoal.position.z
        );

        // 2. Tạo quaternion từ dữ liệu nav goal
        const quat = new THREE.Quaternion(
            this.navGoal.orientation.x,
            this.navGoal.orientation.y,
            this.navGoal.orientation.z,
            this.navGoal.orientation.w
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
            console.log('Found clicked nav goal:', this.navGoal);
            return { 
                data: this.navGoal,
                mesh: this.robotMesh
            };
        }

        // Không tìm thấy nav goal nào được click
        return null;
    }

    isClickOnRobot(worldPoint) {
        const navGoalInfo = this.findClickedNavGoal(worldPoint);
        return navGoalInfo !== null;
    }

    getFootprintRadius() {
        if (!this.robotFootprint || !this.robotFootprint.points) return 0.3;

        let maxDistance = 0;
        const center = { x: 0, y: 0 };
        
        for (const point of this.robotFootprint.points) {
            const distance = Math.sqrt(
                Math.pow(point.x - center.x, 2) + 
                Math.pow(point.y - center.y, 2)
            );
            maxDistance = Math.max(maxDistance, distance);
        }

        return maxDistance;
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

    selectNavGoal() {
        this.state.isSelected = true;
        console.log('Navigation goal selected');
    }

    clearSelection() {
        this.state.isSelected = false;
        console.log('Navigation goal selection cleared');
    }

    // Drag and rotate functionality
    startDrag(clientX, clientY) {
        if (!this.state.isSelected) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.navGoal.position };
        
        // Calculate rotation start angle
        const center = this.navGoal.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.navGoal.orientation);

        console.log('Started dragging navigation goal');
    }

    // New method to start drag from select mode
    startDragFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.navGoal.position };
        
        // Calculate rotation start angle
        const center = this.navGoal.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.navGoal.orientation);

        console.log('Started dragging navigation goal from select mode');
    }

    updateNodePosition(clientX, clientY) {
        if (!this.state.isEnabled) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Handle drag and rotate operations
        if ((this.state.isDragging || this.state.isRotating) && this.state.isSelected) {
            // Set cursor based on current mode
            if (this.state.mode === 'pan') {
                this.renderer.domElement.style.cursor = 'move';
            } else if (this.state.mode === 'rotate') {
                this.renderer.domElement.style.cursor = 'grabbing';
            }

            // Update based on current mode
            if (this.state.mode === 'pan') {
                this.updatePanPosition(worldPoint);
            } else if (this.state.mode === 'rotate') {
                this.updateRotatePosition(worldPoint);
            }

            // Update all transforms
            this.updateRobotTransform();
            this.updateCoordinateFrameTransform();
        }
    }

    stopDrag() {
        if (!this.state.isDragging && !this.state.isRotating) return;

        console.log('Stopping drag/rotate operation');
        this.state.isDragging = false;
        this.state.isRotating = false;
        this.state.dragStartPoint = null;
        this.state.dragStartPosition = null;
        this.state.rotateStartAngle = 0;
        this.state.rotateStartRotation = 0;

        // Set cursor based on current mode
        if (this.state.mode === 'pan') {
            this.renderer.domElement.style.cursor = 'move';
        } else if (this.state.mode === 'rotate') {
            this.renderer.domElement.style.cursor = 'grab';
        } else {
            this.renderer.domElement.style.cursor = 'pointer';
        }

        console.log('Stopped dragging navigation goal. Final goal:', {
            mode: this.state.mode,
            position: this.navGoal.position,
            rotation: this.getYawFromQuaternion(this.navGoal.orientation) * (180 / Math.PI)
        });
    }

    getYawFromQuaternion(orientation) {
        const quaternion = new THREE.Quaternion(
            orientation.x,
            orientation.y,
            orientation.z,
            orientation.w
        );
        const euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion);
        return euler.z;
    }

    // Utility methods
    getWorldPosition(clientX, clientY) {
        if (!this.mapMesh) {
            console.warn('getWorldPosition: mapMesh is null, trying Map2D method');
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

    // State management
    clearCurrentState() {
        this.clearSelection();
        this.state.isDragging = false;
        this.state.isRotating = false;
        this.state.dragStartPoint = null;
        this.state.dragStartPosition = null;
        this.state.rotateStartAngle = 0;
        this.state.rotateStartRotation = 0;
        // Don't clear originalGoalData here - it should be cleared when applying or cancelling changes
        
        // Reset to create mode
        this.enableCreateMode();
    }

    // Enable/disable methods
    enableCreateMode() {
        this.state.mode = 'create';
        this.renderer.domElement.style.cursor = 'crosshair';
        console.log('Navigation goal create mode enabled');
    }

    enableSelectMode() {
        this.state.mode = 'select';
        this.renderer.domElement.style.cursor = 'pointer';
        console.log('Navigation goal select mode enabled');
    }

    enablePanMode() {
        this.state.mode = 'pan';
        this.renderer.domElement.style.cursor = 'move';
        console.log('Navigation goal pan mode enabled');
    }

    enableRotateMode() {
        this.state.mode = 'rotate';
        this.renderer.domElement.style.cursor = 'grab';
        console.log('Navigation goal rotate mode enabled');
    }

    enable() {
        this.state.isEnabled = true;
        console.log('DrawNavGoal enabled');
    }

    disable() {
        this.state.isEnabled = false;
        this.clearCurrentState();
        console.log('DrawNavGoal disabled');
    }

    clear() {
        this.clearCurrentState();
        console.log('DrawNavGoal cleared');
    }

    // Clear navigation goal display (remove from scene but keep data)
    clearNavGoalDisplay() {
        // Remove meshes from scene temporarily
        if (this.robotMesh && this.robotMesh.parent) {
            this.scene.remove(this.robotMesh);
        }
        
        if (this.coordinateFrame && this.coordinateFrame.parent) {
            this.scene.remove(this.coordinateFrame);
        }
        
        console.log('Navigation goal display cleared from scene');
    }

    // Get navigation goal data
    getNavGoal() {
        return this.navGoal;
    }

    // Apply navigation goal to map
    applyNavGoalToMap() {
        if (this.navGoal) {
            // Clear original goal data since changes are now applied
            this.state.originalGoalData = null;
            
            // Clear display after applying changes
            this.clearNavGoalDisplay();
                        
            console.log('Navigation goal applied to map:', this.navGoal);
            
            // Here you can add logic to send navigation goal to ROS or save to database
            return this.navGoal;
        }
        return null;
    }

    // Cancel navigation goal changes
    cancelNavGoalToMap() {
        if (this.state.originalGoalData) {
            // Restore original goal data
            this.navGoal.position = { ...this.state.originalGoalData.position };
            this.navGoal.orientation = { ...this.state.originalGoalData.orientation };
            
            // Update transforms
            this.updateRobotTransform();
            this.updateCoordinateFrameTransform();
            
            // Clear original goal data since changes are cancelled
            this.state.originalGoalData = null;
            
            // Clear display after cancelling changes
            this.clearNavGoalDisplay();
        
            console.log('Navigation goal changes cancelled');
        }
    }

    // Keyboard event handler
    handleKeyDown(event) {
        if (!this.state.isEnabled) return;

        switch (event.key) {
            case 'Escape':
                this.clearCurrentState();
                break;
            case 'Delete':
                if (this.state.isSelected) {
                    this.clearSelection();
                }
                break;
        }
    }

    // Cleanup
    dispose() {
        try {
            // Remove event listeners
            document.removeEventListener('keydown', this.handleKeyDown);

            // Remove meshes from scene
            if (this.robotMesh) {
                this.scene.remove(this.robotMesh);
                this.robotMesh.geometry.dispose();
                this.robotMesh.material.dispose();
                this.robotMesh = null;
            }



            if (this.coordinateFrame) {
                this.scene.remove(this.coordinateFrame);
                this.coordinateFrame = null;
            }

            // Clear references
            this.navGoal = null;
            this.robot = null;
            this.robotFootprint = null;
            this.robotTexture = null;

            console.log('DrawNavGoal disposed');
        } catch (error) {
            console.error('Error disposing DrawNavGoal:', error);
        }
    }

    // Pan mode methods
    startPan(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.isRotating = false;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.navGoal.position };

        console.log('Started panning navigation goal');
    }

    startPanFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.navGoal.position };

        console.log('Started panning navigation goal from select mode');
    }

    updatePanPosition(worldPoint) {
        if (!this.state.isDragging) return;

        // Calculate delta position to avoid jumping
        const deltaX = worldPoint.x - this.state.dragStartPoint.x;
        const deltaY = worldPoint.y - this.state.dragStartPoint.y;

        // Update position based on delta, not absolute position
        this.navGoal.position.x = this.state.dragStartPosition.x + deltaX;
        this.navGoal.position.y = this.state.dragStartPosition.y + deltaY;
        this.navGoal.position.z = this.state.dragStartPosition.z || 0.1;

        console.log('Updated navigation goal during pan:', {
            deltaX: deltaX.toFixed(3),
            deltaY: deltaY.toFixed(3),
            newPosition: {
                x: this.navGoal.position.x.toFixed(3),
                y: this.navGoal.position.y.toFixed(3)
            }
        });
    }

    // Rotate mode methods
    startRotate(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.isRotating = true;
        this.state.dragStartPoint = worldPoint;
        
        // Calculate rotation start angle
        const center = this.navGoal.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.navGoal.orientation);

        console.log('Started rotating navigation goal');
    }

    startRotateFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original goal data
        if (!this.state.originalGoalData) {
            this.state.originalGoalData = {
                position: { ...this.navGoal.position },
                orientation: { ...this.navGoal.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        
        // Calculate rotation start angle
        const center = this.navGoal.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.navGoal.orientation);

        console.log('Started rotating navigation goal from select mode');
    }

    updateRotatePosition(worldPoint) {
        if (!this.state.isDragging) return;

        // Calculate current angle
        const center = this.navGoal.position;
        const currentAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );

        // Calculate delta angle
        const deltaAngle = currentAngle - this.state.rotateStartAngle;
        const newRotation = this.state.rotateStartRotation + deltaAngle;

        // Create quaternion from rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), newRotation);

        // Update orientation only, keep position unchanged
        this.navGoal.orientation.x = quaternion.x;
        this.navGoal.orientation.y = quaternion.y;
        this.navGoal.orientation.z = quaternion.z;
        this.navGoal.orientation.w = quaternion.w;
    }
}

export { DrawNavGoal }; 