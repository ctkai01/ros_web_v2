import * as THREE from 'three';

class FloorTool {
    constructor(scene, camera, renderer, mapMesh, mapInfo) {
        console.log('FloorTool: Constructor called');
        this.scene = scene;
        this.camera = camera; 
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;

        console.log('FloorTool: Constructor parameters:', {
            hasScene: !!scene,
            hasCamera: !!camera,
            hasRenderer: !!renderer,
            hasMapMesh: !!mapMesh,
            hasMapInfo: !!mapInfo
        });

        // Floor tool state
        this.state = {
            mode: 'eraser', // 'eraser' or 'polygon'
            eraserRadius: 0.2,
            polygonWidth: 0.1,
            nodes: [],      // Array of nodes for polygon mode
            points: [],     // Array of point coordinates for polygon mode
            selectedNode: null,  // Currently selected node for moving
            nodeRadius: 0.12,    // Node radius
            nodeColors: {
                outer: {
                    normal: 0x000000,   // Normal outline color
                    selected: 0xFF0000  // Selected outline color
                },
                inner: {
                    normal: 0x87f542,   // Normal fill color (beige/trắng ngà)
                    selected: 0xFF69B4  // Selected fill color
                }
            },
            isErasing: false,
            eraserPreviewMesh: null
        };

        // lưu giá trị bản đồ trước khi xóa
        if (this.mapMesh && this.mapMesh.material.map) {
            const originalTexture = this.mapMesh.material.map;
            const originalData = originalTexture.image.data;
            
            // Create a backup of the texture data
            this.mapBackup = {
                material: {
                    map: {
                        image: {
                            data: new Uint8Array(originalData)
                        }
                    }
                }
            };
        }

        // set cursor to crosshair
        this.renderer.domElement.style.cursor = 'crosshair';
    }

    // Set eraser radius
    setEraserRadius(radius) {
        this.state.eraserRadius = radius;
        if (this.state.eraserPreviewMesh) {
            this.state.eraserPreviewMesh.geometry.dispose();
            this.state.eraserPreviewMesh.geometry = new THREE.CircleGeometry(this.state.eraserRadius, 32);
        }
    }

    // Set polygon width
    setPolygonWidth(width) {
        this.state.polygonWidth = width;
    }

    // Set mode
    setMode(mode) {
        console.log('FloorTool: setMode called with mode:', mode);
        this.state.mode = mode;
        console.log('FloorTool: About to call clear()...');
        this.clear();
        console.log('FloorTool: clear() completed');
        
        if (mode === 'eraser') {
            console.log('FloorTool: Setting eraser mode, showing preview');
            this.showEraserPreview();
            console.log('FloorTool: showEraserPreview completed');
        } else if (mode === 'polygon') {
            console.log('FloorTool: Setting polygon mode, hiding preview');
            this.hideEraserPreview();
        }
    }

    // Show eraser preview
    showEraserPreview() {
        console.log('FloorTool: showEraserPreview called');
        console.log('FloorTool: Scene available:', !!this.scene);
        console.log('FloorTool: Current eraser radius:', this.state.eraserRadius);
        
        if (!this.state.eraserPreviewMesh) {
            console.log('FloorTool: Creating new eraser preview mesh');
            const eraserGeometry = new THREE.CircleGeometry(this.state.eraserRadius, 32);
            const eraserMaterial = new THREE.MeshBasicMaterial({
                color: 0xf5f5dc, // Beige/trắng ngà color
                transparent: true,
                opacity: 0.8, // Tăng opacity để dễ nhìn hơn
                side: THREE.DoubleSide,
                depthTest: false, // Đảm bảo hiển thị trên tất cả objects
                depthWrite: false
            });
            this.state.eraserPreviewMesh = new THREE.Mesh(eraserGeometry, eraserMaterial);
            
            console.log('FloorTool: Eraser preview mesh created:', this.state.eraserPreviewMesh);
            console.log('FloorTool: Adding to scene...');
            
            this.scene.add(this.state.eraserPreviewMesh);
            console.log('FloorTool: Eraser preview mesh added to scene');
            console.log('FloorTool: Scene children count:', this.scene.children.length);
        } else {
            console.log('FloorTool: Eraser preview mesh already exists');
        }
    }

    // Hide eraser preview
    hideEraserPreview() {
        if (this.state.eraserPreviewMesh) {
            this.scene.remove(this.state.eraserPreviewMesh);
            this.state.eraserPreviewMesh.geometry.dispose();
            this.state.eraserPreviewMesh.material.dispose();
            this.state.eraserPreviewMesh = null;
        }
    }

    // Update eraser position
    updateEraserPosition(clientX, clientY) {
        if (this.state.mode !== 'eraser') {
            console.log('FloorTool: updateEraserPosition - not in eraser mode, current mode:', this.state.mode);
            return;
        }
        
        console.log('FloorTool: updateEraserPosition called with client coordinates:', { clientX, clientY });
        
        // Show preview if not exists
        if (!this.state.eraserPreviewMesh) {
            console.log('FloorTool: No eraser preview mesh, creating one');
            this.showEraserPreview();
        } else {
            console.log('FloorTool: Eraser preview mesh exists');
        }

        // Convert client coordinates to world coordinates
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (worldPoint) {
            console.log('FloorTool: Setting eraser preview position to:', worldPoint);
            this.state.eraserPreviewMesh.position.set(worldPoint.x, worldPoint.y, 0.1);
            console.log('FloorTool: Updated eraser preview position to:', worldPoint);
        } else {
            console.log('FloorTool: Could not get world position for eraser preview');
        }
    }

    // Start erasing
    startErase(clientX, clientY) {
        if (this.state.mode !== 'eraser') return;
        
        console.log('FloorTool: startErase called');
        this.state.isErasing = true;
        
        if (this.state.eraserPreviewMesh) {
            this.state.eraserPreviewMesh.material.opacity = 0.5;
        }
        
        // Update position and perform erase
        this.updateEraserPosition(clientX, clientY);
        this.eraseAtPosition(clientX, clientY);
    }

    // Update erasing
    updateErase(clientX, clientY) {
        if (this.state.mode !== 'eraser' || !this.state.isErasing) return;

        console.log('FloorTool: updateErase called');
        // Update eraser circle position
        this.updateEraserPosition(clientX, clientY);

        // Perform erase
        this.eraseAtPosition(clientX, clientY);
    }

    // Stop erasing
    stopErase() {
        console.log('FloorTool: stopErase called');
        this.state.isErasing = false;
        if (this.state.eraserPreviewMesh) {
            this.state.eraserPreviewMesh.material.opacity = 0.3;
        }
    }

    // Erase at specific position
    eraseAtPosition(clientX, clientY) {
        if (!this.mapMesh || !this.mapMesh.material.map) {
            console.log('FloorTool: No mapMesh or material.map available');
            return;
        }

        // Convert client coordinates to world coordinates
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) {
            console.log('FloorTool: Could not get world position');
            return;
        }

        console.log('FloorTool: Erasing at world position:', worldPoint);

        // Convert from world coordinates to pixel coordinates in texture
        const worldX = worldPoint.x - this.mapInfo.origin.position.x;
        const worldY = worldPoint.y - this.mapInfo.origin.position.y;

        const pixelX = Math.floor(worldX / this.mapInfo.resolution);
        const pixelY = Math.floor(worldY / this.mapInfo.resolution);

        console.log('FloorTool: Pixel coordinates:', { pixelX, pixelY });

        // Get texture data
        const texture = this.mapMesh.material.map;
        const data = texture.image.data;

        // Determine erase radius in pixels
        const eraseRadius = this.state.eraserRadius / this.mapInfo.resolution;

        console.log('FloorTool: Erase radius in pixels:', eraseRadius);

        // Erase pixels within radius
        for (let y = -Math.ceil(eraseRadius); y <= Math.ceil(eraseRadius); y++) {
            for (let x = -Math.ceil(eraseRadius); x <= Math.ceil(eraseRadius); x++) {
                const currentX = pixelX + x;
                const currentY = pixelY + y;

                // Check if pixel is within radius and map bounds
                if (currentX >= 0 && currentX < this.mapInfo.width &&
                    currentY >= 0 && currentY < this.mapInfo.height) {

                    const distance = Math.sqrt(x * x + y * y);
                    if (distance <= eraseRadius) {
                        const index = (currentY * this.mapInfo.width + currentX) * 4;
                        // Set to white (255, 255, 255) - clear the area
                        data[index] = 255;     // R
                        data[index + 1] = 255; // G
                        data[index + 2] = 255; // B
                        data[index + 3] = 255; // A
                    }
                }
            }
        }

        // Update texture
        texture.needsUpdate = true;
        console.log('FloorTool: Erase completed, texture updated');
    }

    // Add a new polygon node at the clicked position
    mouseEventHandle(clientX, clientY) {
        if (this.state.mode !== 'polygon') return;
        
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Check if clicked on existing node
        const clickedNode = this.findClickedNode(worldPoint);
        if (clickedNode) {
            this.selectNode(clickedNode);
            return;
        }

        // Create new node
        const node = this.createNode(worldPoint);
        this.state.nodes.push(node);
        this.state.points.push(worldPoint);

        // Create polygon if we have 3+ points
        if (this.state.points.length >= 3) {
            this.createPolygon();
        }
    }

    // Create a new node with inner/outer circles
    createNode(position) {
        const outerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(this.state.nodeRadius, 32),
            new THREE.MeshBasicMaterial({
                color: this.state.nodeColors.outer.normal,
                side: THREE.DoubleSide
            })
        );
        outerCircle.position.set(position.x, position.y, 0.1);

        const innerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(this.state.nodeRadius - 0.01, 32),
            new THREE.MeshBasicMaterial({
                color: this.state.nodeColors.inner.normal,
                side: THREE.DoubleSide
            })
        );
        innerCircle.position.set(position.x, position.y, 0.11);

        this.scene.add(outerCircle);
        this.scene.add(innerCircle);

        return { outerCircle, innerCircle };
    }

    // Create polygon from points
    createPolygon() {
        // Remove existing polygon if any
        if (this.state.polygon) {
            this.scene.remove(this.state.polygon);
            this.state.polygon.geometry.dispose();
            this.state.polygon.material.dispose();
        }

        const points = this.state.points;
        if (points.length < 3) return;

        // Create polygon geometry
        const shape = new THREE.Shape();
        shape.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        
        shape.lineTo(points[0].x, points[0].y); // Close the shape

        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: 0xf5f5dc, // Beige/trắng ngà color
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        this.state.polygon = new THREE.Mesh(geometry, material);
        this.scene.add(this.state.polygon);
    }

    // Find if clicked position hits any node
    findClickedNode(worldPoint) {
        for (let i = 0; i < this.state.nodes.length; i++) {
            const node = this.state.nodes[i];
            const nodePos = node.outerCircle.position;

            const distance = Math.sqrt(
                Math.pow(worldPoint.x - nodePos.x, 2) +
                Math.pow(worldPoint.y - nodePos.y, 2)
            );

            if (distance <= this.state.nodeRadius) {
                return {
                    index: i,
                    node: node
                };
            }
        }
        return null;
    }

    // Select a node for moving
    selectNode(nodeInfo) {
        this.state.selectedNode = nodeInfo;

        nodeInfo.node.outerCircle.material.color.setHex(
            this.state.nodeColors.outer.selected
        );
        nodeInfo.node.innerCircle.material.color.setHex(
            this.state.nodeColors.inner.selected
        );

        // set cursor to move
        this.renderer.domElement.style.cursor = 'move';
    }

    // Update selected node position
    updateNodePosition(clientX, clientY) {
        if (!this.state.selectedNode || this.state.mode !== 'polygon') {
            return;
        }
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        //set cursor to move
        this.renderer.domElement.style.cursor = 'move';

        const { node, index } = this.state.selectedNode;

        // Cập nhật vị trí node
        node.outerCircle.position.set(worldPoint.x, worldPoint.y, 0.1);
        node.innerCircle.position.set(worldPoint.x, worldPoint.y, 0.11);
        this.state.points[index] = worldPoint;

        // Update polygon
        this.createPolygon();
    }

    // Reset cursor
    resetCursor() {
        if (this.state.selectedNode) {
            // reset node
            this.state.selectedNode.node.outerCircle.material.color.setHex(
                this.state.nodeColors.outer.normal
            );
            this.state.selectedNode.node.innerCircle.material.color.setHex(
                this.state.nodeColors.inner.normal
            );
            this.state.selectedNode = null;
            // reset cursor
            this.renderer.domElement.style.cursor = 'crosshair';
        }
    }

    // Apply floor tool to map
    applyFloorToolToMap() {
        if (this.state.mode === 'eraser') {
            // Eraser mode - changes are already applied
            console.log('Floor eraser changes applied');
        } else if (this.state.mode === 'polygon') {
            // Polygon mode - fill the polygon area with white
            this.fillPolygonArea();
        }
        
        this.clear();
        // Cập nhật texture
        if (this.mapMesh && this.mapMesh.material.map) {
            this.mapMesh.material.map.needsUpdate = true;
        }
    }

    // Fill polygon area with white
    fillPolygonArea() {
        if (!this.mapMesh || !this.mapMesh.material.map || this.state.points.length < 3) return;

        const texture = this.mapMesh.material.map;
        const data = texture.image.data;

        // Convert polygon points to pixel coordinates
        const pixelPoints = this.state.points.map(point => ({
            x: Math.floor((point.x - this.mapInfo.origin.position.x) / this.mapInfo.resolution),
            y: Math.floor((point.y - this.mapInfo.origin.position.y) / this.mapInfo.resolution)
        }));

        // Find bounding box
        let minX = Math.max(0, Math.min(...pixelPoints.map(p => p.x)));
        let maxX = Math.min(this.mapInfo.width - 1, Math.max(...pixelPoints.map(p => p.x)));
        let minY = Math.max(0, Math.min(...pixelPoints.map(p => p.y)));
        let maxY = Math.min(this.mapInfo.height - 1, Math.max(...pixelPoints.map(p => p.y)));

        // Fill pixels inside polygon
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, pixelPoints)) {
                    const index = (y * this.mapInfo.width + x) * 4;
                    // Set to white (255, 255, 255)
                    data[index] = 255;     // R
                    data[index + 1] = 255; // G
                    data[index + 2] = 255; // B
                    data[index + 3] = 255; // A
                }
            }
        }
    }

    // Point in polygon test using ray casting algorithm
    isPointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi + 0.000001) + xi);
            
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Convert client coordinates to world position
    getWorldPosition(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        if (this.mapMesh) {
            const intersects = raycaster.intersectObject(this.mapMesh);
            if (intersects.length > 0) {
                return intersects[0].point;
            }
        }
        return null;
    }

    // Enable floor tool mode
    enable(mode = 'eraser') {
        this.setMode(mode);
    }

    // Disable floor tool mode
    disable() {
        this.hideEraserPreview();
        this.state.isErasing = false;
        this.clear();
    }

    // Clear floor tool
    clear() {
        console.log('FloorTool: clear() called');
        console.log('FloorTool: Hiding eraser preview...');
        this.hideEraserPreview();
        console.log('FloorTool: Setting isErasing to false');
        this.state.isErasing = false;
        
        console.log('FloorTool: Removing nodes...');
        // Remove nodes
        this.state.nodes.forEach(node => {
            this.scene.remove(node.outerCircle);
            this.scene.remove(node.innerCircle);
            node.outerCircle.geometry.dispose();
            node.outerCircle.material.dispose();
            node.innerCircle.geometry.dispose();
            node.innerCircle.material.dispose();
        });

        console.log('FloorTool: Removing polygon...');
        // Remove polygon
        if (this.state.polygon) {
            this.scene.remove(this.state.polygon);
            this.state.polygon.geometry.dispose();
            this.state.polygon.material.dispose();
            this.state.polygon = null;
        }

        console.log('FloorTool: Resetting state...');
        // Reset state
        this.state.nodes = [];
        this.state.points = [];
        this.state.selectedNode = null;
        console.log('FloorTool: clear() completed');
    }

    // Dispose floor tool
    dispose() {
        this.clear();
    }
}

export { FloorTool }; 