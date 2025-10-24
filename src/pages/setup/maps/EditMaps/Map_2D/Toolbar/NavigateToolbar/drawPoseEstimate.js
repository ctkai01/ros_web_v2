import * as THREE from 'three';

class DrawPoseEstimate {
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
        this.tfLaserToBase = null;
        this.robotTransforms = null;
        this.laserToMapTransforms = null;
        this.laserPoints = null;

        // Pose estimate data
        this.poseEstimate = null;
        this.robotMesh = null;
        this.laserMesh = null;
        this.coordinateFrame = null;

        // State management
        this.state = {
            mode: 'select', // 'select', 'pan', 'rotate'
            isEnabled: false,
            isDrawingEnabled: false,
            isSelected: false,
            isDragging: false,
            isRotating: false,
            dragStartPoint: null,
            dragStartPosition: null,
            rotateStartAngle: 0,
            rotateStartRotation: 0,
            originalPoseData: null,
            meshCreated: false // Flag to ensure meshes are only created once
        };



        // Colors for different states
        this.colors = {
            normal: 0x00ff00,      // Green
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
        
        // Create initial pose estimate at map center
        this.createInitialPoseEstimate();
    }

    loadRobotData() {
        if (this.robot) {
            this.robotFootprint = this.robot.footprint;
            this.robotTexture = this.robot.texture;
            this.tfLaserToBase = this.robot.tfLaserToBase;
            this.robotTransforms = this.robot.robotTransforms;
            this.laserToMapTransforms = this.robot.laserToMapTransforms;
            this.laserPoints = this.robot.laserPoints;
            console.log('Robot data loaded from Map2D');
        } else {
            console.warn('Robot not available in Map2D');
        }
    }

    createInitialPoseEstimate() {
        // Get current robot transforms from Map2D
        if (!this.robot || !this.robotTransforms) {
            console.warn('Robot transforms not available, using map center');
            // Fallback to map center if robot transforms not available
            const mapWidthMeters = this.mapInfo.width * this.mapInfo.resolution;
            const mapHeightMeters = this.mapInfo.height * this.mapInfo.resolution;
            const centerX = this.mapInfo.origin.position.x + mapWidthMeters / 2;
            const centerY = this.mapInfo.origin.position.y + mapHeightMeters / 2;

            let position = new THREE.Vector3();
            let quaternion = new THREE.Quaternion();
            let scale = new THREE.Vector3();
            
            this.robotTransforms.decompose(position, quaternion, scale);

            this.poseEstimate = {
                id: 1,
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                orientation: {
                    x: quaternion.x,
                    y: quaternion.y,
                    z: quaternion.z,
                    w: quaternion.w
                },
                timestamp: Date.now()
            };
            console.log("PoseEstimate: createInitialPoseEstimate", this.poseEstimate);
        } else {
            // Extract position and orientation from 4x4 matrix
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            this.robotTransforms.decompose(position, quaternion, scale);
            
            this.poseEstimate = {
                id: 1,
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                orientation: {
                    x: quaternion.x,
                    y: quaternion.y,
                    z: quaternion.z,
                    w: quaternion.w
                },
                timestamp: Date.now()
            };
        }

        // Create meshes only if not already created
        if (!this.state.meshCreated) {
            // Create robot mesh
            this.createRobotMesh();
            
            // Create laser mesh
            this.createLaserMesh();
            
            // Create coordinate frame
            this.createCoordinateFrame();
            
            this.state.meshCreated = true;
        }

        console.log('Initial pose estimate created using robot transforms:', this.poseEstimate);
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

        console.log('Robot mesh created');
    }

    createLaserMesh() {
        if (!this.tfLaserToBase) {
            console.warn('TF laser to base not available');
            return;
        }

        // Create laser scan visualization using spheres
        this.laserMesh = new THREE.Group();
        
        // Create material for laser spheres
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });

        // Use real laser points if available, otherwise create simulated points
        let laserPoints = [];
        
        if (this.laserPoints && this.laserPoints.length > 0) {
            // Use real laser scan data
            laserPoints = this.laserPoints.map(point => 
                new THREE.Vector3(point.x, point.y, point.z || 0.05)
            );
            console.log('Using real laser scan data:', laserPoints.length, 'points');
        } else {
            // Create simulated laser points
            const numPoints = 360;
            const maxRange = 5.0; // 5 meters
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * 2 * Math.PI;
                const range = maxRange * (0.5 + 0.5 * Math.random()); // Random range for demo
                
                const x = Math.cos(angle) * range;
                const y = Math.sin(angle) * range;
                
                laserPoints.push(new THREE.Vector3(x, y, 0.05));
            }
            console.log('Using simulated laser scan data:', laserPoints.length, 'points');
        }

        // Create spheres for each laser point
        const sphereRadius = 0.02; // 2cm radius for each sphere
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 6);

        // Use InstancedMesh for better performance if there are many points
        if (laserPoints.length > 100) {
            const instancedMesh = new THREE.InstancedMesh(sphereGeometry, laserMaterial, laserPoints.length);
            const matrix = new THREE.Matrix4();
            
            laserPoints.forEach((point, index) => {
                matrix.setPosition(point.x, point.y, point.z);
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            instancedMesh.instanceMatrix.needsUpdate = true;
            this.laserMesh.add(instancedMesh);
        } else {
            // Use individual meshes for fewer points
            laserPoints.forEach(point => {
                const sphere = new THREE.Mesh(sphereGeometry, laserMaterial);
                sphere.position.copy(point);
                this.laserMesh.add(sphere);
            });
        }
        
        // Set position relative to robot
        this.updateLaserTransform();

        // Add to scene
        this.scene.add(this.laserMesh);

        console.log('Laser mesh created with spheres:', laserPoints.length, 'spheres');
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
        if (!this.robotMesh || !this.poseEstimate) return;

        // Set position
        this.robotMesh.position.set(
            this.poseEstimate.position.x,
            this.poseEstimate.position.y,
            this.poseEstimate.position.z
        );

        // Set rotation
        const quaternion = new THREE.Quaternion(
            this.poseEstimate.orientation.x,
            this.poseEstimate.orientation.y,
            this.poseEstimate.orientation.z,
            this.poseEstimate.orientation.w
        );
        // flip yaw
        const yaw = this.getYawFromQuaternion(quaternion);
        this.robotMesh.position.set(this.poseEstimate.position.x, this.poseEstimate.position.y, this.poseEstimate.position.z);
        this.robotMesh.rotation.z = yaw;
    }

    updateLaserTransform() {
        if (!this.laserMesh || !this.poseEstimate || !this.tfLaserToBase) return;

        // Calculate laser position relative to robot
        const robotQuaternion = new THREE.Quaternion(
            this.poseEstimate.orientation.x,
            this.poseEstimate.orientation.y,
            this.poseEstimate.orientation.z,
            this.poseEstimate.orientation.w
        );

        const robotPosition = new THREE.Vector3(
            this.poseEstimate.position.x,
            this.poseEstimate.position.y,
            this.poseEstimate.position.z
        );

        const matrixRobot = new THREE.Matrix4();
        matrixRobot.compose(robotPosition, robotQuaternion, new THREE.Vector3(1, 1, 1));

        // Apply TF transformation
        let laserPosition = new THREE.Matrix4();
        laserPosition = matrixRobot.multiply(this.tfLaserToBase);

        let laserPositionVector = new THREE.Vector3();
        let laserQuaternion = new THREE.Quaternion();
        let laserScale = new THREE.Vector3();

        laserPosition.decompose(laserPositionVector, laserQuaternion, laserScale);

        // Set laser position
        this.laserMesh.position.set(laserPositionVector.x, laserPositionVector.y, laserPositionVector.z);
        this.laserMesh.rotation.z =  this.getYawFromQuaternion(laserQuaternion);
    }

    updateLaserPoints(newLaserPoints) {
        if (!this.laserMesh || !newLaserPoints || newLaserPoints.length === 0) return;

        // Update laser points data
        this.laserPoints = newLaserPoints;

        // Clear existing spheres
        while (this.laserMesh.children.length > 0) {
            const child = this.laserMesh.children[0];
            this.laserMesh.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }

        // Create new spheres for updated points
        const laserPoints = this.laserPoints.map(point => 
            new THREE.Vector3(point.x, point.y, point.z || 0.05)
        );

        // Create material for laser spheres
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });

        // Create spheres for each laser point
        const sphereRadius = 0.02; // 2cm radius for each sphere
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 6);

        // Use InstancedMesh for better performance if there are many points
        if (laserPoints.length > 100) {
            const instancedMesh = new THREE.InstancedMesh(sphereGeometry, laserMaterial, laserPoints.length);
            const matrix = new THREE.Matrix4();
            
            laserPoints.forEach((point, index) => {
                matrix.setPosition(point.x, point.y, point.z);
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            instancedMesh.instanceMatrix.needsUpdate = true;
            this.laserMesh.add(instancedMesh);
        } else {
            // Use individual meshes for fewer points
            laserPoints.forEach(point => {
                const sphere = new THREE.Mesh(sphereGeometry, laserMaterial);
                sphere.position.copy(point);
                this.laserMesh.add(sphere);
            });
        }

        console.log('Laser points updated:', laserPoints.length, 'spheres');
    }

    updateCoordinateFrameTransform() {
        if (!this.coordinateFrame || !this.poseEstimate) return;

        // Set position
        this.coordinateFrame.position.set(
            this.poseEstimate.position.x,
            this.poseEstimate.position.y,
            this.poseEstimate.position.z + 0.1
        );

        // Set rotation
        const quaternion = new THREE.Quaternion(
            this.poseEstimate.orientation.x,
            this.poseEstimate.orientation.y,
            this.poseEstimate.orientation.z,
            this.poseEstimate.orientation.w
        );
        this.coordinateFrame.setRotationFromQuaternion(quaternion);
    }

    // Mode management
    setMode(mode) {
        if (['select', 'pan', 'rotate'].includes(mode)) {
            this.state.mode = mode;
            console.log(`Pose estimate mode set to: ${mode}`);
        } else {
            console.warn(`Invalid mode: ${mode}`);
        }
    }

    getMode() { return this.state.mode; }
    isSelectMode() { return this.state.mode === 'select'; }
    isPanMode() { return this.state.mode === 'pan'; }
    isRotateMode() { return this.state.mode === 'rotate'; }

    // Mouse event handlers
    mouseEventHandle(clientX, clientY) {
        console.log("PoseEstimate: mouseEventHandle", clientX, clientY);
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log("PoseEstimate: mouseEventHandle: worldPoint is null");
            return;
        }

        switch (this.state.mode) {
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

    handleSelectClick(worldPoint) {
        console.log('PoseEstimate: handleSelectClick', worldPoint);
        
        // Ensure meshes are created if this is the first interaction
        if (!this.state.meshCreated) {
            this.createInitialPoseEstimate();
        }
        
        // Check if clicking on robot using the new smart detection
        const poseInfo = this.findClickedPoseEstimate(worldPoint);
        if (poseInfo) {
            this.selectPoseEstimate();
            
            // Clicking on robot mesh triggers pan mode
            this.enablePanMode();
            this.startPanFromSelect(worldPoint);
            console.log('Pose estimate selected and pan mode enabled (clicked on robot)');
        } else {
            // Clicking outside robot triggers rotate mode
            this.selectPoseEstimate();
            this.enableRotateMode();
            this.startRotateFromSelect(worldPoint);
            console.log('Pose estimate selected and rotate mode enabled (clicked outside robot)');
        }
    }

    findClickedPoseEstimate(worldPoint) {
        if (!this.robotFootprint || !this.poseEstimate) return null;

        // ==================================================================
        // ==                         SỬA LỖI Ở ĐÂY                        ==
        // ==================================================================

        // 1. Tạo vector vị trí từ dữ liệu pose estimate
        const posVec = new THREE.Vector3(
            this.poseEstimate.position.x,
            this.poseEstimate.position.y,
            this.poseEstimate.position.z
        );

        // 2. Tạo quaternion từ dữ liệu pose estimate
        const quat = new THREE.Quaternion(
            this.poseEstimate.orientation.x,
            this.poseEstimate.orientation.y,
            this.poseEstimate.orientation.z,
            this.poseEstimate.orientation.w
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
            console.log('Found clicked pose estimate:', this.poseEstimate);
            return { 
                data: this.poseEstimate,
                mesh: this.robotMesh
            };
        }

        // Không tìm thấy pose estimate nào được click
        return null;
    }

    isClickOnRobot(worldPoint) {
        const poseInfo = this.findClickedPoseEstimate(worldPoint);
        return poseInfo !== null;
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

    selectPoseEstimate() {
        this.state.isSelected = true;
        
        console.log('Pose estimate selected');
    }

    clearSelection() {
        this.state.isSelected = false;
        

        
        console.log('Pose estimate selection cleared');
    }

    // Drag and rotate functionality
    startDrag(clientX, clientY) {
        if (!this.state.isSelected) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.poseEstimate.position };
        
        // Calculate rotation start angle
        const center = this.poseEstimate.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.poseEstimate.orientation);

        console.log('Started dragging pose estimate');
    }

    // New method to start drag from select mode
    startDragFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.poseEstimate.position };
        
        // Calculate rotation start angle
        const center = this.poseEstimate.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.poseEstimate.orientation);

        console.log('Started dragging pose estimate from select mode');
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
            this.updateLaserTransform();
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

        // Keep original pose data for potential cancellation
        // this.state.originalPoseData will be cleared when changes are applied or cancelled

        // Set cursor based on current mode
        if (this.state.mode === 'pan') {
            this.renderer.domElement.style.cursor = 'move';
        } else if (this.state.mode === 'rotate') {
            this.renderer.domElement.style.cursor = 'grab';
        } else {
            this.renderer.domElement.style.cursor = 'pointer';
        }

        console.log('Stopped dragging pose estimate. Final pose:', {
            mode: this.state.mode,
            position: this.poseEstimate.position,
            rotation: this.getYawFromQuaternion(this.poseEstimate.orientation) * (180 / Math.PI)
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
        this.clearSelection();
        this.state.isDragging = false;
        this.state.isRotating = false;
        this.state.dragStartPoint = null;
        this.state.dragStartPosition = null;
        this.state.rotateStartAngle = 0;
        this.state.rotateStartRotation = 0;
        // Don't clear originalPoseData here - it should be cleared when applying or cancelling changes
        
        // Set cursor based on current mode
        if (this.state.mode === 'pan') {
            this.renderer.domElement.style.cursor = 'move';
        } else if (this.state.mode === 'rotate') {
            this.renderer.domElement.style.cursor = 'grab';
        } else {
            this.renderer.domElement.style.cursor = 'pointer';
        }
    }

    // Enable/disable methods
    enableSelectMode() {
        this.state.mode = 'select';
        this.renderer.domElement.style.cursor = 'pointer';
        console.log('Pose estimate select mode enabled');
    }

    enablePanMode() {
        this.state.mode = 'pan';
        this.renderer.domElement.style.cursor = 'move';
        console.log('Pose estimate pan mode enabled');
    }

    enableRotateMode() {
        this.state.mode = 'rotate';
        this.renderer.domElement.style.cursor = 'grab';
        console.log('Pose estimate rotate mode enabled');
    }

    enable() {
        this.state.isEnabled = true;
        console.log('DrawPoseEstimate enabled');
    }

    disable() {
        this.state.isEnabled = false;
        this.clearCurrentState();
        
        console.log('DrawPoseEstimate disabled');
    }

    clear() {
        this.clearCurrentState();
        console.log('DrawPoseEstimate cleared');
    }

    // Clear pose estimate display (remove from scene but keep data)
    clearPoseEstimateDisplay() {
        // Remove meshes from scene temporarily
        if (this.robotMesh && this.robotMesh.parent) {
            this.scene.remove(this.robotMesh);
        }
        
        if (this.laserMesh && this.laserMesh.parent) {
            this.scene.remove(this.laserMesh);
        }
        
        if (this.coordinateFrame && this.coordinateFrame.parent) {
            this.scene.remove(this.coordinateFrame);
        }
        
        console.log('Pose estimate display cleared from scene');
    }


    // Get pose estimate data
    getPoseEstimate() {
        return this.poseEstimate;
    }

    // Update pose estimate from robot transforms
    updatePoseEstimateFromRobot() {
        if (!this.robot || !this.robotTransforms) return;

        // Extract position and orientation from 4x4 matrix
        const matrix =this.robotTransforms.clone();
        
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        matrix.decompose(position, quaternion, scale);

        // Update pose estimate with current robot transforms
        this.poseEstimate.position = {
            x: position.x,
            y: position.y,
            z: position.z
        };

        this.poseEstimate.orientation = {
            x: quaternion.x,
            y: quaternion.y,
            z: quaternion.z,
            w: quaternion.w
        };

        // Update all transforms
        this.updateRobotTransform();
        this.updateLaserTransform();
        this.updateCoordinateFrameTransform();

        console.log('Pose estimate updated from robot transforms:', this.poseEstimate);
    }

    // Create 4x4 matrix from current pose estimate
    getPoseEstimateMatrix() {
        if (!this.poseEstimate) return null;

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(
            this.poseEstimate.position.x,
            this.poseEstimate.position.y,
            this.poseEstimate.position.z
        );
        const quaternion = new THREE.Quaternion(
            this.poseEstimate.orientation.x,
            this.poseEstimate.orientation.y,
            this.poseEstimate.orientation.z,
            this.poseEstimate.orientation.w
        );

        matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
        return matrix.toArray();
    }

    // Apply pose estimate to map
    applyPoseEstimatesToMap() {
        if (this.poseEstimate) {
            // Clear original pose data since changes are now applied
            this.state.originalPoseData = null;
            
            // Clear display after applying changes
            this.clearPoseEstimateDisplay();
                        
            console.log('Pose estimate applied to map:', this.poseEstimate);
            
            // Here you can add logic to send pose estimate to ROS or save to database
            return this.poseEstimate;
        }
        return null;
    }

    // Cancel pose estimate changes
    cancelPoseEstimatesToMap() {
        if (this.state.originalPoseData) {
            // Restore original pose data
            this.poseEstimate.position = { ...this.state.originalPoseData.position };
            this.poseEstimate.orientation = { ...this.state.originalPoseData.orientation };
            
            // Update transforms
            this.updateRobotTransform();
            this.updateLaserTransform();
            this.updateCoordinateFrameTransform();
            
            // Clear original pose data since changes are cancelled
            this.state.originalPoseData = null;
            
            // Clear display after cancelling changes
            this.clearPoseEstimateDisplay();
        
            
            console.log('Pose estimate changes cancelled');
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

            if (this.laserMesh) {
                this.scene.remove(this.laserMesh);
                // Cleanup all spheres in the group
                while (this.laserMesh.children.length > 0) {
                    const child = this.laserMesh.children[0];
                    this.laserMesh.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                    // Cleanup InstancedMesh specific properties
                    if (child.instanceMatrix) {
                        child.instanceMatrix = null;
                    }
                }
                this.laserMesh = null;
            }

            if (this.coordinateFrame) {
                this.scene.remove(this.coordinateFrame);
                this.coordinateFrame = null;
            }

            // Clear references
            this.poseEstimate = null;
            this.robot = null;
            this.robotFootprint = null;
            this.robotTexture = null;
            this.tfLaserToBase = null;

            console.log('DrawPoseEstimate disposed');
        } catch (error) {
            console.error('Error disposing DrawPoseEstimate:', error);
        }
    }

    // Pan mode methods
    startPan(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.isRotating = false;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.poseEstimate.position };

        console.log('Started panning pose estimate');
    }

    startPanFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        this.state.dragStartPosition = { ...this.poseEstimate.position };

        console.log('Started panning pose estimate from select mode');
    }

    updatePanPosition(worldPoint) {
        if (!this.state.isDragging) return;

        // Calculate delta position to avoid jumping
        const deltaX = worldPoint.x - this.state.dragStartPoint.x;
        const deltaY = worldPoint.y - this.state.dragStartPoint.y;

        // Update position based on delta, not absolute position
        this.poseEstimate.position.x = this.state.dragStartPosition.x + deltaX;
        this.poseEstimate.position.y = this.state.dragStartPosition.y + deltaY;
        this.poseEstimate.position.z = this.state.dragStartPosition.z || 0.1;

        console.log('Updated pose estimate during pan:', {
            deltaX: deltaX.toFixed(3),
            deltaY: deltaY.toFixed(3),
            newPosition: {
                x: this.poseEstimate.position.x.toFixed(3),
                y: this.poseEstimate.position.y.toFixed(3)
            }
        });
    }

    // Rotate mode methods
    startRotate(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.isRotating = true;
        this.state.dragStartPoint = worldPoint;
        
        // Calculate rotation start angle
        const center = this.poseEstimate.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.poseEstimate.orientation);

        console.log('Started rotating pose estimate');
    }

    startRotateFromSelect(worldPoint) {
        if (!this.state.isSelected) return;

        // Save original pose data
        if (!this.state.originalPoseData) {
            this.state.originalPoseData = {
                position: { ...this.poseEstimate.position },
                orientation: { ...this.poseEstimate.orientation }
            };
        }

        this.state.isDragging = true;
        this.state.dragStartPoint = worldPoint;
        
        // Calculate rotation start angle
        const center = this.poseEstimate.position;
        this.state.rotateStartAngle = Math.atan2(
            worldPoint.y - center.y,
            worldPoint.x - center.x
        );
        this.state.rotateStartRotation = this.getYawFromQuaternion(this.poseEstimate.orientation);



        console.log('Started rotating pose estimate from select mode');
    }

    updateRotatePosition(worldPoint) {
        if (!this.state.isDragging) return;

        // Calculate current angle
        const center = this.poseEstimate.position;
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
        this.poseEstimate.orientation.x = quaternion.x;
        this.poseEstimate.orientation.y = quaternion.y;
        this.poseEstimate.orientation.z = quaternion.z;
        this.poseEstimate.orientation.w = quaternion.w;
    }




}

export { DrawPoseEstimate }; 