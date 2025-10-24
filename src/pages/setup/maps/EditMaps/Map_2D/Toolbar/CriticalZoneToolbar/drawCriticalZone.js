import * as THREE from "three";
import { SERVER_URL } from "../../../../../../../config/serverConfig.js";

class DrawCriticalZone {
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
      polygon: null,
      selectedNode: null,

      // Select state (for select mode)
      selectedPolygon: null,
      selectedPolygonId: null,

      selectedLine: null,
      selectedLineId: null,

      // Edit state (for edit mode)
      editingNodes: [],
      editingPolygonId: null,
      editingLineId: null,

      criticalZoneMeshesSelectedId: null,
      // Drawing settings
      isDrawingEnabled: true,
      nodeColors: {
        outer: { normal: 0x000000, selected: 0xffbb00 },
        inner: { normal: 0x87f542, selected: 0xffbb00 },
      },
      polygonColor: 0xffbb00,
    };
    this.currentStyle = { color: "green", width: 5 };

     
    // Critical zones storage
    this.criticalZones = []; // Data objects
    this.criticalZoneMeshes = []; // Visual mesh objects

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
    document.addEventListener("keydown", this.handleKeyDown);

    console.log("DrawCriticalZone initialized");
  }

  setCurrentStyle(newStyle) {
    console.log("New style set:", newStyle);
    this.currentStyle = newStyle;

    this.updateCurrentLine();
  }

  getCurrentStyle() {
    return this.currentStyle;
  }

  // ===== MODE MANAGEMENT =====
  setMode(mode) {
    console.log("=== SETTING MODE ===");
    console.log("Setting mode to:", mode);
    console.log(
      "Current editingPolygonId before setMode:",
      this.state.editingPolygonId
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
    console.log("EditingPolygonId after setMode:", this.state.editingPolygonId);
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
    console.log("mouseEventHandle called for critical zone", this.isEnabled);
    if (!this.isEnabled) return;

    const worldPoint = this.getWorldPosition(clientX, clientY);
    if (!worldPoint) return;

    switch (this.state.mode) {
      case "create":
        this.handleCreateClick(worldPoint);
        break;
      case "select":
        this.handleSelectClickLine(worldPoint);
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

    // Create polygon if we have 3 or more points
    // if (this.state.points.length >= 3) {
    // }
    this.updateLineFromPoints(this.state.points);
  }

  updateLineFromPoints(points) {
    // 1. Xóa đường đi cũ khỏi scene (nếu có)
    // console.log("editingLineId: ", this.state.editingLineId);
    if (this.state.line) {
      console.log("Removing old line from scene");
      this.scene.remove(this.state.line);
      this.state.line.geometry.dispose();
      this.state.line.material.dispose();
    }
    console.log(
      "criticalZoneMeshesSelectedId: ",
      this.state.criticalZoneMeshesSelectedId
    );

    // 2. Chỉ vẽ khi có từ 2 điểm trở lên
    if (points.length < 2) {
      return;
    }

    // 3. Tạo Geometry trực tiếp từ mảng các điểm
    // Cách này đơn giản hơn nhiều so với việc tạo Curve
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // 4. Tạo Material cho đường kẻ
    const material = new THREE.LineBasicMaterial({
      // color: "#ff6347", // Màu đỏ
      color: this.currentStyle.color,
      linewidth: this.currentStyle.width,
    });

    // 5. Tạo đối tượng Line và thêm vào scene
    this.state.line = new THREE.Line(geometry, material);
    this.state.line.position.z = 0.05;

    this.scene.add(this.state.line);
  }

  updateCurrentLine() {
    // 1. Xóa đường đi cũ khỏi scene (nếu có)
    console.log("updateCurrentLine: ", this.state.points);
    console.log("getCurrentStyle: ", this.getCurrentStyle());
    if (this.state.line) {
      console.log("Removing old line from scene");
      this.scene.remove(this.state.line);
      this.state.line.geometry.dispose();
      this.state.line.material.dispose();
    }
    console.log(
      "criticalZoneMeshesSelectedId: ",
      this.state.criticalZoneMeshesSelectedId
    );

    // 2. Chỉ vẽ khi có từ 2 điểm trở lên
    if (this.state.points.length < 2) {
      return;
    }

    // 3. Tạo Geometry trực tiếp từ mảng các điểm
    // Cách này đơn giản hơn nhiều so với việc tạo Curve
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.state.points
    );

    // 4. Tạo Material cho đường kẻ
    const material = new THREE.LineBasicMaterial({
      // color: "#ff6347", // Màu đỏ
      color: this.currentStyle.color,
      linewidth: this.currentStyle.width,
    });

    // 5. Tạo đối tượng Line và thêm vào scene
    this.state.line = new THREE.Line(geometry, material);
    this.state.line.position.z = 0.05;

    this.scene.add(this.state.line);
  }

  handleSelectClick(worldPoint) {
    // Check if clicked on any critical zone polygon
    const clickedPolygon = this.findClickedPolygon(worldPoint);
    if (clickedPolygon) {
      this.selectPolygon(clickedPolygon);
    } else {
      this.clearSelectedPolygon();
    }
  }

  handleSelectClickLine(worldPoint) {
    console.log("=== HANDLE SELECT CLICK line ===");
    // Check if clicked on any critical zone line
    const clickedLine = this.findClickedLine(worldPoint);
    console.log("clickedLine: ", clickedLine);

    if (!clickedLine) {
      this.clearSelectedLine();
    } else {
      this.selectLine(clickedLine);
    }
  }

  createCriticalZoneLine() {
    if (this.state.points.length < 2) return;
    this.updateLineFromPoints(this.state.points);
  }

  clearSelectedLine() {
    if (this.state.selectedLine) {
      // Check if the selected polygon has material.color property
      if (
        this.state.selectedLine.material &&
        this.state.selectedLine.material.color
      ) {
        this.state.selectedLine.material.color.setHex(this.state.lineColor);
      }
      this.state.selectedLine = null;
    }

    this.state.selectedLineId = null;

    // Hide edit actions
    if (this.map2D && this.map2D.criticalZoneToolbar) {
      this.map2D.criticalZoneToolbar.hideEditActions();
    }
  }

  handleEditClick(worldPoint) {
    console.log("=== HANDLE EDIT CLICK ===");
    console.log("World point:", worldPoint);
    console.log("Current mode:", this.state.mode);
    console.log("Editing nodes count:", this.state.editingNodes.length);

    if (this.state.mode !== "edit") {
      console.warn("Not in edit mode");
      return;
    }

    // Check if clicking on an existing node
    const clickedNode = this.findClickedNode(worldPoint);
    if (clickedNode) {
      console.log("Clicked on existing node for editing");
      this.selectNode(clickedNode);
      return;
    }

    // Check if clicking on a polygon edge to add a new node
    const edgeInsertion = this.findEdgeForNodeInsertion(worldPoint);
    if (edgeInsertion) {
      console.log("Adding new node on polygon edge");
      this.insertNodeOnEdge(worldPoint, edgeInsertion.index);
      return;
    }

    // If not clicking on a node or edge, just reset selection
    console.log("Clicked on empty space, resetting node selection");
    this.resetSelectedNode();
  }

  // ===== NODE MANAGEMENT =====
  createNode(position) {
    // Create outer circle (larger, colored)
    const outerGeometry = new THREE.CircleGeometry(
      this.nodeRadius,
      this.nodeSegments
    );
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: this.state.nodeColors.outer.normal,
      side: THREE.DoubleSide,
    });
    const outerCircle = new THREE.Mesh(outerGeometry, outerMaterial);
    outerCircle.position.copy(position);
    outerCircle.position.z = 0.1;

    // Create inner circle (smaller, white)
    const innerGeometry = new THREE.CircleGeometry(
      this.nodeRadius * 0.6,
      this.nodeSegments
    );
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: this.state.nodeColors.inner.normal,
      side: THREE.DoubleSide,
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
    const nodes =
      this.state.mode == "edit" ? this.state.editingNodes : this.state.nodes;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const distance = worldPoint.distanceTo(node.outerCircle.position);
      console.log("distance", distance);

      if (distance <= clickRadius) {
        console.log("Found clicked node at index:", i);
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
    node.outerCircle.material.color.setHex(
      this.state.nodeColors.outer.selected
    );
    node.innerCircle.material.color.setHex(
      this.state.nodeColors.inner.selected
    );

    // Set cursor
    this.renderer.domElement.style.cursor = "move";
  }

  resetSelectedNode() {
    if (!this.state.selectedNode) return;

    // Reset node colors
    const { node } = this.state.selectedNode;
    node.outerCircle.material.color.setHex(this.state.nodeColors.outer.normal);
    node.innerCircle.material.color.setHex(this.state.nodeColors.inner.normal);

    // Reset cursor
    this.renderer.domElement.style.cursor =
      this.state.mode === "edit" ? "crosshair" : "default";

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
    const nodes =
      this.state.mode === "edit" ? this.state.editingNodes : this.state.nodes;
    const pointIndex = this.state.selectedNode.index;
    if (pointIndex < this.state.points.length) {
      this.state.points[pointIndex].copy(worldPoint);
    }

    // Update polygon
    this.updateLineFromPoints(this.state.points);
  }

  // ===== POLYGON MANAGEMENT =====
  createCriticalZonePolygon() {
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
      opacity: 0.3,
    });

    this.state.polygon = new THREE.Mesh(geometry, material);
    this.state.polygon.position.z = 0.05;
    this.scene.add(this.state.polygon);
  }

  // ===== SELECT MODE =====
  findClickedPolygon(worldPoint) {
    if (!this.map2D || !this.criticalZones) return null;

    console.log("findClickedPolygon called", this.criticalZones.length);
    const clickRadius = 0.1;

    for (let i = 0; i < this.criticalZones.length; i++) {
      const criticalZone = this.criticalZones[i];

      // Check if this is a data object (has points property)
      if (criticalZone.points) {
        const points = criticalZone.points;
        const polygon = points.map((p) => new THREE.Vector3(p.x, p.y, 0));
        console.log("polygon", polygon);
        // Check if point is inside polygon
        if (this.isPointInPolygon(worldPoint, polygon)) {
          console.log("Found clicked polygon at index:", i);

          // Find the corresponding visual mesh
          const visualMesh = this.criticalZoneMeshes[i];

          return {
            polygon: visualMesh,
            criticalZoneData: criticalZone,
            index: i,
          };
        }
      }
    }

    return null;
  }

  findClickedLine(worldPoint) {
    // Ngưỡng khoảng cách để coi là "click trúng" đường line.
    // Bạn cần điều chỉnh giá trị này cho phù hợp với độ dày của đường line và scale của bản đồ.
    if (!this.map2D || !this.criticalZones) return null;
    const clickRadius = 0.1;

    // Lặp qua tất cả các đường đi (paths)

    // Giả sử `this.state.paths` chứa dữ liệu các đường đi
    for (let i = 0; i < this.criticalZones.length; i++) {
      const zoneData = this.criticalZones[i];
      if (!zoneData.points || zoneData.points.length < 2) continue;

      const pointsAsVector3 = zoneData.points.map(
        (p) => new THREE.Vector3(p.x, p.y, 0)
      );

      for (let j = 0; j < pointsAsVector3.length - 1; j++) {
        const startPoint = pointsAsVector3[j];
        const endPoint = pointsAsVector3[j + 1];

        // --- PHẦN LOGIC KIỂM TRA CHÍNH NẰM Ở ĐÂY ---

        // 2. TẠO ĐOẠN THẲNG ẢO
        // Tạo một đối tượng đoạn thẳng giữa 2 waypoint để tính toán.
        const lineSegment = new THREE.Line3(startPoint, endPoint);

        // 3. TÌM ĐIỂM GẦN NHẤT
        // Tìm điểm trên đoạn thẳng đó gần nhất với con trỏ chuột (`worldPoint`).
        const closestPoint = new THREE.Vector3();
        lineSegment.closestPointToPoint(worldPoint, true, closestPoint);
        console.log("closestPoint", closestPoint);
        // 4. TÍNH KHOẢNG CÁCH
        // Tính khoảng cách từ con trỏ chuột đến điểm gần nhất vừa tìm được.
        const distance = worldPoint.distanceTo(closestPoint);
        console.log("distance", distance);
        // 5. SO SÁNH (ĐÂY LÀ CÂU TRẢ LỜI CHO CÂU HỎI CỦA BẠN)
        // Nếu khoảng cách này nhỏ hơn bán kính click, coi như đã "click trúng" line.
        if (distance < clickRadius) {
          // Nếu điều kiện đúng, tức là worldPoint "nằm trên" đường line.
          console.log("Đã click trúng đường line!: ", zoneData);
          const visualMesh = this.criticalZoneMeshes[i];
          return {
            line: visualMesh,
            criticalZoneData: zoneData,
            index: i,
          };
        }
      }
    }

    return null; // Nếu không có đoạn thẳng nào thỏa mãn, trả về null.
  }

  isPointInPolygon(point, polygonPoints) {
    // polygonPoints là mảng THREE.Vector3

    // Bước 1: Tạo bounding box (giúp tối ưu)
    const geometry = new THREE.BufferGeometry().setFromPoints(polygonPoints);
    const pointsObject = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.1 })
    );
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

    for (
      let i = 0, j = polygonPoints.length - 1;
      i < polygonPoints.length;
      j = i++
    ) {
      const xi = polygonPoints[i].x,
        yi = polygonPoints[i].y;
      const xj = polygonPoints[j].x,
        yj = polygonPoints[j].y;

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-10) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  selectPolygon(polygonInfo) {
    this.clearSelectedPolygon();

    if (!polygonInfo || !polygonInfo.polygon) {
      console.warn("Invalid polygon info for selection");
      return;
    }

    this.state.selectedPolygon = polygonInfo.polygon;
    this.state.selectedPolygonId = polygonInfo.criticalZoneData.id;

    // Highlight the selected polygon - check if it's a visual mesh object
    if (polygonInfo.polygon.material && polygonInfo.polygon.material.color) {
      polygonInfo.polygon.material.color.setHex(0x00ff00); // Green for selected
    } else {
      console.warn("Selected polygon does not have material.color property");
    }

    console.log("Polygon selected:", this.state.selectedPolygonId);

    // Show edit actions
    if (this.map2D && this.map2D.criticalZoneToolbar) {
      this.map2D.criticalZoneToolbar.showEditActions(
        this.state.selectedPolygonId
      );
    }
  }

  selectLine(lineInfo) {
    // 1. Bỏ chọn đường đi cũ (nếu có) trước khi chọn cái mới
    this.clearSelectedLine();

    if (!lineInfo || !lineInfo.line) {
      console.warn("Invalid line info for selection");
      return;
    }
    console.log("lineInfo: ", lineInfo);
    // 2. Lưu lại thông tin của line được chọn
    this.state.selectedLine = lineInfo.line;
    this.state.selectedLineId = lineInfo.criticalZoneData.id;
    this.state.criticalZoneMeshesSelectedId = lineInfo.index;

    if (lineInfo.line.material && lineInfo.line.material.color) {
      lineInfo.line.material.color.setHex(0x00ff00); // Green for selected
    } else {
      console.warn("Selected line does not have material.color property");
    }

    console.log("Line selected:", this.state.selectedLineId);

    if (this.map2D && this.map2D.criticalZoneToolbar) {
      this.map2D.criticalZoneToolbar.showEditActions(this.state.selectedLineId);
    }

    // Bạn có thể thêm logic hiển thị các nút edit ở đây nếu cần
  }

  clearSelectedPolygon() {
    if (this.state.selectedPolygon) {
      // Check if the selected polygon has material.color property
      if (
        this.state.selectedPolygon.material &&
        this.state.selectedPolygon.material.color
      ) {
        this.state.selectedPolygon.material.color.setHex(
          this.state.polygonColor
        );
      }
      this.state.selectedPolygon = null;
    }

    this.state.selectedPolygonId = null;

    // Hide edit actions
    if (this.map2D && this.map2D.criticalZoneToolbar) {
      this.map2D.criticalZoneToolbar.hideEditActions();
    }
  }

  // ===== EDIT MODE =====
  editSelectedPolygon() {
    if (!this.state.selectedPolygonId) return;

    console.log("=== ENTERING EDIT MODE ===");
    console.log("Selected polygon ID:", this.state.selectedPolygonId);

    const criticalZoneData = this.criticalZones.find(
      (zone) => zone.id === this.state.selectedPolygonId
    );
    if (!criticalZoneData) {
      console.error("Critical zone data not found");
      return;
    }

    console.log("Found critical zone data:", criticalZoneData);

    // Store editing state
    this.state.editingPolygonId = this.state.selectedPolygonId;
    console.log("Set editingPolygonId to:", this.state.editingPolygonId);

    this.state.points = criticalZoneData.points.map(
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

    // Create editing polygon
    this.createCriticalZonePolygon();

    // Switch to edit mode
    this.setMode("edit");

    console.log("Edit mode ready");
    console.log("Final editingPolygonId:", this.state.editingPolygonId);
    console.log("Final mode:", this.state.mode);
  }

  editSelectedLine() {
    if (!this.state.selectedLineId) return;

    console.log("=== ENTERING EDIT MODE ===");
    console.log("Selected line ID:", this.state.selectedLineId);

    const criticalZoneData = this.criticalZones.find(
      (zone) => zone.id === this.state.selectedLineId
    );
    if (!criticalZoneData) {
      console.error("Critical zone data not found");
      return;
    }

    console.log("Found critical zone data:", criticalZoneData);

    // Store editing state
    this.state.editingLineId = this.state.selectedLineId;
    console.log("Set editingLineId to:", this.state.editingLineId);

    this.state.points = criticalZoneData.points.map(
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

    // Create editing polygon
    this.createCriticalZoneLine();

    // Switch to edit mode
    this.setMode("edit");
  }

  // ===== APPLY/CANCEL =====
  applyCriticalZoneToMap() {
    console.log("=== APPLY CRITICAL ZONE ===");
    console.log("Current mode:", this.state.mode);
    console.log("Editing polygon ID:", this.state.editingPolygonId);
    console.log("Points:", this.state.points);
    console.log("Points length:", this.state.points.length);

    if (this.state.points.length < 2) {
      console.warn("Not enough points to create critical zone");
      return;
    }

    let criticalZoneData;
    const shouldUpdate =
      this.state.mode === "edit" && this.state.editingPolygonId;
    console.log("Should update existing zone:", shouldUpdate);

    if (shouldUpdate) {
      // Update existing critical zone
      console.log("Updating existing critical zone:", this.state.editingLineId);
      criticalZoneData = {
        id: this.state.editingLineId,
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };
      // Update in local array
      const existingIndex = this.criticalZones.findIndex(
        (zone) => zone.id === this.state.editingLineId
      );
      if (existingIndex !== -1) {
        this.criticalZones[existingIndex] = criticalZoneData;
        console.log("Updated in criticalZones array at index:", existingIndex);
      }
      // Update in scene
      this.updateSceneLines(criticalZoneData);
    } else {
      // Create new critical zone
      console.log("Creating new critical zone");
      criticalZoneData = {
        id: this.IDCount++, // Use IDCount and increment it
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };

      // Add to data array
      this.criticalZones.push(criticalZoneData);

      // Create and add visual mesh
      this.displayCriticalZoneAsLine(criticalZoneData);
    }

    console.log("Critical zone applied to map:", criticalZoneData);

    // Clear state and return to create mode
    this.clearCurrentState();
    this._allowExitEdit = true;
    this.setMode("create");
    this._allowExitEdit = false;
    this.disable();
    console.log("Critical zone applied successfully");
  }

  updateScenePolygon(criticalZoneData) {
    if (!this.criticalZones) return;

    // Find the index of the critical zone in the data array
    const polygonIndex = this.criticalZones.findIndex(
      (zone) => zone.id === criticalZoneData.id
    );

    if (polygonIndex !== -1) {
      // Remove old visual mesh
      if (this.criticalZoneMeshes[polygonIndex]) {
        this.scene.remove(this.criticalZoneMeshes[polygonIndex]);
        this.criticalZoneMeshes[polygonIndex].geometry.dispose();
        this.criticalZoneMeshes[polygonIndex].material.dispose();
      }

      // Create new visual mesh
      const newPolygon =
        this.createCriticalZonePolygonFromData(criticalZoneData);
      this.criticalZoneMeshes[polygonIndex] = newPolygon;

      console.log(
        "Updated scene polygon for critical zone:",
        criticalZoneData.id
      );
    }
  }

  updateSceneLines(criticalZoneData) {
    if (!this.criticalZones) return;

    // Find the index of the critical zone in the data array
    const lineIndex = this.criticalZones.findIndex(
      (zone) => zone.id === criticalZoneData.id
    );

    if (lineIndex !== -1) {
      // Remove old visual mesh
      if (this.criticalZoneMeshes[lineIndex]) {
        this.scene.remove(this.criticalZoneMeshes[lineIndex]);
        this.criticalZoneMeshes[lineIndex].geometry.dispose();
        this.criticalZoneMeshes[lineIndex].material.dispose();
      }

      // Create new visual mesh
      const newLine = this.createCriticalZoneLineFromData(criticalZoneData);
      console.log("newLine", newLine);

      this.criticalZoneMeshes[lineIndex] = newLine;

      console.log("Updated scene line for critical zone:", criticalZoneData.id);
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

  displayCriticalZoneAsPolygon(criticalZoneData) {
    if (
      !criticalZoneData ||
      !criticalZoneData.points ||
      criticalZoneData.points.length < 3
    ) {
      console.warn("Invalid critical zone data for display");
      return;
    }

    const polygon = this.createCriticalZonePolygonFromData(criticalZoneData);

    // Add to visual meshes array (not data array)
    if (this.criticalZoneMeshes) {
      this.criticalZoneMeshes.push(polygon);
    }

    console.log("Critical zone displayed as polygon:", criticalZoneData.id);
  }

  displayCriticalZoneAsLine(criticalZoneData) {
    if (
      !criticalZoneData ||
      !criticalZoneData.points ||
      criticalZoneData.points.length < 2
    ) {
      console.warn("Invalid critical zone data for display");
      return;
    }

    const line = this.createCriticalZoneLineFromData(criticalZoneData);
    console.log("Adding line to criticalZoneMeshes line", line);
    console.log(
      "Adding line to criticalZoneMeshes criticalZoneData",
      criticalZoneData
    );
    // Add to visual meshes array (not data array)
    if (this.criticalZoneMeshes) {
      console.log("Adding line to criticalZoneMeshes");
      this.criticalZoneMeshes.push(line);
    }

    console.log("Critical zone displayed as line:", criticalZoneData.id);
  }

  createCriticalZonePolygonFromData(criticalZoneData) {
    if (
      !criticalZoneData ||
      !criticalZoneData.points ||
      criticalZoneData.points.length < 3
    ) {
      return null;
    }

    // Create polygon geometry
    const shape = new THREE.Shape();

    // Start with first point
    shape.moveTo(criticalZoneData.points[0].x, criticalZoneData.points[0].y);

    // Add lines to subsequent points
    for (let i = 1; i < criticalZoneData.points.length; i++) {
      shape.lineTo(criticalZoneData.points[i].x, criticalZoneData.points[i].y);
    }

    // Close the shape
    shape.lineTo(criticalZoneData.points[0].x, criticalZoneData.points[0].y);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: this.state.polygonColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });

    const polygon = new THREE.Mesh(geometry, material);
    polygon.position.z = 0.05;
    polygon.userData = { criticalZoneId: criticalZoneData.id };

    this.scene.add(polygon);

    return polygon;
  }

  createCriticalZoneLineFromData(criticalZoneData) {
    if (
      !criticalZoneData ||
      !criticalZoneData.points ||
      criticalZoneData.points.length < 2
    ) {
      return null;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.state.points
    );

    // 4. Tạo Material cho đường kẻ
    const material = new THREE.LineBasicMaterial({
      // color: "#ff6347", // Màu đỏ

      color: this.currentStyle.color,
      linewidth: this.currentStyle.width,
    });

    // 5. Tạo đối tượng Line và thêm vào scene
    const pathLine = new THREE.Line(geometry, material);
    pathLine.position.z = 0.05;
    pathLine.userData = { criticalZoneId: criticalZoneData.id };
    this.scene.add(pathLine);

    return pathLine;
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

    // Clear polygon
    if (this.state.polygon) {
      this.scene.remove(this.state.polygon);
      this.state.polygon.geometry.dispose();
      this.state.polygon.material.dispose();
    }

    // Reset state (preserve editing state if in edit mode)
    if (this.state.mode !== "edit") {
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
    this.renderer.domElement.style.cursor = "crosshair";
  }

  disableDrawing() {
    this.state.isDrawingEnabled = false;
    this.renderer.domElement.style.cursor = "default";
  }

  isDrawingEnabled() {
    return this.state.isDrawingEnabled;
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

  deleteSelectedPolygon() {
    if (!this.state.selectedPolygonId) {
      console.warn("No polygon selected for deletion");
      return;
    }

    // Find the index in the data array
    const zoneIndex = this.criticalZones.findIndex(
      (zone) => zone.id === this.state.selectedPolygonId
    );

    if (zoneIndex !== -1) {
      // Remove from data array
      this.criticalZones.splice(zoneIndex, 1);

      // Remove corresponding visual mesh
      if (this.criticalZoneMeshes[zoneIndex]) {
        this.scene.remove(this.criticalZoneMeshes[zoneIndex]);
        this.criticalZoneMeshes[zoneIndex].geometry.dispose();
        this.criticalZoneMeshes[zoneIndex].material.dispose();
        this.criticalZoneMeshes.splice(zoneIndex, 1);
      }

      console.log("Selected polygon deleted:", this.state.selectedPolygonId);
    } else {
      console.warn("Selected polygon not found in data array");
    }

    // Clear selection state
    this.clearSelectedPolygon();
  }

  getAllcriticalZones() {
    return this.criticalZones;
  }

  // Get current ID count for external access
  getCurrentIDCount() {
    return this.IDCount;
  }

  // Set ID count (useful when loading from database)
  setIDCount(count) {
    this.IDCount = count;
    console.log("IDCount set to:", this.IDCount);
  }

  enable() {
    this.isEnabled = true;
  }
  disable() {
    this.isEnabled = false;
  }

  clearAllcriticalZones() {
    // Clear visual meshes
    if (this.criticalZoneMeshes) {
      this.criticalZoneMeshes.forEach((polygon) => {
        if (polygon && polygon.geometry) {
          this.scene.remove(polygon);
          polygon.geometry.dispose();
          polygon.material.dispose();
        }
      });
      this.criticalZoneMeshes = [];
    }

    // Clear data array
    this.criticalZones = [];

    console.log("All critical zones cleared");
  }

  dispose() {
    // Remove keyboard event listener
    document.removeEventListener("keydown", this.handleKeyDown);

    // Clear all critical zones
    this.clearAllcriticalZones();

    // Clear current state
    this.clearCurrentState();

    console.log("DrawCriticalZone disposed");
  }

  // ===== LOAD CRITICAL ZONES FROM SERVER =====
  loadCriticalZonesFromServerData(serverData) {
    if (!serverData || !Array.isArray(serverData)) {
      console.warn("Invalid server data for critical zones");
      return;
    }

    this.clearAllcriticalZones();

    let maxId = 0; // Track the maximum ID from server data

    serverData.forEach((item) => {
      try {
        const jsonObject = JSON.parse(item.Properties);
        const criticalZonePoints = [];

        for (let i = 0; i < jsonObject.Points.length; i += 2) {
          const x = parseFloat(jsonObject.Points[i]);
          const y = parseFloat(jsonObject.Points[i + 1]);
          criticalZonePoints.push({ x, y });
        }

        const criticalZoneData = {
          id: item.ID,
          points: criticalZonePoints,
          timestamp: Date.now(),
        };

        // Track the maximum ID
        const itemId = parseInt(item.ID);
        if (!isNaN(itemId) && itemId > maxId) {
          maxId = itemId;
        }

        // Add to data array
        this.criticalZones.push(criticalZoneData);

        // Create and add visual mesh
        this.displayCriticalZoneAsLine(criticalZoneData);

        console.log("Loaded critical zone from server:", item.ID);
      } catch (error) {
        console.error("Error parsing critical zone data:", error);
      }
    });

    // Update IDCount to be one more than the maximum ID from server
    this.IDCount = maxId + 1;
    console.log(
      `Loaded ${this.criticalZones.length} critical zones from server. Next ID will be: ${this.IDCount}`
    );
  }

  // Method to remove critical zone by ID
  removeCriticalZoneById(id) {
    const dataIndex = this.criticalZones.findIndex((zone) => zone.id === id);
    if (dataIndex !== -1) {
      // Remove from data array
      this.criticalZones.splice(dataIndex, 1);

      // Remove corresponding visual mesh
      if (this.criticalZoneMeshes[dataIndex]) {
        this.scene.remove(this.criticalZoneMeshes[dataIndex]);
        this.criticalZoneMeshes[dataIndex].geometry.dispose();
        this.criticalZoneMeshes[dataIndex].material.dispose();
        this.criticalZoneMeshes.splice(dataIndex, 1);
      }

      console.log("Critical zone removed:", id);
    } else {
      console.warn("Critical zone not found for removal:", id);
    }
  }

  // Method to apply existing critical zone to map (for compatibility)
  applyCriticalZoneToMapById(id) {
    const criticalZoneData = this.criticalZones.find((zone) => zone.id === id);
    if (criticalZoneData) {
      this.displayCriticalZoneAsLine(criticalZoneData);
      console.log("Applied critical zone to map:", id);
    }
  }

  // Method to apply critical zones to map (plural version for compatibility)
  applyCriticalZonesToMap(id) {
    if (id) {
      this.applyCriticalZoneToMapById(id);
    } else {
      // Apply all critical zones
      this.criticalZones.forEach((zone) => {
        if (zone.points) {
          // Only apply data objects, not visual meshes
          this.displayCriticalZoneAsLine(zone);
        }
      });
    }
  }

  // Method to select critical zones to map (for compatibility)
  SelectCriticalZonesToMapExist(id) {
    const criticalZoneData = this.criticalZones.find((zone) => zone.id === id);
    if (criticalZoneData) {
      this.displayCriticalZoneAsLine(criticalZoneData);
      console.log("Selected critical zone to map:", id);
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
      const distance = this.distanceToLineSegment(
        worldPoint,
        currentPoint,
        nextPoint
      );

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

    // Update line
    this.updateLineFromPoints(this.state.points);

    console.log(
      `New node inserted at index ${insertIndex}. Total nodes: ${this.state.editingNodes.length}`
    );
  }

  // Delete selected node in edit mode
  deleteSelectedNode() {
    if (!this.state.selectedNode || this.state.mode !== "edit") return;

    const { index } = this.state.selectedNode;

    // Don't delete if we only have 3 nodes (minimum for a polygon)
    if (this.state.editingNodes.length <= 3) {
      console.warn("Cannot delete node - minimum 3 nodes required for polygon");
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

    // Update line
    this.updateLineFromPoints(this.state.points);

    // Reset selection
    this.state.selectedNode = null;
    this.renderer.domElement.style.cursor = "crosshair";

    console.log(
      `Node deleted at index ${index}. Remaining nodes: ${this.state.editingNodes.length}`
    );
  }

  // Keyboard event handling
  handleKeyDown(event) {
    if (this.state.mode === "edit" && event.key === "Delete") {
      event.preventDefault();
      this.deleteSelectedNode();
    }
  }

  // Load critical zones from database
  async loadCriticalZonesFromDatabase() {
    try {
      // Clear existing critical zones FIRST before any API call
      this.clearAllcriticalZones();

      const token = localStorage.getItem("token");
      if (!token) {
        console.error(
          "No token found for loading critical zones from database"
        );
        return;
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        console.error(
          "No mapId found for loading critical zones from database"
        );
        return;
      }

      const response = await fetch(
        `${SERVER_URL}/api/maps/loadcriticalZones/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.data && data.data.mapCritical) {
        // Use existing method to load critical zones
        this.loadCriticalZonesFromServerData(data.data.mapCritical);
        console.log(
          `Loaded ${data.data.mapCritical.length} critical zones from database`
        );
      } else {
        console.log("No critical zones found in database");
      }
    } catch (error) {
      console.error("Error loading critical zones from database:", error);
    }
  }

  // Save critical zones to database
  async saveToDatabase() {
    try {
      console.log("DrawCriticalZone: Starting save to database...");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        throw new Error("No mapId found for saving critical zones");
      }

      // Get all critical zones from the tool
      const criticalZones = this.getAllcriticalZones();
      console.log("DrawCriticalZone: Saving critical zones:", criticalZones);

      // Get existing critical zones from server for comparison
      const existingResponse = await fetch(
        `${SERVER_URL}/api/maps/loadcriticalZones/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const existingData = await existingResponse.json();
      const existingcriticalZones = existingData?.data?.mapCritical || [];

      // Step 1: Delete critical zones from server that don't exist in current map
      const deletePromises = existingcriticalZones.map(async (serverZone) => {
        const existsInMap = criticalZones.find(
          (mapZone) => mapZone.id === serverZone.ID
        );
        if (!existsInMap) {
          console.log(
            "DrawCriticalZone: Deleting critical zone from server:",
            serverZone.ID
          );
          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/deleteCriticalZone/${serverZone.ID}`,
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
              "DrawCriticalZone: Delete critical zone response:",
              result
            );
          } catch (error) {
            console.error(
              `Error deleting critical zone ${serverZone.ID}:`,
              error
            );
          }
        }
      });
      await Promise.all(deletePromises);

      // Step 2: Update existing critical zones in server
      const updatePromises = criticalZones.map(async (mapZone) => {
        const existsInServer = existingcriticalZones.find(
          (serverZone) => serverZone.ID === mapZone.id
        );
        if (existsInServer) {
          console.log(
            "DrawCriticalZone: Updating critical zone in server:",
            mapZone.id
          );
          const properties = {
            Points: mapZone.points.flatMap((point) => [
              point.x.toString(),
              point.y.toString(),
            ]),
          };

          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/updateCriticalZone/${mapZone.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  criticalZoneName:
                    mapZone.name || `CriticalZone-${mapZone.id}`,
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
              "DrawCriticalZone: Update critical zone response:",
              result
            );
          } catch (error) {
            console.error(`Error updating critical zone ${mapZone.id}:`, error);
          }
        }
      });
      await Promise.all(updatePromises);

      // Step 3: Insert new critical zones to server
      const insertPromises = criticalZones.map(async (mapZone) => {
        const existsInServer = existingcriticalZones.find(
          (serverZone) => serverZone.ID === mapZone.id
        );
        if (!existsInServer) {
          console.log(
            "DrawCriticalZone: Inserting new critical zone to server:",
            mapZone.id
          );
          const properties = {
            Points: mapZone.points.flatMap((point) => [
              point.x.toString(),
              point.y.toString(),
            ]),
          };

          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/addCriticalZone`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  mapId: mapId,
                  criticalZoneName:
                    mapZone.name || `CriticalZone-${mapZone.id}`,
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
              "DrawCriticalZone: Insert critical zone response:",
              result
            );

            // Update critical zone ID directly in this class if server returns new ID
            if (result && result.criticalZoneId) {
              const newServerId = result.criticalZoneId;
              // Find and update the critical zone ID in our criticalZones array
              const criticalZoneIndex = this.criticalZones.findIndex(
                (fz) => fz.id === mapZone.id
              );
              if (criticalZoneIndex !== -1) {
                this.criticalZones[criticalZoneIndex].id = newServerId;
                console.log(
                  `DrawCriticalZone: Updated critical zone ID from ${mapZone.id} to ${newServerId}`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error inserting critical zone ${mapZone.id}:`,
              error
            );
          }
        }
      });
      await Promise.all(insertPromises);

      console.log("DrawCriticalZone: All critical zones saved successfully");
    } catch (error) {
      console.error("DrawCriticalZone: Error saving to database:", error);
      throw error;
    }
  }
}

export { DrawCriticalZone };
