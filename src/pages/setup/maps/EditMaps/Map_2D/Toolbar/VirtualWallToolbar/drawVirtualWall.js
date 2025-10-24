import * as THREE from 'three';
import { SERVER_URL } from '../../../../../../../config/serverConfig.js';

class DrawVirtualWall {
  constructor(scene, camera, renderer, mapMesh, mapInfo, map2D) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.mapMesh = mapMesh;
    this.mapInfo = mapInfo;
    this.map2D = map2D;

    // State management
    this.state = {
      mode: "create", // 'create', 'select', 'edit'

      // Drawing state (for create mode)
      nodes: [],
      points: [],
      line: null,
      selectedNode: null,

      // Select state (for select mode)
      selectedLine: null,
      selectedLineId: null,

      // Edit state (for edit mode)
      editingLineId: null,
      editingNodes: [],
      editingLine: null,

      // Common properties
      nodeRadius: 0.12,
      nodeColors: {
        outer: { normal: 0x000000, selected: 0xff0000 },
        inner: { normal: 0x87f542, selected: 0xff69b4 },
      },
      wallWidth: 4,
      isDrawingEnabled: true,
      name: "",
    };

    // Store all virtual walls
    this.virtualWalls = [];

    // Initialize virtual wall lines array
    if (this.map2D && !this.map2D.virtualWallLines) {
      this.map2D.virtualWallLines = [];
    }

    // Initialize mapBackup for compatibility
    this.mapBackup = null;
    this.IDCount = 0;

    this.renderer.domElement.style.cursor = "crosshair";
    this.isEnabled = false;
  }

  // ===== MODE MANAGEMENT =====
  setMode(mode) {
    console.log("=== SETTING MODE ===");
    console.log("Setting mode to:", mode);
    console.log(
      "Current editingLineId before setMode:",
      this.state.editingLineId
    );
    // Prevent accidental exit from edit mode
    if (
      this.state.mode === "edit" &&
      mode === "create" &&
      !this._allowExitEdit
    ) {
      console.warn("Prevented accidental exit from edit mode");
      return;
    }
    // Clear current state only when switching to create or select mode
    if (mode !== "edit") {
      console.log("Clearing current state (not edit mode)");
      this.clearCurrentState();
    } else {
      console.log("Preserving state (edit mode)");
    }
    this.state.mode = mode;
    switch (mode) {
      case "create":
        this.enableDrawing();
        this.renderer.domElement.style.cursor = "crosshair";
        break;
      case "select":
        this.disableDrawing();
        this.renderer.domElement.style.cursor = "pointer";
        break;
      case "edit":
        this.disableDrawing();
        this.renderer.domElement.style.cursor = "crosshair";
        break;
    }
    console.log("Mode set to:", this.state.mode);
    console.log("EditingLineId after setMode:", this.state.editingLineId);
  }

  getMode() {
    return this.state.mode;
  }
  isCreateMode() {
    return this.state.mode === "create";
  }
  isSelectMode() {
    return this.state.mode === "select";
  }
  isEditMode() {
    return this.state.mode === "edit";
  }

  // ===== CLICK HANDLERS =====
  mouseEventHandle(clientX, clientY) {
    console.log("mouseEventHandle called", this.isEnabled);
    if (!this.isEnabled) return;

    const worldPoint = this.getWorldPosition(clientX, clientY);
    if (!worldPoint) return;

    switch (this.state.mode) {
      case "create":
        this.handleCreateClick(worldPoint);
        break;
      case "select":
        this.handleSelectClick(worldPoint);
        break;
      case "edit":
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

    // Create line if we have 2 points
    if (this.state.points.length === 2) {
      this.createVirtualWallLine();
    }
  }

  handleSelectClick(worldPoint) {
    // Check if clicked on any virtual wall line
    const clickedLine = this.findClickedLine(worldPoint);
    if (clickedLine) {
      this.selectLine(clickedLine);
    } else {
      this.clearSelectedLine();
    }
  }

  handleEditClick(worldPoint) {
    // Only allow clicking on editing nodes
    const clickedNode = this.findClickedNode(worldPoint);
    if (clickedNode) {
      this.selectNode(clickedNode);
    }
  }

  // ===== NODE MANAGEMENT =====
  createNode(position) {
    const outerCircle = new THREE.Mesh(
      new THREE.CircleGeometry(this.state.nodeRadius, 32),
      new THREE.MeshBasicMaterial({
        color: this.state.nodeColors.outer.normal,
        side: THREE.DoubleSide,
      })
    );
    outerCircle.position.set(position.x, position.y, 0.1);

    const innerCircle = new THREE.Mesh(
      new THREE.CircleGeometry(this.state.nodeRadius - 0.02, 32),
      new THREE.MeshBasicMaterial({
        color: this.state.nodeColors.inner.normal,
        side: THREE.DoubleSide,
      })
    );
    innerCircle.position.set(position.x, position.y, 0.11);

    this.scene.add(outerCircle);
    this.scene.add(innerCircle);

    return { outerCircle, innerCircle };
  }

  findClickedNode(worldPoint) {
    // Use editingNodes in edit mode, otherwise use nodes
    const nodes =
      this.state.mode === "edit" ? this.state.editingNodes : this.state.nodes;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodePos = node.outerCircle.position;

      const distance = Math.sqrt(
        Math.pow(worldPoint.x - nodePos.x, 2) +
          Math.pow(worldPoint.y - nodePos.y, 2)
      );

      if (distance <= this.state.nodeRadius) {
        return { index: i, node: node };
      }
    }
    return null;
  }

  selectNode(nodeInfo) {
    this.state.selectedNode = nodeInfo;

    nodeInfo.node.outerCircle.material.color.setHex(
      this.state.nodeColors.outer.selected
    );
    nodeInfo.node.innerCircle.material.color.setHex(
      this.state.nodeColors.inner.selected
    );

    this.renderer.domElement.style.cursor = "move";
  }

  resetSelectedNode() {
    if (this.state.selectedNode) {
      this.state.selectedNode.node.outerCircle.material.color.setHex(
        this.state.nodeColors.outer.normal
      );
      this.state.selectedNode.node.innerCircle.material.color.setHex(
        this.state.nodeColors.inner.normal
      );
      this.state.selectedNode = null;
    }

    if (this.state.isDrawingEnabled) {
      this.renderer.domElement.style.cursor = "crosshair";
    } else {
      this.renderer.domElement.style.cursor = "default";
    }
  }

  // Alias for compatibility
  resetCursor() {
    this.resetSelectedNode();
  }

  updateNodePosition(clientX, clientY) {
    if (!this.state.selectedNode) return;

    const worldPoint = this.getWorldPosition(clientX, clientY);
    if (!worldPoint) return;

    this.renderer.domElement.style.cursor = "move";

    const { node, index } = this.state.selectedNode;

    // Update node position
    node.outerCircle.position.set(worldPoint.x, worldPoint.y, 0.1);
    node.innerCircle.position.set(worldPoint.x, worldPoint.y, 0.11);

    // Update points array (always use this.state.points)
    this.state.points[index] = worldPoint;

    // Update line
    this.updateLineFromPoints(this.state.points);
  }

  // ===== LINE MANAGEMENT =====
  createVirtualWallLine() {
    if (this.state.points.length !== 2) return;
    this.updateLineFromPoints(this.state.points);
    this.state.name = "VirtualWall-" + this.IDCount++;
  }

  updateLineFromPoints(points) {
    if (points.length !== 2) return;

    const startPoint = points[0];
    const endPoint = points[1];

    // Calculate direction and perpendicular vectors
    const direction = new THREE.Vector2(
      endPoint.x - startPoint.x,
      endPoint.y - startPoint.y
    ).normalize();

    const perpendicular = new THREE.Vector2(-direction.y, direction.x);
    const halfWidth = this.state.wallWidth * 0.005;

    // Create rectangle vertices
    const vertices = [
      new THREE.Vector3(
        startPoint.x + perpendicular.x * halfWidth,
        startPoint.y + perpendicular.y * halfWidth,
        0.1
      ),
      new THREE.Vector3(
        endPoint.x + perpendicular.x * halfWidth,
        endPoint.y + perpendicular.y * halfWidth,
        0.1
      ),
      new THREE.Vector3(
        endPoint.x - perpendicular.x * halfWidth,
        endPoint.y - perpendicular.y * halfWidth,
        0.1
      ),
      new THREE.Vector3(
        startPoint.x - perpendicular.x * halfWidth,
        startPoint.y - perpendicular.y * halfWidth,
        0.1
      ),
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vertices);
    geometry.setIndex([0, 1, 2, 0, 2, 3]);

    const material = new THREE.MeshBasicMaterial({
      color: 0xd94c61,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Remove old line if exists
    if (this.state.line) {
      this.scene.remove(this.state.line);
      this.state.line.geometry.dispose();
      this.state.line.material.dispose();
    }

    const virtualWall = new THREE.Mesh(geometry, material);
    this.scene.add(virtualWall);
    this.state.line = virtualWall;
  }

  // ===== SELECT MODE =====
  findClickedLine(worldPoint) {
    if (!this.map2D || !this.map2D.virtualWallLines) return null;

    console.log("findClickedLine called", this.map2D.virtualWallLines.length);
    const clickRadius = 0.1;

    for (let i = 0; i < this.map2D.virtualWallLines.length; i++) {
      const line = this.map2D.virtualWallLines[i];
      const positions = line.geometry.attributes.position;
      if (!positions) continue;

      // Check if click is near any point of the line
      for (let j = 0; j < positions.count; j++) {
        const pointX = positions.getX(j);
        const pointY = positions.getY(j);

        const distance = Math.sqrt(
          Math.pow(worldPoint.x - pointX, 2) +
            Math.pow(worldPoint.y - pointY, 2)
        );

        if (distance <= clickRadius) {
          return {
            line: line,
            index: i,
            virtualWallData: this.virtualWalls[i],
          };
        }
      }
    }
    return null;
  }

  selectLine(lineInfo) {
    this.clearSelectedLine();

    this.state.selectedLine = lineInfo.line;
    this.state.selectedLineId = lineInfo.virtualWallData.id;

    // Highlight the selected line
    lineInfo.line.material.color.setHex(0x00ff00);

    console.log("Virtual wall line selected:", lineInfo.virtualWallData.id);

    // Show edit actions
    if (this.map2D && this.map2D.virtualWallToolbar) {
      this.map2D.virtualWallToolbar.showEditActions(
        lineInfo.virtualWallData.id
      );
    }
  }

  clearSelectedLine() {
    if (this.state.selectedLine) {
      this.state.selectedLine.material.color.setHex(0xff0000);
      this.state.selectedLine = null;
    }

    this.state.selectedLineId = null;

    // Hide edit actions
    if (this.map2D && this.map2D.virtualWallToolbar) {
      this.map2D.virtualWallToolbar.hideEditActions();
    }
  }

  // ===== EDIT MODE =====
  editSelectedLine() {
    if (!this.state.selectedLineId) return;

    console.log("=== ENTERING EDIT MODE ===");
    console.log("Selected line ID:", this.state.selectedLineId);

    const virtualWallData = this.virtualWalls.find(
      (wall) => wall.id === this.state.selectedLineId
    );
    if (!virtualWallData) {
      console.error("Virtual wall data not found");
      return;
    }

    console.log("Found virtual wall data:", virtualWallData);

    // Store editing state
    this.state.editingLineId = this.state.selectedLineId;
    console.log("Set editingLineId to:", this.state.editingLineId);

    this.state.points = virtualWallData.points.map(
      (point) => new THREE.Vector3(point.x, point.y, 0)
    );
    console.log("Set points for editing:", this.state.points);

    // Create editing nodes
    this.state.editingNodes = [];
    this.state.points.forEach((point) => {
      const node = this.createNode(point);
      this.state.editingNodes.push(node);
    });
    console.log("Created editing nodes:", this.state.editingNodes.length);

    // Create editing line
    this.createVirtualWallLine();

    // Switch to edit mode
    this.setMode("edit");

    console.log("Edit mode ready");
    console.log("Final editingLineId:", this.state.editingLineId);
    console.log("Final mode:", this.state.mode);
  }

  // ===== APPLY/CANCEL =====
  applyVirtualWallToMap() {
    console.log("=== APPLY VIRTUAL WALL ===");
    console.log("Current mode:", this.state.mode);
    console.log("Mode type:", typeof this.state.mode);
    console.log('Mode === "edit":', this.state.mode === "edit");
    console.log("Editing line ID:", this.state.editingLineId);
    console.log("Editing line ID type:", typeof this.state.editingLineId);
    console.log("Editing line ID truthy:", !!this.state.editingLineId);
    console.log("Selected line ID:", this.state.selectedLineId);
    console.log("Points:", this.state.points);
    console.log("Points length:", this.state.points.length);

    if (this.state.points.length !== 2) {
      console.warn("Not enough points");
      return;
    }

    let virtualWallData;
    const shouldUpdate = this.state.mode === "edit" && this.state.editingLineId;
    console.log("Should update existing wall:", shouldUpdate);

    if (shouldUpdate) {
      // Update existing virtual wall
      console.log("Updating existing virtual wall:", this.state.editingLineId);
      virtualWallData = {
        id: this.state.editingLineId,
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };
      // Update in local array
      const existingIndex = this.virtualWalls.findIndex(
        (wall) => wall.id === this.state.editingLineId
      );
      if (existingIndex !== -1) {
        this.virtualWalls[existingIndex] = virtualWallData;
        console.log("Updated in virtualWalls array at index:", existingIndex);
      }
      // Update in scene
      this.updateSceneLine(virtualWallData);
    } else {
      // Create new virtual wall
      console.log(
        "Creating new virtual wall (not in edit mode or no editingLineId)"
      );
      console.log("Mode:", this.state.mode);
      console.log("EditingLineId:", this.state.editingLineId);
      virtualWallData = {
        id: Date.now(),
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };
      this.virtualWalls.push(virtualWallData);
      this.displayVirtualWallAsLine(virtualWallData);
    }
    // Clear state and return to create mode
    this.clearCurrentState();
    this._allowExitEdit = true;
    this.setMode("create");
    this._allowExitEdit = false;
    this.disable();
    console.log("Virtual wall applied successfully");
  }

  updateSceneLine(virtualWallData) {
    if (!this.map2D || !this.map2D.virtualWallLines) return;

    // Find the line in scene
    let lineIndex = -1;
    for (let i = 0; i < this.map2D.virtualWallLines.length; i++) {
      const line = this.map2D.virtualWallLines[i];
      if (line.userData && line.userData.virtualWallId === virtualWallData.id) {
        lineIndex = i;
        break;
      }
    }

    if (lineIndex !== -1) {
      // Remove old line
      this.scene.remove(this.map2D.virtualWallLines[lineIndex]);
      this.map2D.virtualWallLines[lineIndex].geometry.dispose();
      this.map2D.virtualWallLines[lineIndex].material.dispose();

      // Create new line
      const newLine = this.createVirtualWallLineFromData(virtualWallData);
      this.map2D.virtualWallLines[lineIndex] = newLine;

      console.log("Scene line updated");
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

  displayVirtualWallAsLine(virtualWallData) {
    if (
      !virtualWallData ||
      !virtualWallData.points ||
      virtualWallData.points.length < 2
    ) {
      console.warn("Invalid virtual wall data");
      return;
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
    });

    const points = virtualWallData.points.map(
      (point) => new THREE.Vector3(point.x, point.y, 0.1)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);

    line.userData = { virtualWallId: virtualWallData.id };

    this.scene.add(line);

    if (this.map2D && this.map2D.virtualWallLines) {
      this.map2D.virtualWallLines.push(line);
    }

    console.log("Virtual wall displayed as line:", virtualWallData.id);
  }

  createVirtualWallLineFromData(virtualWallData) {
    if (
      !virtualWallData ||
      !virtualWallData.points ||
      virtualWallData.points.length < 2
    ) {
      return null;
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
    });

    const points = virtualWallData.points.map(
      (point) => new THREE.Vector3(point.x, point.y, 0.1)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);

    line.userData = { virtualWallId: virtualWallData.id };

    this.scene.add(line);

    return line;
  }

  clearCurrentState() {
    // Clear nodes (use appropriate array based on mode)
    const nodes =
      this.state.mode === "edit" ? this.state.editingNodes : this.state.nodes;
    nodes.forEach((node) => {
      this.scene.remove(node.outerCircle);
      this.scene.remove(node.innerCircle);
      node.outerCircle.geometry.dispose();
      node.outerCircle.material.dispose();
      node.innerCircle.geometry.dispose();
      node.innerCircle.material.dispose();
    });

    // Clear line
    if (this.state.line) {
      this.scene.remove(this.state.line);
      this.state.line.geometry.dispose();
      this.state.line.material.dispose();
    }

    // Reset state (preserve editing state if in edit mode)
    if (this.state.mode !== "edit") {
      this.state.nodes = [];
      this.state.points = [];
      this.state.editingNodes = [];
      this.state.editingLineId = null;
    }

    this.state.line = null;
    this.state.selectedNode = null;
    this.state.selectedLine = null;
    this.state.selectedLineId = null;
  }

  enableDrawing() {
    this.state.isDrawingEnabled = true;
    this.renderer.domElement.style.cursor = "crosshair";
  }

  disableDrawing() {
    this.state.isDrawingEnabled = false;
    this.renderer.domElement.style.cursor = "default";
  }

  isDrawingEnabled() {
    return this.state.isDrawingEnabled;
  }

  setLineWidth(width) {
    this.state.wallWidth = width;
  }

  // ===== PUBLIC METHODS =====
  enableSelectMode() {
    this.setMode("select");
  }

  disableSelectMode() {
    this.setMode("create");
  }

  // Alias for clearCurrentState
  clear() {
    this.clearCurrentState();
  }

  // Alias for resetSelectedNode (for compatibility)
  stopErase() {
    this.resetSelectedNode();
  }

  deleteSelectedLine() {
    if (!this.state.selectedLineId) return;

    // Remove from arrays
    const wallIndex = this.virtualWalls.findIndex(
      (wall) => wall.id === this.state.selectedLineId
    );
    if (wallIndex !== -1) {
      this.virtualWalls.splice(wallIndex, 1);
    }

    // Remove from scene
    if (this.map2D && this.map2D.virtualWallLines) {
      let lineIndex = -1;
      for (let i = 0; i < this.map2D.virtualWallLines.length; i++) {
        const line = this.map2D.virtualWallLines[i];
        if (
          line.userData &&
          line.userData.virtualWallId === this.state.selectedLineId
        ) {
          lineIndex = i;
          break;
        }
      }

      if (lineIndex !== -1) {
        this.scene.remove(this.map2D.virtualWallLines[lineIndex]);
        this.map2D.virtualWallLines[lineIndex].geometry.dispose();
        this.map2D.virtualWallLines[lineIndex].material.dispose();
        this.map2D.virtualWallLines.splice(lineIndex, 1);
      }
    }

    this.clearSelectedLine();
    console.log("Virtual wall deleted:", this.state.selectedLineId);
  }

  getAllVirtualWalls() {
    return this.virtualWalls;
  }
  enable() {
    this.isEnabled = true;
  }
  disable() {
    this.isEnabled = false;
  }

  clearAllVirtualWalls() {
    if (this.map2D && this.map2D.virtualWallLines) {
      this.map2D.virtualWallLines.forEach((line) => {
        this.scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
      this.map2D.virtualWallLines = [];
    }

    this.virtualWalls = [];
    console.log("All virtual walls cleared");
  }

  dispose() {
    this.clearCurrentState();
  }

  // ===== LOAD VIRTUAL WALLS FROM SERVER =====
  loadVirtualWallsFromServerData(serverData) {
    // clear all virtual walls first
    this.clearAllVirtualWalls();
    if (!serverData || serverData.length === 0) {
      console.log("No virtual wall data to load");
      return;
    }
    let idCount = 0;

    serverData.forEach((item) => {
      const jsonObject = JSON.parse(item.Properties);
      const virtualWallData = {
        id: item.ID,
        name: item.VirtualWallName || `VirtualWall-${item.ID}`,
        points: [],
        timestamp: Date.now(),
      };

      // Update max value of idCount
      idCount = Math.max(idCount, item.ID);

      // Parse points from Properties
      if (jsonObject.Points && jsonObject.Points.length >= 4) {
        for (let i = 0; i < jsonObject.Points.length; i += 2) {
          virtualWallData.points.push({
            x: parseFloat(jsonObject.Points[i]),
            y: parseFloat(jsonObject.Points[i + 1]),
          });
        }
      }

      console.log("Virtual wall data:", virtualWallData);

      // Add to virtualWalls array
      this.virtualWalls.push(virtualWallData);

      // Display the virtual wall as line
      this.displayVirtualWallAsLine(virtualWallData);
    });

    // Update IDCount for new virtual walls
    this.IDCount = idCount + 1;

    console.log(
      `Loaded ${serverData.length} virtual walls, IDCount set to ${this.IDCount}`
    );
  }

  // Load virtual walls from database
  async loadVirtualWallsFromDatabase() {
    try {
      // Clear existing virtual walls FIRST before any API call
      this.clearAllVirtualWalls();

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for loading virtual walls from database");
        return;
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        console.error("No mapId found for loading virtual walls from database");
        return;
      }

      const response = await fetch(
        `${SERVER_URL}/api/maps/getVirtualWalls/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.data && data.data.mapVirtualWall) {
        // Use existing method to load virtual walls
        this.loadVirtualWallsFromServerData(data.data.mapVirtualWall);
        console.log(
          `Loaded ${data.data.mapVirtualWall.length} virtual walls from database`
        );
      } else {
        console.log("No virtual walls found in database");
      }
    } catch (error) {
      console.error("Error loading virtual walls from database:", error);
    }
  }

  // Save virtual walls to database
  async saveToDatabase() {
    try {
      console.log("DrawVirtualWall: Starting save to database...");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        throw new Error("No mapId found for saving virtual walls");
      }

      // Get all virtual walls from the tool
      const virtualWalls = this.getAllVirtualWalls();
      console.log("DrawVirtualWall: Saving virtual walls:", virtualWalls);

      // Get existing virtual walls from server for comparison
      const existingResponse = await fetch(
        `${SERVER_URL}/api/maps/getVirtualWalls/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const existingData = await existingResponse.json();
      const existingVirtualWalls = existingData?.data?.mapVirtualWall || [];

      // Step 1: Delete virtual walls from server that don't exist in current map
      const deletePromises = existingVirtualWalls.map(async (serverWall) => {
        const existsInMap = virtualWalls.find(
          (mapWall) => mapWall.id === serverWall.ID
        );
        if (!existsInMap) {
          console.log(
            "DrawVirtualWall: Deleting virtual wall from server:",
            serverWall.ID
          );
          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/deleteVirtualWall/${serverWall.ID}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(
              "DrawVirtualWall: Delete virtual wall response:",
              result
            );
          } catch (error) {
            console.error(
              `Error deleting virtual wall ${serverWall.ID}:`,
              error
            );
          }
        }
      });
      await Promise.all(deletePromises);

      // Step 2: Update existing virtual walls in server
      const updatePromises = virtualWalls.map(async (mapWall) => {
        const existsInServer = existingVirtualWalls.find(
          (serverWall) => serverWall.ID === mapWall.id
        );
        if (existsInServer) {
          console.log(
            "DrawVirtualWall: Updating virtual wall in server:",
            mapWall.id
          );
          const properties = {
            Points: mapWall.points.flatMap((point) => [
              point.x.toString(),
              point.y.toString(),
            ]),
          };

          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/updateVirtualWall/${mapWall.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  virtualWallName: mapWall.name || `VirtualWall-${mapWall.id}`,
                  properties: JSON.stringify(properties),
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(
              "DrawVirtualWall: Update virtual wall response:",
              result
            );
          } catch (error) {
            console.error(`Error updating virtual wall ${mapWall.id}:`, error);
          }
        }
      });
      await Promise.all(updatePromises);

      // Step 3: Insert new virtual walls to server
      const insertPromises = virtualWalls.map(async (mapWall) => {
        const existsInServer = existingVirtualWalls.find(
          (serverWall) => serverWall.ID === mapWall.id
        );
        if (!existsInServer) {
          console.log(
            "DrawVirtualWall: Inserting new virtual wall to server:",
            mapWall.id
          );
          const properties = {
            Points: mapWall.points.flatMap((point) => [
              point.x.toString(),
              point.y.toString(),
            ]),
          };

          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/addVirtualWall`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  mapId: mapId,
                  virtualWallName: mapWall.name || `VirtualWall-${mapWall.id}`,
                  properties: JSON.stringify(properties),
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(
              "DrawVirtualWall: Insert virtual wall response:",
              result
            );

            // Update virtual wall ID directly in this class if server returns new ID
            if (result && result.virtualWallId) {
              const newServerId = result.virtualWallId;
              // Find and update the virtual wall ID in our virtualWalls array
              const virtualWallIndex = this.virtualWalls.findIndex(
                (vw) => vw.id === mapWall.id
              );
              if (virtualWallIndex !== -1) {
                this.virtualWalls[virtualWallIndex].id = newServerId;
                console.log(
                  `DrawVirtualWall: Updated virtual wall ID from ${mapWall.id} to ${newServerId}`
                );
              }
            }
          } catch (error) {
            console.error(`Error inserting virtual wall ${mapWall.id}:`, error);
          }
        }
      });
      await Promise.all(insertPromises);

      console.log("DrawVirtualWall: All virtual walls saved successfully");
    } catch (error) {
      console.error("DrawVirtualWall: Error saving to database:", error);
      throw error;
    }
  }
}

export { DrawVirtualWall }; 