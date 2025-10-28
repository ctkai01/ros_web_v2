import * as THREE from 'three';
import { SERVER_URL } from '../../../../../../../config/serverConfig.js';

class DrawUnpreferredZone {
    constructor(scene, camera, renderer, mapMesh, mapInfo, map2D) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;
        this.map2D = map2D;

        // State management
        this.state = {
            mode: 'create', // 'create', 'select', 'edit'

            // Drawing state (for create mode)
            nodes: [],
            points: [],
            polygon: null,
            selectedNode: null,

            // Select state (for select mode)
            selectedPolygon: null,
            selectedPolygonId: null,

            // Edit state (for edit mode)
            editingNodes: [],
            editingPolygonId: null,

            // Drawing settings
            isDrawingEnabled: true,
            nodeColors: {
                outer: { normal: 0x000000, selected: 0x8e92eb },
                inner: { normal: 0x87f542, selected: 0x8e92eb }
            },
            polygonColor: 0x8e92eb,
        };

        // Unpreferred zones storage
        this.unpreferredZones = []; // Data objects
        this.unpreferredZoneMeshes = []; // Visual mesh objects

        // Tool state
        this.isEnabled = false;
        this._allowExitEdit = false; // Flag to allow exit from edit mode

        // Node settings
        this.nodeRadius = 0.12;
        this.nodeSegments = 32;

        // ID management
        this.IDCount = 1; // Counter for generating new IDs

        // Keyboard event handling
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);

        console.log('DrawUnpreferredZone initialized');
    }

    // ===== MODE MANAGEMENT =====
    setMode(mode) {
        console.log('=== SETTING MODE ===');
        console.log('Setting mode to:', mode);
        console.log('Current editingPolygonId before setMode:', this.state.editingPolygonId);

        // Prevent accidental exit from edit mode
        if (this.state.mode === 'edit' && mode === 'create' && !this._allowExitEdit) {
            console.warn('Prevented accidental exit from edit mode');
            return;
        }

        // Clear current state only when switching to create or select mode
        if (mode !== 'edit') {
            console.log('Clearing current state (not edit mode)');
            this.clearCurrentState();
        } else {
            console.log('Preserving state (edit mode)');
        }

        this.state.mode = mode;

        switch (mode) {
            case 'create':
                this.enableDrawing();
                this.renderer.domElement.style.cursor = 'crosshair';
                break;
            case 'select':
                this.disableDrawing();
                this.renderer.domElement.style.cursor = 'pointer';
                break;
            case 'edit':
                this.disableDrawing();
                this.renderer.domElement.style.cursor = 'crosshair';
                break;
        }

        console.log('Mode set to:', this.state.mode);
        console.log('EditingPolygonId after setMode:', this.state.editingPolygonId);
    }

    getMode() { return this.state.mode; }
    isCreateMode() { return this.state.mode === 'create'; }
    isSelectMode() { return this.state.mode === 'select'; }
    isEditMode() { return this.state.mode === 'edit'; }

    // ===== CLICK HANDLERS =====
    mouseEventHandle(clientX, clientY) {
        console.log('mouseEventHandle called for unpreferred zone', this.isEnabled);
        if (!this.isEnabled) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        switch (this.state.mode) {
            case 'create':
                this.handleCreateClick(worldPoint);
                break;
            case 'select':
                this.handleSelectClick(worldPoint);
                break;
            case 'edit':
                this.handleEditClick(worldPoint);
                break;
        }
    }

    handleCreateClick(worldPoint) {
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

        // Create polygon if we have 3 or more points
        if (this.state.points.length >= 3) {
            this.createUnpreferredZonePolygon();
        }
    }

    handleSelectClick(worldPoint) {
        // Check if clicked on any unpreferred zone polygon
        const clickedPolygon = this.findClickedPolygon(worldPoint);
        if (clickedPolygon) {
            this.selectPolygon(clickedPolygon);
        } else {
            this.clearSelectedPolygon();
        }
    }

    handleEditClick(worldPoint) {
        console.log('=== HANDLE EDIT CLICK ===');
        console.log('World point:', worldPoint);
        console.log('Current mode:', this.state.mode);
        console.log('Editing nodes count:', this.state.editingNodes.length);

        if (this.state.mode !== 'edit') {
            console.warn('Not in edit mode');
            return;
        }

        // Check if clicking on an existing node
        const clickedNode = this.findClickedNode(worldPoint);
        if (clickedNode) {
            console.log('Clicked on existing node for editing');
            this.selectNode(clickedNode);
            return;
        }

        // Check if clicking on a polygon edge to add a new node
        const edgeInsertion = this.findEdgeForNodeInsertion(worldPoint);
        if (edgeInsertion) {
            console.log('Adding new node on polygon edge');
            this.insertNodeOnEdge(worldPoint, edgeInsertion.index);
            return;
        }

        // If not clicking on a node or edge, just reset selection
        console.log('Clicked on empty space, resetting node selection');
        this.resetSelectedNode();
    }

    // ===== NODE MANAGEMENT =====
    createNode(position) {
        // Create outer circle (larger, colored)
        const outerGeometry = new THREE.CircleGeometry(this.nodeRadius, this.nodeSegments);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: this.state.nodeColors.outer.normal,
            side: THREE.DoubleSide
        });
        const outerCircle = new THREE.Mesh(outerGeometry, outerMaterial);
        outerCircle.position.copy(position);
        outerCircle.position.z = 0.1;

        // Create inner circle (smaller, white)
        const innerGeometry = new THREE.CircleGeometry(this.nodeRadius * 0.6, this.nodeSegments);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: this.state.nodeColors.inner.normal,
            side: THREE.DoubleSide
        });
        const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
        innerCircle.position.copy(position);
        innerCircle.position.z = 0.11;

        // Add to scene
        this.scene.add(outerCircle);
        this.scene.add(innerCircle);

        return { outerCircle, innerCircle };
    }

    findClickedNode(worldPoint) {
        const clickRadius = 0.2;
        const nodes = this.state.mode == 'edit' ? this.state.editingNodes : this.state.nodes;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const distance = worldPoint.distanceTo(node.outerCircle.position);
            console.log('distance', distance);

            if (distance <= clickRadius) {
                console.log('Found clicked node at index:', i);
                return { node, index: i };
            }
        }

        return null;
    }

    selectNode(nodeInfo) {
        // Reset previous selection
        this.resetSelectedNode();

        // Set new selection
        this.state.selectedNode = nodeInfo;

        // Highlight selected node
        const { node } = nodeInfo;
        node.outerCircle.material.color.setHex(this.state.nodeColors.outer.selected);
        node.innerCircle.material.color.setHex(this.state.nodeColors.inner.selected);

        // Set cursor
        this.renderer.domElement.style.cursor = 'move';
    }

    resetSelectedNode() {
        if (!this.state.selectedNode) return;

        // Reset node colors
        const { node } = this.state.selectedNode;
        node.outerCircle.material.color.setHex(this.state.nodeColors.outer.normal);
        node.innerCircle.material.color.setHex(this.state.nodeColors.inner.normal);

        // Reset cursor
        this.renderer.domElement.style.cursor = this.state.mode === 'edit' ? 'crosshair' : 'default';

        this.state.selectedNode = null;
    }

    // Alias for compatibility
    resetCursor() {
        this.resetSelectedNode();
    }

    updateNodePosition(clientX, clientY) {
        if (!this.state.selectedNode) return;

        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Update node position
        this.state.selectedNode.node.outerCircle.position.copy(worldPoint);
        this.state.selectedNode.node.innerCircle.position.copy(worldPoint);

        // Update corresponding point
        const nodes = this.state.mode === 'edit' ? this.state.editingNodes : this.state.nodes;
        const pointIndex = this.state.selectedNode.index;
        if (pointIndex < this.state.points.length) {
            this.state.points[pointIndex].copy(worldPoint);
        }

        // Update polygon
        this.updatePolygonFromPoints(this.state.points);
    }

    // ===== POLYGON MANAGEMENT =====
    createUnpreferredZonePolygon() {
        if (this.state.points.length < 3) return;

        this.updatePolygonFromPoints(this.state.points);
    }

    updatePolygonFromPoints(points) {
        // Remove existing polygon
        if (this.state.polygon) {
            this.scene.remove(this.state.polygon);
            this.state.polygon.geometry.dispose();
            this.state.polygon.material.dispose();
        }

        if (points.length < 3) return;

        // Create polygon geometry
        const shape = new THREE.Shape();
        shape.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: this.state.polygonColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });

        this.state.polygon = new THREE.Mesh(geometry, material);
        this.state.polygon.position.z = 0.05;
        this.scene.add(this.state.polygon);
    }

    // ===== SELECT MODE =====
    findClickedPolygon(worldPoint) {
        if (!this.map2D || !this.unpreferredZones) return null;

        console.log('findClickedPolygon called', this.unpreferredZones.length);
        const clickRadius = 0.1;

        for (let i = 0; i < this.unpreferredZones.length; i++) {
            const unpreferredZone = this.unpreferredZones[i];

            // Check if this is a data object (has points property)
            if (unpreferredZone.points) {
                const points = unpreferredZone.points;
                const polygon = points.map(p => new THREE.Vector3(p.x, p.y, 0));
                console.log('polygon', polygon);
                // Check if point is inside polygon
                if (this.isPointInPolygon(worldPoint, polygon)) {
                    console.log('Found clicked polygon at index:', i);

                    // Find the corresponding visual mesh
                    const visualMesh = this.unpreferredZoneMeshes[i];

                    return {
                        polygon: visualMesh,
                        unpreferredZoneData: unpreferredZone,
                        index: i
                    };
                }
            }
        }

        return null;
    }

    isPointInPolygon(point, polygonPoints) {
        // polygonPoints là mảng THREE.Vector3

        // Bước 1: Tạo bounding box (giúp tối ưu)
        const geometry = new THREE.BufferGeometry().setFromPoints(polygonPoints);
        const pointsObject = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.1 }));
        const boundingBox = new THREE.Box3().setFromObject(pointsObject);

        const testPoint = new THREE.Vector3(point.x, point.y, 0);

        // Bước 2: Kiểm tra nếu nằm ngoài bounding box => loại ngay
        if (!boundingBox.containsPoint(testPoint)) {
            return false;
        }

        // Bước 3: Kiểm tra chính xác bằng thuật toán Ray Casting (Even-Odd Rule)
        const x = point.x;
        const y = point.y;
        let inside = false;

        for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
            const xi = polygonPoints[i].x, yi = polygonPoints[i].y;
            const xj = polygonPoints[j].x, yj = polygonPoints[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-10) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    selectPolygon(polygonInfo) {
        this.clearSelectedPolygon();

        if (!polygonInfo || !polygonInfo.polygon) {
            console.warn('Invalid polygon info for selection');
            return;
        }

        this.state.selectedPolygon = polygonInfo.polygon;
        this.state.selectedPolygonId = polygonInfo.unpreferredZoneData.id;

        // Highlight the selected polygon - check if it's a visual mesh object
        if (polygonInfo.polygon.material && polygonInfo.polygon.material.color) {
            polygonInfo.polygon.material.color.setHex(0x00ff00); // Green for selected
        } else {
            console.warn('Selected polygon does not have material.color property');
        }

        console.log('Polygon selected:', this.state.selectedPolygonId);

        // Show edit actions
        if (this.map2D && this.map2D.unpreferredZoneToolbar) {
            this.map2D.unpreferredZoneToolbar.showEditActions(this.state.selectedPolygonId);
        }
    }

    clearSelectedPolygon() {
        if (this.state.selectedPolygon) {
            // Check if the selected polygon has material.color property
            if (this.state.selectedPolygon.material && this.state.selectedPolygon.material.color) {
                this.state.selectedPolygon.material.color.setHex(this.state.polygonColor);
            }
            this.state.selectedPolygon = null;
        }

        this.state.selectedPolygonId = null;

        // Hide edit actions
        if (this.map2D && this.map2D.unpreferredZoneToolbar) {
            this.map2D.unpreferredZoneToolbar.hideEditActions();
        }
    }

    // ===== EDIT MODE =====
    editSelectedPolygon() {
        if (!this.state.selectedPolygonId) return;

        console.log('=== ENTERING EDIT MODE ===');
        console.log('Selected polygon ID:', this.state.selectedPolygonId);

        const unpreferredZoneData = this.unpreferredZones.find(zone => zone.id === this.state.selectedPolygonId);
        if (!unpreferredZoneData) {
            console.error('Unpreferred zone data not found');
            return;
        }

        console.log('Found unpreferred zone data:', unpreferredZoneData);

        // Store editing state
        this.state.editingPolygonId = this.state.selectedPolygonId;
        console.log('Set editingPolygonId to:', this.state.editingPolygonId);

        this.state.points = unpreferredZoneData.points.map(point => new THREE.Vector3(point.x, point.y, 0));
        console.log('Set points for editing:', this.state.points);

        // Create editing nodes
        this.state.editingNodes = [];
        this.state.points.forEach(point => {
            const node = this.createNode(point);
            this.state.editingNodes.push(node);
        });
        console.log('Created editing nodes:', this.state.editingNodes.length);

        // Create editing polygon
        this.createUnpreferredZonePolygon();

        // Switch to edit mode
        this.setMode('edit');

        console.log('Edit mode ready');
        console.log('Final editingPolygonId:', this.state.editingPolygonId);
        console.log('Final mode:', this.state.mode);
    }

    // ===== APPLY/CANCEL =====
        applyUnpreferredZoneToMap() {

        if (this.state.points.length < 3) {
            console.warn('Not enough points to create unpreferred zone');
            return;
        }

        let unpreferredZoneData;
        const shouldUpdate = this.state.mode === 'edit' && this.state.editingPolygonId;
        console.log('Should update existing zone:', shouldUpdate);

        if (shouldUpdate) {
            // Update existing unpreferred zone
            console.log('Updating existing unpreferred zone:', this.state.editingPolygonId);
            unpreferredZoneData = {
                id: this.state.editingPolygonId,
                points: this.state.points.map(point => ({ x: point.x, y: point.y })),
                timestamp: Date.now()
            };
            // Update in local array
            const existingIndex = this.unpreferredZones.findIndex(zone => zone.id === this.state.editingPolygonId);
            if (existingIndex !== -1) {
                this.unpreferredZones[existingIndex] = unpreferredZoneData;
                console.log('Updated in unpreferredZones array at index:', existingIndex);
            }
            // Update in scene
            this.updateScenePolygon(unpreferredZoneData);
        } else {
            // Create new unpreferred zone
            console.log('Creating new unpreferred zone');
            unpreferredZoneData = {
                id: this.IDCount++, // Use IDCount and increment it
                points: this.state.points.map(point => ({ x: point.x, y: point.y })),
                timestamp: Date.now()
            };

            // Add to data array
            this.unpreferredZones.push(unpreferredZoneData);

            // Create and add visual mesh
            this.displayUnpreferredZoneAsPolygon(unpreferredZoneData);
        }

        console.log('Unpreferred zone applied to map:', unpreferredZoneData);

        // Clear state and return to create mode
        this.clearCurrentState();
        this._allowExitEdit = true;
        this.setMode('create');
        this._allowExitEdit = false;
        this.disable();
        console.log('Unpreferred zone applied successfully');
    }

    updateScenePolygon(unpreferredZoneData) {
        if (!this.unpreferredZones) return;

        // Find the index of the unpreferred zone in the data array
        const polygonIndex = this.unpreferredZones.findIndex(zone => zone.id === unpreferredZoneData.id);

        if (polygonIndex !== -1) {
            // Remove old visual mesh
            if (this.unpreferredZoneMeshes[polygonIndex]) {
                this.scene.remove(this.unpreferredZoneMeshes[polygonIndex]);
                this.unpreferredZoneMeshes[polygonIndex].geometry.dispose();
                this.unpreferredZoneMeshes[polygonIndex].material.dispose();
            }

            // Create new visual mesh
            const newPolygon = this.createUnpreferredZonePolygonFromData(unpreferredZoneData);
            this.unpreferredZoneMeshes[polygonIndex] = newPolygon;

            console.log('Updated scene polygon for unpreferred zone:', unpreferredZoneData.id);
        }
    }

    // ===== UTILITY METHODS =====
    getWorldPosition(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        return intersection;
    }

    displayUnpreferredZoneAsPolygon(unpreferredZoneData) {
        if (!unpreferredZoneData || !unpreferredZoneData.points || unpreferredZoneData.points.length < 3) {
            console.warn('Invalid unpreferred zone data for display');
            return;
        }

            const polygon = this.createUnpreferredZonePolygonFromData(unpreferredZoneData);

        // Add to visual meshes array (not data array)
        if (this.unpreferredZoneMeshes) {
            this.unpreferredZoneMeshes.push(polygon);
        }

        console.log('Unpreferred zone displayed as polygon:', unpreferredZoneData.id);
    }

    createUnpreferredZonePolygonFromData(unpreferredZoneData) {
        if (!unpreferredZoneData || !unpreferredZoneData.points || unpreferredZoneData.points.length < 3) {
            return null;
        }

        // Create polygon geometry
        const shape = new THREE.Shape();

        // Start with first point
        shape.moveTo(unpreferredZoneData.points[0].x, unpreferredZoneData.points[0].y);

        // Add lines to subsequent points
        for (let i = 1; i < unpreferredZoneData.points.length; i++) {
            shape.lineTo(unpreferredZoneData.points[i].x, unpreferredZoneData.points[i].y);
        }

        // Close the shape
        shape.lineTo(unpreferredZoneData.points[0].x, unpreferredZoneData.points[0].y);

        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: this.state.polygonColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });

        const polygon = new THREE.Mesh(geometry, material);
        polygon.position.z = 0.05;
        polygon.userData = { unpreferredZoneId: unpreferredZoneData.id };

        this.scene.add(polygon);

        return polygon;
    }

    clearCurrentState() {
        // Clear nodes (use appropriate array based on mode)
        const nodes = this.state.mode === 'edit' ? this.state.editingNodes : this.state.nodes;
        nodes.forEach(node => {
            this.scene.remove(node.outerCircle);
            this.scene.remove(node.innerCircle);
            node.outerCircle.geometry.dispose();
            node.outerCircle.material.dispose();
            node.innerCircle.geometry.dispose();
            node.innerCircle.material.dispose();
        });

        // Clear polygon
        if (this.state.polygon) {
            this.scene.remove(this.state.polygon);
            this.state.polygon.geometry.dispose();
            this.state.polygon.material.dispose();
        }

        // Reset state (preserve editing state if in edit mode)
        if (this.state.mode !== 'edit') {
            this.state.nodes = [];
            this.state.points = [];
            this.state.editingNodes = [];
            this.state.editingPolygonId = null;
        }

        this.state.polygon = null;
        this.state.selectedNode = null;
        this.state.selectedPolygon = null;
        this.state.selectedPolygonId = null;
    }

    enableDrawing() {
        this.state.isDrawingEnabled = true;
        this.renderer.domElement.style.cursor = 'crosshair';
    }

    disableDrawing() {
        this.state.isDrawingEnabled = false;
        this.renderer.domElement.style.cursor = 'default';
    }

    isDrawingEnabled() {
        return this.state.isDrawingEnabled;
    }

    // ===== PUBLIC METHODS =====
    enableSelectMode() {
        this.setMode('select');
    }

    disableSelectMode() {
        this.setMode('create');
    }

    // Alias for clearCurrentState
    clear() {
        this.clearCurrentState();
    }

    // Alias for resetSelectedNode (for compatibility)
    stopErase() {
        this.resetSelectedNode();
    }

    deleteSelectedPolygon() {
        if (!this.state.selectedPolygonId) {
            console.warn('No polygon selected for deletion');
            return;
        }

        // Find the index in the data array
        const zoneIndex = this.unpreferredZones.findIndex(zone => zone.id === this.state.selectedPolygonId);

        if (zoneIndex !== -1) {
            // Remove from data array
            this.unpreferredZones.splice(zoneIndex, 1);

            // Remove corresponding visual mesh
            if (this.unpreferredZoneMeshes[zoneIndex]) {
                this.scene.remove(this.unpreferredZoneMeshes[zoneIndex]);
                this.unpreferredZoneMeshes[zoneIndex].geometry.dispose();
                this.unpreferredZoneMeshes[zoneIndex].material.dispose();
                this.unpreferredZoneMeshes.splice(zoneIndex, 1);
            }

            console.log('Selected polygon deleted:', this.state.selectedPolygonId);
        } else {
            console.warn('Selected polygon not found in data array');
        }

        // Clear selection state
        this.clearSelectedPolygon();
    }

    getAllunpreferredZones() {
            return this.unpreferredZones;
    }

    // Get current ID count for external access
    getCurrentIDCount() {
        return this.IDCount;
    }

    // Set ID count (useful when loading from database)
    setIDCount(count) {
        this.IDCount = count;
        console.log('IDCount set to:', this.IDCount);
    }

    enable() {
        this.isEnabled = true;
    }
    disable() {
        this.isEnabled = false;
    }

    clearAllunpreferredZones() {
        // Clear visual meshes
        if (this.unpreferredZoneMeshes) {
            this.unpreferredZoneMeshes.forEach(polygon => {
                if (polygon && polygon.geometry) {
                    this.scene.remove(polygon);
                    polygon.geometry.dispose();
                    polygon.material.dispose();
                }
            });
            this.unpreferredZoneMeshes = [];
        }

        // Clear data array
        this.unpreferredZones = [];

        console.log('All unpreferred zones cleared');
    }

    dispose() {
        // Remove keyboard event listener
        document.removeEventListener('keydown', this.handleKeyDown);

        // Clear all unpreferred zones
        this.clearAllunpreferredZones();

        // Clear current state
        this.clearCurrentState(); 

        console.log('DrawUnpreferredZone disposed');
    }

    // ===== LOAD UNPREFERRED ZONES FROM SERVER =====
    loadUnpreferredZonesFromServerData(serverData) {
        if (!serverData || !Array.isArray(serverData)) {
            console.warn('Invalid server data for unpreferred zones');
            return;
        }

        this.clearAllunpreferredZones();

        let maxId = 0; // Track the maximum ID from server data

        serverData.forEach(item => {
            try {
                const jsonObject = JSON.parse(item.Properties);
                const unpreferredZonePoints = [];

                for (let i = 0; i < jsonObject.Points.length; i += 2) {
                    const x = parseFloat(jsonObject.Points[i]);
                    const y = parseFloat(jsonObject.Points[i + 1]);
                    unpreferredZonePoints.push({ x, y });
                }

                const unpreferredZoneData = {
                    id: item.ID,
                    points: unpreferredZonePoints,
                    timestamp: Date.now()
                };

                // Track the maximum ID
                const itemId = parseInt(item.ID);
                if (!isNaN(itemId) && itemId > maxId) {
                    maxId = itemId;
                }

                // Add to data array
                this.unpreferredZones.push(unpreferredZoneData);

                // Create and add visual mesh
                this.displayUnpreferredZoneAsPolygon(unpreferredZoneData);

                console.log('Loaded unpreferred zone from server:', item.ID);
            } catch (error) {
                console.error('Error parsing unpreferred zone data:', error);
            }
        });

        // Update IDCount to be one more than the maximum ID from server
        this.IDCount = maxId + 1;
        console.log(`Loaded ${this.unpreferredZones.length} unpreferred zones from server. Next ID will be: ${this.IDCount}`);
    }

    // Method to remove unpreferred zone by ID
    removeUnpreferredZoneById(id) {
        const dataIndex = this.unpreferredZones.findIndex(zone => zone.id === id);
        if (dataIndex !== -1) {
            // Remove from data array
            this.unpreferredZones.splice(dataIndex, 1);

            // Remove corresponding visual mesh
            if (this.unpreferredZoneMeshes[dataIndex]) {
                this.scene.remove(this.unpreferredZoneMeshes[dataIndex]);
                this.unpreferredZoneMeshes[dataIndex].geometry.dispose();
                this.unpreferredZoneMeshes[dataIndex].material.dispose();
                this.unpreferredZoneMeshes.splice(dataIndex, 1);
            }

                console.log('Unpreferred zone removed:', id);
        } else {
            console.warn('Unpreferred zone not found for removal:', id);
        }
    }

    // Method to apply existing unpreferred zone to map (for compatibility)
    applyUnpreferredZoneToMapById(id) {
        const unpreferredZoneData = this.unpreferredZones.find(zone => zone.id === id);
        if (unpreferredZoneData) {
            this.displayUnpreferredZoneAsPolygon(unpreferredZoneData);
            console.log('Applied unpreferred zone to map:', id);
        }
    }

    // Method to apply unpreferred zones to map (plural version for compatibility)
    applyUnpreferredZonesToMap(id) {
        if (id) {
            this.applyUnpreferredZoneToMapById(id);
        } else {
            // Apply all unpreferred zones
            this.unpreferredZones.forEach(zone => {
                if (zone.points) { // Only apply data objects, not visual meshes
                    this.displayUnpreferredZoneAsPolygon(zone);
                }
            });
        }
    }

    // Method to select unpreferred zones to map (for compatibility)
    SelectUnpreferredZonesToMapExist(id) {
            const unpreferredZoneData = this.unpreferredZones.find(zone => zone.id === id);
        if (unpreferredZoneData) {
            this.displayUnpreferredZoneAsPolygon(unpreferredZoneData);
            console.log('Selected unpreferred zone to map:', id);
        }
    }

    // Find if click is near a polygon edge for node insertion
    findEdgeForNodeInsertion(worldPoint) {
        if (this.state.points.length < 3) return null;

        const edgeThreshold = 0.15; // Distance threshold for edge detection

        for (let i = 0; i < this.state.points.length; i++) {
            const currentPoint = this.state.points[i];
            const nextPoint = this.state.points[(i + 1) % this.state.points.length];

            // Calculate distance from click point to line segment
            const distance = this.distanceToLineSegment(worldPoint, currentPoint, nextPoint);

            if (distance <= edgeThreshold) {
                return { index: i + 1 }; // Insert after current point
            }
        }

        return null;
    }

    // Calculate distance from point to line segment
    distanceToLineSegment(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            // Line segment is actually a point
            return Math.sqrt(A * A + B * B);
        }

        let param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Insert a new node on a polygon edge
    insertNodeOnEdge(worldPoint, insertIndex) {
        // Create new node
        const newNode = this.createNode(worldPoint);

        // Insert node at the specified index
        this.state.editingNodes.splice(insertIndex, 0, newNode);
        this.state.points.splice(insertIndex, 0, worldPoint);

        // Update polygon
        this.updatePolygonFromPoints(this.state.points);

        console.log(`New node inserted at index ${insertIndex}. Total nodes: ${this.state.editingNodes.length}`);
    }

    // Delete selected node in edit mode
    deleteSelectedNode() {
        if (!this.state.selectedNode || this.state.mode !== 'edit') return;

        const { index } = this.state.selectedNode;

        // Don't delete if we only have 3 nodes (minimum for a polygon)
        if (this.state.editingNodes.length <= 3) {
            console.warn('Cannot delete node - minimum 3 nodes required for polygon');
            return;
        }

        // Remove node from arrays
        const removedNode = this.state.editingNodes.splice(index, 1)[0];
        this.state.points.splice(index, 1)[0];

        // Remove from scene
        this.scene.remove(removedNode.outerCircle);
        this.scene.remove(removedNode.innerCircle);
        removedNode.outerCircle.geometry.dispose();
        removedNode.outerCircle.material.dispose();
        removedNode.innerCircle.geometry.dispose();
        removedNode.innerCircle.material.dispose();

        // Update polygon
        this.updatePolygonFromPoints(this.state.points);

        // Reset selection
        this.state.selectedNode = null;
        this.renderer.domElement.style.cursor = 'crosshair';

        console.log(`Node deleted at index ${index}. Remaining nodes: ${this.state.editingNodes.length}`);
    }

    // Keyboard event handling
    handleKeyDown(event) {
        if (this.state.mode === 'edit' && event.key === 'Delete') {
            event.preventDefault();
            this.deleteSelectedNode();
        }
    }

    // Load unpreferred zones from database
    async loadUnpreferredZonesFromDatabase() {
        try {
            // Clear existing unpreferred zones FIRST before any API call
            this.clearAllunpreferredZones();

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found for loading unpreferred zones from database');
                return;
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                console.error('No mapId found for loading unpreferred zones from database');
                return;
            }

                const response = await fetch(`${SERVER_URL}/api/maps/loadunpreferredZones/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data && data.data && data.data.mapUnpreferred) {
                // Use existing method to load unpreferred zones
                this.loadUnpreferredZonesFromServerData(data.data.mapUnpreferred);
                console.log(`Loaded ${data.data.mapUnpreferred.length} unpreferred zones from database`);
            } else {
                console.log('No unpreferred zones found in database');
            }
        } catch (error) {
            console.error('Error loading unpreferred zones from database:', error);
        }
    }

    // Save unpreferred zones to database
    async saveToDatabase() {
        try {
            console.log('DrawUnpreferredZone: Starting save to database...');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const mapId = this.map2D.mapId;
            if (!mapId) {
                throw new Error('No mapId found for saving unpreferred zones');
            }

            // Get all unpreferred zones from the tool
            const unpreferredZones = this.getAllunpreferredZones();
            console.log('DrawUnpreferredZone: Saving unpreferred zones:', unpreferredZones);

            // Get existing unpreferred zones from server for comparison
            const existingResponse = await fetch(`${SERVER_URL}/api/maps/loadunpreferredZones/${mapId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const existingData = await existingResponse.json();
            const existingunpreferredZones = existingData?.data?.mapUnpreferred || [];

            // Step 1: Delete unpreferred zones from server that don't exist in current map
            const deletePromises = existingunpreferredZones.map(async (serverZone) => {
                const existsInMap = unpreferredZones.find(mapZone => mapZone.id === serverZone.ID);
                if (!existsInMap) {
                    console.log('DrawUnpreferredZone: Deleting unpreferred zone from server:', serverZone.ID);
                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/deleteUnpreferredZone/${serverZone.ID}`, {
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
                        console.log('DrawUnpreferredZone: Delete unpreferred zone response:', result);
                    } catch (error) {
                        console.error(`Error deleting unpreferred zone ${serverZone.ID}:`, error);
                    }
                }
            });
            await Promise.all(deletePromises);

            // Step 2: Update existing unpreferred zones in server
            const updatePromises = unpreferredZones.map(async (mapZone) => {
                const existsInServer = existingunpreferredZones.find(serverZone => serverZone.ID === mapZone.id);
                if (existsInServer) {
                    console.log('DrawUnpreferredZone: Updating unpreferred zone in server:', mapZone.id);
                    const properties = {
                        Points: mapZone.points.flatMap(point => [point.x.toString(), point.y.toString()])
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/updateUnpreferredZone/${mapZone.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                unpreferredZoneName: mapZone.name || `UnpreferredZone-${mapZone.id}`,
                                properties: JSON.stringify(properties)
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawUnpreferredZone: Update unpreferred zone response:', result);
                    } catch (error) {
                        console.error(`Error updating unpreferred zone ${mapZone.id}:`, error);
                    }
                }
            });
            await Promise.all(updatePromises);

            // Step 3: Insert new unpreferred zones to server
            const insertPromises = unpreferredZones.map(async (mapZone) => {
                const existsInServer = existingunpreferredZones.find(serverZone => serverZone.ID === mapZone.id);
                if (!existsInServer) {
                    console.log('DrawUnpreferredZone: Inserting new unpreferred zone to server:', mapZone.id);
                    const properties = {
                        Points: mapZone.points.flatMap(point => [point.x.toString(), point.y.toString()])
                    };

                    try {
                        const response = await fetch(`${SERVER_URL}/api/maps/addUnpreferredZone`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                mapId: mapId,
                                unpreferredZoneName: mapZone.name || `UnpreferredZone-${mapZone.id}`,
                                properties: JSON.stringify(properties)
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('DrawUnpreferredZone: Insert unpreferred zone response:', result);

                        // Update unpreferred zone ID directly in this class if server returns new ID
                        if (result && result.unpreferredZoneId) {
                                const newServerId = result.unpreferredZoneId;
                            // Find and update the unpreferred zone ID in our unpreferredZones array
                            const unpreferredZoneIndex = this.unpreferredZones.findIndex(fz => fz.id === mapZone.id);
                            if (unpreferredZoneIndex !== -1) {
                                this.unpreferredZones[unpreferredZoneIndex].id = newServerId;
                                console.log(`DrawUnpreferredZone: Updated unpreferred zone ID from ${mapZone.id} to ${newServerId}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Error inserting unpreferred zone ${mapZone.id}:`, error);
                    }
                }
            });
            await Promise.all(insertPromises);

            console.log('DrawUnpreferredZone: All unpreferred zones saved successfully');

        } catch (error) {
            console.error('DrawUnpreferredZone: Error saving to database:', error);
            throw error;
        }
    }
}

export { DrawUnpreferredZone };    