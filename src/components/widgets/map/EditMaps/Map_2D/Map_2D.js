import * as THREE from "three";
//import { callRosService } from '../../../../services/rosService';
import { DrawWall } from "./Toolbar/WallToolbar/drawWall.js"; // tool for drawing wall
import { EraserWall } from "./Toolbar/WallToolbar/eraserWall.js"; // tool for erasing wall
import { Buffer } from "buffer"; // for buffer map data
import { WallToolbar } from "./Toolbar/WallToolbar/WallToolbar.js"; // wall toolbar manager
import { FloorToolbar } from "./Toolbar/FloorToolbar/FloorToolbar.js"; // floor toolbar manager
import { FloorTool } from "./Toolbar/FloorToolbar/floorTool.js"; // floor tool
import { VirtualWallToolbar } from "./Toolbar/VirtualWallToolbar/VirtualWallToolbar.js"; // virtual wall toolbar manager
import { DrawVirtualWall } from "./Toolbar/VirtualWallToolbar/drawVirtualWall.js"; // tool for drawing virtual wall
import { ForbiddenZoneToolbar } from "./Toolbar/ForbiddenZoneToolbar/ForbiddenZoneToolbar.js"; // forbidden zone toolbar manager
import { DrawForbiddenZone } from "./Toolbar/ForbiddenZoneToolbar/drawForbiddenZone.js"; // tool for drawing forbidden zone
import { PreferredZoneToolbar } from "./Toolbar/PreferredZoneToolbar/PreferredZoneToolbar.js"; // preferred zone toolbar manager
import { DrawPreferredZone } from "./Toolbar/PreferredZoneToolbar/drawPreferredZone.js"; // tool for drawing preferred zone
import { UnpreferredZoneToolbar } from "./Toolbar/UnpreferredZoneToolbar/UnpreferredZoneToolbar.js"; // unpreferred zone toolbar manager
import { DrawUnpreferredZone } from "./Toolbar/UnpreferredZoneToolbar/drawUnpreferredZone.js"; // tool for drawing unpreferred zone
import { CriticalZoneToolbar } from "./Toolbar/CriticalZoneToolbar/CriticalZoneToolbar.js"; // critical zone toolbar manager
import { DrawCriticalZone } from "./Toolbar/CriticalZoneToolbar/drawCriticalZone.js"; // tool for drawing critical zone
import { PositionToolbar } from "./Toolbar/PositionToolbar/PositionToolbar.js"; // position toolbar manager
import { DrawPosition } from "./Toolbar/PositionToolbar/drawPosition.js"; // tool for drawing position
import { MarkersToolbar } from "./Toolbar/MarkersToolbar/MarkersToolbar.js"; // markers toolbar manager
import { DrawMarkers } from "./Toolbar/MarkersToolbar/drawMarkers.js"; // tool for drawing markers
import { Robot } from "./Robot/Robot.js"; // Robot class for managing robot visualization
import { NavigateToolbar } from "./Toolbar/NavigateToolbar/NavigateToolbar.js"; // Navigation toolbar
import { DrawPoseEstimate } from "./Toolbar/NavigateToolbar/drawPoseEstimate.js"; // tool for drawing pose estimate
import { DrawNavGoal } from "./Toolbar/NavigateToolbar/drawNavGoal.js"; // tool for drawing navigation goal
import { SERVER_URL } from "../../../../../config/serverConfig.js";

export class Map2D {
  constructor(container) {
    // Khởi tạo các thuộc tính cơ bản
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mapMesh = null;
    this.mapMeshOriginal = null;
    this.coordinateFrame = null;
    this.tfLaserToBase = null;

    // Map info
    this.mapInfo = {
      width: 0,
      height: 0,
      resolution: 0.05,
      origin: null,
      image: null,
      negate: 0,
      occupied_thresh: 0.65,
      free_thresh: 0.196,
    };

    // Map Settings
    this.MAP_SETTINGS = {
      ZOOM_STEP: 1.2, // Thay đổi thành hệ số nhân
      DEFAULT_ZOOM: 1.0,
      MIN_ZOOM: 0.1,
      MAX_ZOOM: 10.0,
    };

    // Trạng thái
    this.isFirstMap = true;
    this.currentZoom = this.MAP_SETTINGS.DEFAULT_ZOOM;
    this.isRunning = true;
    this.isInitialized = false;
    this.isClickPont = false;
    // Rotation properties
    this.isRotating = false;
    this.rotationCenter = new THREE.Vector2();
    this.currentRotation = 0;
    this.startAngle = 0;
    this.rotationDisplay = null;

    // Mouse modes
    this.MouseMode = {
      NONE: "none",
      PAN: "pan",
      ZOOM: "zoom",
      ZOOM_IN: "zoom_in",
      ZOOM_OUT: "zoom_out",
      SELECT: "select",
      ROTATE: "rotate",
      DRAW_LINE: "draw_line",
      ERASE: "erase",
      POINT: "pointer",
      CHECK: "check",
      CANCEL: "cancel",
      FLOOR_ERASER: "floor_eraser",
      FLOOR_POLYGON: "floor_polygon",
      DRAW_VIRTUAL_WALL: "draw_virtual_wall",
      SELECT_VIRTUAL_WALL: "select_virtual_wall",
      DRAW_FORBIDDEN_ZONE: "draw_forbidden_zone",
      SELECT_FORBIDDEN_ZONE: "select_forbidden_zone",
      DRAW_PREFERRED_ZONE: "draw_preferred_zone",
      SELECT_PREFERRED_ZONE: "select_preferred_zone",
      DRAW_UNPREFERRED_ZONE: "draw_unpreferred_zone",
      SELECT_UNPREFERRED_ZONE: "select_unpreferred_zone",
      DRAW_CRITICAL_ZONE: "draw_critical_zone",
      SELECT_CRITICAL_ZONE: "select_critical_zone",
      DRAW_POSITION: "draw_position",
      SELECT_POSITION: "select_position",
      DRAW_MARKER: "draw_marker",
      SELECT_MARKER: "select_marker",
      POSE_ESTIMATE: "pose_estimate",
      NAV_GOAL: "nav_goal",
    };
    this.currentMouseMode = this.MouseMode.NONE;

    // Tools
    this.toolDrawWall = null;
    this.toolEraserWall = null;
    this.toolFloorTool = null;
    this.toolDrawVirtualWall = null;
    this.toolDrawForbiddenZone = null;
    this.toolDrawPreferredZone = null;
    this.toolDrawUnpreferredZone = null;
    this.toolDrawCriticalZone = null;
    this.toolDrawPosition = null;
    this.toolDrawMarkers = null;
    this.toolDrawPoseEstimate = null;
    this.toolDrawNavGoal = null;

    // Wall Toolbar
    this.wallToolbar = null;

    // Floor Toolbar
    this.floorToolbar = null;

    // Virtual Wall Toolbar
    this.virtualWallToolbar = null;

    // Forbidden Zone Toolbar
    this.forbiddenZoneToolbar = null;

    // Preferred Zone Toolbar
    this.preferredZoneToolbar = null;

    // Unpreferred Zone Toolbar
    this.unpreferredZoneToolbar = null;

    // Critical Zone Toolbar
    this.criticalZoneToolbar = null;

    // Position Toolbar
    this.positionToolbar = null;

    // Markers Toolbar
    this.markersToolbar = null;

    // Navigate Toolbar
    this.navigateToolbar = null;

    // State tracking
    this.previousMouseMode = null;
    this.previousCursor = null;

    // Site info
    this.siteId = null;
    this.mapId = null;

    // Store container reference
    this.container = container;
    this.object_type = null;

    // Robot instance
    this.robot = null;

    // footprint
    this.robotFootprint = null;

    // texture
    this.robotTexture = null;

    // Default footprint (fallback)
    this.defaultFootprint = {
      points: [
        { x: -0.25, y: -0.25 },
        { x: 0.25, y: -0.25 },
        { x: 0.25, y: 0.25 },
        { x: -0.25, y: 0.25 },
      ],
    };

    this.navigationMode = false;
  }

  async fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        console.warn(
          `API attempt ${attempt} failed with status ${response.status}`
        );
      } catch (error) {
        console.warn(
          `API attempt ${attempt} failed with error:`,
          error.message
        );
      }

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed to fetch after ${maxRetries} attempts`);
  }

  async initialize() {
    try {
      if (!this.container) {
        console.error("No container provided for map initialization");
        return false;
      }

      // Initialize Three.js
      const success = this.initThreeJS();
      if (!success) {
        console.error("Failed to initialize Three.js");
        return false;
      }

      // Load robot settings only after successful initialization
      if (this.isInitialized) {
        await this.loadRobotSettings();
        console.log("loadRobotSettings completed successfully");

        // Update DrawPosition with new footprint and texture
        this.updateDrawPositionFootprint();
      }

      console.log("Map2D initialization completed successfully");
      return true;
    } catch (error) {
      console.error("Error during Map2D initialization:", error);
      this.isInitialized = false;
      return false;
    }
  }

  initThreeJS() {
    console.log("Starting ThreeJS initialization");

    try {
      // init scene
      this.scene = new THREE.Scene();
      if (!this.scene) {
        console.error("Failed to create scene");
        return false;
      }
      this.scene.background = new THREE.Color(0xf0f0f0);

      // get container size
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      console.log("Wid: ", width);
      console.log("Hei: ", height);

      if (!width || !height) {
        console.error("Invalid container dimensions:", { width, height });
        return false;
      }
      const aspect = width / height;
      // init camera with correct aspect ratio
      this.camera = new THREE.OrthographicCamera(
        -10 * aspect,
        10 * aspect,
        10,
        -10,
        0.1,
        1000
      );
      if (!this.camera) {
        console.error("Failed to create camera");
        return false;
      }
      this.camera.position.z = 10;
      this.currentZoom = this.MAP_SETTINGS.DEFAULT_ZOOM;

      // init renderer with container size
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        if (!this.renderer) {
          throw new Error("Failed to create WebGL renderer");
        }
        this.renderer.setSize(width, height);

        // add renderer to container
        this.container.appendChild(this.renderer.domElement);
        console.log("Renderer added to container");
      } catch (error) {
        console.error("Error creating renderer:", error);
        return false;
      }

      // update initial size
      this.handleResize();
      // Animation loop with 24fps limit for better performance
      // - Reduced from 60fps to 24fps to improve performance on low-end devices
      // - Still smooth enough for map visualization
      let lastFrameTime = 0;
      const targetFPS = 24;
      const frameInterval = 1000 / targetFPS; // ~41.67ms per frame

      const animate = () => {
        if (!this.isRunning || !this.renderer) return;

        const currentTime = performance.now();

        // Only render if enough time has passed (24fps)
        if (currentTime - lastFrameTime >= frameInterval) {
          // Render current frame
          this.renderer.render(this.scene, this.camera);
          lastFrameTime = currentTime;
        }

        // Schedule next frame
        requestAnimationFrame(animate);
      };

      // Start the animation loop
      animate();

      // init mouse mode selection
      this.initMouseModeSelection();

      // init wall toolbar
      this.wallToolbar = new WallToolbar(this);

      // init floor toolbar
      this.floorToolbar = new FloorToolbar(this);

      // init virtual wall toolbar
      this.virtualWallToolbar = new VirtualWallToolbar(this);

      // ForbiddenZoneToolbar is managed by React component tree, not instantiated here
      this.forbiddenZoneToolbar = new ForbiddenZoneToolbar(this);

      // PreferredZoneToolbar is managed by React component tree, not instantiated here
      this.preferredZoneToolbar = new PreferredZoneToolbar(this);

      // UnpreferredZoneToolbar is managed by React component tree, not instantiated here
      this.unpreferredZoneToolbar = new UnpreferredZoneToolbar(this);

      // CriticalZoneToolbar is managed by React component tree, not instantiated here
      this.criticalZoneToolbar = new CriticalZoneToolbar(this);

      // init position toolbar
      this.positionToolbar = new PositionToolbar(this);

      // init markers toolbar
      this.markersToolbar = new MarkersToolbar(this);

      // init navigate toolbar
      this.navigateToolbar = new NavigateToolbar(this);

      // set initialization flag
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error("Error initializing ThreeJS:", error);
      this.isInitialized = false;
      return false;
    }
  }

  // Handle window resize - update renderer and camera when container size changes
  // This ensures the map displays correctly when browser window is resized
  handleResize() {
    if (!this.renderer || !this.camera || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update renderer size to match container
    this.renderer.setSize(width, height);

    // Update camera aspect ratio to maintain proper perspective
    const aspect = width / height;
    this.camera.left = -this.camera.top * aspect;
    this.camera.right = this.camera.top * aspect;

    // Update camera projection matrix after changes
    this.camera.updateProjectionMatrix();
  }

  // Update camera zoom level with bounds checking
  // Ensures zoom stays within MIN_ZOOM and MAX_ZOOM limits
  updateZoom(zoom) {
    if (!this.camera) return;

    // Clamp zoom value between min and max bounds
    this.camera.zoom = Math.max(
      this.MAP_SETTINGS.MIN_ZOOM,
      Math.min(this.MAP_SETTINGS.MAX_ZOOM, zoom)
    );

    // Update camera projection matrix after zoom change
    this.camera.updateProjectionMatrix();
  }
  // Zoom out - decrease zoom level by ZOOM_STEP factor
  zoomOut() {
    if (!this.camera) return;

    this.updateZoom(this.camera.zoom / this.MAP_SETTINGS.ZOOM_STEP);
  }

  // Zoom in - increase zoom level by ZOOM_STEP factor
  zoomIn() {
    console.log("zoom in");
    if (!this.camera) return;
    this.updateZoom(this.camera.zoom * this.MAP_SETTINGS.ZOOM_STEP);
  }
  // reset view
  resetView() {
    if (this.mapMesh) {
      console.log("reset view with map mesh");
      this.fitViewToMap();
    } else {
      console.log("reset view without map mesh");
      // if no map, reset to default
      this.updateZoom(this.MAP_SETTINGS.DEFAULT_ZOOM);
      if (this.camera) {
        this.camera.position.x = 0;
        this.camera.position.y = 0;
      }
    }
    console.log("reset view");
  }

  // Clear map data and reset to initial state
  clearMap() {
    console.log("🧹 Clearing map data...");

    // Clear map mesh
    if (this.mapMesh) {
      this.scene.remove(this.mapMesh);
      if (this.mapMesh.geometry) this.mapMesh.geometry.dispose();
      if (this.mapMesh.material) {
        if (this.mapMesh.material.map) this.mapMesh.material.map.dispose();
        this.mapMesh.material.dispose();
      }
      this.mapMesh = null;
    }

    // Clear map data
    this.mapData = null;
    this.mapInfo = null;

    if (this.camera) {
      // Reset camera to default position
      this.camera.position.x = 0;
      this.camera.position.y = 0;
      this.updateZoom(this.MAP_SETTINGS.DEFAULT_ZOOM);
    }

    // Clear robot if exists
    if (this.robot) {
      this.robot.clear();
    }

    console.log("✅ Map cleared successfully");
  }

  initRotationDisplay() {
    // create element to display rotation
    this.rotationDisplay = document.createElement("div");
    this.rotationDisplay.className = "rotation-display";
    this.rotationDisplay.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            display: none;
            z-index: 1000;
        `;
    const container = this.renderer.domElement.parentElement;
    container.appendChild(this.rotationDisplay);
  }

  initMouseModeSelection() {
    if (
      !this.isInitialized ||
      !this.renderer /*|| !this.renderer.domElement*/
    ) {
      return;
    }
    const container = this.renderer.domElement;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // add event listener for mouse wheel
    container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (this.currentMouseMode === this.MouseMode.ZOOM) {
          if (e.deltaY < 0) {
            this.zoomIn();
          } else {
            this.zoomOut();
          }
        }
      },
      { passive: false }
    );

    container.addEventListener("mousedown", (e) => {
      if (e.buttons === 1) {
        // left click
        lastX = e.clientX;
        lastY = e.clientY;

        switch (this.currentMouseMode) {
          case this.MouseMode.PAN:
            isDragging = true;
            if (this.renderer && this.renderer.domElement) {
              this.renderer.domElement.style.cursor = "grabbing";
            }
            break;
          case this.MouseMode.ROTATE:
            this.startRotation(e.clientX, e.clientY);
            break;
          case this.MouseMode.DRAW_LINE:
            if (this.toolDrawWall) {
              this.toolDrawWall.mouseEventHandle(e.clientX, e.clientY);
            } else {
              console.log("toolDrawWall is null");
            }
            break;
          case this.MouseMode.ERASE:
            if (this.toolEraserWall) {
              this.toolEraserWall.startErase(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT:
            this.startSelect(e.clientX, e.clientY);
            break;
          case this.MouseMode.POINT:
            this.drawRectangleMesh(e.clientX, e.clientY);
            break;
          case this.MouseMode.CHECK:
            this.startCheck(e.clientX, e.clientY);
            break;
          case this.MouseMode.CANCEL:
            this.startCancel(e.clientX, e.clientY);
            break;
          case this.MouseMode.FLOOR_ERASER:
            if (this.toolFloorTool) {
              this.toolFloorTool.startErase(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.FLOOR_POLYGON:
            if (this.toolFloorTool) {
              this.toolFloorTool.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.DRAW_VIRTUAL_WALL:
            if (this.toolDrawVirtualWall) {
              this.toolDrawVirtualWall.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_VIRTUAL_WALL:
            if (this.toolDrawVirtualWall) {
              this.toolDrawVirtualWall.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.DRAW_FORBIDDEN_ZONE:
            if (this.toolDrawForbiddenZone) {
              this.toolDrawForbiddenZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_FORBIDDEN_ZONE:
            if (this.toolDrawForbiddenZone) {
              this.toolDrawForbiddenZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.DRAW_PREFERRED_ZONE:
            if (this.toolDrawPreferredZone) {
              this.toolDrawPreferredZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_PREFERRED_ZONE:
            if (this.toolDrawPreferredZone) {
              this.toolDrawPreferredZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.DRAW_UNPREFERRED_ZONE:
            if (this.toolDrawUnpreferredZone) {
              this.toolDrawUnpreferredZone.mouseEventHandle(
                e.clientX,
                e.clientY
              );
            }
            break;
          case this.MouseMode.SELECT_UNPREFERRED_ZONE:
            if (this.toolDrawUnpreferredZone) {
              this.toolDrawUnpreferredZone.mouseEventHandle(
                e.clientX,
                e.clientY
              );
            }
            break;
          case this.MouseMode.DRAW_CRITICAL_ZONE:
            if (this.toolDrawCriticalZone) {
              this.toolDrawCriticalZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_CRITICAL_ZONE:
            if (this.toolDrawCriticalZone) {
              this.toolDrawCriticalZone.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.DRAW_POSITION:
            // create tool for drawing position if not exist
            if (this.toolDrawPosition) {
              this.toolDrawPosition.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_POSITION:
            if (this.toolDrawPosition) {
              this.toolDrawPosition.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.POSE_ESTIMATE:
            if (this.toolDrawPoseEstimate) {
              this.toolDrawPoseEstimate.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.NAV_GOAL:
            if (this.toolDrawNavGoal) {
              this.toolDrawNavGoal.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
          case this.MouseMode.SELECT_MARKER:
            if (this.toolDrawMarkers) {
              this.toolDrawMarkers.mouseEventHandle(e.clientX, e.clientY);
            }
            break;
        }
      }
    });

    container.addEventListener("mousemove", (e) => {
      switch (this.currentMouseMode) {
        case this.MouseMode.PAN:
          {
            if (isDragging) {
              const deltaX = e.clientX - lastX;
              const deltaY = e.clientY - lastY;
              // Pan camera
              this.camera.position.x -= deltaX * 0.01 * this.currentZoom;
              this.camera.position.y += deltaY * 0.01 * this.currentZoom;
              // update last position
              lastX = e.clientX;
              lastY = e.clientY;
            }
          }
          break;
        case this.MouseMode.ROTATE:
          this.updateRotation(e.clientX, e.clientY);
          break;
        case this.MouseMode.DRAW_LINE:
          if (this.toolDrawWall) {
            this.toolDrawWall.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.ERASE:
          if (this.toolEraserWall) {
            if (this.toolEraserWall.state.isErasing) {
              this.toolEraserWall.updateErase(e.clientX, e.clientY);
            } else {
              this.toolEraserWall.updateEraserPosition(e.clientX, e.clientY);
            }
          }
          break;
        case this.MouseMode.SELECT:
          this.updateSelect(e.clientX, e.clientY);
          break;
        case this.MouseMode.CHECK:
          this.updateCheck(e.clientX, e.clientY);
          break;
        case this.MouseMode.CANCEL:
          this.updateCancel(e.clientX, e.clientY);
          break;
        case this.MouseMode.FLOOR_ERASER:
          if (this.toolFloorTool) {
            if (this.toolFloorTool.state.isErasing) {
              this.toolFloorTool.updateErase(e.clientX, e.clientY);
            } else {
              this.toolFloorTool.updateEraserPosition(e.clientX, e.clientY);
            }
          }
          break;
        case this.MouseMode.FLOOR_POLYGON:
          if (this.toolFloorTool) {
            this.toolFloorTool.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.DRAW_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.DRAW_FORBIDDEN_ZONE:
          if (this.toolDrawForbiddenZone) {
            this.toolDrawForbiddenZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_FORBIDDEN_ZONE:
          if (this.toolDrawForbiddenZone) {
            this.toolDrawForbiddenZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.DRAW_PREFERRED_ZONE:
          if (this.toolDrawPreferredZone) {
            this.toolDrawPreferredZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_PREFERRED_ZONE:
          if (this.toolDrawPreferredZone) {
            this.toolDrawPreferredZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.DRAW_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.updateNodePosition(
              e.clientX,
              e.clientY
            );
          }
          break;
        case this.MouseMode.SELECT_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.updateNodePosition(
              e.clientX,
              e.clientY
            );
          }
          break;
        case this.MouseMode.DRAW_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone) {
            this.toolDrawCriticalZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone) {
            this.toolDrawCriticalZone.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.DRAW_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.POSE_ESTIMATE:
          if (this.toolDrawPoseEstimate) {
            this.toolDrawPoseEstimate.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.NAV_GOAL:
          if (this.toolDrawNavGoal) {
            this.toolDrawNavGoal.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        case this.MouseMode.SELECT_MARKER:
          if (this.toolDrawMarkers) {
            this.toolDrawMarkers.updateNodePosition(e.clientX, e.clientY);
          }
          break;
        default:
          break;
      }
    });

    container.addEventListener("mouseup", () => {
      isDragging = false;
      if (
        this.currentMouseMode === this.MouseMode.PAN &&
        this.renderer &&
        this.renderer.domElement
      ) {
        this.renderer.domElement.style.cursor = "grab";
      }
      switch (this.currentMouseMode) {
        case this.MouseMode.ROTATE:
          this.stopRotation();
          break;
        case this.MouseMode.DRAW_LINE:
          if (this.toolDrawWall) {
            this.toolDrawWall.resetCursor();
          }
          break;
        case this.MouseMode.ERASE:
          if (this.toolEraserWall) {
            this.toolEraserWall.stopErase();
          }
          break;
        case this.MouseMode.SELECT:
          this.stopSelect();
          break;
        case this.MouseMode.CHECK:
          this.stopCheck();
          break;
        case this.MouseMode.CANCEL:
          this.stopCancel();
          break;
        case this.MouseMode.FLOOR_ERASER:
          if (this.toolFloorTool) {
            this.toolFloorTool.stopErase();
          }
          break;
        case this.MouseMode.FLOOR_POLYGON:
          if (this.toolFloorTool) {
            this.toolFloorTool.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_FORBIDDEN_ZONE:
          if (this.toolDrawForbiddenZone) {
            this.toolDrawForbiddenZone.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_FORBIDDEN_ZONE:
          if (this.toolDrawForbiddenZone) {
            this.toolDrawForbiddenZone.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_PREFERRED_ZONE:
          if (this.toolDrawPreferredZone) {
            this.toolDrawPreferredZone.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_PREFERRED_ZONE:
          if (this.toolDrawPreferredZone) {
            this.toolDrawPreferredZone.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone) {
            this.toolDrawCriticalZone.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone) {
            this.toolDrawCriticalZone.resetCursor();
          }
          break;
        case this.MouseMode.DRAW_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.resetCursor();
          }
          break;
        case this.MouseMode.SELECT_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.resetCursor();
          }
          break;
        case this.MouseMode.POSE_ESTIMATE:
          if (this.toolDrawPoseEstimate) {
            this.toolDrawPoseEstimate.stopDrag();
            this.toolDrawPoseEstimate.enableSelectMode();
          }
          break;
        case this.MouseMode.NAV_GOAL:
          if (this.toolDrawNavGoal) {
            this.toolDrawNavGoal.stopDrag();
            this.toolDrawNavGoal.enableSelectMode();
          }
          break;
        case this.MouseMode.SELECT_MARKER:
          if (this.toolDrawMarkers) {
            this.toolDrawMarkers.resetCursor();
          }
          break;
      }
    });

    container.addEventListener("mouseleave", () => {
      switch (this.currentMouseMode) {
        case this.MouseMode.ROTATE:
          this.stopRotation();
          break;
        case this.MouseMode.DRAW_LINE:
          //this.stopDrawLine();
          break;
        case this.MouseMode.ERASE:
          this.isErasing = false;
          if (this.eraserPreviewMesh) {
            this.eraserPreviewMesh.material.opacity = 0.3;
          }
          break;
        case this.MouseMode.SELECT:
          this.stopSelect();
          break;
        case this.MouseMode.CHECK:
          this.stopCheck();
          break;
        case this.MouseMode.CANCEL:
          this.stopCancel();
          break;
        case this.MouseMode.FLOOR_ERASER:
          if (this.toolFloorTool) {
            this.toolFloorTool.stopErase();
          }
          break;
        case this.MouseMode.FLOOR_POLYGON:
          break;
        case this.MouseMode.DRAW_VIRTUAL_WALL:
          break;
        case this.MouseMode.SELECT_VIRTUAL_WALL:
          break;
        case this.MouseMode.DRAW_FORBIDDEN_ZONE:
          break;
        case this.MouseMode.SELECT_FORBIDDEN_ZONE:
          break;
        case this.MouseMode.DRAW_POSITION:
          break;
        case this.MouseMode.SELECT_POSITION:
          break;
        case this.MouseMode.POSE_ESTIMATE:
          if (this.toolDrawPoseEstimate) {
            this.toolDrawPoseEstimate.stopDrag();
          }
          break;
        case this.MouseMode.NAV_GOAL:
          if (this.toolDrawNavGoal) {
            this.toolDrawNavGoal.stopDrag();
          }
          break;
        case this.MouseMode.SELECT_MARKER:
          break;
      }
    });

    // Touch events - Full mouse functionality support
    container.addEventListener(
      "touchstart",
      (e) => {
        console.log("Map2D: touchstart-------------------------", e);
        e.preventDefault();
        if (e.touches.length === 1) {
          const touch = e.touches[0];

          // Handle different mouse modes with touch
          switch (this.currentMouseMode) {
            case this.MouseMode.PAN:
              isDragging = true;
              lastX = touch.clientX;
              lastY = touch.clientY;
              if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.cursor = "grabbing";
              }
              break;
            case this.MouseMode.ROTATE:
              this.startRotation(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.DRAW_LINE:
              if (this.toolDrawWall) {
                this.toolDrawWall.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              } else {
                console.log("toolDrawWall is null");
              }
              break;
            case this.MouseMode.ERASE:
              if (this.toolEraserWall) {
                this.toolEraserWall.startErase(touch.clientX, touch.clientY);
              }
              break;
            case this.MouseMode.SELECT:
              this.startSelect(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.POINT:
              this.drawRectangleMesh(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.CHECK:
              this.startCheck(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.CANCEL:
              this.startCancel(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.FLOOR_ERASER:
              if (this.toolFloorTool) {
                this.toolFloorTool.startErase(touch.clientX, touch.clientY);
              }
              break;
            case this.MouseMode.FLOOR_POLYGON:
              if (this.toolFloorTool) {
                this.toolFloorTool.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_POSITION:
              // create tool for drawing position if not exist
              if (this.toolDrawPosition) {
                this.toolDrawPosition.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_POSITION:
              if (this.toolDrawPosition) {
                this.toolDrawPosition.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.POSE_ESTIMATE:
              if (this.toolDrawPoseEstimate) {
                this.toolDrawPoseEstimate.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.NAV_GOAL:
              if (this.toolDrawNavGoal) {
                this.toolDrawNavGoal.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_MARKER:
              if (this.toolDrawMarkers) {
                this.toolDrawMarkers.mouseEventHandle(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
          }
        }
      },
      { passive: false }
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          const touch = e.touches[0];

          // Handle touch move for all mouse modes
          switch (this.currentMouseMode) {
            case this.MouseMode.PAN:
              if (isDragging) {
                const deltaX = touch.clientX - lastX;
                const deltaY = touch.clientY - lastY;
                this.camera.position.x -= deltaX * 0.01;
                this.camera.position.y += deltaY * 0.01;
                lastX = touch.clientX;
                lastY = touch.clientY;
              }
              break;
            case this.MouseMode.ROTATE:
              this.updateRotation(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.DRAW_LINE:
              if (this.toolDrawWall) {
                this.toolDrawWall.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.ERASE:
              if (this.toolEraserWall) {
                if (this.toolEraserWall.state.isErasing) {
                  this.toolEraserWall.updateErase(touch.clientX, touch.clientY);
                } else {
                  this.toolEraserWall.updateEraserPosition(
                    touch.clientX,
                    touch.clientY
                  );
                }
              }
              break;
            case this.MouseMode.SELECT:
              this.updateSelect(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.CHECK:
              this.updateCheck(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.CANCEL:
              this.updateCancel(touch.clientX, touch.clientY);
              break;
            case this.MouseMode.FLOOR_ERASER:
              if (this.toolFloorTool) {
                if (this.toolFloorTool.state.isErasing) {
                  this.toolFloorTool.updateErase(touch.clientX, touch.clientY);
                } else {
                  this.toolFloorTool.updateEraserPosition(
                    touch.clientX,
                    touch.clientY
                  );
                }
              }
              break;
            case this.MouseMode.FLOOR_POLYGON:
              if (this.toolFloorTool) {
                this.toolFloorTool.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.DRAW_POSITION:
              if (this.toolDrawPosition) {
                this.toolDrawPosition.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_POSITION:
              if (this.toolDrawPosition) {
                this.toolDrawPosition.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.POSE_ESTIMATE:
              if (this.toolDrawPoseEstimate) {
                this.toolDrawPoseEstimate.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.NAV_GOAL:
              if (this.toolDrawNavGoal) {
                this.toolDrawNavGoal.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            case this.MouseMode.SELECT_MARKER:
              if (this.toolDrawMarkers) {
                this.toolDrawMarkers.updateNodePosition(
                  touch.clientX,
                  touch.clientY
                );
              }
              break;
            default:
              break;
          }
        }
      },
      { passive: false }
    );

    container.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (e.touches.length === 0) {
          // Handle touch end for all mouse modes
          switch (this.currentMouseMode) {
            case this.MouseMode.ROTATE:
              this.stopRotation();
              break;
            case this.MouseMode.DRAW_LINE:
              if (this.toolDrawWall) {
                this.toolDrawWall.resetCursor();
              }
              break;
            case this.MouseMode.ERASE:
              if (this.toolEraserWall) {
                this.toolEraserWall.stopErase();
              }
              break;
            case this.MouseMode.SELECT:
              this.stopSelect();
              break;
            case this.MouseMode.CHECK:
              this.stopCheck();
              break;
            case this.MouseMode.CANCEL:
              this.stopCancel();
              break;
            case this.MouseMode.FLOOR_ERASER:
              if (this.toolFloorTool) {
                this.toolFloorTool.stopErase();
              }
              break;
            case this.MouseMode.FLOOR_POLYGON:
              if (this.toolFloorTool) {
                this.toolFloorTool.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_VIRTUAL_WALL:
              if (this.toolDrawVirtualWall) {
                this.toolDrawVirtualWall.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_FORBIDDEN_ZONE:
              if (this.toolDrawForbiddenZone) {
                this.toolDrawForbiddenZone.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_PREFERRED_ZONE:
              if (this.toolDrawPreferredZone) {
                this.toolDrawPreferredZone.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_UNPREFERRED_ZONE:
              if (this.toolDrawUnpreferredZone) {
                this.toolDrawUnpreferredZone.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_CRITICAL_ZONE:
              if (this.toolDrawCriticalZone) {
                this.toolDrawCriticalZone.resetCursor();
              }
              break;
            case this.MouseMode.DRAW_POSITION:
              if (this.toolDrawPosition) {
                this.toolDrawPosition.resetCursor();
              }
              break;
            case this.MouseMode.SELECT_POSITION:
              if (this.toolDrawPosition) {
                this.toolDrawPosition.resetCursor();
              }
              break;
            case this.MouseMode.POSE_ESTIMATE:
              if (this.toolDrawPoseEstimate) {
                this.toolDrawPoseEstimate.stopDrag();
                this.toolDrawPoseEstimate.enableSelectMode();
              }
              break;
            case this.MouseMode.NAV_GOAL:
              if (this.toolDrawNavGoal) {
                this.toolDrawNavGoal.stopDrag();
                this.toolDrawNavGoal.enableSelectMode();
              }
              break;
            case this.MouseMode.SELECT_MARKER:
              if (this.toolDrawMarkers) {
                this.toolDrawMarkers.resetCursor();
              }
              break;
          }
        }
      },
      { passive: false }
    );

    // Prevent context menu
    container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  // Method để xử lý touch click trên map
  handleTouchClick(clientX, clientY) {
    this.isClickPont = true;

    // Chuyển đổi tọa độ click sang tọa độ world
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    const y = -((clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    // Tạo raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, this.camera);

    // Kiểm tra intersection với map mesh (chỉ khi mapMesh tồn tại)
    if (this.mapMesh) {
      const intersects = raycaster.intersectObject(this.mapMesh);
      if (intersects.length > 0) {
        const point = intersects[0].point;

        // Xử lý click dựa trên current mouse mode
        switch (this.currentMouseMode) {
          case this.MouseMode.DRAW_POSITION:
            if (this.toolDrawPosition) {
              this.toolDrawPosition.handleClick(point);
            }
            break;
          case this.MouseMode.DRAW_NAV_GOAL:
            if (this.toolDrawNavGoal) {
              this.toolDrawNavGoal.handleClick(point);
            }
            break;
          case this.MouseMode.DRAW_POSE_ESTIMATE:
            if (this.toolDrawPoseEstimate) {
              this.toolDrawPoseEstimate.handleClick(point);
            }
            break;
          case this.MouseMode.DRAW_MARKER:
            if (this.toolDrawMarker) {
              this.toolDrawMarker.handleClick(point);
            }
            break;
          case this.MouseMode.SELECT_POSITION:
            if (this.toolDrawPosition) {
              this.toolDrawPosition.handleSelectClick(point);
            }
            break;
          case this.MouseMode.SELECT_NAV_GOAL:
            if (this.toolDrawNavGoal) {
              this.toolDrawNavGoal.handleSelectClick(point);
            }
            break;
          case this.MouseMode.SELECT_POSE_ESTIMATE:
            if (this.toolDrawPoseEstimate) {
              this.toolDrawPoseEstimate.handleSelectClick(point);
            }
            break;
          case this.MouseMode.SELECT_MARKER:
            if (this.toolDrawMarker) {
              this.toolDrawMarker.handleSelectClick(point);
            }
            break;
          default:
            // Default click handling
            break;
        }
      }
    } else {
      console.log("Map mesh not available for touch click detection");
    }
  }

  startRotation(x, y) {
    this.isRotating = true;

    // Lấy vị trí click trong không gian world
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = ((x - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((y - rect.top) / rect.height) * 2 + 1;

    // Tạo raycaster để lấy điểm click trên map
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    // Kiểm tra intersection với map mesh (chỉ khi mapMesh tồn tại)
    if (this.mapMesh) {
      const intersects = raycaster.intersectObject(this.mapMesh);
      if (intersects.length > 0) {
        // Lưu điểm click làm tâm xoay
        this.rotationCenter = intersects[0].point;
      } else {
        // Nếu không click trúng map, lấy center của map làm tâm
        this.rotationCenter = this.mapMesh.position.clone();
      }
    } else {
      // Nếu không có map mesh, sử dụng tọa độ mặc định
      this.rotationCenter = new THREE.Vector2(0, 0);
    }

    // Lưu góc bắt đầu
    const centerScreenX = this.rotationCenter.project(this.camera).x;
    const centerScreenY = this.rotationCenter.project(this.camera).y;
    this.startAngle =
      Math.atan2(
        y - ((centerScreenY + 1) / 2) * rect.height,
        x - ((centerScreenX + 1) / 2) * rect.width
      ) *
      (180 / Math.PI);

    // Hiển thị rotation display
    this.rotationDisplay.style.display = "block";
    this.rotationDisplay.textContent = `${Math.round(this.currentRotation)}°`;
  }

  // startTouchRotation method removed - touch events disabled for performance

  updateRotation(x, y) {
    if (!this.isRotating) return;

    // Chuyển đổi tọa độ center sang screen space
    const rect = this.renderer.domElement.getBoundingClientRect();
    const centerScreenPos = this.rotationCenter.clone().project(this.camera);
    const centerX = ((centerScreenPos.x + 1) / 2) * rect.width;
    const centerY = ((centerScreenPos.y + 1) / 2) * rect.height;

    // Tính góc hiện tại
    const currentAngle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);

    // Tính delta angle
    const deltaAngle = currentAngle - this.startAngle;
    this.currentRotation = (this.currentRotation + deltaAngle) % 360;
    this.startAngle = currentAngle;

    // Xoay map quanh điểm click
    if (this.mapMesh) {
      // Lưu vị trí gốc
      const originalPosition = this.mapMesh.position.clone();

      // Di chuyển tâm xoay về gốc tọa độ
      this.mapMesh.position.sub(this.rotationCenter);

      // Xoay
      this.mapMesh.rotation.z = THREE.MathUtils.degToRad(this.currentRotation);

      // Di chuyển lại vị trí ban đầu
      this.mapMesh.position.add(this.rotationCenter);
    }

    // Cập nhật hiển thị góc
    this.rotationDisplay.textContent = `${Math.round(this.currentRotation)}°`;
  }

  // updateTouchRotation method removed - touch events disabled for performance

  stopRotation() {
    this.isRotating = false;
    setTimeout(() => {
      if (!this.isRotating) {
        this.rotationDisplay.style.display = "none";
      }
    }, 1500);
  }

  getAngle(x, y) {
    return (
      Math.atan2(y - this.rotationCenter.y, x - this.rotationCenter.x) *
      (180 / Math.PI)
    );
  }

  /**
   * Load robot footprint from server data
   * @param {Object} footprintData - Footprint data from server
   */
  async loadFootprint(footprintData) {
    try {
      if (
        footprintData &&
        footprintData.Footprint &&
        Array.isArray(footprintData.Footprint)
      ) {
        this.robotFootprint = {
          points: footprintData.Footprint.map((point) => ({
            x: parseFloat(point[0]),
            y: parseFloat(point[1]),
          })),
        };
        console.log("Robot footprint loaded:", this.robotFootprint);
      } else {
        console.warn("Invalid footprint data, using default");
        this.robotFootprint = this.defaultFootprint;
      }
    } catch (error) {
      console.error("Error loading robot footprint:", error);
      this.robotFootprint = this.defaultFootprint;
    }
  }

  /**
   * Load robot texture
   * @param {string} texturePath - Path to robot texture image
   */
  async loadTexture(texturePath = "/assets/nturobot_icon.png") {
    try {
      const textureLoader = new THREE.TextureLoader();
      this.robotTexture = await new Promise((resolve, reject) => {
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
      console.log("Robot texture loaded successfully");
    } catch (error) {
      console.error("Error loading robot texture:", error);
      this.robotTexture = null;
    }
  }

  async loadRobotSettings() {
    try {
      // Create robot instance
      this.robot = new Robot(this.scene, this.camera, this.renderer);

      // Load robot footprint
      const response = await this.fetchWithRetry(
        `${SERVER_URL}/api/settings/footprint`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
        3
      );

      const data = await response.json();

      if (data.success && data.data && data.data.properties) {
        const footprintData = data.data.properties;

        // Load TF laser to base data
        let tfData = null;
        try {
          const tfResponse = await this.fetchWithRetry(
            `${SERVER_URL}/api/settings/tf_laser_to_base`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
            3
          );

          const tfResult = await tfResponse.json();
          console.log("data tf_laser_to_base", tfResult);

          if (tfResult.success && tfResult.data && tfResult.data.properties) {
            tfData = tfResult.data.properties;
          }
        } catch (error) {
          console.error("Error loading TF data:", error);
        }

        // Initialize robot with footprint, texture, and TF data
        await this.robot.initialize(
          footprintData,
          "/assets/nturobot_icon.png",
          tfData
        );
        // console.log('Robot initialized with footprint, texture, and TF data');

        // load footprint
        await this.loadFootprint(footprintData);
        // load texture
        await this.loadTexture("/assets/robot-icon.png");
      } else {
        console.warn("Footprint data not found, initializing with default");
        await this.robot.initialize();
      }

      // Update DrawPosition with new footprint and texture
      this.updateDrawPositionFootprint();
    } catch (error) {
      console.error("Error loading robot settings:", error);
      // Initialize robot with defaults if loading fails
      if (!this.robot) {
        this.robot = new Robot(this.scene, this.camera, this.renderer);
        await this.robot.initialize();
      }
    }
  }

  // Thêm phương thức để xử lý click trên map
  initMapClickHandler() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("click", (event) => {
      this.isClickPont = true;
      // Chuyển đổi tọa độ click sang tọa độ world
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

      // Tạo raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, this.camera);

      // Kiểm tra intersection với map mesh (chỉ khi mapMesh tồn tại)
      if (this.mapMesh) {
        const intersects = raycaster.intersectObject(this.mapMesh);
        if (intersects.length > 0) {
          const point = intersects[0].point;
        }
      } else {
        console.log("Map mesh not available for click detection");
      }
    });
  }

  fitCameraToMap() {
    this.fitViewToMap();

    return;

    if (!this.mapMesh || !this.mapInfo || this.mapInfo.width === 0) return;

    const mapWidthMeters = this.mapInfo.width * this.mapInfo.resolution;
    const mapHeightMeters = this.mapInfo.height * this.mapInfo.resolution;

    // Di chuyển camera đến trung tâm của bản đồ
    this.camera.position.x =
      this.mapInfo.origin.position.x + mapWidthMeters / 2;
    this.camera.position.y =
      this.mapInfo.origin.position.y + mapHeightMeters / 2;

    const aspect = this.camera.right / this.camera.top; // Lấy tỷ lệ từ camera đã được resize đúng
    const mapAspect = mapWidthMeters / mapHeightMeters;

    // Tính toán zoom để vừa khít
    if (aspect > mapAspect) {
      // Fit theo chiều cao
      this.camera.top = mapHeightMeters / 2;
    } else {
      // Fit theo chiều rộng
      this.camera.top = mapWidthMeters / aspect / 2;
    }

    this.camera.bottom = -this.camera.top;
    this.camera.left = -this.camera.top * aspect;
    this.camera.right = this.camera.top * aspect;

    this.camera.zoom = 1; // Reset zoom vì đã điều chỉnh frustum
    this.camera.updateProjectionMatrix();
  }

  updateMapFromSLAM(message) {
    if (!this.isInitialized) {
      console.error("Cannot update map - not initialized");
      return;
    }
    // Handle different message formats
    let mapInfo = null;
    let mapData = null;

    // Check if this is a ROS nav_msgs/OccupancyGrid message
    if (message.header && message.info && Array.isArray(message.data)) {
      // console.log('Processing ROS nav_msgs/OccupancyGrid message format');

      // Extract map info from the message
      mapInfo = {
        width: message.info.width || 0,
        height: message.info.height || 0,
        resolution: message.info.resolution || 0.05,
        origin: message.info.origin || {
          position: { x: 0, y: 0 },
          orientation: { z: 0 },
        },
      };

      // Use the data array as map data
      mapData = message.data;
    }
    // Check if this is a ROS standard message (header + data array)
    else if (message.header && Array.isArray(message.data)) {
      // console.log('Processing ROS standard message format');

      // For ROS standard messages, we need to parse the data array
      // The data array contains the map information in a specific format
      if (message.data.length < 2) {
        console.error("Invalid ROS message - data array too short");
        return;
      }

      // First element should be map info, second element should be map data
      const infoData = message.data[0];
      const mapDataArray = message.data[1];

      if (!infoData || !mapDataArray) {
        console.error("Invalid ROS message - missing info or map data");
        return;
      }

      // Parse map info from the first data element
      mapInfo = {
        width: infoData.width || 0,
        height: infoData.height || 0,
        resolution: infoData.resolution || 0.05,
        origin: infoData.origin || {
          position: { x: 0, y: 0 },
          orientation: { z: 0 },
        },
      };

      // Use the second data element as map data
      mapData = mapDataArray;
    }
    // Check if this is a SLAM message (direct data structure)
    else if (message.data && message.data.info && message.data.mapData) {
      // console.log('Processing SLAM message format');
      mapInfo = message.data.info;
      mapData = message.data.mapData;
    }
    // Check if this is a server message (nested data structure)
    else if (message.info && message.mapData) {
      // console.log('Processing server message format');

      // Info object validation
      if (!message.info.data) {
        console.error("Invalid map message - info.data is null or undefined");
        return;
      }

      const buffer = Buffer.from(message.info.data);

      // Convert buffer to string and split into lines
      const bufferString = buffer.toString("utf-8");

      // console.log("string buff :",bufferString.toString('utf-8'));
      const lines = bufferString.split("\n");

      // Parse each line into key-value pairs
      mapInfo = {};
      lines.forEach((line) => {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith("#")) return;

        // Split line into key and value
        const [key, ...valueParts] = line.split(":");
        if (!key || !valueParts.length) return;

        const value = valueParts.join(":").trim();

        // Handle different value types
        switch (key.trim()) {
          case "width":
          case "height":
          case "resolution":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "origin":
            // Parse array format [x, y, z]
            const originValues = value
              .replace(/[\[\]]/g, "")
              .split(",")
              .map((v) => parseFloat(v.trim()));
            mapInfo[key.trim()] = {
              position: {
                x: originValues[0],
                y: originValues[1],
              },
              orientation: {
                z: originValues[2] || 0,
              },
            };
            break;
          case "occupied_thresh":
          case "free_thresh":
          case "negate":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "image":
            mapInfo[key.trim()] = value;
            break;
          default:
            mapInfo[key.trim()] = value;
        }
      });

      // Check if mapData exists and has data property
      if (!message.mapData || !message.mapData.data) {
        console.error(
          "Invalid map message - mapData or mapData.data is null or undefined"
        );
        return;
      }

      const bufferMapdata = Buffer.from(message.mapData.data);
      // Remove the subarray extraction and directly use the buffer data
      const bufferMapdataString = bufferMapdata.toString("utf-8");

      //  Parse the map data directly from the buffer
      const mapDataArray = new Uint8Array(bufferMapdata);
      // Create a new array starting from index 41 to the end
      const newMapDataArray = mapDataArray.slice(41, mapDataArray.length);

      // console.log("message.mapData :", message.mapData);

      // Convert get info Width, height, resolution
      const headerMapdata = bufferMapdataString.split("255");
      // const linemapResult = linesMapdata.pop();
      const headerSplitMapdata = headerMapdata[0].split(" ");
      // Get Real Data
      const mapWidth = headerSplitMapdata[4].split("\n")[1];
      const mapHeight = headerSplitMapdata[5];
      const mapResolution = headerSplitMapdata[3];
      // Convert type data
      mapInfo["width"] = parseFloat(mapWidth);
      mapInfo["height"] = parseFloat(mapHeight);
      mapInfo["resolution"] = parseFloat(mapResolution);
      // Set to info and mapdata
      mapData = newMapDataArray;
    } else {
      console.error("Invalid map message format - unrecognized format");
      console.error("Message structure:", {
        hasHeader: !!message.header,
        hasInfo: !!message.info,
        hasData: !!message.data,
        dataType: message.data ? typeof message.data : "undefined",
        isDataArray: message.data ? Array.isArray(message.data) : false,
        hasMapData: !!message.mapData,
      });

      // Try to extract map data from any available structure
      if (message.data && typeof message.data === "object") {
        // console.log('Attempting to extract map data from message.data object');

        // Look for common map properties in the data object
        if (
          message.data.width &&
          message.data.height &&
          message.data.resolution
        ) {
          console.log("Found map info in message.data");
          mapInfo = {
            width: message.data.width,
            height: message.data.height,
            resolution: message.data.resolution,
            origin: message.data.origin || {
              position: { x: 0, y: 0 },
              orientation: { z: 0 },
            },
          };

          // Look for map data in various possible locations
          if (message.data.data && Array.isArray(message.data.data)) {
            mapData = message.data.data;
          } else if (
            message.data.mapData &&
            Array.isArray(message.data.mapData)
          ) {
            mapData = message.data.mapData;
          } else if (message.data.image && Array.isArray(message.data.image)) {
            mapData = message.data.image;
          }
        }
      }

      if (!mapInfo || !mapData) {
        console.error("Could not extract map data from message");
        return;
      }
    }

    // Required properties validation
    const requiredProps = ["width", "height", "resolution", "origin"];
    const missingProps = requiredProps.filter(
      (prop) => !mapInfo.hasOwnProperty(prop)
    );

    if (missingProps.length > 0) {
      console.error(
        "Invalid map info - missing required properties:",
        missingProps
      );
      console.error("Available info properties:", Object.keys(mapInfo));
      return;
    }

    // Validate property values
    if (!Number.isFinite(mapInfo.width) || mapInfo.width <= 0) {
      console.error("Invalid width value:", mapInfo.width);
      return;
    }
    if (!Number.isFinite(mapInfo.height) || mapInfo.height <= 0) {
      console.error("Invalid height value:", mapInfo.height);
      return;
    }
    if (!Number.isFinite(mapInfo.resolution) || mapInfo.resolution <= 0) {
      console.error("Invalid resolution value:", mapInfo.resolution);
      return;
    }

    // Lưu thông tin map
    this.mapInfo.width = mapInfo.width;
    this.mapInfo.height = mapInfo.height;
    this.mapInfo.resolution = mapInfo.resolution;
    this.mapInfo.origin = mapInfo.origin;
    this.mapInfo.image = mapInfo.image;

    // Tính toán kích thước thực của map (mét)
    const mapWidthMeters = this.mapInfo.width * this.mapInfo.resolution;
    const mapHeightMeters = this.mapInfo.height * this.mapInfo.resolution;

    // Tạo geometry cho map
    const geometry = new THREE.PlaneGeometry(mapWidthMeters, mapHeightMeters);

    // Tạo texture từ map data
    const data = new Uint8Array(this.mapInfo.width * this.mapInfo.height * 4);

    // Process map data
    let occupiedCount = 0;
    let freeCount = 0;
    let unknownCount = 0;

    // Validate map data size
    const expectedSize = this.mapInfo.width * this.mapInfo.height;
    if (!mapData || mapData.length !== expectedSize) {
      console.error("Invalid map data size:", {
        actual: mapData ? mapData.length : "null/undefined",
        expected: expectedSize,
        width: this.mapInfo.width,
        height: this.mapInfo.height,
      });
      return;
    }

    // Sử dụng 2 vòng lặp để duyệt qua width và height
    for (let y = 0; y < this.mapInfo.height; y++) {
      for (let x = 0; x < this.mapInfo.width; x++) {
        const i = y * this.mapInfo.width + x;
        const value = mapData[i];

        // Tính toán index trong texture
        const textureX = x;
        const textureY = y;
        const pixelIndex = (textureY * this.mapInfo.width + textureX) * 4;

        // Set màu sắc dựa trên giá trị occupancy
        // Cartographer SLAM format:
        // -1 = Unknown, 0 = Free, 100 = Occupied (standard)
        // But Cartographer might use different values like 254 for occupied
        let color;
        if (value < 0) {
          color = [128, 128, 128, 255]; // Unknown - xám
        } else if (value === 0) {
          color = [255, 255, 255, 255]; // Free - trắng
          freeCount++;
        } else if (value >= 50) {
          // Handle intermediate values (1-100) as occupied with varying intensity
          color = [0, 0, 0, 255];
          occupiedCount++;
        } else {
          // Fallback for any other values - treat as unknown
          color = [255, 255, 255, 255];
        }

        // Gán màu vào texture
        data[pixelIndex] = color[0]; // R
        data[pixelIndex + 1] = color[1]; // G
        data[pixelIndex + 2] = color[2]; // B
        data[pixelIndex + 3] = color[3]; // A
      }
    }

    // Tạo texture
    const texture = new THREE.DataTexture(
      data,
      this.mapInfo.width,
      this.mapInfo.height,
      THREE.RGBAFormat
    );
    texture.needsUpdate = true;

    // Tạo material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Tạo hoặc cập nhật mesh
    if (this.mapMesh) {
      console.log("Removing existing map mesh");
      this.scene.remove(this.mapMesh);
    }

    this.mapMesh = new THREE.Mesh(geometry, material);
    // console.log("this.mapMesh :",this.mapMesh);
    // Đặt vị trí của map dựa trên origin
    this.mapMesh.position.x =
      this.mapInfo.origin.position.x + mapWidthMeters / 2;
    this.mapMesh.position.y =
      this.mapInfo.origin.position.y + mapHeightMeters / 2;

    // console.log('Map mesh position:', {
    //     x: this.mapMesh.position.x,
    //     y: this.mapMesh.position.y
    // });

    // Thêm mesh vào scene
    this.scene.add(this.mapMesh);
    // console.log('New map mesh added to scene');

    // Update mapMesh reference in DrawPosition tool
    if (this.toolDrawPosition) {
      this.toolDrawPosition.updateMapMesh(this.mapMesh);
      // console.log('Updated mapMesh reference in DrawPosition tool');
    }

    // Rotate map mesh 180 degrees around x-axis
    //this.mapMesh.rotation.x = Math.PI; // 180 degrees in radians

    // Fit camera to map
    this.fitCameraToMap();
    console.log("Camera fitted to map");

    // Lưu bản sao của map mesh gốc
    this.mapMeshOriginal = this.mapMesh.clone();

    // Thêm coordinate frame
    this.addCoordinateFrame();

    // Chỉ fit camera khi đây là lần đầu nhận map
    if (this.isFirstMap) {
      console.log("First map received, fitting camera");
      const container = this.renderer.domElement.parentElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      this.renderer.setSize(width, height);
      this.fitCameraToMap();
      this.isFirstMap = false;
    }

    console.log("Setting map mesh to forbidden zone");
    // this.toolDrawFobiddentzone = this.toolDrawFobiddentzone;
    // set map mesh to forbidden zone
    console.log("this.toolDrawForbiddenZone :", this.toolDrawForbiddenZone);
    if (this.toolDrawForbiddenZone) {
      console.log("this.mapMesh : ===", this.mapMesh);
      //this.toolDrawForbiddenZone.setMap(this.mapMesh, this.mapInfo);
    }
    // this.mapMesh.rotation.x=90;
  }

  parsePgmData(bufferData) {
    try {
      // Chuyển toàn bộ buffer sang string để đọc header
      const buffer = Buffer.from(bufferData);
      const text = buffer.toString("utf-8");

      // Tách header và data dựa trên ký tự xuống dòng đầu tiên sau giá trị màu tối đa
      const lines = text.split("\n");
      let headerLines = 0;
      const headerValues = [];

      for (const line of lines) {
        headerLines++;
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("#")) {
          // Bỏ qua các dòng comment
          continue;
        }
        // Tách các giá trị trong dòng bởi khoảng trắng
        headerValues.push(...trimmedLine.split(/\s+/).filter((v) => v));

        // Một header P5 hợp lệ sẽ có 4 phần: "P5", width, height, max_value
        if (headerValues.length >= 4) {
          break;
        }
      }

      if (headerValues.length < 4 || headerValues[0] !== "P5") {
        console.error("Invalid PGM header format.");
        return null;
      }

      const mapInfo = {
        width: parseInt(headerValues[1], 10),
        height: parseInt(headerValues[2], 10),
      };

      // Tìm vị trí bắt đầu của dữ liệu hình ảnh (ngay sau header)
      let dataStartIndex = 0;
      let newlineCount = 0;
      for (let i = 0; i < bufferData.length; i++) {
        if (bufferData[i] === 10) {
          // Ký tự xuống dòng (newline)
          newlineCount++;
          if (newlineCount === headerLines) {
            dataStartIndex = i + 1;
            break;
          }
        }
      }
      let mapData = null;

      const imageData = new Uint8Array(bufferData.slice(dataStartIndex));

      // Kiểm tra lại kích thước dữ liệu
      if (imageData.length !== mapInfo.width * mapInfo.height) {
        console.warn(
          "Map data size does not match header dimensions. There might be extra metadata."
        );
        // Cố gắng cắt lại nếu có thể
        if (imageData.length > mapInfo.width * mapInfo.height) {
          const trimmedData = imageData.slice(
            0,
            mapInfo.width * mapInfo.height
          );
          mapData = trimmedData;
          return { info: mapInfo, data: trimmedData };
        }
      }

      mapData = imageData;
      return { info: mapInfo, data: imageData };
    } catch (e) {
      console.error("Error parsing PGM data:", e);
      return null;
    }
  }

  parseMapData(mapInfo, mapData) {
    let data = new Uint8Array(mapInfo.width * mapInfo.height * 4);
    // Sử dụng 2 vòng lặp để duyệt qua width và height của bản đồ gốc
    for (let y = 0; y < mapInfo.height; y++) {
      for (let x = 0; x < mapInfo.width; x++) {
        // Index trong mảng mapData 1 chiều (hàng-trước)
        const i = y * mapInfo.width + x;
        const value = mapData[i];

        // ==================================================================
        // ==                         SỬA LỖI Ở ĐÂY                        ==
        // ==================================================================

        // 1. SỬA LỖI TÍNH TOÁN TỌA ĐỘ:
        // Đảo ngược trục Y một cách chính xác. Tọa độ Y của texture (top-left)
        // được tính bằng (chiều cao - 1 - tọa độ y của bản đồ).
        const textureY = mapInfo.height - 1 - y;
        const pixelIndex = (textureY * mapInfo.width + x) * 4;

        let color;
        // 2. SỬA LỖI LOGIC MÀU SẮC:
        // Ánh xạ lại màu sắc cho đúng với tiêu chuẩn của ROS.
        if (value < 0 || value === 205) {
          // Giá trị -1 (unknown) trong ROS OccupancyGrid, hoặc 205 trong PGM
          // thường được dùng cho vùng không xác định.
          color = [205, 205, 205, 255]; // Unknown - Xám nhạt
        } else if (value === 0) {
          // Giá trị 0 là vùng trống.
          color = [0, 0, 0, 255]; // Free - Gần như trắng (để phân biệt với nền trắng tinh)
        } else {
          // Các giá trị > 0 là vật cản
          color = [255, 255, 255, 255]; // Occupied - Đen
        }

        // Gán màu vào mảng data của texture
        data[pixelIndex] = color[0]; // R
        data[pixelIndex + 1] = color[1]; // G
        data[pixelIndex + 2] = color[2]; // B
        data[pixelIndex + 3] = color[3]; // A
      }
    }
    return data;
  }

  setMapData(message) {
    if (!this.isInitialized) {
      console.error("Cannot update map - not initialized");
      return;
    }

    let mapInfo = null;
    let mapData = null;
    // Check if this is a server message (nested data structure)
    if (message.info && message.mapData) {
      console.log("Processing server message format");

      // Info object validation
      if (!message.info.data) {
        console.error("Invalid map message - info.data is null or undefined");
        return;
      }

      const buffer = Buffer.from(message.info.data);

      // Convert buffer to string and split into lines
      const bufferString = buffer.toString("utf-8");

      const lines = bufferString.split("\n");

      // Parse each line into key-value pairs
      mapInfo = {};

      lines.forEach((line) => {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith("#")) return;

        // Split line into key and value
        const [key, ...valueParts] = line.split(":");
        if (!key || !valueParts.length) return;

        const value = valueParts.join(":").trim();

        // Handle different value types
        switch (key.trim()) {
          case "width":
          case "height":
          case "resolution":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "origin":
            // Parse array format [x, y, z]
            const originValues = value
              .replace(/[\[\]]/g, "")
              .split(",")
              .map((v) => parseFloat(v.trim()));
            mapInfo[key.trim()] = {
              position: {
                x: originValues[0],
                y: originValues[1],
                z: originValues[2] || 0,
              },
            };
            break;
          case "occupied_thresh":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "free_thresh":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "negate":
            mapInfo[key.trim()] = parseFloat(value);
            break;
          case "image":
            mapInfo[key.trim()] = value;
            break;
          default:
            mapInfo[key.trim()] = value;
        }
      });

      // Check if mapData exists and has data property
      if (!message.mapData || !message.mapData.data) {
        console.error(
          "Invalid map message - mapData or mapData.data is null or undefined"
        );
        return;
      }

      const result = this.parsePgmData(message.mapData.data);
      if (result) {
        mapInfo.width = result.info.width;
        mapInfo.height = result.info.height;
        mapData = result.data;
      } else {
        console.error("Could not extract map data from message");
        return;
      }
    } else {
      console.error("Invalid map message format - unrecognized format");
      return;
    }

    // Lưu thông tin map
    this.mapInfo.width = mapInfo.width;
    this.mapInfo.height = mapInfo.height;
    this.mapInfo.resolution = mapInfo.resolution;
    this.mapInfo.origin = mapInfo.origin;
    this.mapInfo.image = mapInfo.image;

    // Tính toán kích thước thực của map (mét)
    const mapWidthMeters = this.mapInfo.width * this.mapInfo.resolution;
    const mapHeightMeters = this.mapInfo.height * this.mapInfo.resolution;

    // Tạo geometry cho map
    const geometry = new THREE.PlaneGeometry(mapWidthMeters, mapHeightMeters);

    // Validate map data size
    const expectedSize = this.mapInfo.width * this.mapInfo.height;
    if (!mapData || mapData.length !== expectedSize) {
      console.error("Invalid map data size:", {
        actual: mapData ? mapData.length : "null/undefined",
        expected: expectedSize,
        width: this.mapInfo.width,
        height: this.mapInfo.height,
      });
      return;
    }
    // Tạo texture từ map data
    const data = this.parseMapData(this.mapInfo, mapData);

    // Tạo texture
    const texture = new THREE.DataTexture(
      data,
      this.mapInfo.width,
      this.mapInfo.height,
      THREE.RGBAFormat
    );
    texture.needsUpdate = true;

    // Tạo material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Tạo hoặc cập nhật mesh
    if (this.mapMesh) {
      console.log("Removing existing map mesh");
      this.scene.remove(this.mapMesh);
    }

    this.mapMesh = new THREE.Mesh(geometry, material);
    // Đặt vị trí của map dựa trên origin
    this.mapMesh.position.x =
      this.mapInfo.origin.position.x + mapWidthMeters / 2;
    this.mapMesh.position.y =
      this.mapInfo.origin.position.y + mapHeightMeters / 2;

    // Thêm mesh vào scene
    this.scene.add(this.mapMesh);

    // Update mapMesh reference in DrawPosition tool
    if (this.toolDrawPosition) {
      this.toolDrawPosition.updateMapMesh(this.mapMesh);
    }

    // Rotate map mesh 180 degrees around x-axis
    //this.mapMesh.rotation.x = Math.PI; // 180 degrees in radians

    // Fit camera to map
    this.fitCameraToMap();

    // Lưu bản sao của map mesh gốc
    this.mapMeshOriginal = this.mapMesh.clone();

    // Thêm coordinate frame
    this.addCoordinateFrame();

    // Chỉ fit camera khi đây là lần đầu nhận map
    if (this.isFirstMap) {
      // console.log('First map received, fitting camera');
      const container = this.renderer.domElement.parentElement;
      const width = container.clientWidth;
      const height = container.clientHeight - 60; // Trừ đi 60px cho margin-top

      this.renderer.setSize(width, height);
      this.fitCameraToMap();
      this.isFirstMap = false;
    }
  }

  addCoordinateFrame() {
    // Xóa coordinate frame cũ nếu có
    if (this.coordinateFrame) {
      this.scene.remove(this.coordinateFrame);
    }

    this.coordinateFrame = new THREE.Group();

    const axisLength = 0.2; // 0.2 mét
    const axisWidth = 0.01; // Độ dày của trục

    // Trục X (màu đỏ)
    const xGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.position.x = axisLength / 2;

    // Trục Y (màu xanh lá)
    const yGeometry = new THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = axisLength / 2;

    // Thêm mũi tên cho trục X
    const xArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.04, 8),
      xMaterial
    );
    xArrow.position.x = axisLength;
    xArrow.rotation.z = -Math.PI / 2;

    // Thêm mũi tên cho trục Y
    const yArrowGeometry = new THREE.ConeGeometry(0.02, 0.04, 8);
    const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
    yArrow.position.y = axisLength;

    // Thêm các thành phần vào group
    this.coordinateFrame.add(xAxis);
    this.coordinateFrame.add(yAxis);
    this.coordinateFrame.add(xArrow);
    this.coordinateFrame.add(yArrow);

    // Đặt vị trí coordinate frame tại gốc tọa độ (0,0)
    this.coordinateFrame.position.set(0, 0, 0.1);

    this.scene.add(this.coordinateFrame);
  }

  showRobot() {
    if (this.robot) {
      this.robot.show();
    }
  }

  /**
   * Hide robot from map
   */
  hideRobot() {
    if (this.robot) {
      this.robot.hide();
    }

    console.log("Robot display disabled");
  }

  dispose() {
    console.log("Starting disposal of Map2D instance");
    this.isRunning = false;
    this.isInitialized = false;

    try {
      // Cleanup Wall Toolbar
      if (this.wallToolbar) {
        this.wallToolbar.dispose();
        this.wallToolbar = null;
      }

      // Cleanup Floor Toolbar
      if (this.floorToolbar) {
        this.floorToolbar.dispose();
        this.floorToolbar = null;
      }

      // Cleanup renderer
      if (this.renderer) {
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(
            this.renderer.domElement
          );
        }
        this.renderer.dispose();
        this.renderer = null;
      }

      // Cleanup scene
      if (this.scene) {
        while (this.scene.children.length > 0) {
          const object = this.scene.children[0];
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
          this.scene.remove(object);
        }
        this.scene = null;
      }

      // Reset other properties
      this.camera = null;
      this.mapMesh = null;
      this.pathPoints = [];
      this.currentMouseMode = this.MouseMode.NONE;

      // Cleanup laser scan
      if (this.laserScanMaterial) {
        this.laserScanMaterial.dispose();
        this.laserScanMaterial = null;
      }
      this.laserScanPoints = [];

      // Cleanup Virtual Wall Toolbar
      if (this.virtualWallToolbar) {
        this.virtualWallToolbar.dispose();
        this.virtualWallToolbar = null;
      }

      // Cleanup Forbidden Zone Toolbar
      if (this.forbiddenZoneToolbar) {
        this.forbiddenZoneToolbar.dispose();
        this.forbiddenZoneToolbar = null;
      }
      if (this.preferredZoneToolbar) {
        this.preferredZoneToolbar.dispose();
        this.preferredZoneToolbar = null;
      }

      // Cleanup Position Toolbar
      if (this.positionToolbar) {
        this.positionToolbar.dispose();
        this.positionToolbar = null;
      }

      // Cleanup Markers Toolbar
      if (this.markersToolbar) {
        this.markersToolbar.dispose();
        this.markersToolbar = null;
      }

      // Cleanup Navigate Toolbar
      if (this.navigateToolbar) {
        this.navigateToolbar.dispose();
        this.navigateToolbar = null;
      }

      // Cleanup drawing tools
      if (this.toolDrawMarkers) {
        this.toolDrawMarkers.dispose();
        this.toolDrawMarkers = null;
      }
      if (this.toolDrawPoseEstimate) {
        this.toolDrawPoseEstimate.dispose();
        this.toolDrawPoseEstimate = null;
      }
      if (this.toolDrawNavGoal) {
        this.toolDrawNavGoal.dispose();
        this.toolDrawNavGoal = null;
      }

      // Cleanup Robot
      if (this.robot) {
        this.robot.dispose();
        this.robot = null;
      }

      // Cleanup Pose Estimate
      if (this.toolDrawPoseEstimate) {
        this.toolDrawPoseEstimate.dispose();
        this.toolDrawPoseEstimate = null;
      }

      // Cleanup Nav Goal
      if (this.toolDrawNavGoal) {
        this.toolDrawNavGoal.dispose();
        this.toolDrawNavGoal = null;
      }

      console.log("Map2D instance disposed successfully");
    } catch (error) {
      console.error("Error during Map2D disposal:", error);
    }
  }

  setEnableRotateMap(enable) {
    if (enable) {
      // Hiển thị rotation display
      if (this.rotationDisplay) {
        this.rotationDisplay.style.display = "block";
      }
      this.currentMouseMode = this.MouseMode.ROTATE;
      //hiển thị cursor rotate
      this.renderer.domElement.style.cursor = "grab";
    } else {
      // Reset rotation
      if (this.mapMesh) {
        this.mapMesh.rotation.z = 0;
        this.currentRotation = 0;
      }

      // Ẩn rotation display
      if (this.rotationDisplay) {
        this.rotationDisplay.style.display = "none";
      }
      this.currentMouseMode = this.MouseMode.NONE;
      //hiển thị cursor default
      this.renderer.domElement.style.cursor = "default";
    }
  }

  async rotateMap() {
    try {
      if (this.currentRotation !== 0) {
        // Gọi service để rotate map
        const request = new ROSLIB.ServiceRequest({
          angle: this.currentRotation,
        });

        const result = await callRosService(
          "/slam_toolbox2/rotate_map",
          "slam_toolbox_msgs/RotateMap",
          request
        );

        if (result.result) {
          console.log("Map rotated successfully");
          // Reset rotation sau khi rotate thành công
          this.mapMesh.rotation.z = 0;
          this.currentRotation = 0;
          // Xóa thông tin map hiện tại
          if (this.mapMesh) {
            this.scene.remove(this.mapMesh);
            this.mapMesh = null;
          }
          // Reset camera
          this.camera.position.x = 0;
          this.camera.position.y = 0;
          this.currentZoom = 1;
          this.camera.updateProjectionMatrix();
          return true;
        } else {
          console.error("Failed to rotate map");
          throw new Error("Service call failed");
        }
      }
      return false;
    } catch (error) {
      console.error("Error rotating map:", error);
      throw error;
    }
  }

  startSelect(clientX, clientY) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // Lấy vị trí chuột trong màn hình (pixel)

    console.log("object_type", this.object_type);
    // Chuyển đổi sang tọa độ chuẩn hóa [-1, 1]
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    const worldPoint = this.toolDrawForbiddenZone.getWorldPosition(
      clientX,
      clientY
    );
    console.log("Bạn đang click vào Forbidden Zone!", worldPoint);
    console.log("Các Forbidden Zone!", this.listForbiddenZones);
    const point = worldPoint;
    // Duyệt để check chọn  Forbidden Zone
    if (this.object_type == "forbidden-zones") {
      let id_forbiddenZone = null;
      let inside = false;
      for (let iList = 0; iList < this.listForbiddenZones.length; iList++) {
        console.log(
          "Duyệt các Forbidden Zone!",
          this.listForbiddenZones[iList].points
        );
        for (
          let i = 0, j = this.listForbiddenZones[iList].points.length - 1;
          i < this.listForbiddenZones[iList].points.length;
          j = i++
        ) {
          const xi = this.listForbiddenZones[iList].points[i].x,
            yi = this.listForbiddenZones[iList].points[i].y;
          const xj = this.listForbiddenZones[iList].points[j].x,
            yj = this.listForbiddenZones[iList].points[j].y;

          const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;

          if (intersect) {
            id_forbiddenZone = this.listForbiddenZones[iList].id;
            inside = !inside;
          }
        }
      }

      console.log("Zone=", id_forbiddenZone);

      const zoneSelected = this.listForbiddenZones.find(
        (z) => z.id === id_forbiddenZone
      );
      const zonePointSelected = zoneSelected ? zoneSelected.points : null;
      console.log("zonePointSelect=", zonePointSelected);
      // this.toolDrawFobiddentzone.state.selectedNode.selected;
      this.toolDrawForbiddenZone.state.points = zonePointSelected;
      //this.toolDrawForbiddenZone.forbiddenZones.points=forbiddenZonePoints;
      if (zonePointSelected && zonePointSelected.length > 3) {
        this.toolDrawForbiddenZone.state.polygons = zonePointSelected;
        //this.toolDrawForbiddenZone.forbiddenZones.polygons=zonePointSelected;
        // this.toolDrawForbiddenZone.dispose();
      }
      //if(zonePointSelected>1  )
      this.toolDrawForbiddenZone.SelectForbiddenZonesToMapExist(
        id_forbiddenZone
      );

      if (id_forbiddenZone) {
        const zoneIdBox = document.getElementById("zoneId");
        if (zoneIdBox) {
          zoneIdBox.value = id_forbiddenZone;
        }
        console.log("Bạn đang click vào Forbidden Zone!");
      } else {
        console.log("Ngoài vùng cấm.");
      }
    }
    if (this.object_type == "positions") {
      // Ensure DrawPosition tool exists
      if (!this.toolDrawPosition) {
        console.log("Creating DrawPosition tool for position selection");
        this.toolDrawPosition = new DrawPosition(
          this.scene,
          this.camera,
          this.renderer,
          this.mapMesh,
          this.mapInfo,
          this
        );
      }

      // Use DrawPosition tool to handle position selection
      const worldPoint = this.toolDrawPosition.getWorldPosition(
        clientX,
        clientY
      );
      if (worldPoint) {
        this.toolDrawPosition.handleSelectClick(worldPoint);
      }
    }
  }
  updateSelect(clientX, clientY) {
    // Handle position hover if in positions mode
    if (this.object_type === "positions") {
      // Ensure DrawPosition tool exists
      if (!this.toolDrawPosition) {
        console.log("Creating DrawPosition tool for position hover");
        this.toolDrawPosition = new DrawPosition(
          this.scene,
          this.camera,
          this.renderer,
          this.mapMesh,
          this.mapInfo,
          this
        );
      }

      const worldPoint = this.toolDrawPosition.getWorldPosition(
        clientX,
        clientY
      );
      if (worldPoint) {
        this.toolDrawPosition.updateNodePosition(clientX, clientY);
      }
    }
  }

  stopSelect(clientX, clientY) {
    // Handle position selection completion if in positions mode
    if (this.object_type === "positions" && this.toolDrawPosition) {
      // Position selection is handled by handleSelectClick in startSelect
      // This method can be used for any cleanup if needed
    }
  }
  // set tool map mode
  setToolMapMode(enable, mode = this.MouseMode.NONE) {
    if (enable) {
      this.cancelMapTool();
      switch (mode) {
        case this.MouseMode.ERASE:
          if (this.toolEraserWall == null) {
            this.toolEraserWall = new EraserWall(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo
            );
          }
          break;
        case this.MouseMode.POINT:
          this.renderer.domElement.style.cursor = "crosshair";
          break;
        case this.MouseMode.DRAW_LINE:
          if (this.toolDrawWall == null) {
            this.toolDrawWall = new DrawWall(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo
            );
            // Set the wallWidth from WallToolbar if available
            if (this.wallToolbar && this.wallToolbar.tools.drawLine.lineWidth) {
              this.toolDrawWall.setLineWidth(
                this.wallToolbar.tools.drawLine.lineWidth
              );
            }
          }
          break;
        case this.MouseMode.DRAW_FORBIDDEN_ZONE:
          // create tool for drawing forbidden zone if not exist
          if (this.toolDrawForbiddenZone == null) {
            this.toolDrawForbiddenZone = new DrawForbiddenZone(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
            this.toolDrawForbiddenZone.enable();
          } else {
            this.toolDrawForbiddenZone.enable();
            // clear tool for drawing forbidden zone
            this.toolDrawForbiddenZone.clear();
            // set cursor to crosshair
            this.renderer.domElement.style.cursor = "crosshair";
          }
          break;
        case this.MouseMode.FLOOR_ERASER:
          if (this.toolFloorTool == null) {
            this.toolFloorTool = new FloorTool(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo
            );
            this.toolFloorTool.setMode("eraser");
            // Set the eraserRadius from FloorToolbar if available
            if (
              this.floorToolbar &&
              this.floorToolbar.tools.eraser.eraserRadius
            ) {
              console.log(
                "Map2D: Setting eraser radius from toolbar:",
                this.floorToolbar.tools.eraser.eraserRadius
              );
              this.toolFloorTool.setEraserRadius(
                this.floorToolbar.tools.eraser.eraserRadius
              );
            }
            console.log(
              "Map2D: FloorTool created and configured for eraser mode"
            );
          } else {
            console.log(
              "Map2D: FloorTool already exists, reusing existing instance"
            );
          }
          break;
        case this.MouseMode.FLOOR_POLYGON:
          if (this.toolFloorTool == null) {
            this.toolFloorTool = new FloorTool(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo
            );
            this.toolFloorTool.setMode("polygon");
            // Set the polygonWidth from FloorToolbar if available
            if (
              this.floorToolbar &&
              this.floorToolbar.tools.polygon.polygonWidth
            ) {
              this.toolFloorTool.setPolygonWidth(
                this.floorToolbar.tools.polygon.polygonWidth
              );
            }
          }
          break;
        case this.MouseMode.DRAW_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall == null) {
            this.toolDrawVirtualWall = new DrawVirtualWall(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
            // Set the lineWidth from VirtualWallToolbar if available
            if (
              this.virtualWallToolbar &&
              this.virtualWallToolbar.tools.drawLine.lineWidth
            ) {
              this.toolDrawVirtualWall.setLineWidth(
                this.virtualWallToolbar.tools.drawLine.lineWidth
              );
            }
            // Enable drawing by default when creating new tool
            this.toolDrawVirtualWall.enableDrawing();
            this.toolDrawVirtualWall.enable();
          } else {
            // Re-enable drawing if tool already exists
            this.toolDrawVirtualWall.enableDrawing();
            this.toolDrawVirtualWall.enable();
          }
          break;
        case this.MouseMode.SELECT_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall == null) {
            this.toolDrawVirtualWall = new DrawVirtualWall(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          // Enable select mode
          this.toolDrawVirtualWall.enableSelectMode();
          this.toolDrawVirtualWall.enable();
          break;
        case this.MouseMode.DRAW_POSITION:
          // create tool for drawing position if not exist
          if (this.toolDrawPosition == null) {
            this.toolDrawPosition = new DrawPosition(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
            this.toolDrawPosition.enable();
          } else {
            this.toolDrawPosition.enable();
            // set cursor to crosshair
            this.renderer.domElement.style.cursor = "crosshair";
          }
          break;
        case this.MouseMode.SELECT_POSITION:
          if (this.toolDrawPosition == null) {
            this.toolDrawPosition = new DrawPosition(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          this.toolDrawPosition.enableSelectMode();
          this.toolDrawPosition.enable();
          break;
        case this.MouseMode.POSE_ESTIMATE:
          if (this.toolDrawPoseEstimate == null) {
            this.toolDrawPoseEstimate = new DrawPoseEstimate(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
            console.log("create toolDrawPoseEstimate");
          } else {
            console.log("toolDrawPoseEstimate already exists");
          }
          this.toolDrawPoseEstimate.enable();
          if (this.robot) {
            this.robot.hide();
          }
          break;
        case this.MouseMode.NAV_GOAL:
          if (this.toolDrawNavGoal == null) {
            this.toolDrawNavGoal = new DrawNavGoal(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          this.toolDrawNavGoal.enable();
          break;
        case this.MouseMode.DRAW_MARKER:
          if (this.toolDrawMarkers == null) {
            console.log("create toolDrawMarkers in Map_2D mouse mode");
            console.log("mapMesh in DRAW_MARKER:", this.mapMesh);
            console.log("scene in DRAW_MARKER:", this.scene);
            console.log("camera in DRAW_MARKER:", this.camera);
            this.toolDrawMarkers = new DrawMarkers(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          } else {
            console.log("toolDrawMarkers already exists");
            console.log("mapMesh in DRAW_MARKER:", this.mapMesh);
            console.log("scene in DRAW_MARKER:", this.scene);
            console.log("camera in DRAW_MARKER:", this.camera);
          }
          this.toolDrawMarkers.enable();
          break;
        case this.MouseMode.SELECT_MARKER:
          if (this.toolDrawMarkers == null) {
            console.log(
              "create toolDrawMarkers in Map_2D mouse mode for SELECT_MARKER"
            );
            console.log("mapMesh in SELECT_MARKER:", this.mapMesh);
            console.log("scene in SELECT_MARKER:", this.scene);
            console.log("camera in SELECT_MARKER:", this.camera);
            this.toolDrawMarkers = new DrawMarkers(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          } else {
            console.log("toolDrawMarkers already exists");
            console.log("mapMesh in SELECT_MARKER:", this.mapMesh);
            console.log("scene in SELECT_MARKER:", this.scene);
            console.log("camera in SELECT_MARKER:", this.camera);
          }
          this.toolDrawMarkers.setMode("select");
          this.toolDrawMarkers.enable();
          break;
        case this.MouseMode.DRAW_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone == null) {
            this.toolDrawCriticalZone = new DrawCriticalZone(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          break;
        case this.MouseMode.DRAW_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone == null) {
            this.toolDrawUnpreferredZone = new DrawUnpreferredZone(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          break;
        case this.MouseMode.SELECT_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone == null) {
            this.toolDrawUnpreferredZone = new DrawUnpreferredZone(
              this.scene,
              this.camera,
              this.renderer,
              this.mapMesh,
              this.mapInfo,
              this
            );
          }
          break;
      }
    } else {
      switch (this.currentMouseMode) {
        case this.MouseMode.ERASE:
          if (this.toolEraserWall) {
            this.toolEraserWall.disable();
            this.toolEraserWall = null;
          }
          break;
        case this.MouseMode.DRAW_LINE:
          if (this.toolDrawWall) {
            this.toolDrawWall.clear();
            this.toolDrawWall = null;
          }
          break;
        case this.MouseMode.FORBIDDEN_ZONES:
          if (this.toolDrawForbiddenZone) {
            this.toolDrawForbiddenZone.disable();
          }
          break;
        case this.MouseMode.FLOOR_ERASER:
          if (this.toolFloorTool) {
            this.toolFloorTool.disable();
            this.toolFloorTool = null;
          }
          break;
        case this.MouseMode.FLOOR_POLYGON:
          if (this.toolFloorTool) {
            this.toolFloorTool.clear();
            this.toolFloorTool = null;
          }
          break;
        case this.MouseMode.DRAW_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.clear();
            this.toolDrawVirtualWall.disable();
          }
          break;
        case this.MouseMode.SELECT_VIRTUAL_WALL:
          if (this.toolDrawVirtualWall) {
            this.toolDrawVirtualWall.clear();
            this.toolDrawVirtualWall.disable();
          }
          break;
        case this.MouseMode.DRAW_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.cancelPositionsToMap();
          }
          break;
        case this.MouseMode.SELECT_POSITION:
          if (this.toolDrawPosition) {
            this.toolDrawPosition.cancelPositionsToMap();
          }
          break;
        case this.MouseMode.DRAW_MARKER:
        case this.MouseMode.SELECT_MARKER:
          if (this.toolDrawMarkers) {
            this.toolDrawMarkers.disable();
          }
          break;
        case this.MouseMode.POSE_ESTIMATE:
          if (this.toolDrawPoseEstimate) {
            this.toolDrawPoseEstimate.disable();
          }
          break;
        case this.MouseMode.NAV_GOAL:
          if (this.toolDrawNavGoal) {
            this.toolDrawNavGoal.disable();
          }
          break;
        case this.MouseMode.DRAW_CRITICAL_ZONE:
          if (this.toolDrawCriticalZone) {
            this.toolDrawCriticalZone.disable();
          }
          break;
        case this.MouseMode.DRAW_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.disable();
          }
          break;
        case this.MouseMode.SELECT_UNPREFERRED_ZONE:
          if (this.toolDrawUnpreferredZone) {
            this.toolDrawUnpreferredZone.disable();
          }
          break;
        default:
          break;
      }

      // reset cursor
      this.renderer.domElement.style.cursor = "default";
    }
    this.currentMouseMode = mode;

    // Update WallToolbar state
    this.updateWallToolbarState();

    // Update FloorToolbar state
    this.updateFloorToolbarState();

    // Update VirtualWallToolbar state
    this.updateVirtualWallToolbarState();

    // Update PositionToolbar state
    this.updatePositionToolbarState();
  }
  // Helper method để chuyển đổi tọa độ client sang world
  getWorldPosition(clientX, clientY) {
    if (!this.mapMesh) return null;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    const intersects = raycaster.intersectObject(this.mapMesh);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  applyMapTool() {
    switch (this.currentMouseMode) {
      case this.MouseMode.ERASE:
        {
          if (this.toolEraserWall) {
            this.toolEraserWall.clear();
          }
        }
        break;
      case this.MouseMode.DRAW_LINE:
        {
          if (this.toolDrawWall) {
            this.toolDrawWall.applyWallToMap();
          }
        }
        break;

      case this.MouseMode.FLOOR_ERASER:
        if (this.toolFloorTool) {
          this.toolFloorTool.applyFloorToolToMap();
          this.toolFloorTool = null;
        }
        break;
      case this.MouseMode.FLOOR_POLYGON:
        if (this.toolFloorTool) {
          this.toolFloorTool.applyFloorToolToMap();
          this.toolFloorTool = null;
        }
        break;
      case this.MouseMode.DRAW_VIRTUAL_WALL:
        if (this.toolDrawVirtualWall) {
          this.toolDrawVirtualWall.applyVirtualWallToMap();
        }
        break;
      case this.MouseMode.SELECT_VIRTUAL_WALL:
        if (this.toolDrawVirtualWall) {
          this.toolDrawVirtualWall.applyVirtualWallToMap();
        }
        break;
      case this.MouseMode.DRAW_FORBIDDEN_ZONE:
        if (this.toolDrawForbiddenZone) {
          this.toolDrawForbiddenZone.applyForbiddenZoneToMap();
        }
        break;
      case this.MouseMode.SELECT_FORBIDDEN_ZONE:
        if (this.toolDrawForbiddenZone) {
          this.toolDrawForbiddenZone.applyForbiddenZoneToMap();
        }
        break;
      case this.MouseMode.DRAW_PREFERRED_ZONE:
        if (this.toolDrawPreferredZone) {
          this.toolDrawPreferredZone.applyPreferredZoneToMap();
        }
        break;
      case this.MouseMode.SELECT_PREFERRED_ZONE:
        if (this.toolDrawPreferredZone) {
          this.toolDrawPreferredZone.applyPreferredZoneToMap();
        }
        break;
      case this.MouseMode.DRAW_UNPREFERRED_ZONE:
        if (this.toolDrawUnpreferredZone) {
          this.toolDrawUnpreferredZone.applyUnpreferredZoneToMap();
        }
        break;
      case this.MouseMode.SELECT_UNPREFERRED_ZONE:
        if (this.toolDrawUnpreferredZone) {
          this.toolDrawUnpreferredZone.applyUnpreferredZoneToMap();
        }
        break;
      case this.MouseMode.DRAW_CRITICAL_ZONE:
        if (this.toolDrawCriticalZone) {
          this.toolDrawCriticalZone.applyCriticalZoneToMap();
        }
        break;
      case this.MouseMode.SELECT_CRITICAL_ZONE:
        if (this.toolDrawCriticalZone) {
          this.toolDrawCriticalZone.applyCriticalZoneToMap();
        }
        break;
      case this.MouseMode.DRAW_POSITION:
        if (this.toolDrawPosition) {
          this.toolDrawPosition.applyPositionsToMap();
        }
        break;
      case this.MouseMode.SELECT_POSITION:
        if (this.toolDrawPosition) {
          this.toolDrawPosition.applyPositionsToMap();
        }
        break;
      case this.MouseMode.POSE_ESTIMATE:
        if (this.toolDrawPoseEstimate) {
          //this.toolDrawPoseEstimate.applyPoseEstimatesToMap();
          this.toolDrawPoseEstimate.disable();
          this.toolDrawPoseEstimate.dispose();
          this.toolDrawPoseEstimate = null;
        }
        break;
      case this.MouseMode.NAV_GOAL:
        if (this.toolDrawNavGoal) {
          this.toolDrawNavGoal.disable();
          this.toolDrawNavGoal.dispose();
          this.toolDrawNavGoal = null;
        }
        break;
      case this.MouseMode.SELECT_MARKER:
        if (this.toolDrawMarkers) {
          this.toolDrawMarkers.clearSelectedMarker();
        }
        break;
      case this.MouseMode.SELECT:
        // Handle position selection - this is handled by the selection logic
        break;
    }
    this.currentMouseMode = this.MouseMode.NONE;
    this.renderer.domElement.style.cursor = "default";
  }

  cancelMapTool() {
    switch (this.currentMouseMode) {
      case this.MouseMode.ERASE:
        {
          // Restore map data from EraserWall tool
          if (this.toolEraserWall && this.toolEraserWall.mapBackup) {
            // Copy data from backup to current texture
            const originalData =
              this.toolEraserWall.mapBackup.material.map.image.data;
            const currentData = this.mapMesh.material.map.image.data;

            // Copy each pixel
            for (let i = 0; i < originalData.length; i++) {
              currentData[i] = originalData[i];
            }

            // Update texture to force Three.js to re-render
            this.mapMesh.material.map.needsUpdate = true;

            // Force a render update
            if (this.renderer) {
              this.renderer.render(this.scene, this.camera);
            }
            console.log("Restore map data from EraserWall tool");
            this.toolEraserWall.clear();

            this.toolEraserWall = null;
            console.log("Restore map data from EraserWall tool");
          }
        }
        break;
      case this.MouseMode.DRAW_LINE:
        if (this.toolDrawWall && this.toolDrawWall.mapBackup) {
          // Copy data from backup to current texture
          const originalData =
            this.toolDrawWall.mapBackup.material.map.image.data;
          const currentData = this.mapMesh.material.map.image.data;

          // Copy each pixel
          for (let i = 0; i < originalData.length; i++) {
            currentData[i] = originalData[i];
          }
          this.mapMesh.material.map.needsUpdate = true;

          // Force a render update
          if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
          }
          this.toolDrawWall.clear();
          this.toolDrawWall = null;
          console.log("Restore map data from DrawWall tool");
        }
        this.setEnableDrawLine(false);
        break;
      case this.MouseMode.FLOOR_ERASER:
        if (this.toolFloorTool && this.toolFloorTool.mapBackup) {
          // Copy data from backup to current texture
          const originalData =
            this.toolFloorTool.mapBackup.material.map.image.data;
          const currentData = this.mapMesh.material.map.image.data;

          // Copy each pixel
          for (let i = 0; i < originalData.length; i++) {
            currentData[i] = originalData[i];
          }

          // Update texture to force Three.js to re-render
          this.mapMesh.material.map.needsUpdate = true;

          // Force a render update
          if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
          }
          this.toolFloorTool.clear();
          this.toolFloorTool = null;
          console.log("Restore map data from FloorTool eraser");
        }
        break;
      case this.MouseMode.FLOOR_POLYGON:
        if (this.toolFloorTool && this.toolFloorTool.mapBackup) {
          // Copy data from backup to current texture
          const originalData =
            this.toolFloorTool.mapBackup.material.map.image.data;
          const currentData = this.mapMesh.material.map.image.data;

          // Copy each pixel
          for (let i = 0; i < originalData.length; i++) {
            currentData[i] = originalData[i];
          }

          // Update texture to force Three.js to re-render
          this.mapMesh.material.map.needsUpdate = true;

          // Force a render update
          if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
          }
          this.toolFloorTool.clear();
          this.toolFloorTool = null;
          console.log("Restore map data from FloorTool polygon");
        }
        break;
      case this.MouseMode.DRAW_VIRTUAL_WALL:
        if (this.toolDrawVirtualWall && this.toolDrawVirtualWall.mapBackup) {
          // Copy data from backup to current texture
          const originalData =
            this.toolDrawVirtualWall.mapBackup.material.map.image.data;
          const currentData = this.mapMesh.material.map.image.data;

          // Copy each pixel
          for (let i = 0; i < originalData.length; i++) {
            currentData[i] = originalData[i];
          }

          // Update texture to force Three.js to re-render
          this.mapMesh.material.map.needsUpdate = true;

          // Force a render update
          if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
          }
          this.toolDrawVirtualWall.clear();
          this.toolDrawVirtualWall = null;
          console.log("Restore map data from DrawVirtualWall tool");
        }
        break;
      case this.MouseMode.CURSOR:
        if (this.toolDrawVirtualWall) {
          this.toolDrawVirtualWall.stopErase();
        }
        break;
      case this.MouseMode.POINT:
        // Handle position creation cancellation
        break;
      case this.MouseMode.SELECT:
        // Handle position selection cancellation
        break;
      case this.MouseMode.DRAW_PREFERRED_ZONE:
      case this.MouseMode.SELECT_PREFERRED_ZONE:
        if (this.toolDrawPreferredZone) {
          this.toolDrawPreferredZone.clearCurrentState();
        }
        break;
      case this.MouseMode.DRAW_UNPREFERRED_ZONE:
      case this.MouseMode.SELECT_UNPREFERRED_ZONE:
        if (this.toolDrawUnpreferredZone) {
          this.toolDrawUnpreferredZone.clearCurrentState();
        }
        break;
      case this.MouseMode.DRAW_CRITICAL_ZONE:
      case this.MouseMode.SELECT_CRITICAL_ZONE:
        if (this.toolDrawCriticalZone) {
          this.toolDrawCriticalZone.clearCurrentState();
        }
        break;
      case this.MouseMode.POSE_ESTIMATE:
        if (this.toolDrawPoseEstimate) {
          this.toolDrawPoseEstimate.cancelPoseEstimatesToMap();
        }
        break;
      case this.MouseMode.NAV_GOAL:
        if (this.toolDrawNavGoal) {
          this.toolDrawNavGoal.cancelNavGoalToMap();
        }
        break;
      default:
        break;
    }
  }
  setEnableDrawLine(enable) {
    if (enable) {
      this.currentMouseMode = this.MouseMode.DRAW_LINE;
      this.renderer.domElement.style.cursor = "crosshair";
    }
  }
  setZoomMode() {
    if (this.currentMouseMode === this.MouseMode.ZOOM) {
      // Tắt chế độ zoom, quay về chế độ trước đó
      this.currentMouseMode = this.previousMouseMode || this.MouseMode.NONE;
      this.renderer.domElement.style.cursor = this.previousCursor || "default";
      return false;
    } else {
      // Bật chế độ zoom
      this.previousMouseMode = this.currentMouseMode;
      this.previousCursor = this.renderer.domElement.style.cursor;
      this.currentMouseMode = this.MouseMode.ZOOM;
      this.renderer.domElement.style.cursor = "zoom-in";
      return true;
    }
  }

  setPanMode() {
    if (this.currentMouseMode === this.MouseMode.PAN) {
      // Nếu đang ở chế độ PAN, chuyển về chế độ trước đó
      this.currentMouseMode = this.previousMouseMode || this.MouseMode.NONE;
      this.renderer.domElement.style.cursor = this.previousCursor || "default";
      return false;
    } else {
      // Lưu chế độ hiện tại và chuyển sang chế độ PAN
      this.previousMouseMode = this.currentMouseMode;
      this.currentMouseMode = this.MouseMode.PAN;
      this.previousCursor = this.renderer.domElement.style.cursor;
      this.renderer.domElement.style.cursor = "grab";
      return true;
    }
  }
  setCursorMode() {
    if (this.currentMouseMode === this.MouseMode.SELECT) {
      // Nếu đang ở chế độ SELECT, chuyển về chế độ trước đó
      this.currentMouseMode = this.previousMouseMode || this.MouseMode.NONE;
      return false;
    } else {
      // Lưu chế độ hiện tại và chuyển sang chế độ SELECT
      this.previousMouseMode = this.currentMouseMode;
      this.currentMouseMode = this.MouseMode.SELECT;
      this.renderer.domElement.style.cursor = "default";

      return true;
    }
  }

  clearActiveButtons() {
    const buttons = document.querySelectorAll(".map-tool-divider .tool-button");
    buttons.forEach((btn) => btn.classList.remove("active"));
  }

  // Thêm phương thức fitViewToMap
  fitViewToMap() {
    if (!this.mapMesh || !this.mapInfo || this.mapInfo.width === 0) return;
    if (!this.renderer || !this.renderer.domElement) return;

    const mapWidthMeters = this.mapInfo.width * this.mapInfo.resolution;
    const mapHeightMeters = this.mapInfo.height * this.mapInfo.resolution;

    // Di chuyển camera đến trung tâm của bản đồ
    this.camera.position.x =
      this.mapInfo.origin.position.x + mapWidthMeters / 2;
    this.camera.position.y =
      this.mapInfo.origin.position.y + mapHeightMeters / 2;
    this.camera.position.z = 10; // Đặt lại Z để đảm bảo camera nhìn thấy

    const canvas = this.renderer.domElement;
    const canvasAspect = canvas.clientWidth / canvas.clientHeight;
    const mapAspect = mapWidthMeters / mapHeightMeters;

    // Thêm một chút padding để bản đồ không bị dính sát vào cạnh
    const padding = 1.1;

    if (canvasAspect > mapAspect) {
      // Canvas rộng hơn bản đồ -> fit theo chiều cao
      this.camera.top = (mapHeightMeters / 2) * padding;
      this.camera.bottom = -this.camera.top;
      this.camera.left = -this.camera.top * canvasAspect;
      this.camera.right = this.camera.top * canvasAspect;
    } else {
      // Canvas cao hơn hoặc bằng bản đồ -> fit theo chiều rộng
      this.camera.left = -(mapWidthMeters / 2) * padding;
      this.camera.right = (mapWidthMeters / 2) * padding;
      this.camera.top = this.camera.right / canvasAspect;
      this.camera.bottom = -this.camera.top;
    }

    this.camera.zoom = 1; // Reset zoom vì đã điều chỉnh frustum
    this.camera.updateProjectionMatrix();
  }

  // Thêm phương thức để convert map sang PGM byte array
  convertMapToPGM() {
    if (!this.mapMesh || !this.mapMesh.material.map) {
      console.error("No map data available");
      return null;
    }

    const imageData = this.mapMesh.material.map.image;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Tạo PGM header
    const header = `P5\n# CREATOR: NTU ${this.mapInfo.resolution.toFixed(
      3
    )} m/pix\n${width} ${height}\n255\n`;

    // Tạo binary array cho PGM data
    const pgmContent = new Uint8Array(width * height);

    // Copy image data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const alpha = data[((height - y - 1) * width + x) * 4 + 3];
        // Convert giống như trong C++
        if (alpha === 0) {
          pgmContent[index] = 254; // free
        } else if (alpha === 255) {
          pgmContent[index] = 0; // occupied
        } else {
          pgmContent[index] = 205; // unknown
        }
      }
    }

    // Encode header và combine với image data
    const headerBytes = new TextEncoder().encode(header);
    const pgmData = new Uint8Array(headerBytes.length + pgmContent.length);
    pgmData.set(headerBytes, 0);
    pgmData.set(pgmContent, headerBytes.length);

    return pgmData;
  }

  // Thêm phương thức để lấy thông tin map để lưu vào file YAML
  getMapMetadata() {
    if (!this.mapInfo) {
      console.error("No map info available");
      return null;
    }

    return {
      image: "map.pgm", // Tên file PGM
      resolution: this.mapInfo.resolution,
      origin: [
        this.mapInfo.origin.position.x,
        this.mapInfo.origin.position.y,
        this.mapInfo.origin.position.z || 0,
      ],
      occupied_thresh: 0.65,
      free_thresh: 0.196,
      negate: 0,
    };
  }

  // Helper method để tạo YAML string từ map metadata
  convertMetadataToYAML(metadata) {
    if (!metadata) return null;

    return [
      `image: ${metadata.image}`,
      `resolution: ${metadata.resolution}`,
      `origin: [${metadata.origin.join(", ")}]`,
      `occupied_thresh: ${metadata.occupied_thresh}`,
      `free_thresh: ${metadata.free_thresh}`,
      `negate: ${metadata.negate}`,
    ].join("\n");
  }
  // Phương thức để lấy cả PGM và YAML data
  getMapFiles() {
    if (!this.mapMesh || !this.mapMesh.material.map || !this.mapInfo) {
      console.error("No map data available");
      return null;
    }
    // Tạo PGM data trực tiếp
    const imageData = this.mapMesh.material.map.image;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Tạo PGM header
    const header = `P5\n# CREATOR: NTU ${this.mapInfo.resolution.toFixed(
      3
    )} m/pix\n${width} ${height}\n255\n`;

    // Encode header thành binary
    const headerBytes = new TextEncoder().encode(header);

    // Tạo binary array cho toàn bộ file PGM
    const pgmData = new Uint8Array(headerBytes.length + width * height);

    // Copy header vào đầu array
    pgmData.set(headerBytes, 0);

    // Copy image data trực tiếp vào array, không encode
    let offset = headerBytes.length;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const red = data[((height - y - 1) * width + x) * 4]; // Lấy giá trị kênh R
        // Convert giống như trong C++
        if (red === 0) {
          pgmData[offset] = 0x00; // occupied (0)
        } else if (red === 255) {
          pgmData[offset] = 0xfe; // free (254)
        } else {
          pgmData[offset] = 0xcd; // unknown (205)
        }
        offset++;
      }
    }
    //console.log('pgmData:', pgmData);
    // Tạo YAML content
    const yamlContent = [
      `image: ${
        this.mapInfo.image ||
        `/home/robot/maps/${this.siteId}_${this.mapId}.pgm`
      }`,
      `resolution: ${this.mapInfo.resolution}`,
      `origin: [${this.mapInfo.origin.position.x}, ${
        this.mapInfo.origin.position.y
      }, ${this.mapInfo.origin.position.z || 0}]`,
      "negate: 0",
      "occupied_thresh: 0.65",
      "free_thresh: 0.196\n",
    ].join("\n");

    // Convert YAML content to binary array
    const yamlData = new TextEncoder().encode(yamlContent);

    return {
      pgm: pgmData,
      yaml: yamlData,
    };
  }

  // Load points from database
  async loadPointsFromDatabase() {
    // Ensure DrawPosition tool exists
    if (!this.toolDrawPosition) {
      this.toolDrawPosition = new DrawPosition(
        this.scene,
        this.camera,
        this.renderer,
        this.mapMesh,
        this.mapInfo,
        this
      );
    }

    // Let DrawPosition tool handle the API call and data loading
    await this.toolDrawPosition.loadPointsFromDatabase();
  }

  // Load virtual walls from database
  async loadVirtualWallsFromDatabase() {
    // Ensure DrawVirtualWall tool exists
    if (!this.toolDrawVirtualWall) {
      this.createDrawVirtualWallTool();
    }

    // Let DrawVirtualWall tool handle the API call and data loading
    await this.toolDrawVirtualWall.loadVirtualWallsFromDatabase();
  }

  // Load forbidden zones from database
  async loadForbiddenZonesFromDatabase() {
    // Ensure DrawForbiddenZone tool exists
    if (!this.toolDrawForbiddenZone) {
      this.createDrawForbiddenZoneTool();
    }

    // Let DrawForbiddenZone tool handle the API call and data loading
    await this.toolDrawForbiddenZone.loadForbiddenZonesFromDatabase();
  }

  async loadPreferredZonesFromDatabase() {
    // Ensure DrawPreferredZone tool exists
    if (!this.toolDrawPreferredZone) {
      this.createDrawPreferredZoneTool();
    }

    // Let DrawPreferredZone tool handle the API call and data loading
    await this.toolDrawPreferredZone.loadPreferredZonesFromDatabase();
  }

  async loadUnpreferredZonesFromDatabase() {
    // Ensure DrawUnpreferredZone tool exists
    if (!this.toolDrawUnpreferredZone) {
      this.createDrawUnpreferredZoneTool();
    }

    // Let DrawUnpreferredZone tool handle the API call and data loading
    await this.toolDrawUnpreferredZone.loadUnpreferredZonesFromDatabase();
  }

  async loadCriticalZonesFromDatabase() {
    // Ensure DrawCriticalZone tool exists
    if (!this.toolDrawCriticalZone) {
      this.createDrawCriticalZoneTool();
    }

    // Let DrawCriticalZone tool handle the API call and data loading
    await this.toolDrawCriticalZone.loadCriticalZonesFromDatabase();
  }

  // Load markers from database
  async loadMarkersFromDatabase() {
    // Ensure DrawMarkers tool exists
    if (!this.toolDrawMarkers) {
      this.createDrawMarkersTool();
    }

    // Let DrawMarkers tool handle the API call and data loading
    await this.toolDrawMarkers.loadMarkersFromDatabase();
  }

  // Update robot position from odometry data
  updateRobotPositionFromOdom(position, orientation) {
    if (!this.robot) {
      console.warn("Robot not initialized");
      return false;
    }

    return this.robot.updateFromOdom(position, orientation);
  }

  // Wall Toolbar management methods
  showWallToolbar() {
    if (this.wallToolbar) {
      this.wallToolbar.show();
    }
  }

  hideWallToolbar() {
    if (this.wallToolbar) {
      this.wallToolbar.hide();
    }
  }

  toggleWallToolbar() {
    if (this.wallToolbar) {
      this.wallToolbar.toggle();
    }
  }

  // Update WallToolbar state based on current mouse mode
  updateWallToolbarState() {
    if (this.wallToolbar) {
      this.wallToolbar.updateFromMap2D();
    }
  }

  // Floor Toolbar management methods
  showFloorToolbar() {
    if (this.floorToolbar) {
      this.floorToolbar.show();
    }
  }

  hideFloorToolbar() {
    if (this.floorToolbar) {
      this.floorToolbar.hide();
    }
  }

  toggleFloorToolbar() {
    if (this.floorToolbar) {
      this.floorToolbar.toggle();
    }
  }

  // Update FloorToolbar state based on current mouse mode
  updateFloorToolbarState() {
    if (this.floorToolbar) {
      this.floorToolbar.updateFromMap2D();
    }
  }

  // Virtual Wall Toolbar management methods
  showVirtualWallToolbar() {
    if (this.virtualWallToolbar) {
      this.virtualWallToolbar.show();
    }
  }

  hideVirtualWallToolbar() {
    if (this.virtualWallToolbar) {
      this.virtualWallToolbar.hide();
    }
    if (this.toolDrawVirtualWall) {
      this.toolDrawVirtualWall.clearCurrentState();
      this.toolDrawVirtualWall.clearSelectedLine();
    }
  }

  toggleVirtualWallToolbar() {
    if (this.virtualWallToolbar) {
      this.virtualWallToolbar.toggle();
    }
  }

  // Update VirtualWallToolbar state based on current mouse mode
  updateVirtualWallToolbarState() {
    if (this.virtualWallToolbar) {
      this.virtualWallToolbar.updateFromMap2D();
    }
  }

  // Forbidden Zone Toolbar management methods
  showForbiddenZoneToolbar() {
    // ForbiddenZoneToolbar is managed by React component tree in EditMaps.js
    console.log("showForbiddenZoneToolbar called - managed by React component");
    if (this.forbiddenZoneToolbar) {
      this.forbiddenZoneToolbar.show();
    }
  }

  hideForbiddenZoneToolbar() {
    // ForbiddenZoneToolbar is managed by React component tree in EditMaps.js
    console.log("hideForbiddenZoneToolbar called - managed by React component");
    if (this.forbiddenZoneToolbar) {
      this.forbiddenZoneToolbar.hide();
    }
    if (this.toolDrawForbiddenZone) {
      this.toolDrawForbiddenZone.clearCurrentState();
    }
  }

  toggleForbiddenZoneToolbar() {
    // ForbiddenZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "toggleForbiddenZoneToolbar called - managed by React component"
    );
    if (this.forbiddenZoneToolbar) {
      this.forbiddenZoneToolbar.toggle();
    }
  }

  // Preferred Zone Toolbar management methods
  showPreferredZoneToolbar() {
    // PreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log("showPreferredZoneToolbar called - managed by React component");
    if (this.preferredZoneToolbar) {
      this.preferredZoneToolbar.show();
    }
  }

  hidePreferredZoneToolbar() {
    // PreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log("hidePreferredZoneToolbar called - managed by React component");
    if (this.preferredZoneToolbar) {
      this.preferredZoneToolbar.hide();
    }
    if (this.toolDrawPreferredZone) {
      this.toolDrawPreferredZone.clearCurrentState();
    }
  }

  togglePreferredZoneToolbar() {
    // PreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "togglePreferredZoneToolbar called - managed by React component"
    );
    if (this.preferredZoneToolbar) {
      this.preferredZoneToolbar.toggle();
    }
  }

  // Update ForbiddenZoneToolbar state based on current mouse mode
  updateForbiddenZoneToolbarState() {
    // ForbiddenZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "updateForbiddenZoneToolbarState called - managed by React component"
    );
    if (this.forbiddenZoneToolbar) {
      this.forbiddenZoneToolbar.updateFromMap2D();
    }
  }

  // Update PreferredZoneToolbar state based on current mouse mode
  updatePreferredZoneToolbarState() {
    // PreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "updatePreferredZoneToolbarState called - managed by React component"
    );
    if (this.preferredZoneToolbar) {
      this.preferredZoneToolbar.updateFromMap2D();
    }
  }

  // Unpreferred Zone Toolbar management methods
  showUnpreferredZoneToolbar() {
    // UnpreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "showUnpreferredZoneToolbar called - managed by React component"
    );
    if (this.unpreferredZoneToolbar) {
      this.unpreferredZoneToolbar.show();
    }
  }

  hideUnpreferredZoneToolbar() {
    // UnpreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "hideUnpreferredZoneToolbar called - managed by React component"
    );
    if (this.unpreferredZoneToolbar) {
      this.unpreferredZoneToolbar.hide();
    }
    if (this.toolDrawUnpreferredZone) {
      this.toolDrawUnpreferredZone.clearCurrentState();
    }
  }

  toggleUnpreferredZoneToolbar() {
    // UnpreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "toggleUnpreferredZoneToolbar called - managed by React component"
    );
    if (this.unpreferredZoneToolbar) {
      this.unpreferredZoneToolbar.toggle();
    }
  }

  // Update UnpreferredZoneToolbar state based on current mouse mode
  updateUnpreferredZoneToolbarState() {
    // UnpreferredZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "updateUnpreferredZoneToolbarState called - managed by React component"
    );
    if (this.unpreferredZoneToolbar) {
      this.unpreferredZoneToolbar.updateFromMap2D();
    }
  }

  // Critical Zone Toolbar management methods
  showCriticalZoneToolbar() {
    // CriticalZoneToolbar is managed by React component tree in EditMaps.js
    console.log("showCriticalZoneToolbar called - managed by React component");
    if (this.criticalZoneToolbar) {
      this.criticalZoneToolbar.show();
    }
  }

  hideCriticalZoneToolbar() {
    // CriticalZoneToolbar is managed by React component tree in EditMaps.js
    console.log("hideCriticalZoneToolbar called - managed by React component");
    if (this.criticalZoneToolbar) {
      this.criticalZoneToolbar.hide();
    }
    if (this.toolDrawCriticalZone) {
      this.toolDrawCriticalZone.clearCurrentState();
    }
  }

  toggleCriticalZoneToolbar() {
    // CriticalZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "toggleCriticalZoneToolbar called - managed by React component"
    );
    if (this.criticalZoneToolbar) {
      this.criticalZoneToolbar.toggle();
    }
  }

  // Update CriticalZoneToolbar state based on current mouse mode
  updateCriticalZoneToolbarState() {
    // CriticalZoneToolbar is managed by React component tree in EditMaps.js
    console.log(
      "updateCriticalZoneToolbarState called - managed by React component"
    );
    if (this.criticalZoneToolbar) {
      this.criticalZoneToolbar.updateFromMap2D();
    }
  }

  // Position Toolbar management methods
  showPositionToolbar() {
    console.log("showPositionToolbar called");
    if (this.positionToolbar) {
      this.positionToolbar.show();
    }
  }

  hidePositionToolbar() {
    console.log("hidePositionToolbar called");
    if (this.positionToolbar) {
      this.positionToolbar.hide();
    }
    if (this.toolDrawPosition) {
      this.toolDrawPosition.clearCurrentState();
    }
  }

  togglePositionToolbar() {
    console.log("togglePositionToolbar called");
    if (this.positionToolbar) {
      this.positionToolbar.toggle();
    }
  }

  // Update PositionToolbar state based on current mouse mode
  updatePositionToolbarState() {
    console.log("updatePositionToolbarState called");
    if (this.positionToolbar) {
      this.positionToolbar.updateFromMap2D();
    }
  }

  // Markers Toolbar management methods
  showMarkersToolbar() {
    console.log("showMarkersToolbar called");
    if (this.markersToolbar) {
      this.markersToolbar.show();
    }
  }

  hideMarkersToolbar() {
    console.log("hideMarkersToolbar called");
    if (this.markersToolbar) {
      this.markersToolbar.hide();
    }
    if (this.toolDrawMarkers) {
      this.toolDrawMarkers.clearCurrentState();
    }
  }

  toggleMarkersToolbar() {
    console.log("toggleMarkersToolbar called");
    if (this.markersToolbar) {
      this.markersToolbar.toggle();
    }
  }

  // Update MarkersToolbar state based on current mouse mode
  updateMarkersToolbarState() {
    if (this.markersToolbar) {
      this.markersToolbar.updateFromMap2D();
    }
  }

  // Set position dialog callback
  setPositionDialogCallback(callback) {
    if (this.positionToolbar) {
      this.positionToolbar.setDialogCallback(callback);
    }
  }

  // Set markers dialog callback
  setMarkersDialogCallback(callback) {
    if (this.markersToolbar) {
      this.markersToolbar.setDialogCallback(callback);
    }
    if (this.toolDrawMarkers) {
      this.toolDrawMarkers.setDialogCallbacks(
        callback, // onCreated
        callback, // onUpdated
        callback // onClose
      );
    }
  }

  // Set pose estimate callback
  setPoseEstimateCallback(callback) {
    if (this.navigateToolbar) {
      this.navigateToolbar.setPoseEstimateCallback(callback);
    }
  }

  // Set navigation goal callback
  setNavGoalCallback(callback) {
    if (this.navigateToolbar) {
      this.navigateToolbar.setNavGoalCallback(callback);
    }
  }

  //create new drawVirtualWall tool
  createDrawVirtualWallTool() {
    this.toolDrawVirtualWall = new DrawVirtualWall(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  //create new drawForbiddenZone tool
  createDrawForbiddenZoneTool() {
    this.toolDrawForbiddenZone = new DrawForbiddenZone(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  //create new drawPreferredZone tool
  createDrawPreferredZoneTool() {
    this.toolDrawPreferredZone = new DrawPreferredZone(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  //create new drawUnpreferredZone tool
  createDrawUnpreferredZoneTool() {
    this.toolDrawUnpreferredZone = new DrawUnpreferredZone(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  //create new drawCriticalZone tool
  createDrawCriticalZoneTool() {
    this.toolDrawCriticalZone = new DrawCriticalZone(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  //create new drawMarkers tool
  createDrawMarkersTool() {
    this.toolDrawMarkers = new DrawMarkers(
      this.scene,
      this.camera,
      this.renderer,
      this.mapMesh,
      this.mapInfo,
      this
    );
  }

  // update Forbidden data
  UpdateForbiddenZoneMap(points) {
    console.log("UpdateForbiddenZoneMap", points.mapForbidden);

    // Clear existing forbidden zones
    this.listForbiddenZones = [];

    // Use the tool's method to load forbidden zones from server data
    if (this.toolDrawForbiddenZone) {
      this.toolDrawForbiddenZone.loadForbiddenZonesFromServerData(
        points.mapForbidden
      );

      // Update local list with the loaded data
      this.listForbiddenZones =
        this.toolDrawForbiddenZone.getAllForbiddenZones();

      // Update maxIdForbidden based on the tool's IDCount
      this.maxIdForbidden = this.toolDrawForbiddenZone.getCurrentIDCount() - 1;
    } else {
      console.warn("DrawForbiddenZone tool not available");
    }
  }

  removeForbiddenZoneById(id) {
    // Remove from the tool's data and visual arrays
    if (this.toolDrawForbiddenZone) {
      this.toolDrawForbiddenZone.removeForbiddenZoneById(id);
    }

    // Remove from local list
    const localIndex = this.listForbiddenZones.findIndex(
      (zone) => zone.id === id
    );
    if (localIndex !== -1) {
      this.listForbiddenZones.splice(localIndex, 1);
    }
  }

  // Update DrawPosition with new footprint and texture
  updateDrawPositionFootprint() {
    if (this.toolDrawPosition && this.robot) {
      this.toolDrawPosition.updateFootprintAndTexture();
      this.toolDrawPosition.refreshPositionMeshes();
      console.log("Updated DrawPosition with new footprint and texture");
    }
  }

  // Retry adding info bars for all toolbars
  retryAddInfoBars() {
    if (this.wallToolbar) {
      this.wallToolbar.retryAddInfoBar();
    }
    if (this.virtualWallToolbar) {
      this.virtualWallToolbar.retryAddInfoBar();
    }
    if (this.forbiddenZoneToolbar) {
      this.forbiddenZoneToolbar.retryAddInfoBar();
    }
    if (this.preferredZoneToolbar) {
      this.preferredZoneToolbar.retryAddInfoBar();
    }
    if (this.positionToolbar) {
      this.positionToolbar.retryAddInfoBar();
    }
    if (this.markersToolbar) {
      this.markersToolbar.retryAddInfoBar();
    }
    if (this.navigateToolbar) {
      // NavigateToolbar doesn't have info bars, but we can add any retry logic here if needed
      console.log("NavigateToolbar retry logic - no info bars needed");
    }
  }

  // Navigate Toolbar management methods
  showNavigateToolbar() {
    console.log("Map2D: showNavigateToolbar called");
    console.log("Map2D: navigateToolbar exists:", !!this.navigateToolbar);
    if (this.navigateToolbar) {
      this.navigateToolbar.show();
      console.log("Map2D: NavigateToolbar.show() called");
    } else {
      console.warn("Map2D: navigateToolbar is null");
    }
  }

  hideNavigateToolbar() {
    console.log("hideNavigateToolbar called");
    if (this.navigateToolbar) {
      this.navigateToolbar.hide();
    }
  }

  toggleNavigateToolbar() {
    console.log("toggleNavigateToolbar called");
    if (this.navigateToolbar) {
      this.navigateToolbar.toggle();
    }
  }

  // Update NavigateToolbar state based on current mouse mode
  updateNavigateToolbarState() {
    console.log("updateNavigateToolbarState called");
    if (this.navigateToolbar) {
      // Add any state updates specific to navigate toolbar if needed
    }
  }

  // Set navigate toolbar button text
  setNavigateButtonText(buttonId, text) {
    if (this.navigateToolbar) {
      this.navigateToolbar.updateButtonText(buttonId, text);
    }
  }

  // Enable/disable navigate toolbar button
  setNavigateButtonEnabled(buttonId, enabled) {
    if (this.navigateToolbar) {
      this.navigateToolbar.setButtonEnabled(buttonId, enabled);
    }
  }

  // Get navigate toolbar current mode
  getNavigateCurrentMode() {
    if (this.navigateToolbar) {
      return this.navigateToolbar.getCurrentMode();
    }
    return "none";
  }

  // Check if navigate toolbar is active
  isNavigateToolbarActive() {
    if (this.navigateToolbar) {
      return this.navigateToolbar.isToolbarActive();
    }
    return false;
  }

  // Save map data to database
  async saveToDatabase() {
    try {
      console.log("Map2D: Starting save to database...");

      // Get map files (PGM and YAML)
      const mapFiles = this.getMapFiles();
      if (!mapFiles) {
        throw new Error("Failed to get map files");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Save map files to database
      const mapData = {
        siteId: this.siteId,
        mapId: this.mapId,
        dateTime: new Date().toISOString(),
        info: Array.from(mapFiles.yaml), // Convert Uint8Array to regular array
        mapData: Array.from(mapFiles.pgm), // Convert Uint8Array to regular array
      };

      console.log("Map2D: Saving map files...");
      const response = await fetch(
        `${SERVER_URL}/api/maps/save/${this.mapId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(mapData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Map2D: Map files saved successfully:", result);

      // Save all map elements (positions, virtual walls, forbidden zones, markers)
      await this.saveAllMapElements();

      console.log("Map2D: All map data saved successfully");

      // Save costmap
      console.log("Map2D: Saving costmap...");
      const costmapResponse = await fetch(
        `${SERVER_URL}/api/robot/save-costmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mapId: this.mapId,
            siteId: this.siteId,
          }),
        }
      );

      if (!costmapResponse.ok) {
        const errorText = await costmapResponse.text();
        throw new Error(
          `Failed to save costmap: HTTP ${costmapResponse.status}: ${errorText}`
        );
      }

      const costmapResult = await costmapResponse.json();
      console.log("Map2D: Costmap saved successfully:", costmapResult);

      const updateMapResponse = await fetch(
        `${SERVER_URL}/api/robot/update-map`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mapId: this.mapId,
            siteId: this.siteId,
          }),
        }
      );

      if (!updateMapResponse.ok) {
        const errorText = await updateMapResponse.text();
        throw new Error(
          `Failed to update map: HTTP ${updateMapResponse.status}: ${errorText}`
        );
      }

      return { success: true, message: "Map saved successfully" };
    } catch (error) {
      console.error("Map2D: Error saving to database:", error);
      throw error;
    }
  }

  // Save all map elements to database
  async saveAllMapElements() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Save positions
      if (this.toolDrawPosition) {
        console.log("Map2D: Saving positions...");
        await this.toolDrawPosition.saveToDatabase();
      }

      // Save virtual walls
      if (this.toolDrawVirtualWall) {
        console.log("Map2D: Saving virtual walls...");
        await this.toolDrawVirtualWall.saveToDatabase();
      }

      // Save forbidden zones
      if (this.toolDrawForbiddenZone) {
        console.log("Map2D: Saving forbidden zones...");
        await this.toolDrawForbiddenZone.saveToDatabase();
      }

      // Save preferred zones
      if (this.toolDrawPreferredZone) {
        console.log("Map2D: Saving preferred zones...");
        await this.toolDrawPreferredZone.saveToDatabase();
      }

      // Save unpreferred zones
      if (this.toolDrawUnpreferredZone) {
        console.log("Map2D: Saving unpreferred zones...");
        await this.toolDrawUnpreferredZone.saveToDatabase();
      }

      // Save critical zones
      if (this.toolDrawCriticalZone) {
        console.log("Map2D: Saving critical zones...");
        await this.toolDrawCriticalZone.saveToDatabase();
      }

      // Save markers
      if (this.toolDrawMarkers) {
        console.log("Map2D: Saving markers...");
        await this.toolDrawMarkers.saveToDatabase();
      }

      console.log("Map2D: All map elements saved successfully");
    } catch (error) {
      console.error("Map2D: Error saving map elements:", error);
      throw error;
    }
  }
}
