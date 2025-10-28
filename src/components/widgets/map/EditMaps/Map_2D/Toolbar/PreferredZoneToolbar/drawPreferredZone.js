import * as THREE from "three";
import { SERVER_URL } from "../../../../../../../config/serverConfig.js";

class DrawPreferredZone {
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
      line: null,
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

      preferredZoneMeshesSelectedId: null,

      // Drawing settings
      isDrawingEnabled: true,
      nodeColors: {
        outer: { normal: 0x000000, selected: 0xff0000 },
        inner: { normal: 0x87f542, selected: 0xff69b4 },
      },
      polygonColor: 0x90ee90,
      lineColor: 0xff6347,
    };
    this.currentStyle = { color: "green", width: 5 };
    // Preferred zones storage
    this.preferredZones = []; // Data objects
    this.preferredZoneMeshes = []; // Visual mesh objects

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

    console.log("DrawPreferredZone initialized");
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
    // console.log(
    //   "Current editingPolygonId before setMode:",
    //   this.state.editingPolygonId
    // );

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
    // console.log("EditingPolygonId after setMode:", this.state.editingPolygonId);
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
    console.log("mouseEventHandle called for preferred zone", this.isEnabled);
    if (!this.isEnabled) return;

    const worldPoint = this.getWorldPosition(clientX, clientY);
    // console.log("World point:", worldPoint);
    console.log("Current mode:", this.state.mode);
    if (!worldPoint) return;

    switch (this.state.mode) {
      case "create":
        this.handleCreateClick(worldPoint);
        break;
      case "select":
        this.handleSelectClickLine(worldPoint);
        // this.handleSelectClick(worldPoint);
        break;
      case "edit":
        this.handleEditClick(worldPoint);
        break;
    }
  }

  handleCreateClick(worldPoint) {
    // Check if clicked on existing node
    // console.log("World point in create mode:", worldPoint);
    const clickedNode = this.findClickedNode(worldPoint);
    if (clickedNode) {
      console.log("Clicked on existing node, selecting it");
      this.selectNode(clickedNode);
      return;
    }
    // Create new node
    const node = this.createNode(worldPoint);
    this.scene.add(node);

    this.state.nodes.push(node);
    this.state.points.push(worldPoint.clone());

    // Create polygon if we have 3 or more points
    // if (this.state.points.length >= 3) {
    //   this.createPreferredZonePolygon();
    // }

    this.updateLineFromPoints(this.state.points);
  }

  /**
   * Phiên bản `updateLineFromPoints` đơn giản hóa để gỡ lỗi.
   * Chỉ vẽ đoạn thẳng giữa điểm 0 và điểm 1.
   */
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
      "preferredZoneMeshesSelectedId: ",
      this.state.preferredZoneMeshesSelectedId
    );
    // if (this.state.preferredZoneMeshesSelectedId !== null) {
    //   if (this.preferredZoneMeshes[this.state.preferredZoneMeshesSelectedId]) {
    //     this.scene.remove(
    //       this.preferredZoneMeshes[this.state.preferredZoneMeshesSelectedId]
    //     );
    //     this.preferredZoneMeshes[
    //       this.state.preferredZoneMeshesSelectedId
    //     ].geometry.dispose();
    //     this.preferredZoneMeshes[
    //       this.state.preferredZoneMeshesSelectedId
    //     ].material.dispose();
    //   }
    // }

    // 2. Chỉ vẽ khi có từ 2 điểm trở lên
    if (points.length < 2) {
      return;
    }

    // 3. Tạo Geometry trực tiếp từ mảng các điểm
    // Cách này đơn giản hơn nhiều so với việc tạo Curve
    const curve = new THREE.CatmullRomCurve3(
      points,
      false, // đặt là `true` nếu bạn muốn điểm đầu và điểm cuối nối với nhau
      "centripetal"
    );
    const curvePoints = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const material = new THREE.LineBasicMaterial({
      color: this.currentStyle.color,
      linewidth: this.currentStyle.width,
    });

    // const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // // 4. Tạo Material cho đường kẻ
    // const material = new THREE.LineBasicMaterial({
    //   // color: "#ff6347", // Màu đỏ
    //   color: this.currentStyle.color,
    //   linewidth: this.currentStyle.width,
    // });

    // 5. Tạo đối tượng Line và thêm vào scene
    this.state.line = new THREE.Line(geometry, material);
    this.state.line.position.z = 0.05;

    this.scene.add(this.state.line);
  }

  updateCurrentLine() {
    // 1. Xóa đường đi cũ khỏi scene (nếu có)
    console.log("updateCurrentLine: ", this.state.points);
    if (this.state.line) {
      console.log("Removing old line from scene");
      this.scene.remove(this.state.line);
      this.state.line.geometry.dispose();
      this.state.line.material.dispose();
    }
    console.log(
      "preferredZoneMeshesSelectedId: ",
      this.state.preferredZoneMeshesSelectedId
    );
    // if (this.state.preferredZoneMeshesSelectedId !== null) {
    //   if (this.preferredZoneMeshes[this.state.preferredZoneMeshesSelectedId]) {
    //     this.scene.remove(
    //       this.preferredZoneMeshes[this.state.preferredZoneMeshesSelectedId]
    //     );
    //     this.preferredZoneMeshes[
    //       this.state.preferredZoneMeshesSelectedId
    //     ].geometry.dispose();
    //     this.preferredZoneMeshes[
    //       this.state.preferredZoneMeshesSelectedId
    //     ].material.dispose();
    //   }
    // }

    // 2. Chỉ vẽ khi có từ 2 điểm trở lên
    if (this.state.points.length < 2) {
      return;
    }

    // 3. Tạo Geometry trực tiếp từ mảng các điểm
    // Cách này đơn giản hơn nhiều so với việc tạo Curve

    const curve = new THREE.CatmullRomCurve3(
      points,
      false, // đặt là `true` nếu bạn muốn điểm đầu và điểm cuối nối với nhau
      "centripetal"
    );
    const curvePoints = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const material = new THREE.LineBasicMaterial({
      color: this.currentStyle.color,
      linewidth: this.currentStyle.width,
    });

    // const geometry = new THREE.BufferGeometry().setFromPoints(
    //   this.state.points
    // );

    // 4. Tạo Material cho đường kẻ
    // const material = new THREE.LineBasicMaterial({
    //   // color: "#ff6347", // Màu đỏ
    //   color: this.currentStyle.color,
    //   linewidth: this.currentStyle.width,
    // });

    console.log("OK new line material: ", material);

    // 5. Tạo đối tượng Line và thêm vào scene
    this.state.line = new THREE.Line(geometry, material);
    this.state.line.position.z = 0.05;

    this.scene.add(this.state.line);
  }

  handleSelectClick(worldPoint) {
    console.log("=== HANDLE SELECT CLICK ===");
    // Check if clicked on any preferred zone polygon
    const clickedPolygon = this.findClickedPolygon(worldPoint);
    if (clickedPolygon) {
      this.selectPolygon(clickedPolygon);
    } else {
      this.clearSelectedPolygon();
    }
  }

  handleSelectClickLine(worldPoint) {
    console.log("=== HANDLE SELECT CLICK line ===");
    // Check if clicked on any preferred zone line
    console.log("S: ", this.preferredZoneMeshes);
    const clickedLine = this.findClickedLine(worldPoint);
    console.log("clickedLine: ", clickedLine);

    if (!clickedLine) {
      this.clearSelectedLine();
    } else {
      this.selectLine(clickedLine);
    }
  }

  createPreferredZoneLine() {
    if (this.state.points.length < 2) return;
    this.updateLineFromPoints(this.state.points);
  }

  // clearSelectedLine() {
  //   console.log("this.state.selectedLine: ", this.state.selectedLine);
  //   if (this.state.selectedLine) {
  //     this.state.selectedLine.material.color.setHex(
  //       this.state.lineColors.default
  //     );
  //     this.state.selectedLine = null;
  //   }
  // }
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
    if (this.map2D && this.map2D.preferredZoneToolbar) {
      this.map2D.preferredZoneToolbar.hideEditActions();
    }
  }

  handleEditClick(worldPoint) {
    console.log("=== HANDLE EDIT CLICK ===");
    // console.log("World point:", worldPoint);
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
    // console.log("World point in findClickedNode:", worldPoint);
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
    console.log("Node selected:");
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
    // console.log("Updating ", this.state.points);
    // Update node position
    this.state.selectedNode.node.outerCircle.position.copy(worldPoint);
    this.state.selectedNode.node.innerCircle.position.copy(worldPoint);

    // Update corresponding point
    const nodes =
      this.state.mode === "edit" ? this.state.editingNodes : this.state.nodes;
    const pointIndex = this.state.selectedNode.index;

    // console.log("Updating point at index:", pointIndex, worldPoint);
    if (pointIndex < this.state.points.length) {
      console.log("Updating point at index:", pointIndex);
      // console.log("Point update before:", this.state.points[pointIndex]);
      this.state.points[pointIndex].copy(worldPoint);
      // console.log("Point update after:", this.state.points[pointIndex]);
    }
    // console.log("Updated point:", this.state.points);
    // Update polygon
    // this.updatePolygonFromPoints(this.state.points);
    this.updateLineFromPoints(this.state.points);
  }

  // ===== POLYGON MANAGEMENT =====
  createPreferredZonePolygon() {
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
    // Ngưỡng khoảng cách để coi là "click trúng". Bạn cần điều chỉnh giá trị này.
    const clickRadius = 0.1;

    // Lặp qua mảng `this.preferredZones` của bạn
    for (let i = 0; i < this.preferredZones.length; i++) {
      const zoneData = this.preferredZones[i];

      // Bỏ qua nếu zone không có đủ điểm để tạo thành một đường thẳng
      if (!zoneData.points || zoneData.points.length < 2) {
        continue; // Chuyển sang zone tiếp theo
      }

      // Chuyển đổi các điểm {x,y} sang dạng THREE.Vector3 để tính toán
      const pointsAsVector3 = zoneData.points.map(
        (p) => new THREE.Vector3(p.x, p.y, 0)
      );

      // Lặp qua từng đoạn thẳng (segment) trong zone
      for (let j = 0; j < pointsAsVector3.length - 1; j++) {
        const startPoint = pointsAsVector3[j];
        const endPoint = pointsAsVector3[j + 1];

        const lineSegment = new THREE.Line3(startPoint, endPoint);
        const closestPoint = new THREE.Vector3();
        lineSegment.closestPointToPoint(worldPoint, true, closestPoint);

        const distance = worldPoint.distanceTo(closestPoint);

        // Nếu khoảng cách đủ nhỏ, chúng ta đã tìm thấy đường line
        if (distance < clickRadius) {
          console.log("Clicked on zone at index:", i);

          // Giả sử bạn có một mảng lưu các đối tượng Mesh tương ứng
          const visualMesh = this.pathMeshes[i];

          return {
            lineMesh: visualMesh,
            pathData: zoneData, // Trả về data của zone được click
            index: i,
          };
        }
      }
    }

    return null; // Không tìm thấy
  }

  findClickedLine(worldPoint) {
    // Ngưỡng khoảng cách để coi là "click trúng" đường line.
    // Bạn cần điều chỉnh giá trị này cho phù hợp với độ dày của đường line và scale của bản đồ.
    if (!this.map2D || !this.preferredZones) return null;
    const clickRadius = 0.1;

    // Lặp qua tất cả các đường đi (paths)

    // Giả sử `this.state.paths` chứa dữ liệu các đường đi
    for (let i = 0; i < this.preferredZones.length; i++) {
      const zoneData = this.preferredZones[i];
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
          const visualMesh = this.preferredZoneMeshes[i];
          return {
            line: visualMesh,
            preferredZoneData: zoneData,
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
    this.state.selectedPolygonId = polygonInfo.preferredZoneData.id;

    // Highlight the selected polygon - check if it's a visual mesh object
    if (polygonInfo.polygon.material && polygonInfo.polygon.material.color) {
      polygonInfo.polygon.material.color.setHex(0x00ff00); // Green for selected
    } else {
      console.warn("Selected polygon does not have material.color property");
    }

    console.log("Polygon selected:", this.state.selectedPolygonId);

    // Show edit actions
    if (this.map2D && this.map2D.preferredZoneToolbar) {
      this.map2D.preferredZoneToolbar.showEditActions(
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
    // this.state.selectedLine = lineInfo;
    // this.state.selectedLine = lineInfo;
    // this.state.selectedPolygonId = polygonInfo.preferredZoneData.id;
    this.state.selectedLine = lineInfo.line;
    this.state.selectedLineId = lineInfo.preferredZoneData.id;
    this.state.preferredZoneMeshesSelectedId = lineInfo.index;

    if (lineInfo.line.material && lineInfo.line.material.color) {
      lineInfo.line.material.color.setHex(0x00ff00); // Green for selected
    } else {
      console.warn("Selected line does not have material.color property");
    }

    console.log("Line selected:", this.state.selectedLineId);

    if (this.map2D && this.map2D.preferredZoneToolbar) {
      this.map2D.preferredZoneToolbar.showEditActions(
        this.state.selectedLineId
      );
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
    if (this.map2D && this.map2D.preferredZoneToolbar) {
      this.map2D.preferredZoneToolbar.hideEditActions();
    }
  }

  // ===== EDIT MODE =====
  editSelectedPolygon() {
    if (!this.state.selectedPolygonId) return;

    console.log("=== ENTERING EDIT MODE ===");
    console.log("Selected polygon ID:", this.state.selectedPolygonId);

    const preferredZoneData = this.preferredZones.find(
      (zone) => zone.id === this.state.selectedPolygonId
    );
    if (!preferredZoneData) {
      console.error("Preferred zone data not found");
      return;
    }

    console.log("Found preferred zone data:", preferredZoneData);

    // Store editing state
    this.state.editingPolygonId = this.state.selectedPolygonId;
    console.log("Set editingPolygonId to:", this.state.editingPolygonId);

    this.state.points = preferredZoneData.points.map(
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
    this.createPreferredZonePolygon();

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

    const preferredZoneData = this.preferredZones.find(
      (zone) => zone.id === this.state.selectedLineId
    );
    if (!preferredZoneData) {
      console.error("Preferred zone data not found");
      return;
    }

    console.log("Found preferred zone data:", preferredZoneData);

    // Store editing state
    this.state.editingLineId = this.state.selectedLineId;
    console.log("Set editingLineId to:", this.state.editingLineId);

    this.state.points = preferredZoneData.points.map(
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
    this.createPreferredZoneLine();

    // Switch to edit mode
    this.setMode("edit");

    // console.log("Edit mode ready");
    // console.log("Final editingLineId:", this.state.editingLineId);
    // console.log("Final mode:", this.state.mode);
  }

  // ===== APPLY/CANCEL =====
  applyPreferredZoneToMap() {
    // console.log("=== APPLY PREFERRED ZONE ===");
    // console.log("Current mode:", this.state.mode);
    // console.log("Editing polygon ID:", this.state.editingPolygonId);
    // console.log("Points:", this.state.points);
    // console.log("Points length:", this.state.points.length);

    if (this.state.points.length < 2) {
      console.warn("Not enough points to create preferred zone");
      return;
    }

    let preferredZoneData;
    const shouldUpdate = this.state.mode === "edit" && this.state.editingLineId;
    console.log("Should update existing zone:", shouldUpdate);
    console.log("Current mode:", this.state.mode);
    console.log("Current editing line ID:", this.state.editingLineId);

    if (shouldUpdate) {
      // Update existing preferred zone
      console.log(
        "Updating existing preferred zone:",
        this.state.editingLineId
      );
      preferredZoneData = {
        id: this.state.editingLineId,
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };
      // Update in local array
      const existingIndex = this.preferredZones.findIndex(
        (zone) => zone.id === this.state.editingLineId
      );
      if (existingIndex !== -1) {
        this.preferredZones[existingIndex] = preferredZoneData;
        console.log("Updated in preferredZones array at index:", existingIndex);
      }
      // Update in scene
      this.updateSceneLines(preferredZoneData);
      // this.updateScenePolygon(preferredZoneData);
    } else {
      // Create new preferred zone
      console.log("Creating new preferred zone");
      preferredZoneData = {
        id: this.IDCount++, // Use IDCount and increment it
        points: this.state.points.map((point) => ({ x: point.x, y: point.y })),
        timestamp: Date.now(),
      };

      // Add to data array
      this.preferredZones.push(preferredZoneData);

      // Create and add visual mesh
      this.displayPreferredZoneAsLine(preferredZoneData);
      // this.displayPreferredZoneAsPolygon(preferredZoneData);
    }

    console.log("Preferred zone applied to map:", preferredZoneData);

    // Clear state and return to create mode
    this.clearCurrentState();
    this._allowExitEdit = true;
    this.setMode("create");
    this._allowExitEdit = false;
    this.disable();
    console.log("Preferred zone applied successfully");
  }

  updateScenePolygon(preferredZoneData) {
    if (!this.preferredZones) return;

    // Find the index of the preferred zone in the data array
    const polygonIndex = this.preferredZones.findIndex(
      (zone) => zone.id === preferredZoneData.id
    );
    console.log("PreferredZoneMeshes", this.preferredZoneMeshes);
    if (polygonIndex !== -1) {
      // Remove old visual mesh
      if (this.preferredZoneMeshes[polygonIndex]) {
        this.scene.remove(this.preferredZoneMeshes[polygonIndex]);
        this.preferredZoneMeshes[polygonIndex].geometry.dispose();
        this.preferredZoneMeshes[polygonIndex].material.dispose();
      }

      // Create new visual mesh
      const newPolygon =
        this.createPreferredZonePolygonFromData(preferredZoneData);
      this.preferredZoneMeshes[polygonIndex] = newPolygon;

      console.log(
        "Updated scene polygon for preferred zone:",
        preferredZoneData.id
      );
    }
  }

  updateSceneLines(preferredZoneData) {
    if (!this.preferredZones) return;

    // Find the index of the preferred zone in the data array
    const lineIndex = this.preferredZones.findIndex(
      (zone) => zone.id === preferredZoneData.id
    );

    if (lineIndex !== -1) {
      // Remove old visual mesh
      if (this.preferredZoneMeshes[lineIndex]) {
        this.scene.remove(this.preferredZoneMeshes[lineIndex]);
        this.preferredZoneMeshes[lineIndex].geometry.dispose();
        this.preferredZoneMeshes[lineIndex].material.dispose();
      }

      // Create new visual mesh
      const newLine = this.createPreferredZoneLineFromData(preferredZoneData);
      console.log("newLine", newLine);

      this.preferredZoneMeshes[lineIndex] = newLine;

      console.log(
        "Updated scene line for preferred zone:",
        preferredZoneData.id
      );
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

  displayPreferredZoneAsPolygon(preferredZoneData) {
    if (
      !preferredZoneData ||
      !preferredZoneData.points ||
      preferredZoneData.points.length < 3
    ) {
      console.warn("Invalid preferred zone data for display");
      return;
    }

    const polygon = this.createPreferredZonePolygonFromData(preferredZoneData);

    // Add to visual meshes array (not data array)
    if (this.preferredZoneMeshes) {
      this.preferredZoneMeshes.push(polygon);
    }

    console.log("Preferred zone displayed as polygon:", preferredZoneData.id);
  }

  displayPreferredZoneAsLine(preferredZoneData) {
    if (
      !preferredZoneData ||
      !preferredZoneData.points ||
      preferredZoneData.points.length < 2
    ) {
      console.warn("Invalid preferred zone data for display");
      return;
    }

    const line = this.createPreferredZoneLineFromData(preferredZoneData);
    console.log("Adding line to preferredZoneMeshes line", line);
    console.log(
      "Adding line to preferredZoneMeshes preferredZoneData",
      preferredZoneData
    );
    // Add to visual meshes array (not data array)
    if (this.preferredZoneMeshes) {
      console.log("Adding line to preferredZoneMeshes");
      this.preferredZoneMeshes.push(line);
    }

    console.log("Preferred zone displayed as lline:", preferredZoneData.id);
  }

  createPreferredZonePolygonFromData(preferredZoneData) {
    if (
      !preferredZoneData ||
      !preferredZoneData.points ||
      preferredZoneData.points.length < 3
    ) {
      return null;
    }

    // Create polygon geometry
    const shape = new THREE.Shape();

    // Start with first point
    shape.moveTo(preferredZoneData.points[0].x, preferredZoneData.points[0].y);

    // Add lines to subsequent points
    for (let i = 1; i < preferredZoneData.points.length; i++) {
      shape.lineTo(
        preferredZoneData.points[i].x,
        preferredZoneData.points[i].y
      );
    }

    // Close the shape
    shape.lineTo(preferredZoneData.points[0].x, preferredZoneData.points[0].y);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: this.state.polygonColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });

    const polygon = new THREE.Mesh(geometry, material);
    polygon.position.z = 0.05;
    polygon.userData = { preferredZoneId: preferredZoneData.id };

    this.scene.add(polygon);

    return polygon;
  }

  createPreferredZoneLineFromData(preferredZoneData) {
    if (
      !preferredZoneData ||
      !preferredZoneData.points ||
      preferredZoneData.points.length < 2
    ) {
      return null;
    }

    // Create polygon geometry
    // const shape = new THREE.Shape();

    //  const pointsAsVector3 = preferredZoneData.points.map(
    //    (p) => new THREE.Vector3(p.x, p.y, 0)
    //  );
    // const geometry = new THREE.BufferGeometry().setFromPoints(
    //   this.state.points
    // );

    // // 4. Tạo Material cho đường kẻ
    // const material = new THREE.LineBasicMaterial({
    //   color: "#ff6347", // Màu đỏ
    // });

    // Start with first point
    // shape.moveTo(preferredZoneData.points[0].x, preferredZoneData.points[0].y);

    // // Add lines to subsequent points
    // for (let i = 1; i < preferredZoneData.points.length; i++) {
    //   shape.lineTo(
    //     preferredZoneData.points[i].x,
    //     preferredZoneData.points[i].y
    //   );
    // }

    // // Close the shape
    // shape.lineTo(preferredZoneData.points[0].x, preferredZoneData.points[0].y);

    // const geometry = new THREE.ShapeGeometry(shape);
    // const material = new THREE.MeshBasicMaterial({
    //   color: this.state.polygonColor,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    //   opacity: 0.3,
    // });

    // const polygon = new THREE.Mesh(geometry, material);
    // polygon.position.z = 0.05;
    // polygon.userData = { preferredZoneId: preferredZoneData.id };

    // this.scene.add(polygon);

    // return polygon;
    // const geometry = new THREE.BufferGeometry().setFromPoints(
    //   this.state.points
    // );

    // // 4. Tạo Material cho đường kẻ
    // const material = new THREE.LineBasicMaterial({
    //   // color: "#ff6347", // Màu đỏ

    //   color: this.currentStyle.color,
    //   linewidth: this.currentStyle.width,
    // });


     const curve = new THREE.CatmullRomCurve3(
       this.state.points,
       false, // đặt là `true` nếu bạn muốn điểm đầu và điểm cuối nối với nhau
       "centripetal"
     );
     const curvePoints = curve.getPoints(100);
     const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

     const material = new THREE.LineBasicMaterial({
       color: this.currentStyle.color,
       linewidth: this.currentStyle.width,
     });

    // 5. Tạo đối tượng Line và thêm vào scene
    const pathLine = new THREE.Line(geometry, material);
    pathLine.position.z = 0.05;
    pathLine.userData = { preferredZoneId: preferredZoneData.id };
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
    // if (this.state.polygon) {
    //   this.scene.remove(this.state.polygon);
    //   this.state.polygon.geometry.dispose();
    //   this.state.polygon.material.dispose();
    // }

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
      // this.state.editingPolygonId = null;
      this.state.editingLineId = null;
    }

    // this.state.polygon = null;
    this.state.line = null;
    this.state.selectedNode = null;
    this.state.selectedLine = null;
    // this.state.selectedPolygon = null;
    // this.state.selectedPolygonId = null;
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
    // if (!this.state.selectedPolygonId) {updatePath
    //   console.warn("No polygon selected for deletion");
    //   return;
    // }

    if (!this.state.selectedLineId) {
      console.warn("No line selected for deletion");
      return;
    }

    // Find the index in the data array
    const zoneIndex = this.preferredZones.findIndex(
      (zone) => zone.id === this.state.selectedLineId
    );

    if (zoneIndex !== -1) {
      // Remove from data array
      this.preferredZones.splice(zoneIndex, 1);

      // Remove corresponding visual mesh
      if (this.preferredZoneMeshes[zoneIndex]) {
        this.scene.remove(this.preferredZoneMeshes[zoneIndex]);
        this.preferredZoneMeshes[zoneIndex].geometry.dispose();
        this.preferredZoneMeshes[zoneIndex].material.dispose();
        this.preferredZoneMeshes.splice(zoneIndex, 1);
      }

      console.log("Selected line deleted:", this.state.selectedLineId);
    } else {
      console.warn("Selected line not found in data array");
    }

    // Clear selection state
    this.clearSelectedLine();
  }

  getAllPreferredZones() {
    return this.preferredZones;
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

  clearAllPreferredZones() {
    // Clear visual meshes
    if (this.preferredZoneMeshes) {
      // this.preferredZoneMeshes.forEach((polygon) => {
      //   if (polygon && polygon.geometry) {
      //     this.scene.remove(polygon);
      //     polygon.geometry.dispose();
      //     polygon.material.dispose();
      //   }
      // });

      this.preferredZoneMeshes.forEach((line) => {
        if (line && line.geometry) {
          this.scene.remove(line);
          line.geometry.dispose();
          line.material.dispose();
        }
      });
      this.preferredZoneMeshes = [];
    }

    // Clear data array
    this.preferredZones = [];

    console.log("All preferred zones cleared");
  }

  dispose() {
    // Remove keyboard event listener
    document.removeEventListener("keydown", this.handleKeyDown);

    // Clear all preferred zones
    this.clearAllPreferredZones();

    // Clear current state
    this.clearCurrentState();

    console.log("DrawPreferredZone disposed");
  }

  // ===== LOAD PREFERRED ZONES FROM SERVER =====
  loadPreferredZonesFromServerData(serverData) {
    if (!serverData || !Array.isArray(serverData)) {
      console.warn("Invalid server data for preferred zones");
      return;
    }

    this.clearAllPreferredZones();

    let maxId = 0; // Track the maximum ID from server data

    serverData.forEach((item) => {
      try {
        const jsonObject = JSON.parse(item.Properties);
        const preferredZonePoints = [];

        for (let i = 0; i < jsonObject.Points.length; i += 2) {
          const x = parseFloat(jsonObject.Points[i]);
          const y = parseFloat(jsonObject.Points[i + 1]);
          preferredZonePoints.push({ x, y });
        }

        const preferredZoneData = {
          id: item.ID,
          points: preferredZonePoints,
          timestamp: Date.now(),
        };

        // Track the maximum ID
        const itemId = parseInt(item.ID);
        if (!isNaN(itemId) && itemId > maxId) {
          maxId = itemId;
        }

        // Add to data array
        this.preferredZones.push(preferredZoneData);

        // Create and add visual mesh
        this.displayPreferredZoneAsLine(preferredZoneData);
        // this.displayPreferredZoneAsPolygon(preferredZoneData);

        console.log("Loaded preferred zone from server:", item.ID);
      } catch (error) {
        console.error("Error parsing preferred zone data:", error);
      }
    });

    // Update IDCount to be one more than the maximum ID from server
    this.IDCount = maxId + 1;
    console.log(
      `Loaded ${this.preferredZones.length} preferred zones from server. Next ID will be: ${this.IDCount}`
    );
  }

  // Method to remove preferred zone by ID
  removePreferredZoneById(id) {
    const dataIndex = this.preferredZones.findIndex((zone) => zone.id === id);
    if (dataIndex !== -1) {
      // Remove from data array
      this.preferredZones.splice(dataIndex, 1);

      // Remove corresponding visual mesh
      if (this.preferredZoneMeshes[dataIndex]) {
        this.scene.remove(this.preferredZoneMeshes[dataIndex]);
        this.preferredZoneMeshes[dataIndex].geometry.dispose();
        this.preferredZoneMeshes[dataIndex].material.dispose();
        this.preferredZoneMeshes.splice(dataIndex, 1);
      }

      console.log("Preferred zone removed:", id);
    } else {
      console.warn("Preferred zone not found for removal:", id);
    }
  }

  // Method to apply existing preferred zone to map (for compatibility)
  applyPreferredZoneToMapById(id) {
    const preferredZoneData = this.preferredZones.find(
      (zone) => zone.id === id
    );
    if (preferredZoneData) {
      this.displayPreferredZoneAsLine(preferredZoneData);
      // this.displayPreferredZoneAsPolygon(preferredZoneData);
      console.log("Applied preferred zone to map:", id);
    }
  }

  // Method to apply preferred zones to map (plural version for compatibility)
  applyPreferredZonesToMap(id) {
    if (id) {
      this.applyPreferredZoneToMapById(id);
    } else {
      // Apply all preferred zones
      this.preferredZones.forEach((zone) => {
        if (zone.points) {
          // Only apply data objects, not visual meshes
          // this.displayPreferredZoneAsPolygon(zone);
          this.displayPreferredZoneAsLine(zone);
        }
      });
    }
  }

  // Method to select preferred zones to map (for compatibility)
  SelectPreferredZonesToMapExist(id) {
    const preferredZoneData = this.preferredZones.find(
      (zone) => zone.id === id
    );
    if (preferredZoneData) {
      // this.displayPreferredZoneAsPolygon(preferredZoneData);
      this.displayPreferredZoneAsLine(preferredZoneData);
      console.log("Selected preferred zone to map:", id);
    }
  }

  // Find if click is near a polygon edge for node insertion
  findEdgeForNodeInsertion(worldPoint) {
    if (this.state.points.length < 3) return null;
    console.log("ƯTF");
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
    // this.updatePolygonFromPoints(this.state.points);

    console.log(
      `New node inserted at index ${insertIndex}. Total nodes: ${this.state.editingNodes.length}`
    );
  }

  // Delete selected node in edit mode
  deleteSelectedNode() {
    if (!this.state.selectedNode || this.state.mode !== "edit") return;

    const { index } = this.state.selectedNode;

    // Don't delete if we only have 2  nodes (minimum for a polygon)
    if (this.state.editingNodes.length <= 2) {
      console.warn("Cannot delete node - minimum 2 nodes required for a line");
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
    // this.updatePolygonFromPoints(this.state.points);

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

  // Load preferred zones from database
  async loadPreferredZonesFromDatabase() {
    try {
      // Clear existing preferred zones FIRST before any API call
      this.clearAllPreferredZones();

      const token = localStorage.getItem("token");
      if (!token) {
        console.error(
          "No token found for loading preferred zones from database"
        );
        return;
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        console.error(
          "No mapId found for loading preferred zones from database"
        );
        return;
      }

      const response = await fetch(
        `${SERVER_URL}/api/maps/loadPreferredZones/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.data && data.data.mapPreferred) {
        // Use existing method to load preferred zones
        this.loadPreferredZonesFromServerData(data.data.mapPreferred);
        console.log(
          `Loaded ${data.data.mapPreferred.length} preferred zones from database`
        );
      } else {
        console.log("No preferred zones found in database");
      }
    } catch (error) {
      console.error("Error loading preferred zones from database:", error);
    }
  }

  // Save preferred zones to database
  async saveToDatabase() {
    try {
      console.log("DrawPreferredZone: Starting save to database...");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const mapId = this.map2D.mapId;
      if (!mapId) {
        throw new Error("No mapId found for saving preferred zones");
      }

      // Get all preferred zones from the tool
      const preferredZones = this.getAllPreferredZones();
      console.log("DrawPreferredZone: Saving preferred zones:", preferredZones);

      // Get existing preferred zones from server for comparison
      const existingResponse = await fetch(
        `${SERVER_URL}/api/maps/loadPreferredZones/${mapId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const existingData = await existingResponse.json();
      const existingPreferredZones = existingData?.data?.mapPreferred || [];

      // Step 1: Delete preferred zones from server that don't exist in current map
      const deletePromises = existingPreferredZones.map(async (serverZone) => {
        const existsInMap = preferredZones.find(
          (mapZone) => mapZone.id === serverZone.ID
        );
        if (!existsInMap) {
          console.log(
            "DrawPreferredZone: Deleting preferred zone from server:",
            serverZone.ID
          );
          try {
            const response = await fetch(
              `${SERVER_URL}/api/maps/deletePreferredZone/${serverZone.ID}`,
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
              "DrawPreferredZone: Delete preferred zone response:",
              result
            );
          } catch (error) {
            console.error(
              `Error deleting preferred zone ${serverZone.ID}:`,
              error
            );
          }
        }
      });
      await Promise.all(deletePromises);

      // Step 2: Update existing preferred zones in server
      const updatePromises = preferredZones.map(async (mapZone) => {
        const existsInServer = existingPreferredZones.find(
          (serverZone) => serverZone.ID === mapZone.id
        );
        if (existsInServer) {
          console.log(
            "DrawPreferredZone: Updating preferred zone in server:",
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
              `${SERVER_URL}/api/maps/updatePreferredZone/${mapZone.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  preferredZoneName:
                    mapZone.name || `PreferredZone-${mapZone.id}`,
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
              "DrawPreferredZone: Update preferred zone response:",
              result
            );
          } catch (error) {
            console.error(
              `Error updating preferred zone ${mapZone.id}:`,
              error
            );
          }
        }
      });
      await Promise.all(updatePromises);

      // Step 3: Insert new preferred zones to server
      const insertPromises = preferredZones.map(async (mapZone) => {
        const existsInServer = existingPreferredZones.find(
          (serverZone) => serverZone.ID === mapZone.id
        );
        if (!existsInServer) {
          console.log(
            "DrawPreferredZone: Inserting new preferred zone to server:",
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
              `${SERVER_URL}/api/maps/addPreferredZone`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  mapId: mapId,
                  preferredZoneName:
                    mapZone.name || `PreferredZone-${mapZone.id}`,
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
              "DrawPreferredZone: Insert preferred zone response:",
              result
            );

            // Update preferred zone ID directly in this class if server returns new ID
            if (result && result.preferredZoneId) {
              const newServerId = result.preferredZoneId;
              // Find and update the preferred zone ID in our preferredZones array
              const preferredZoneIndex = this.preferredZones.findIndex(
                (fz) => fz.id === mapZone.id
              );
              if (preferredZoneIndex !== -1) {
                this.preferredZones[preferredZoneIndex].id = newServerId;
                console.log(
                  `DrawPreferredZone: Updated preferred zone ID from ${mapZone.id} to ${newServerId}`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error inserting preferred zone ${mapZone.id}:`,
              error
            );
          }
        }
      });
      await Promise.all(insertPromises);

      console.log("DrawPreferredZone: All preferred zones saved successfully");
    } catch (error) {
      console.error("DrawPreferredZone: Error saving to database:", error);
      throw error;
    }
  }
}

export { DrawPreferredZone };
