import { useEffect, useRef } from "react";
import serverConfig from "../../../config/serverConfig";
import { MissionDesignCard } from "../../common";
import "../map/EditMaps/EditMaps.css";
import { Map2D } from "../map/EditMaps/Map_2D/Map_2D";
import "./MapWidget.css";
// Global variables for storing current site and map IDs
let globalCurrentSiteId = null;
let globalCurrentMapId = null;
let globalCurrentMapData = null;

const MapWidgetComponent = ({ widget, onEdit }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const currentMapId = useRef(null);
  const currentSiteId = useRef(null);
  const currentMapData = useRef(null);
  const wsRef = useRef(null);
  const mapChangeWsRef = useRef(null);
  console.log("Rendering MapWidgetComponent with widget:", widget);
  const setGlobalCurrentSite = (siteId) => {
    globalCurrentSiteId = siteId;
    currentSiteId.current = siteId;
    console.log("Set global current site ID:", siteId);
  };

  const setGlobalCurrentMap = (mapId) => {
    globalCurrentMapId = mapId;
    currentMapId.current = mapId;
    console.log("Set global current map ID:", mapId);
  };

  const setGlobalCurrentMapData = (mapData) => {
    if (!mapData) {
      console.warn("⚠️ MapWidget: Attempting to set null/undefined map data");
      return;
    }

    globalCurrentMapData = mapData;
    currentMapData.current = mapData;
    console.log("✅ MapWidget: Set global current map data:", {
      hasInfo: !!mapData.info,
      hasMapData: !!mapData.mapData,
      mapId: mapData.id,
      siteId: mapData.siteId,
    });
  };

  const getGlobalCurrentSite = () => {
    return globalCurrentSiteId;
  };

  const getGlobalCurrentMap = () => {
    return globalCurrentMapId;
  };

  const getGlobalCurrentMapData = () => {
    return globalCurrentMapData;
  };

  // Function to reload map data when map/site changes
  const reloadMapData = async (newMapId, newSiteId) => {
    try {
      console.log("🔄 MapWidget: Reloading map data due to map/site change:", {
        newMapId,
        newSiteId,
      });

      // Update global variables
      setGlobalCurrentMap(newMapId);
      setGlobalCurrentSite(newSiteId);

      // Get new map data
      const mapData = await getMapDataFromServer(newMapId, newSiteId);
      if (mapData) {
        setGlobalCurrentMapData(mapData);

        // Update map visualization if map instance exists
        if (mapRef.current && mapData) {
          // Update base map
          if (mapData.info && mapData.mapData) {
            mapRef.current.setMapData(mapData);
            mapRef.current.resetView();
            mapRef.current.mapId = newMapId;
            mapRef.current.siteId = newSiteId;
          }

          // Load virtual walls, forbidden zones, positions, and markers in parallel
          if (mapRef.current) {
            console.log(
              "🔄 MapWidget: Reloading all map elements in parallel..."
            );
            const startTime = performance.now();

            // Load all elements in parallel for better performance
            await Promise.all([
              mapRef.current.loadVirtualWallsFromDatabase(),
              mapRef.current.loadForbiddenZonesFromDatabase(),
              mapRef.current.loadPreferredZonesFromDatabase(),
              mapRef.current.loadUnpreferredZonesFromDatabase(),
              mapRef.current.loadCriticalZonesFromDatabase(),
              mapRef.current.loadPointsFromDatabase(),
              mapRef.current.loadMarkersFromDatabase(),
            ]);

            const endTime = performance.now();
            console.log(
              `✅ MapWidget: All map elements reloaded in ${(
                endTime - startTime
              ).toFixed(2)}ms`
            );
          }

          // // Update virtual walls if available
          // console.log('🔄 MapWidget: Reloading virtual walls:', mapData.virtualWalls);
          // if (mapData.virtualWalls && mapRef.current.toolDrawVirtualWall) {
          //   mapRef.current.toolDrawVirtualWall.loadVirtualWallsFromServerData(mapData.virtualWalls.mapVirtualWall);
          // }

          // // Update forbidden zones if available
          // console.log('🔄 MapWidget: Reloading forbidden zones:', mapData.forbiddenZones);
          // if (mapData.forbiddenZones && mapRef.current.toolDrawForbiddenZone) {
          //   mapRef.current.toolDrawForbiddenZone.loadForbiddenZonesFromServerData(mapData.forbiddenZones.mapForbidden);
          // }

          // // Update positions if available
          // console.log('🔄 MapWidget: Reloading positions:', mapData.positions);
          // if (mapData.positions && mapRef.current.toolDrawPosition) {
          //   mapRef.current.toolDrawPosition.loadPositionsFromServerData(mapData.positions.mapPoint);
          // }

          // // Update markers if available
          // console.log('🔄 MapWidget: Reloading markers:', mapData.markers);
          // if (mapData.markers && mapRef.current.toolDrawMarkers) {
          //   mapRef.current.toolDrawMarkers.loadMarkersFromServerData(mapData.markers);
          //}
        }

        console.log("✅ MapWidget: Successfully reloaded map data");
      } else {
        console.warn("⚠️ MapWidget: Failed to get new map data");
      }
    } catch (error) {
      console.error("❌ MapWidget: Error reloading map data:", error);
    }
  };

  const getMapDataFromServer = async (mapId, siteId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return null;
      }

      console.log(
        "🔄 MapWidget: Loading map data for mapId:",
        mapId,
        "siteId:",
        siteId
      );

      // First try to load map data
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/maps/load/${mapId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            siteId: siteId,
          }),
        }
      );

      if (!response.ok) {
        console.error("HTTP error! status: ", response.status);
        return null;
      }

      const data = await response.json();

      console.log("📥 MapWidget: API response data:", data);

      if (data.success && data.data) {
        console.log(
          "✅ MapWidget: API response is successful, validating data structure..."
        );
        console.log("🔍 MapWidget: data.data structure:", {
          hasInfo: !!data.data.info,
          hasMapData: !!data.data.mapData,
          infoType: typeof data.data.info,
          mapDataType: typeof data.data.mapData,
          infoContent: data.data.info,
          mapDataContent: data.data.mapData,
        });

        // Validate map data structure
        if (!data.data.info || !data.data.mapData) {
          console.error(
            "❌ MapWidget: Invalid map data structure - missing info or mapData"
          );
          return null;
        }

        // Get additional map data
        try {
          console.log("🔄 MapWidget: Loading additional map elements...");
          // Send start navigation to server
          try {
            console.log("🔄 MapWidget: About to call start-navigation API...");
            const startNavigationResponse = await fetch(
              `${serverConfig.SERVER_URL}/api/robot/start-navigation`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  mapId: mapId,
                  siteId: siteId,
                }),
              }
            );

            console.log(
              "📡 MapWidget: start-navigation response received:",
              startNavigationResponse.status
            );
            if (startNavigationResponse.ok) {
              console.log("✅ MapWidget: Navigation started successfully");
            } else {
              console.warn(
                "⚠️ MapWidget: Failed to start navigation, status:",
                startNavigationResponse.status
              );
            }
          } catch (navError) {
            console.error("❌ MapWidget: Error starting navigation:", navError);
            console.error("❌ MapWidget: Navigation error details:", {
              message: navError.message,
              stack: navError.stack,
              name: navError.name,
            });
          }

          // Combine all data and ensure required fields
          console.log("🔄 MapWidget: Creating combinedData...");
          const combinedData = {
            ...data.data,
            id: mapId,
            siteId: siteId,
          };

          console.log("✅ MapWidget: Map data loaded successfully:", {
            hasInfo: !!combinedData.info,
            hasMapData: !!combinedData.mapData,
            mapId: combinedData.id,
            siteId: combinedData.siteId,
          });

          console.log("📤 MapWidget: Returning combinedData");
          return combinedData;
        } catch (error) {
          console.error(
            "❌ MapWidget: Error fetching additional map data:",
            error
          );
          // Return base map data even if additional data fetch fails
          const fallbackData = {
            ...data.data,
            id: mapId,
            siteId: siteId,
          };
          console.log("⚠️ MapWidget: Using fallback map data:", {
            hasInfo: !!fallbackData.info,
            hasMapData: !!fallbackData.mapData,
            mapId: fallbackData.id,
            siteId: fallbackData.siteId,
          });
          return fallbackData;
        }
      } else {
        console.warn("⚠️ MapWidget: No map data found in response");
        return null;
      }
    } catch (error) {
      console.error("❌ MapWidget: Error getting map data:", error);
      return null;
    }
  };

  const getMapId = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return null;
      }
      console.log("globalCurrentSiteId", globalCurrentSiteId);
      // First get siteId if we don't have it
      const siteId = globalCurrentSiteId || (await getSiteId());
      if (!siteId) {
        console.error("No siteId available");
        return null;
      }

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/maps/getCurrentMapId/${siteId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const mapId = data.data.mapId;
        setGlobalCurrentMap(mapId); // Set global map ID
        return mapId;
      } else {
        console.warn("No current map ID found in response");
        return null;
      }
    } catch (error) {
      console.error("Error getting current map ID:", error);
      return null;
    }
  };

  const getSiteId = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return null;
      }

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/maps/getCurrentSiteId`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        console.warn("No site ID found in response");
        return null;
      }
    } catch (error) {
      console.error("Error getting site ID:", error);
      return null;
    }
  };

  useEffect(() => {
    if (containerRef.current && widget.hasCustomSize()) {
      const size = widget.getSize();
      containerRef.current.style.width = `${size.width}px`;
      containerRef.current.style.height = `${size.height}px`;
    }
  }, [widget]);

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;

    // Tạo một ResizeObserver để theo dõi sự thay đổi kích thước của container
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        console.log("Container resized, updating map renderer and camera.");
        mapRef.current.handleResize();
      }
    });

    // Bắt đầu theo dõi
    resizeObserver.observe(containerRef.current);

    // Dọn dẹp khi component bị unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Chạy một lần duy nhất sau khi component được mount

  useEffect(() => {
    if (!canvasRef.current) return;

    const initMap = async () => {
      // Create map instance
      const map = new Map2D(canvasRef.current);
      await map.initialize();
      mapRef.current = map;

      // Configure map based on display mode
      if (widget.displayMode === "display" && mapRef.current) {
        map.initMapClickHandler();
        map.initMouseModeSelection();
        map.setToolMapMode(false);
        map.hideWallToolbar();
        map.hideFloorToolbar();

        if (mapRef.current.toolDrawVirtualWall == null) {
          mapRef.current.createDrawVirtualWallTool();
        }
        map.hideVirtualWallToolbar();

        if (mapRef.current.toolDrawForbiddenZone == null) {
          mapRef.current.createDrawForbiddenZoneTool();
        }
        map.hideForbiddenZoneToolbar();
        map.hidePositionToolbar();
        map.showNavigateToolbar();
        map.setPanMode();
        map.robot.setPathVisible(false);
        map.robot.setGlobalPathPlanningVisible(true);
        map.setPoseEstimateCallback(handleInitPoseEstimate);

        // get current map id and site id from server
        const siteId = await getSiteId();
        setGlobalCurrentSite(siteId);
        const mapId = await getMapId();

        setGlobalCurrentMap(mapId);

        console.log("mapId", mapId);
        console.log("siteId", siteId);
        // Get map data and update current map
        if (mapId) {
          console.log(
            "🔄 MapWidget: About to call getMapDataFromServer with:",
            { mapId, siteId }
          );
          const mapData = await getMapDataFromServer(mapId, siteId);
          console.log("📊 MapWidget: getMapDataFromServer returned:", mapData);
          if (mapData) {
            console.log(
              "✅ MapWidget: mapData is valid, processing...",
              mapData
            );
            setGlobalCurrentMapData(mapData);

            // Update map visualization if needed
            if (mapRef.current && mapData) {
              // Update base map
              if (mapData.info && mapData.mapData) {
                mapRef.current.setMapData(mapData);
                mapRef.current.resetView();
                // Set mapId and siteId from parameters, not from mapData
                mapRef.current.mapId = mapId;
                mapRef.current.siteId = siteId;
              }

              if (mapRef.current) {
                console.log(
                  "🔄 MapWidget: Loading all map elements in parallel..."
                );
                const startTime = performance.now();

                // Load all elements in parallel for better performance
                await Promise.all([
                  mapRef.current.loadVirtualWallsFromDatabase(),
                  mapRef.current.loadForbiddenZonesFromDatabase(),
                  mapRef.current.loadPreferredZonesFromDatabase(),
                  mapRef.current.loadUnpreferredZonesFromDatabase(),
                  mapRef.current.loadCriticalZonesFromDatabase(),
                  mapRef.current.loadPointsFromDatabase(),
                  mapRef.current.loadMarkersFromDatabase(),
                ]);

                const endTime = performance.now();
                console.log(
                  `✅ MapWidget: All map elements loaded in ${(
                    endTime - startTime
                  ).toFixed(2)}ms`
                );
              }
            }
          }
        }

        // start display mode
        startDisplayMode();
      }
    };

    initMap();

    return () => {
      // Close WebSocket connection
      if (wsRef.current) {
        console.log("Closing WebSocket connection");
        wsRef.current.close();
        wsRef.current = null;
      }

      // Dispose map
      if (mapRef.current) {
        // Clear WebSocket reference from map
        if (mapRef.current.mapWebSocket) {
          mapRef.current.mapWebSocket = null;
        }
        mapRef.current.dispose();
      }
    };
  }, [widget.displayMode]);

  // Callback function to handle pose estimate from NavigateToolbar
  const handleInitPoseEstimate = async (poseEstimateData) => {
    try {
      console.log(
        "EditMaps: handleInitPoseEstimate called with data:",
        poseEstimateData
      );

      if (!poseEstimateData) {
        console.warn("EditMaps: No pose estimate data provided");
        return;
      }

      const { position, orientation } = poseEstimateData;

      if (!position || !orientation) {
        console.warn(
          "EditMaps: Invalid pose estimate data - missing position or orientation"
        );
        return;
      }

      // Validate position data
      if (typeof position.x !== "number" || typeof position.y !== "number") {
        console.warn("EditMaps: Invalid position data");
        return;
      }

      // Validate orientation data (quaternion)
      if (
        typeof orientation.x !== "number" ||
        typeof orientation.y !== "number" ||
        typeof orientation.z !== "number" ||
        typeof orientation.w !== "number"
      ) {
        console.warn("EditMaps: Invalid orientation data");
        return;
      }

      console.log("EditMaps: Pose estimate validated successfully:", {
        position: { x: position.x, y: position.y, z: position.z },
        orientation: {
          x: orientation.x,
          y: orientation.y,
          z: orientation.z,
          w: orientation.w,
        },
      });

      // Call API to publish pose estimate to ROS
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/robot/init-pose-estimate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            poseEstimate: {
              position: {
                x: position.x,
                y: position.y,
                z: position.z || 0.0,
              },
              orientation: {
                x: orientation.x,
                y: orientation.y,
                z: orientation.z,
                w: orientation.w,
              },
            },
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("EditMaps: Pose estimate published to ROS successfully");

        // // Show success message
        // setMessageDialogConfig({
        //   title: 'Pose Estimate Applied',
        //   message: `Robot pose has been updated to: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`,
        //   onConfirm: () => setShowMessageDialog(false),
        //   onClose: () => setShowMessageDialog(false)
        // });
        // setShowMessageDialog(true);
      } else {
        throw new Error(result.message || "Failed to publish pose estimate");
      }
    } catch (error) {
      console.error("EditMaps: Error handling pose estimate:", error);

      // // Show error message
      // setMessageDialogConfig({
      //   title: 'Error',
      //   message: `Failed to apply pose estimate: ${error.message}`,
      //   onConfirm: () => setShowMessageDialog(false),
      //   onClose: () => setShowMessageDialog(false)
      // });
      // setShowMessageDialog(true);
    }
  };

  const startDisplayMode = () => {
    try {
      // Initialize WebSocket connection for map and tf updates
      const ws = new WebSocket(serverConfig.WS_URL);
      console.log("🔌 MapWidget connecting to WebSocket:", serverConfig.WS_URL);
      wsRef.current = ws; // Store WebSocket reference for cleanup

      ws.onopen = async () => {
        console.log("✅ MapWidget WebSocket connected");
        // Store WebSocket reference for cleanup
        if (mapRef.current) {
          mapRef.current.mapWebSocket = ws;

          // Initialize map if not already initialized
          if (!mapRef.current.isInitialized) {
            console.log(
              "mapRef.current.isInitialized",
              mapRef.current.isInitialized
            );
            const initSuccess = await mapRef.current.initialize();
            if (!initSuccess) {
              console.error("Failed to initialize map after starting SLAM");
              // setError('Failed to initialize map after starting SLAM'); // Removed setError
            } else {
              console.log("mapRef isInitialized", mapRef.current.isInitialized);
              // Create robot frame for visualization
              // mapRef.current.createRobotFrame();
              mapRef.current.showRobot();
              if (mapRef.current.robot) {
                mapRef.current.robot.setPathVisible(false);
              }

              // Fit camera to map if map data is available
              if (mapRef.current.mapData && mapRef.current.mapData.info) {
                setTimeout(() => {
                  if (mapRef.current && mapRef.current.isInitialized) {
                    mapRef.current.fitCameraToMap();
                  }
                }, 1000); // Small delay to ensure map is fully loaded
              }
            }
          } else {
            // Create robot frame for visualization
            //mapRef.current.createRobotFrame();
            mapRef.current.showRobot();
            if (mapRef.current.robot) {
              mapRef.current.robot.setPathVisible(false);
            }
          }

          // Add small delay to ensure robot is fully initialized before processing messages
          setTimeout(() => {}, 500);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // // Handle map updates
          // if (message.type === 'map_update' && mapRef.current) {
          //   // Handle map initialization asynchronously
          //   const handleMapUpdate = async () => {
          //     // Ensure map is initialized before updating
          //     if (!mapRef.current.isInitialized) {
          //       const initSuccess = await mapRef.current.initialize();
          //       if (!initSuccess) {
          //         console.error('Failed to initialize map for update');
          //         return;
          //       }
          //     }

          //     // Update map with SLAM data - pass only the data portion
          //     mapRef.current.updateMapFromSLAM(message.data);

          //     // Fit camera to the new map data
          //     setTimeout(() => {
          //       if (mapRef.current && mapRef.current.isInitialized) {
          //         mapRef.current.fitCameraToMap();
          //       }
          //     }, 500);
          //   };

          //   handleMapUpdate();
          // }
          // else
          if (message.type === "map_change") {
            console.log(
              "📋 MapWidget: Received map change notification:",
              message.data
            );

            const { id_map, id_site } = message.data;
            if (id_map == null || id_site == null) {
              console.log(
                "📋 MapWidget: Map change notification received but no change detected"
              );
              return;
            }

            const currentMapId = getGlobalCurrentMap();
            const currentSiteId = getGlobalCurrentSite();

            // Check if map or site has changed
            if (id_map !== currentMapId || id_site !== currentSiteId) {
              console.log(
                "🔄 MapWidget: Map or site changed, reloading data:",
                {
                  current: { mapId: currentMapId, siteId: currentSiteId },
                  new: { mapId: id_map, siteId: id_site },
                }
              );

              // Reload map data with new IDs
              reloadMapData(id_map, id_site);
            } else {
              console.log(
                "ℹ️ MapWidget: Map change notification received but no change detected"
              );
            }
          }
          // Handle robot TF updates
          else if (message.type === "robot_tf" && mapRef.current) {
            const robotTFs = message.data;
            if (robotTFs && robotTFs.transforms) {
              if (mapRef.current.robot) {
                mapRef.current.robot.setTF(robotTFs.transforms);
              }
            } else {
              console.warn("Invalid TF data format:", robotTFs);
            }
          }
          // Handle laser scan updates
          else if (message.type === "scan_update" && mapRef.current) {
            const scanData = message.data;

            // Check if map and robot are fully initialized before processing scan
            if (
              mapRef.current.isInitialized &&
              mapRef.current.robot &&
              mapRef.current.scene
            ) {
              try {
                mapRef.current.robot.updateScan(scanData);
              } catch (error) {
                console.error("Error processing scan update:", error);
              }
            } else {
              console.warn("❌ Cannot process scan - conditions not met:", {
                mapInitialized: mapRef.current.isInitialized,
                hasRobot: !!mapRef.current.robot,
                hasScene: !!mapRef.current.scene,
                robotHasScene: mapRef.current.robot
                  ? !!mapRef.current.robot.scene
                  : false,
                scenesMatch: mapRef.current.robot
                  ? mapRef.current.robot.scene === mapRef.current.scene
                  : false,
              });
            }
          }
          // Handle odometry updates from joystick
          else if (message.type === "odom_update" && mapRef.current) {
            const odomData = message.data;

            // Check if map is initialized before processing odom
            if (mapRef.current.isInitialized) {
              // Update robot position based on odometry data
              if (odomData && odomData.pose && odomData.pose.pose) {
                const pose = odomData.pose.pose;
                const position = pose.position;
                const orientation = pose.orientation;

                // Update robot position on map if needed
                // This can be used for real-time position tracking during joystick control
                //mapRef.current.updateRobotPositionFromOdom(position, orientation);
              }
            } else {
              console.warn("Cannot process odom - map not initialized");
            }
          }
          // Handle nav global path planning updates
          else if (
            message.type === "nav_global_path_planning" &&
            mapRef.current
          ) {
            const pathData = message.data;
            if (mapRef.current.robot) {
              mapRef.current.robot.updatePath(pathData);
            }
          }
        } catch (error) {
          console.error("WebSocket message processing error:", {
            error: error.message,
            stack: error.stack,
            data: event.data,
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        // Clear reference
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        // Try to reconnect if connection was lost and component is still mounted
        if (
          mapRef.current &&
          mapRef.current.displayRobot &&
          wsRef.current === null
        ) {
          console.log("Attempting to reconnect WebSocket in 3 seconds...");
          setTimeout(() => {
            // Only reconnect if component is still mounted and no new connection exists
            if (mapRef.current && !wsRef.current) {
              startDisplayMode();
            }
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Error initializing map after SLAM:", error);
    }
  };

  const handleZoom = () => {
    if (mapRef.current) {
      // Toggle zoom mode
      if (mapRef.current.setZoomMode()) {
        // Add active class to zoom button
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) {
          zoomButton.classList.add("active");
          // Remove active from other buttons
          const panButton = document.querySelector(".pan-tools .tool-button");
          if (panButton) panButton.classList.remove("active");
        }
      } else {
        // Remove active class if zoom mode is disabled
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) zoomButton.classList.remove("active");
      }
    }
  };

  const handlePan = () => {
    if (mapRef.current) {
      // Toggle pan mode
      if (mapRef.current.setPanMode()) {
        // Add active class to pan button
        const panButton = document.querySelector(".pan-tools .tool-button");
        if (panButton) {
          panButton.classList.add("active");
          // Remove active from other buttons
          const zoomButton = document.querySelector(".zoom-tools .tool-button");
          if (zoomButton) zoomButton.classList.remove("active");
        }
      } else {
        // Remove active class if pan mode is disabled
        const panButton = document.querySelector(".pan-tools .tool-button");
        if (panButton) panButton.classList.remove("active");
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.fitCameraToMap();
      // Reset active states of all toolbar buttons
      const toolButtons = document.querySelectorAll(".tool-button");
      toolButtons.forEach((button) => button.classList.remove("active"));
    }
  };

  if (widget.displayMode === "display") {
    return renderDisplayMode(widget, containerRef, canvasRef, mapRef);
  } else {
    return renderDesignMode(widget, onEdit, containerRef);
  }
};

const renderDesignMode = (widget, onEdit, containerRef) => {
  return (
    <MissionDesignCard
      onEdit={() => {
        onEdit(widget.id);
      }}
      title={widget.title}
      subtitle={widget.settings}
    />
    // <div
    //   ref={containerRef}
    //   className="map-widget design-mode"
    //   data-widget-id={widget.id}
    //   style={{
    //     gridColumn: `span ${widget.colspan}`,
    //     gridRow: `span ${widget.rowspan}`,
    //   }}
    // >
    //   <div className="widget-header">
    //     <div className="widget-info">
    //       <h3 className="widget-title">{widget.title}</h3>
    //       <p className="widget-settings">{widget.settings}</p>
    //     </div>
    //   </div>
    //   {onEdit && (
    //     <button
    //       className="widget-edit-btn"
    //       onClick={() => {
    //         onEdit(widget.id);
    //       }}
    //       title="Edit widget"
    //     >
    //       <span className="edit-icon"></span>
    //     </button>
    //   )}
    // </div>
  );
};

const renderDisplayMode = (widget, containerRef, canvasRef, mapRef) => {
  const handleZoom = () => {
    if (mapRef.current) {
      // Toggle zoom mode
      if (mapRef.current.setZoomMode()) {
        // Add active class to zoom button
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) {
          zoomButton.classList.add("active");
          // Remove active from other buttons
          const panButton = document.querySelector(".pan-tools .tool-button");
          if (panButton) panButton.classList.remove("active");
        }
      } else {
        // Remove active class if zoom mode is disabled
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) zoomButton.classList.remove("active");
      }
    }
  };

  const handlePan = () => {
    if (mapRef.current) {
      // Toggle pan mode
      if (mapRef.current.setPanMode()) {
        // Add active class to pan button
        const panButton = document.querySelector(".pan-tools .tool-button");
        if (panButton) {
          panButton.classList.add("active");
          // Remove active from other buttons
          const zoomButton = document.querySelector(".zoom-tools .tool-button");
          if (zoomButton) zoomButton.classList.remove("active");
        }
      } else {
        // Remove active class if pan mode is disabled
        const panButton = document.querySelector(".pan-tools .tool-button");
        if (panButton) panButton.classList.remove("active");
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.resetView();
      // Reset active states of all toolbar buttons
      const toolButtons = document.querySelectorAll(".tool-button");
      toolButtons.forEach((button) => button.classList.remove("active"));
    }
  };

  return (
    <div
      ref={containerRef}
      className="map-widget display-mode"
      data-widget-id={widget.id}
      style={{
        gridColumn: `span ${widget.colspan}`,
        gridRow: `span ${widget.rowspan}`,
      }}
    >
      <div className="widget-header" style={{ display: "none" }}>
        <div className="widget-info">
          <h3 className="widget-title">{widget.title}</h3>
          <p className="widget-settings">{widget.settings}</p>
        </div>
      </div>

      <div className="widget-content" style={{ padding: "5px" }}>
        <div className="map-content">
          <div className="map-toolbar">
            <div className="toolbar-left-group">
              <div className="zoom-tools">
                <button
                  className="tool-button"
                  title="Zoom"
                  onClick={handleZoom}
                >
                  <span className="tool-icon zoom-icon"></span>
                </button>
              </div>

              <div className="pan-tools">
                <button className="tool-button" title="Pan" onClick={handlePan}>
                  <span className="tool-icon pan-icon"></span>
                </button>
              </div>
            </div>

            <div className="toolbar-right-group">
              <div className="reset-view-button">
                <button
                  className="tool-button"
                  title="Reset View"
                  onClick={handleResetView}
                >
                  <span className="tool-icon reset-view-icon"></span>
                </button>
              </div>
              <div className="zoom-in-button">
                <button
                  className="tool-button"
                  title="Zoom In"
                  onClick={handleZoomIn}
                >
                  <span className="tool-icon zoom-in-icon"></span>
                </button>
              </div>
              <div className="zoom-out-button">
                <button
                  className="tool-button"
                  title="Zoom Out"
                  onClick={handleZoomOut}
                >
                  <span className="tool-icon zoom-out-icon"></span>
                </button>
              </div>
            </div>
          </div>
          <div className="map-canvas" ref={canvasRef}></div>
        </div>
      </div>
    </div>
  );
};

export default MapWidgetComponent;
