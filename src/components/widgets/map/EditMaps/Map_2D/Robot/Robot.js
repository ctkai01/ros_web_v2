import * as THREE from 'three';

export class Robot {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Robot properties
        this.footprint = null;
        this.texture = null;
        this.mesh = null;
        this.frame = null;

        // Position and orientation
        this.position = { x: 0, y: 0, z: 0.1 };
        this.orientation = { x: 0, y: 0, z: 0, w: 1 };
        this.yaw = 0;

        // Path tracking
        this.pathPoints = [];
        this.pathLine = null;
        this.maxPathPoints = 1000;

        // Global path planning
        this.globalPathPoints = [];
        this.globalPathLine = null;

        // Display settings
        this.isVisible = false;
        this.opacity = 1.0;
        this.showFrame = true;
        this.showPath = false;
        this.showLaserScan = true;
        this.showGlobalPathPlanning = false;


        // Laser scan visualization
        this.laserScanPoints = [];
        this.laserScanMesh = null;
        this.laserScanGroup = null;
        this.laserScanMaterial = null;
        this.laserScanStyle = 'points'; // 'flat', 'points', 'spheres' - points is fastest

        // TF data for laser scan transformation
        this.tfLaserToBase = null;

        // Default footprint (fallback)
        this.defaultFootprint = {
            points: [
                { x: -0.25, y: -0.25 },
                { x: 0.25, y: -0.25 },
                { x: 0.25, y: 0.25 },
                { x: -0.25, y: 0.25 }
            ]
        };
        // Initialize transforms for robot pose tracking
        this.transforms = {
            mapToOdom: null,
            odomToBase: null
        };

        this.robotTransforms = null;
        this.laserToMapTransforms = null;
        this.laserPoints = [];
    }

    /**
     * Load robot footprint from server data
     * @param {Object} footprintData - Footprint data from server
     */
    async loadFootprint(footprintData) {
        try {
            if (footprintData && footprintData.Footprint && Array.isArray(footprintData.Footprint)) {
                this.footprint = {
                    points: footprintData.Footprint.map(point => ({
                        x: parseFloat(point[0]),
                        y: parseFloat(point[1])
                    }))
                };
            } else {
                console.warn('Invalid footprint data, using default');
                this.footprint = this.defaultFootprint;
            }
        } catch (error) {
            console.error('Error loading robot footprint:', error);
            this.footprint = this.defaultFootprint;
        }
    }

    /**
     * Load robot texture
     * @param {string} texturePath - Path to robot texture image
     */
    async loadTexture(texturePath = '/assets/nturobot_icon.png') {
        try {
            const textureLoader = new THREE.TextureLoader();
            this.texture = await new Promise((resolve, reject) => {
                textureLoader.load(
                    texturePath,
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1, 1);
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
            });
            console.log('Robot texture loaded successfully');
        } catch (error) {
            console.error('Error loading robot texture:', error);
            this.texture = null;
        }
    }


    /**
     * Update path line
     */
    updatePath(pathData) {
        if (!this.showGlobalPathPlanning) {
            return;
        }
        this.globalPathPoints = pathData.poses.map(pose => ({
            x: pose.pose.position.x,
            y: pose.pose.position.y
        }));
        this.updateGlobalPathLine();
    }

    updateGlobalPathLine() {
        // Remove existing global path visualization
        if (this.globalPathLine) {
            this.scene.remove(this.globalPathLine);
            this.globalPathLine = null;
        }

        if (this.globalPathPoints.length === 0) {
            return;
        }

        // Create a group to hold all spheres
        this.globalPathLine = new THREE.Group();

        // Create spheres at each path point with 0.2 spacing
        let startPoint;
        for (let i = 0; i < this.globalPathPoints.length; i++) {
            if (i == 0) {
                startPoint = this.globalPathPoints[i];
            }
            else {
                const distance = Math.sqrt(Math.pow(this.globalPathPoints[i].x - startPoint.x, 2) + Math.pow(this.globalPathPoints[i].y - startPoint.y, 2));
                if (distance > 0.2) {
                    startPoint = this.globalPathPoints[i];
                }
                else {
                    continue;
                }
            }

            const point = this.globalPathPoints[i];

            // Create sphere geometry (same as laser scan spheres)
            const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 6); // Radius 0.05, 8 segments, 6 rings

            // Create material with blue color
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x0000cc,
                transparent: true,
                opacity: 0.7
            });

            // Create sphere mesh
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

            // Position sphere at path point
            sphere.position.set(point.x, point.y, 0.05);

            // Add sphere to group
            this.globalPathLine.add(sphere);
        }


        // Add group to scene
        this.scene.add(this.globalPathLine);
    }

    // Helper function để chuyển đổi quaternion thành góc yaw
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
     * Compute robot pose from transforms
     * @param {Object} mapToOdom - Transform from map to odom
     * @param {Object} odomToBase - Transform from odom to base_footprint
     * @returns {Object} Robot pose {x, y, theta}
     */
    computeRobotPose(mapToOdom, odomToBase) {
        // Validate input transforms
        if (!mapToOdom || !odomToBase) {
            console.error('Invalid transforms for robot pose computation');
            return { x: 0, y: 0, theta: 0 };
        }

        // Validate required properties
        if (!mapToOdom.translation || !mapToOdom.rotation ||
            !odomToBase.translation || !odomToBase.rotation) {
            console.error('Missing required transform properties for robot pose computation');
            return { x: 0, y: 0, theta: 0 };
        }

        // Tính vị trí robot trong khung map
        // Áp dụng rotation của mapToOdom vào odomToBase translation
        const q1 = new THREE.Quaternion(
            mapToOdom.rotation.x,
            mapToOdom.rotation.y,
            mapToOdom.rotation.z,
            mapToOdom.rotation.w
        );
        const v1 = new THREE.Vector3(
            odomToBase.translation.x,
            odomToBase.translation.y,
            odomToBase.translation.z
        );
        v1.applyQuaternion(q1);

        // Tổng hợp translations
        const robotX = mapToOdom.translation.x + v1.x;
        const robotY = mapToOdom.translation.y + v1.y;

        // Tính quaternion cho base_footprint
        const q2 = new THREE.Quaternion(
            odomToBase.rotation.x,
            odomToBase.rotation.y,
            odomToBase.rotation.z,
            odomToBase.rotation.w
        );

        // Nhân hai quaternion để được quaternion cuối cùng
        const finalQuaternion = q1.multiply(q2);
        if (this.robotTransforms == null) {
            this.robotTransforms = new THREE.Matrix4();
        }
        this.robotTransforms.compose(
            new THREE.Vector3(robotX, robotY, 0.1),
            finalQuaternion,
            new THREE.Vector3(1, 1, 1)
        );
        if (this.laserToMapTransforms == null) {
            this.laserToMapTransforms = new THREE.Matrix4();
        }

        if (this.tfLaserToBase) {
            this.laserToMapTransforms = this.robotTransforms.clone();
            this.laserToMapTransforms.multiply(this.tfLaserToBase);
        }

        // Chuyển quaternion thành góc yaw và đổi dấu để khớp với hệ tọa độ Three.js
        const robotYaw = this.quaternionToYaw(
            finalQuaternion.x,
            finalQuaternion.y,
            finalQuaternion.z,
            finalQuaternion.w
        );

        return {
            x: robotX,
            y: robotY,
            theta: robotYaw
        };
    }


    /**
     * Set robot transforms
     * @param {Object} robotTFs - Robot transforms
     */
    setTF(robotTFs) {
        if (!this.isVisible) {
            //console.log('Robot is not visible');
            return;
        }
        // Validate input
        if (!robotTFs || !Array.isArray(robotTFs)) {
            console.error('Invalid robotTFs input:', robotTFs);
            return;
        }

        robotTFs.forEach(transform => {
            // Validate transform structure
            if (!transform || typeof transform !== 'object') {
                console.error('Invalid transform object:', transform);
                return;
            }

            // Lưu transform từ map đến odom
            if (transform.child_frame_id === 'odom' &&
                transform.header.frame_id === 'map') {
                this.transforms.mapToOdom = transform.transform;
            }
            // Lưu transform từ odom đến base_footprint
            else if (transform.child_frame_id === 'base_footprint' &&
                transform.header.frame_id === 'odom') {
                this.transforms.odomToBase = transform.transform;
            }
        });

        // Cập nhật vị trí robot nếu có đủ transforms
        if (this.transforms.mapToOdom && this.transforms.odomToBase) {
            const robotPose = this.computeRobotPose(
                this.transforms.mapToOdom,
                this.transforms.odomToBase
            );
            this.updatePose(robotPose);
        }
    }


    /**
     * Load TF laser to base data
     * @param {Object} tfData - TF data from server
     */
    async loadTFLaserToBase(tfData) {
        try {
            if (tfData && tfData.Position && tfData.Orientation) {
                // Validate Position array
                if (Array.isArray(tfData.Position) && tfData.Position.length >= 3) {
                    // Validate Orientation array
                    if (Array.isArray(tfData.Orientation) && tfData.Orientation.length >= 4) {
                        // console.log('Raw TF Position array:', tfData.Position);
                        // console.log('Raw TF Orientation array:', tfData.Orientation);

                        // Parse values with detailed logging
                        const posX = parseFloat(tfData.Position[0]);
                        const posY = parseFloat(tfData.Position[1]);
                        const posZ = parseFloat(tfData.Position[2]);
                        const rotX = parseFloat(tfData.Orientation[0]);
                        const rotY = parseFloat(tfData.Orientation[1]);
                        const rotZ = parseFloat(tfData.Orientation[2]);
                        const rotW = parseFloat(tfData.Orientation[3]);


                        // Check for NaN values
                        if (isNaN(posX) || isNaN(posY) || isNaN(posZ) ||
                            isNaN(rotX) || isNaN(rotY) || isNaN(rotZ) || isNaN(rotW)) {
                            console.error('NaN values detected in TF data');
                            this.tfLaserToBase = null;
                            return;
                        }

                        this.tfLaserToBase = new THREE.Matrix4();
                        this.tfLaserToBase.compose(
                            new THREE.Vector3(posX, posY, posZ),
                            new THREE.Quaternion(rotX, rotY, rotZ, rotW),
                            new THREE.Vector3(1, 1, 1)
                        );
                        // console.log("TF laser to base loaded:", this.tfLaserToBase);
                    } else {
                        console.error('Invalid TF Orientation array:', tfData.Orientation);
                        this.tfLaserToBase = null;
                    }
                } else {
                    console.error('Invalid TF Position array:', tfData.Position);
                    this.tfLaserToBase = null;
                }
            } else {
                console.error('Invalid TF data format - missing Position or Orientation');
                this.tfLaserToBase = null;
            }
        } catch (error) {
            console.error('Error loading robot TF:', error);
            this.tfLaserToBase = null;
        }
    }

    /**
     * Create robot mesh from footprint and texture
     */
    createMesh() {
        // Remove existing mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        if (!this.footprint) {
            console.warn('No footprint available, using default');
            this.footprint = this.defaultFootprint;
        }

        if (this.texture) {
            // Create mesh with texture
            this.mesh = this.createTexturedMesh();
        } else {
            // Create fallback mesh
            this.mesh = this.createFallbackMesh();
        }

        // Set initial position
        this.mesh.position.set(this.position.x, this.position.y, 0.5);
        this.mesh.rotation.z = this.yaw;

        // Add to scene
        if (this.isVisible) {
            this.scene.add(this.mesh);
        }
        // console.log('Robot mesh created and added to scene');
    }

    /**
     * Create textured mesh from footprint
     */
    createTexturedMesh() {
        const shape = new THREE.Shape();
        const points = this.footprint.points;

        // Move to first point
        shape.moveTo(points[0].x, points[0].y);

        // Draw footprint edges
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        // Close shape
        shape.lineTo(points[0].x, points[0].y);

        const geometry = new THREE.ShapeGeometry(shape);

        // Calculate UV mapping for proper texture placement
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

        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.opacity
        });

        return new THREE.Mesh(geometry, material);
    }

    /**
     * Create fallback mesh (colored rectangle)
     */
    createFallbackMesh() {
        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.opacity
        });
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Create coordinate frame for robot
     */
    createFrame() {
        if (this.frame) {
            this.scene.remove(this.frame);
        }

        this.frame = new THREE.Group();
        const axisLength = 0.2;
        const axisWidth = 0.01;

        // X-axis (red)
        const xGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.position.x = axisLength / 2;

        // Y-axis (green)
        const yGeometry = new THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yAxis = new THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = axisLength / 2;

        // Add arrows
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

        this.frame.add(xAxis, yAxis, xArrow, yArrow);
        if (this.isVisible) {
            this.scene.add(this.frame);
        }

        // Set initial position
        this.frame.position.set(this.position.x, this.position.y, this.position.z);
        this.frame.rotation.z = this.yaw;
    }

    /**
     * Update robot position and orientation
     * @param {Object} pose - Robot pose {x, y, theta}
     */
    updatePose(pose) {
        if (!pose || typeof pose !== 'object') {
            console.error('Invalid robot pose:', pose);
            return;
        }

        // Validate pose properties
        if (typeof pose.x !== 'number' || typeof pose.y !== 'number' || typeof pose.theta !== 'number') {
            console.error('Invalid robot pose properties:', pose);
            return;
        }

        // Check for NaN or infinite values
        if (isNaN(pose.x) || isNaN(pose.y) || isNaN(pose.theta) ||
            !isFinite(pose.x) || !isFinite(pose.y) || !isFinite(pose.theta)) {
            console.error('Robot pose contains NaN or infinite values:', pose);
            return;
        }

        // Update position and orientation
        this.position.x = pose.x;
        this.position.y = pose.y;
        this.yaw = pose.theta;

        // Update mesh if exists
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.z = this.yaw;
        }

        // Update frame if exists
        if (this.frame) {
            this.frame.position.set(this.position.x, this.position.y, this.position.z);
            this.frame.rotation.z = this.yaw;
        }

        // Add point to path
        this.addPathPoint(this.position.x, this.position.y);
    }

    /**
     * Update robot position from odometry data
     * @param {Object} position - Position {x, y, z}
     * @param {Object} orientation - Orientation quaternion {x, y, z, w}
     */
    updateFromOdom(position, orientation) {
        try {
            if (!position || !orientation) {
                console.warn('Invalid odometry data - missing position or orientation');
                return false;
            }

            // Convert quaternion to yaw angle
            const yaw = this.quaternionToYaw(
                orientation.x,
                orientation.y,
                orientation.z,
                orientation.w
            );

            const pose = {
                x: position.x,
                y: position.y,
                theta: yaw
            };

            this.updatePose(pose);
            return true;
        } catch (error) {
            console.error('Error updating robot from odometry:', error);
            return false;
        }
    }

    /**
     * Add point to robot path
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    addPathPoint(x, y) {
        if (!this.showPath) return;

        if (this.pathPoints.length === 0) {
            this.pathPoints.push(new THREE.Vector3(x, y, 0.1));
        }
        else {
            const lastPoint = this.pathPoints[this.pathPoints.length - 1];
            const distance = lastPoint.distanceTo(new THREE.Vector3(x, y, 0.1));
            if (distance > 0.1) {
                this.pathPoints.push(new THREE.Vector3(x, y, 0.1));
            }
        }

        this.updatePathLine();
    }

    /**
     * Update path visualization
     */
    updatePathLine() {
        if (!this.showPath) return;

        // Remove old path line
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }

        if (this.pathPoints.length < 2) return;

        // Create new path line
        const geometry = new THREE.BufferGeometry().setFromPoints(this.pathPoints);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 8
        });

        this.pathLine = new THREE.Line(geometry, material);
        this.scene.add(this.pathLine);
    }

    /**
     * Convert quaternion to yaw angle
     * @param {number} x - Quaternion x component
     * @param {number} y - Quaternion y component
     * @param {number} z - Quaternion z component
     * @param {number} w - Quaternion w component
     * @returns {number} Yaw angle in radians
     */
    quaternionToYaw(x, y, z, w) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number' || typeof w !== 'number') {
            console.error('Invalid quaternion parameters:', { x, y, z, w });
            return 0;
        }

        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(w) ||
            !isFinite(x) || !isFinite(y) || !isFinite(z) || !isFinite(w)) {
            console.error('Quaternion contains NaN or infinite values:', { x, y, z, w });
            return 0;
        }

        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        return Math.atan2(siny_cosp, cosy_cosp);
    }

    /**
     * Set robot visibility
     * @param {boolean} visible - Whether robot should be visible
     */
    setVisible(visible) {
        console.log('🤖 Robot.setVisible called:', visible);
        this.isVisible = visible;

        if (this.mesh) {
            this.mesh.visible = visible;
            if (visible) {
                this.scene.add(this.mesh);
            } else {
                this.scene.remove(this.mesh);
            }
        }
        if (this.frame) {
            this.frame.visible = visible && this.showFrame;
            if (visible) {
                this.scene.add(this.frame);
            } else {
                this.scene.remove(this.frame);
            }
        }

        if (this.laserScanGroup) {
            this.laserScanGroup.visible = visible && this.showLaserScan;
            if (visible) {
                this.scene.add(this.laserScanGroup);
            } else {
                this.scene.remove(this.laserScanGroup);
            }
        }
        if (this.laserScanMesh) {
            this.laserScanMesh.visible = visible && this.showLaserScan;
            if (visible) {
                this.scene.add(this.laserScanMesh);
            } else {
                this.scene.remove(this.laserScanMesh);
            }
        }
    }

    /**
     * Show robot on map
     */
    show() {
        this.setVisible(true);
    }

    /**
     * Hide robot from map
     */
    hide() {
        this.setVisible(false);
    }

    /**
     * Toggle robot visibility
     * @returns {boolean} New visibility state
     */
    toggle() {
        const newState = !this.isVisible;
        this.setVisible(newState);
        console.log(`Robot visibility toggled to: ${newState ? 'visible' : 'hidden'}`);
        return newState;
    }

    /**
     * Check if robot is currently visible
     * @returns {boolean} True if robot is visible
     */
    isRobotVisible() {
        return this.isVisible;
    }

    /**
     * Set frame visibility
     * @param {boolean} visible - Whether coordinate frame should be visible
     */
    setFrameVisible(visible) {
        this.showFrame = visible;
        if (this.frame) {
            this.frame.visible = visible && this.isVisible;
        }
    }

    /**
     * Set path visibility
     * @param {boolean} visible - Whether path should be visible
     */
    setPathVisible(visible) {
        this.showPath = visible;
        if (visible) {
            if (this.pathLine) {
                this.pathLine.visible = visible && this.isVisible;
                this.scene.add(this.pathLine);
            }
        } else {
            if (this.pathLine) {
                this.scene.remove(this.pathLine);
            }
        }
    }

    setGlobalPathPlanningVisible(visible) {
        this.showGlobalPathPlanning = visible;
        if (visible) {
            this.updateGlobalPathLine();
        } else {
            if (this.globalPathLine) {
                this.scene.remove(this.globalPathLine);
            }
        }
    }

    /**
     * Set laser scan visibility
     * @param {boolean} visible - Whether laser scan should be visible
     */
    setLaserScanVisible(visible) {
        this.showLaserScan = visible;
        if (this.laserScanGroup) {
            this.laserScanGroup.visible = visible && this.isVisible;
        }
        if (this.laserScanMesh) {
            this.laserScanMesh.visible = visible && this.isVisible;
        }
    }

    /**
     * Set robot opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));

        if (this.mesh && this.mesh.material) {
            this.mesh.material.opacity = this.opacity;
        }
    }

    /**
     * Clear robot path
     */
    clearPath() {
        this.pathPoints = [];
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }
    }

    /**
     * Clear robot completely
     */
    clear() {
        // Clear path
        this.clearPath();
        
        // Remove robot mesh from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
        
        // Reset robot state
        this.currentPose = { x: 0, y: 0, theta: 0 };
        this.pathPoints = [];
    }

    /**
     * Get current robot pose
     * @returns {Object} Current pose {x, y, theta}
     */
    getPose() {
        return {
            x: this.position.x,
            y: this.position.y,
            theta: this.yaw
        };
    }

    /**
     * Get robot footprint
     * @returns {Object} Robot footprint
     */
    getFootprint() {
        return this.footprint;
    }

    /**
     * Initialize robot with footprint and texture
     * @param {Object} footprintData - Footprint data
     * @param {string} texturePath - Path to texture image
     * @param {Object} tfData - TF laser to base data
     */
    async initialize(footprintData = null, texturePath = null, tfData = null) {
        try {
            // Load footprint
            if (footprintData) {
                await this.loadFootprint(footprintData);
            }

            // Load texture
            if (texturePath) {
                await this.loadTexture(texturePath);
            }

            // Load TF data
            if (tfData) {
                await this.loadTFLaserToBase(tfData);
            }

            // Create mesh and frame
            this.createMesh();
            //this.createFrame();

            return true;
        } catch (error) {
            console.error('Error initializing robot:', error);
            return false;
        }
    }

    /**
     * Dispose robot resources
     */
    dispose() {
        try {
            // Remove from scene
            if (this.mesh) {
                this.scene.remove(this.mesh);
                if (this.mesh.geometry) this.mesh.geometry.dispose();
                if (this.mesh.material) {
                    if (this.mesh.material.map) this.mesh.material.map.dispose();
                    this.mesh.material.dispose();
                }
                this.mesh = null;
            }

            if (this.frame) {
                this.scene.remove(this.frame);
                this.frame = null;
            }

            if (this.pathLine) {
                this.scene.remove(this.pathLine);
                if (this.pathLine.geometry) this.pathLine.geometry.dispose();
                if (this.pathLine.material) this.pathLine.material.dispose();
                this.pathLine = null;
            }

            // Clear laser scan
            this.clearLaserScan();
            if (this.laserScanMaterial) {
                this.laserScanMaterial.dispose();
                this.laserScanMaterial = null;
            }

            // Clear arrays
            this.pathPoints = [];
            this.laserScanPoints = [];

            // Dispose texture
            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }
            // clear global path line
            if (this.globalPathLine) {
                // Remove all circles from the group
                while (this.globalPathLine.children.length > 0) {
                    const child = this.globalPathLine.children[0];
                    this.globalPathLine.remove(child);
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        child.material.dispose();
                    }
                }

                this.scene.remove(this.globalPathLine);
                this.globalPathLine = null;
            }

        } catch (error) {
            console.error('Error disposing robot:', error);
        }
    }

    /**
     * Update laser scan data
     * @param {Object} message - Laser scan message
     */
    updateScan(message) {

        if (!this.showLaserScan || !this.isVisible) {
            return;
        }
        // Check if scene is available
        if (!this.scene) {
            console.warn('Scene not available for laser scan processing');
            return;
        }

        // Validate scan message
        if (!message || typeof message !== 'object') {
            console.error('Invalid scan message:', message);
            return;
        }
        
        if (this.laserToMapTransforms) {

            // Extract scan data from message
            if (message.ranges && Array.isArray(message.ranges)) {
                const ranges = message.ranges;
                const angleMin = message.angle_min || 0;
                const angleIncrement = message.angle_increment || 0.0174533; // ~1 degree in radians

                // Transform scan data to map coordinates
                this.transformAndVisualizeScan(ranges, angleMin, angleIncrement, this.transforms);
            } else {
                console.warn('❌ No valid ranges in scan message');
            }
        } 
    }

    /**
     * Transform and visualize laser scan data
     * @param {Array} ranges - Laser scan ranges
     * @param {number} angleMin - Minimum angle
     * @param {number} angleIncrement - Angle increment
     * @param {Object} transforms - Robot transforms
     */
    transformAndVisualizeScan(ranges, angleMin, angleIncrement, transforms) {
        // Clear previous laser scan visualization
        this.clearLaserScan();

        // Validate that all required transforms are available
        if (!this.tfLaserToBase || !this.laserToMapTransforms) {
            return;
        }

        // Multiply matrices: mapToOdom * odomToBase * laserToBase
        const tfLaserToMap = this.laserToMapTransforms.clone();

        // Clear laser points
        this.laserPoints = [];
        // Process each scan point
        const scanPoints = [];
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];

            // Skip invalid ranges
            if (range === Infinity || range === -Infinity || isNaN(range) || range <= 0) {
                continue;
            }

            // Calculate angle for this point
            const angle = angleMin + i * angleIncrement;

            // Skip invalid angles
            if (isNaN(angle)) {
                continue;
            }

            // Convert polar coordinates to Cartesian (in laser frame)
            const laserX = range * Math.cos(angle);
            const laserY = range * Math.sin(angle);
            const laserZ = 0.2;

            // Skip invalid laser coordinates
            if (isNaN(laserX) || isNaN(laserY) || isNaN(laserZ)) {
                continue;
            }
            // Add laser point to array
            this.laserPoints.push(new THREE.Vector3(laserX, laserY, laserZ));
            // Transform from laser frame to map frame
            const mapPoint = this.transformPoint([laserX, laserY, laserZ], tfLaserToMap);

            // Validate transformed point
            if (mapPoint &&
                !isNaN(mapPoint[0]) && !isNaN(mapPoint[1]) && !isNaN(mapPoint[2]) &&
                isFinite(mapPoint[0]) && isFinite(mapPoint[1]) && isFinite(mapPoint[2])) {

                // Add some reasonable bounds checking
                if (Math.abs(mapPoint[0]) < 1000 && Math.abs(mapPoint[1]) < 1000 && Math.abs(mapPoint[2]) < 1000) {
                    scanPoints.push(new THREE.Vector3(mapPoint[0], mapPoint[1], 0.05));
                }
            }
        }

        // console.log(`Transformed ${scanPoints.length} valid scan points to map coordinates`);

        // Only visualize if we have valid points
        if (scanPoints.length > 0) {
            this.visualizeLaserScan(scanPoints);
        }
    }

    /**
     * Create transformation matrix from TF data
     * @param {Object} tf - TF data
     * @returns {THREE.Matrix4} Transformation matrix
     */
    createTransformMatrix(tf) {
        // Validate TF data
        if (!tf) {
            console.error('Invalid TF data: null or undefined');
            return new THREE.Matrix4().identity();
        }

        // Create 4x4 transformation matrix from TF data
        const matrix = new THREE.Matrix4();

        try {
            // Extract position - handle both formats
            let position = null;
            if (tf.translation) {
                position = tf.translation;
            } else if (tf.Position) {
                position = tf.Position;
            }

            if (!position) {
                console.error('Invalid TF data: missing position (translation or Position)');
                return new THREE.Matrix4().identity();
            }

            // Handle position as object or array
            let x, y, z;
            if (typeof position === 'object' && position.x !== undefined) {
                // Object format: {x: 0.5, y: 0.3, z: 0}
                x = parseFloat(position.x);
                y = parseFloat(position.y);
                z = parseFloat(position.z || 0);
            } else if (Array.isArray(position)) {
                // Array format: [0.5, 0.3, 0]
                x = parseFloat(position[0]);
                y = parseFloat(position[1]);
                z = parseFloat(position[2] || 0);
            } else {
                console.error('Invalid position format:', position);
                return new THREE.Matrix4().identity();
            }

            // console.log('TF Position parsed:', { x, y, z });

            // Validate position values
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error('Invalid TF position values after parsing:', { x, y, z });
                return new THREE.Matrix4().identity();
            }

            // Extract orientation (quaternion) - handle both formats
            let orientation = null;
            if (tf.rotation) {
                orientation = tf.rotation;
            } else if (tf.Orientation) {
                orientation = tf.Orientation;
            }

            if (!orientation) {
                console.error('Invalid TF data: missing orientation (rotation or Orientation)');
                return new THREE.Matrix4().identity();
            }

            // Handle orientation as object or array
            let qx, qy, qz, qw;
            if (typeof orientation === 'object' && orientation.x !== undefined) {
                // Object format: {x: 0, y: 0, z: 0.5, w: 0.866}
                qx = parseFloat(orientation.x);
                qy = parseFloat(orientation.y);
                qz = parseFloat(orientation.z);
                qw = parseFloat(orientation.w);
            } else if (Array.isArray(orientation)) {
                // Array format: [0, 0, 0.5, 0.866]
                qx = parseFloat(orientation[0]);
                qy = parseFloat(orientation[1]);
                qz = parseFloat(orientation[2]);
                qw = parseFloat(orientation[3]);
            } else {
                console.error('Invalid orientation format:', orientation);
                return new THREE.Matrix4().identity();
            }

            // console.log('TF Orientation parsed:', { qx, qy, qz, qw });

            // Validate quaternion values
            if (isNaN(qx) || isNaN(qy) || isNaN(qz) || isNaN(qw)) {
                console.error('Invalid TF quaternion values after parsing:', { qx, qy, qz, qw });
                return new THREE.Matrix4().identity();
            }

            // Create quaternion and set matrix
            const quaternion = new THREE.Quaternion(qx, qy, qz, qw);
            matrix.compose(
                new THREE.Vector3(x, y, z),
                quaternion,
                new THREE.Vector3(1, 1, 1)
            );

            return matrix;
        } catch (error) {
            console.error('Error creating transform matrix:', error);
            return new THREE.Matrix4().identity();
        }
    }

    /**
     * Multiply transformation matrices
     * @param {THREE.Matrix4} mapToOdomMatrix - Map to odom matrix
     * @param {THREE.Matrix4} odomToBaseMatrix - Odom to base matrix
     * @param {THREE.Matrix4} laserToBaseMatrix - Laser to base matrix
     * @returns {THREE.Matrix4} Result matrix
     */
    multiplyMatrices(mapToOdomMatrix, odomToBaseMatrix, laserToBaseMatrix) {
        // Validate input parameters - these should be Three.js Matrix4 objects
        if (!mapToOdomMatrix || !odomToBaseMatrix || !laserToBaseMatrix) {
            console.error('Invalid matrix parameters:', {
                hasMapToOdomMatrix: !!mapToOdomMatrix,
                hasOdomToBaseMatrix: !!odomToBaseMatrix,
                hasLaserToBaseMatrix: !!laserToBaseMatrix
            });
            return new THREE.Matrix4().identity();
        }

        // Validate that they are Matrix4 objects
        if (!mapToOdomMatrix.isMatrix4 || !odomToBaseMatrix.isMatrix4 || !laserToBaseMatrix.isMatrix4) {
            console.error('Invalid matrix types - expected Matrix4 objects');
            return new THREE.Matrix4().identity();
        }

        // Multiply matrices: mapToOdom * odomToBase * laserToBase
        let result = mapToOdomMatrix.clone().multiply(odomToBaseMatrix).multiply(laserToBaseMatrix);

        return result;
    }

    /**
     * Transform a point using a transformation matrix
     * @param {Array} point - 3D point [x, y, z]
     * @param {THREE.Matrix4} matrix - Transformation matrix
     * @returns {Array} Transformed point [x, y, z]
     */
    transformPoint(point, matrix) {
        // Validate input
        if (!point || !Array.isArray(point) || point.length < 3) {
            console.error('Invalid point for transformation:', point);
            return null;
        }

        if (!matrix || !matrix.isMatrix4) {
            console.error('Invalid matrix for transformation:', matrix);
            return null;
        }

        // Transform a 3D point using 4x4 matrix
        const vector = new THREE.Vector3(point[0], point[1], point[2]);
        vector.applyMatrix4(matrix);
        return [vector.x, vector.y, vector.z];
    }

    /**
     * Visualize laser scan points
     * @param {Array} scanPoints - Array of THREE.Vector3 points
     */
    visualizeLaserScan(scanPoints) {
        // Check if scene is available
        if (!this.scene) {
            console.warn('Scene not available for laser scan visualization');
            return;
        }

        // Validate input
        if (!scanPoints || !Array.isArray(scanPoints)) {
            console.error('Invalid scan points for visualization:', scanPoints);
            return;
        }

        if (scanPoints.length === 0) {
            console.log('No valid scan points to visualize');
            return;
        }

        // Final validation of all points
        const validPoints = scanPoints.filter(point => {
            return point &&
                !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
                isFinite(point.x) && isFinite(point.y) && isFinite(point.z) &&
                Math.abs(point.x) < 1000 && Math.abs(point.y) < 1000 && Math.abs(point.z) < 1000;
        });

        if (validPoints.length === 0) {
            console.warn('No valid points after final validation');
            return;
        }

        // Get current style (default to 'spheres')
        const style = this.laserScanStyle;
        // console.log(`Creating ${style} laser scan with ${validPoints.length} valid points`);

        // Clear previous laser scan
        this.clearLaserScan();

        // Create a group to hold all laser scan elements
        try {
            this.laserScanGroup = new THREE.Group();
            if (!this.laserScanGroup) {
                console.error('Failed to create laserScanGroup');
                return;
            }
        } catch (error) {
            console.error('Error creating laserScanGroup:', error);
            return;
        }

        // Create material based on style
        if (!this.laserScanMaterial) {
            this.setLaserScanStyle(style);
        }

        if (style === 'points') {
            // Create points geometry - most efficient for large point clouds
            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints(validPoints);

            // Create points mesh with optimized material
            this.laserScanMesh = new THREE.Points(geometry, this.laserScanMaterial);
            this.laserScanMesh.frustumCulled = false; // Disable frustum culling for better performance
            this.scene.add(this.laserScanMesh);
        } else {
            // Create individual meshes for flat or sphere styles
            validPoints.forEach((point, index) => {
                let geometry;

                if (style === 'flat') {
                    // Create flat circles
                    geometry = new THREE.CircleGeometry(0.08, 12);
                } else if (style === 'spheres') {
                    // Create small spheres
                    geometry = new THREE.SphereGeometry(0.03, 8, 6);
                }

                const mesh = new THREE.Mesh(geometry, this.laserScanMaterial);

                // Position the mesh at the scan point
                mesh.position.set(point.x, point.y, point.z + 0.2);

                // Add rotation for flat style
                if (style === 'flat') {
                    mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
                }

                // Add to group - check if group exists first
                if (this.laserScanGroup) {
                    this.laserScanGroup.add(mesh);
                }
            });

            // Add group to scene - check if both group and scene exist
            if (this.laserScanGroup && this.scene) {
                this.scene.add(this.laserScanGroup);
            }
        }

        // console.log(`Visualized ${validPoints.length} laser scan points as ${style} style`);
    }

    /**
     * Set laser scan visualization style
     * @param {string} style - Style: 'flat', 'points', 'spheres'
     */
    setLaserScanStyle(style = 'spheres') {
        this.laserScanStyle = style;

        // Clear current visualization
        this.clearLaserScan();

        // Recreate material based on style
        if (style === 'flat') {
            this.laserScanMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4444, // Bright red color
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
        } else if (style === 'points') {
            this.laserScanMaterial = new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.05, // Smaller size for better performance
                sizeAttenuation: false, // Disable size attenuation for better performance
                transparent: false, // Disable transparency for better performance
                alphaTest: 0.1 // Use alpha test instead of transparency
            });
        } else if (style === 'spheres') {
            this.laserScanMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4444,
                transparent: true,
                opacity: 0.7
            });
        }

    }

    /**
     * Clear laser scan visualization
     */
    clearLaserScan() {
        // Remove previous laser scan visualization
        if (this.laserScanGroup) {
            // Remove all meshes from the group
            while (this.laserScanGroup.children.length > 0) {
                const child = this.laserScanGroup.children[0];
                this.laserScanGroup.remove(child);
                if (child.geometry) {
                    child.geometry.dispose();
                }
            }

            // Remove group from scene
            this.scene.remove(this.laserScanGroup);
            this.laserScanGroup = null;
        }

        // Also clear the old mesh if it exists
        if (this.laserScanMesh) {
            this.scene.remove(this.laserScanMesh);
            this.laserScanMesh.geometry.dispose();
            this.laserScanMesh = null;
        }
    }
} 