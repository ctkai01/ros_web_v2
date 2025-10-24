import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './MissionQueueWidget.css';
import serverConfig from '../../../../config/serverConfig';
import MissionQueueStatusIndicator from '../../../../common/MissionQueueStatusIndicator';

// Hàm trợ giúp để gọi API sắp xếp lại hàng đợi
const reorderMissionQueueAPI = async (orderedIds) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderedExecutionIds: orderedIds }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reorder queue');
    }
    console.log('✅ Mission queue reordered successfully on the server.');
    return await response.json();
  } catch (error) {
    console.error("❌ Error reordering mission queue:", error);
    // Có thể hiển thị thông báo lỗi cho người dùng ở đây
  }
};



const MissionQueueWidgetComponent = ({ widget, onEdit }) => {
  if (widget.displayMode === 'display') {
    return renderDisplayMode(widget);
  } else {
    return renderDesignMode(widget, onEdit);
  }
};

const renderDesignMode = (widget, onEdit) => {
  return (
    <div
      className="mission-queue-widget design-mode"
      data-widget-id={widget.id}
    >
      <div className="widget-header">
        <div className="widget-info">
          <h3 className="widget-title">{widget.title}</h3>
          <p className="widget-settings">{widget.settings}</p>
        </div>
      </div>
      {onEdit && (
        <button
          className="widget-edit-btn"
          onClick={() => onEdit(widget.id)}
          title="Edit widget"
        >
          <span className="edit-icon"></span>
        </button>
      )}
    </div>
  );
};

const renderDisplayMode = (widget) => {

  const [queueData, setQueueData] = useState(null);
  const [currentSite, setCurrentSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missionUpdates, setMissionUpdates] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMissionLog, setLatestMissionLog] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use ref to store current queueData for WebSocket handler
  const queueDataRef = useRef(null);
  const lastApiCallRef = useRef(null);



  useEffect(() => {
    // Load current site and queue data together
    loadQueueData();


    // Cleanup on unmount
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Call mission queue status when WebSocket receives update
  useEffect(() => {
    if (missionUpdates.length > 0) {
      // Get the latest update
      const latestUpdate = missionUpdates[0];

      // Only call API if it's been more than 2 seconds since last call
      const now = Date.now();
      if (!lastApiCallRef.current || (now - lastApiCallRef.current) > 2000) {
        lastApiCallRef.current = now;
        getMissionQueueStatus();
      }
    }
  }, [missionUpdates]);



  const loadQueueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setCurrentSite({ id: result.data.siteId, name: result.data.siteName });
        setQueueData(result.data);
        queueDataRef.current = result.data;
        setError(null);
        console.log('✅ Mission queue loaded successfully:', result.data);
      } else {
        console.warn('⚠️ Mission queue response not successful:', result);
        const fallbackData = { 
          missions: [], 
          totalCount: 0, 
          pendingCount: 0, 
          runningCount: 0,
          pausedCount: 0,
          highPriorityCount: 0
        };
        setCurrentSite({ id: 1, name: 'Default Site' });
        setQueueData(fallbackData);
        queueDataRef.current = fallbackData;
        setError(null); // Don't show error for fallback data
      }
    } catch (error) {
      console.error('🚨 MissionQueueWidget: Error loading data:', error);
      
      // Check if it's a timeout error
      if (error.name === 'AbortError') {
        console.log('⏰ Request timeout, using fallback data');
        setError('Request timeout - using cached data');
      } else {
        setError('Failed to load mission queue - using cached data');
      }
      
      const fallbackData = { 
        missions: [], 
        totalCount: 0, 
        pendingCount: 0, 
        runningCount: 0,
        pausedCount: 0,
        highPriorityCount: 0
      };
      setCurrentSite({ id: 1, name: 'Default Site' });
      setQueueData(fallbackData);
      queueDataRef.current = fallbackData;
    } finally {
      setLoading(false);
    }
  };

  // Handle queue added from MissionQueueStatusIndicator
  const handleQueueAdded = (queueData) => {


    // If this is a new mission being added to queue
    if (queueData && queueData.type === 'mission_queue_added' && queueData.data) {
      console.log('📋 MissionQueueWidget: Received mission queue added:', queueData);

      // Create new mission item from the update data
      const newMissionItem = {
        queueId: queueData.data.queueId || Date.now(),
        missionId: queueData.data.missionId,
        name: queueData.data.missionName || queueData.data.name || `Mission ${queueData.data.missionId}`,
        description: queueData.data.description || `New mission added`,
        priority: queueData.data.priority || 1,
        estimatedDuration: queueData.data.estimatedDuration || 120,
        status: queueData.data.status || 0, // PENDING
        executionUUID: queueData.data.executionUUID || `temp-${Date.now()}`,
        queuedAt: queueData.data.queuedAt || new Date().toISOString(),
        remainingTime: null
      };

      // Add to current queue data
      setQueueData(prevData => {
        if (!prevData) {
          return {
            siteId: currentSite?.id || 1,
            siteName: currentSite?.name || 'Default Site',
            missions: [newMissionItem],
            totalCount: 1,
            pendingCount: 1,
            runningCount: 0,
            pausedCount: 0,
            highPriorityCount: newMissionItem.priority >= 2 ? 1 : 0
          };
        }

        const updatedMissions = [newMissionItem, ...prevData.missions];
        return {
          ...prevData,
          missions: updatedMissions,
          totalCount: updatedMissions.length,
          pendingCount: updatedMissions.filter(m => m.status === 0).length,
          runningCount: updatedMissions.filter(m => m.status === 1).length,
          pausedCount: updatedMissions.filter(m => m.status === 2).length,
          highPriorityCount: updatedMissions.filter(m => m.priority >= 2).length
        };
      });
    } else {
      // Regular queue data update
      setQueueData(queueData);
      queueDataRef.current = queueData;

      // Update current site if available
      if (queueData && queueData.siteId && queueData.siteName) {
        setCurrentSite({ id: queueData.siteId, name: queueData.siteName });
      }
    }
  };

  // Handle mission updates from MissionQueueStatusIndicator
  const handleMissionUpdate = (update) => {
    // Không cập nhật khi đang drag để tránh conflict
    if (isDragging) {
      return;
    }

    // Add to mission updates history
    setMissionUpdates(prevUpdates => {
      const newUpdates = [update, ...prevUpdates];
      return newUpdates.slice(0, 50);
    });

    // Handle mission log updates
    if (update && update.type === 'mission_log_update') {
      setLatestMissionLog(update.logEntry);
    }

    // Handle mission queue status updates (from MissionQueueStatusIndicator)
    if (update && update.type === 'mission_queue_status_update') {

      setQueueData(prevData => {
        if (!prevData || !prevData.missions) {
          return prevData;
        }

        // Find and update the mission with matching executionUUID
        const updatedMissions = prevData.missions.map(mission => {
          if (mission.executionUUID === update.execution_id) {
            return {
              ...mission,
              status: update.status,
              name: update.mission_name || mission.name
            };
          }
          return mission;
        });

        // Recalculate counts
        const pendingCount = updatedMissions.filter(m => m.status === 0).length;
        const runningCount = updatedMissions.filter(m => m.status === 1).length;
        const pausedCount = updatedMissions.filter(m => m.status === 2).length;
        const highPriorityCount = updatedMissions.filter(m => m.priority >= 2).length;

        return {
          ...prevData,
          missions: updatedMissions,
          totalCount: updatedMissions.length,
          pendingCount,
          runningCount,
          pausedCount,
          highPriorityCount
        };
      });
    }

    // Handle new mission additions
    else if (update && (update.type === 'add' || update.action === 'add' || update.status === 'PENDING')) {
      console.log('📋 MissionQueueWidget: New mission detected, adding to queue');

      // Create new mission item
      const newMissionItem = {
        queueId: Date.now(), // Temporary ID
        missionId: update.missionId || update.id,
        name: update.missionName || update.name || `Mission ${update.missionId || update.id}`,
        description: update.description || `New mission added`,
        priority: update.priority || 1,
        estimatedDuration: update.estimatedDuration || 120,
        status: 0, // PENDING
        executionUUID: update.executionUUID || `temp-${Date.now()}`,
        queuedAt: new Date().toISOString(),
        remainingTime: null
      };

      // Add to current queue data
      setQueueData(prevData => {
        if (!prevData) {
          return {
            siteId: currentSite?.id || 1,
            siteName: currentSite?.name || 'Default Site',
            missions: [newMissionItem],
            totalCount: 1,
            pendingCount: 1,
            runningCount: 0,
            pausedCount: 0,
            highPriorityCount: newMissionItem.priority >= 2 ? 1 : 0
          };
        }

        const updatedMissions = [newMissionItem, ...prevData.missions];
        return {
          ...prevData,
          missions: updatedMissions,
          totalCount: updatedMissions.length,
          pendingCount: updatedMissions.filter(m => m.status === 0).length,
          runningCount: updatedMissions.filter(m => m.status === 1).length,
          pausedCount: updatedMissions.filter(m => m.status === 2).length,
          highPriorityCount: updatedMissions.filter(m => m.priority >= 2).length
        };
      });

      // Also reload from server to get the actual data
      loadQueueData();
    }
  };



  const handleCancel = async (queueId, executionUUID) => {
    try {
      if (!executionUUID) {
        console.error('No execution UUID provided for mission cancellation');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/cancel/${executionUUID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Mission cancellation command sent successfully');

          // Check if the mission is in pending status (status = 0)
          const mission = queueData.missions.find(m => m.executionUUID === executionUUID);
          if (mission && (mission.status != 3 && mission.status != 4 && mission.status != 5)) {
            console.log('🔄 Mission is pending, updating status to cancelled and removing from queue');

            // Update status to cancelled (5) in database
            try {
              const statusResponse = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/${mission.queueId}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 5 }) // 5 = CANCELLED
              });

              if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                if (statusResult.success) {
                  console.log('✅ Mission status updated to cancelled in database');
                } else {
                  console.error('❌ Failed to update mission status in database:', statusResult.message);
                }
              } else {
                console.error('❌ Error updating mission status in database:', statusResponse.status);
              }
            } catch (statusError) {
              console.error('❌ Error updating mission status in database:', statusError);
            }

            // Update mission status to cancelled (5) in local state
            setQueueData(prevData => {
              if (!prevData || !prevData.missions) return prevData;

              const updatedMissions = prevData.missions.map(m =>
                m.executionUUID === executionUUID
                  ? { ...m, status: 5 } // Set status to CANCELLED
                  : m
              );

              // Remove cancelled missions from the list
              const filteredMissions = updatedMissions.filter(m => m.status !== 5);

              // Recalculate counts
              const newPendingCount = filteredMissions.filter(m => m.status === 0).length;
              const newRunningCount = filteredMissions.filter(m => m.status === 1).length;
              const newPausedCount = filteredMissions.filter(m => m.status === 2).length;
              const newTotalCount = filteredMissions.length;

              return {
                ...prevData,
                missions: filteredMissions,
                pendingCount: newPendingCount,
                runningCount: newRunningCount,
                pausedCount: newPausedCount,
                totalCount: newTotalCount
              };
            });

            // Update queueDataRef for WebSocket handlers
            queueDataRef.current = {
              ...queueData,
              missions: queueData.missions.filter(m => m.executionUUID !== executionUUID),
              pendingCount: queueData.pendingCount - 1,
              totalCount: queueData.totalCount - 1
            };
          } else {
            // For non-pending missions, just reload data
            getMissionQueueStatus();
          }
        } else {
          console.error('❌ Failed to cancel mission:', result.message);
        }
      } else {
        console.error('❌ Error response from cancel API:', response.status);
      }
    } catch (error) {
      console.error('❌ Error cancelling mission:', error);
    }
  };

  // Get mission queue status from server
  const getMissionQueueStatus = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for refresh

      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setQueueData(result.data);
          queueDataRef.current = result.data;
          setCurrentSite({ id: result.data.siteId, name: result.data.siteName });
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted due to timeout');
      } else {
        console.error('Error getting mission queue status:', error);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Component con để render mỗi item có thể kéo thả
const SortableMissionItem = ({ mission, onCancel }) => {
  const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
  } = useSortable({ id: mission.executionUUID });

  const style = {
      transform: CSS.Transform.toString(transform),
      transition,
  };

  return (
      <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          className={`mission-item pending`}
      >
          <div className="mission-info">
              {/* Tay cầm để kéo, gán listeners vào đây */}
              <div {...listeners} className="drag-handle">
                  <img src="/assets/icons/pan.png" alt="Drag Mission" className="mission-icon" />
              </div>
              <div className="mission-details">
                  <span className="mission-name">{mission.name}</span>
              </div>
          </div>
          <div className="mission-controls">
              <button className={`status-btn ${getStatusClass(mission.status)}`}>
                  {getStatusText(mission.status)}
              </button>
              <button 
                  className="cancel-btn" 
                  onClick={() => onCancel(mission.queueId, mission.executionUUID)}
                  disabled={mission.status === 3 || mission.status === 4 || mission.status === 5}
                  title="Cancel Mission"
              >
                  ✕
              </button>
          </div>
      </div>
  );
};

  // Auto-refresh mission queue status every 5 seconds - REMOVED
  // Now using real-time WebSocket updates instead of polling

  const getStatusText = (status) => {
    // MissionStatus enum: 0=Pending, 1=Running, 2=Paused, 3=Completed, 4=Failed, 5=Cancelled
    switch (status) {
      case 0: return 'PENDING';
      case 1: return 'RUNNING';
      case 2: return 'PAUSED';
      case 3: return 'COMPLETED';
      case 4: return 'FAILED';
      case 5: return 'CANCELLED';
      default: return 'UNKNOWN';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 0: return 'LOW';
      case 1: return 'NORMAL';
      case 2: return 'HIGH';
      default: return 'NORMAL';
    }
  };

  const getStatusClass = (status) => {
    // MissionStatus enum: 0=Pending, 1=Running, 2=Paused, 3=Completed, 4=Failed, 5=Cancelled
    switch (status) {
      case 0: return 'pending';
      case 1: return 'running';
      case 2: return 'paused';
      case 3: return 'completed';
      case 4: return 'failed';
      case 5: return 'cancelled';
      default: return 'unknown';
    }
  };

  // Apply custom size for all render states
  const getCustomStyle = () => {
    const customStyle = {};
    const hasCustomSize = widget.hasCustomSize ? widget.hasCustomSize() :
      (widget.properties && widget.properties.resized);

    if (hasCustomSize) {
      const customSize = widget.getSize ? widget.getSize() :
        (widget.properties && widget.properties.resized ?
          { width: widget.properties.width, height: widget.properties.height } : null);

      if (customSize) {
        customStyle.width = `${customSize.width}px`;
        customStyle.height = `${customSize.height}px`;
        customStyle.minWidth = `${customSize.width}px`;
        customStyle.minHeight = `${customSize.height}px`;
      }
    }
    return customStyle;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
);



const handleDragStart = (event) => {
    setIsDragging(true);
};
function arrayMove(arr, fromIndex, toIndex) {
  const newArr = [...arr];
  const [movedItem] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, movedItem);
  return newArr;
}
const handleDragEnd = (event) => {
    setIsDragging(false);
    const { active, over } = event;

    if (active.id !== over.id && queueData && queueData.missions) {
        const runningMission = queueData.missions.find(m => m.status === 1);
        let pendingMissions = queueData.missions.filter(m => m.status === 0);

        const oldIndex = pendingMissions.findIndex(m => m.executionUUID === active.id);
        const newIndex = pendingMissions.findIndex(m => m.executionUUID === over.id);

        console.log('oldIndex', pendingMissions[oldIndex]);
        console.log('newIndex', pendingMissions[newIndex]);
        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedPendingMissions = arrayMove(pendingMissions, oldIndex, newIndex);
            const newFullQueue = runningMission ? [runningMission, ...reorderedPendingMissions] : reorderedPendingMissions;

            console.log('newFullQueue', newFullQueue);
            // Cập nhật giao diện ngay lập tức với đầy đủ thông tin
            setQueueData(prev => ({
                ...prev,
                missions: newFullQueue,
                totalCount: newFullQueue.length,
                pendingCount: reorderedPendingMissions.length,
                runningCount: runningMission ? 1 : 0,
                pausedCount: newFullQueue.filter(m => m.status === 2).length,
                highPriorityCount: newFullQueue.filter(m => m.priority >= 2).length
            }));

            // Cập nhật queueDataRef để tránh conflict với WebSocket
            queueDataRef.current = {
                ...queueData,
                missions: newFullQueue,
                totalCount: newFullQueue.length,
                pendingCount: reorderedPendingMissions.length,
                runningCount: runningMission ? 1 : 0,
                pausedCount: newFullQueue.filter(m => m.status === 2).length,
                highPriorityCount: newFullQueue.filter(m => m.priority >= 2).length
            };

            // Gửi thứ tự mới lên server
            const orderedExecutionIds = reorderedPendingMissions.map(item => item.executionUUID);
            reorderMissionQueueAPI(orderedExecutionIds);
        }
    }
};

  const customStyle = getCustomStyle();

  if (loading || !currentSite) {
    return (
      <div className="mission-queue-widget display-mode" data-widget-id={widget.id} style={customStyle}>
        {/* MissionQueueStatusIndicator for subscription management - ALWAYS render */}
        <MissionQueueStatusIndicator
          onQueueUpdate={handleQueueAdded}
          onMissionUpdate={handleMissionUpdate}
        />
        <div className="queue-header">
          <div className="waiting-status">
            {!currentSite ? 'Loading...' : 'Loading queue data...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mission-queue-widget display-mode" data-widget-id={widget.id} style={customStyle}>
        {/* MissionQueueStatusIndicator for subscription management - ALWAYS render */}
        <MissionQueueStatusIndicator
          onQueueUpdate={handleQueueAdded}
          onMissionUpdate={handleMissionUpdate}
        />
        <div className="queue-header">
          <div className="waiting-status error">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!queueData || !queueData.missions || queueData.missions.length === 0) {
    return (
      <div className="mission-queue-widget display-mode" data-widget-id={widget.id} style={customStyle}>
        {/* MissionQueueStatusIndicator for subscription management - ALWAYS render */}
        <MissionQueueStatusIndicator
          onQueueUpdate={handleQueueAdded}
          onMissionUpdate={handleMissionUpdate}
        />
        <div className="queue-header">
          <div className="waiting-status">Waiting for mission queue...</div>
        </div>
      </div>
    );
  }

  // Missions can be pending (Status = 0), running (Status = 1), or paused (Status = 2)

  const runningMission = queueData.missions.find(m => m.status === 1);
  const pendingMissions = queueData.missions.filter(m => m.status === 0);
  const totalCount = queueData.missions.length;
  const runningCount = runningMission ? 1 : 0;
  const pendingCount = pendingMissions.length;

      // HÀM MỚI ĐỂ RENDER TRẠNG THÁI HEADER
      const renderHeaderStatus = () => {
        if (totalCount > 0) {
            if (latestMissionLog && latestMissionLog.message) {
                return latestMissionLog.message;
            } else {
                return `Running: ${runningCount}, Queued: ${pendingCount}`;
            }
        } else {
            return 'No missions in queue';
        }
    };

  return (
    <div className="mission-queue-widget display-mode" data-widget-id={widget.id}>
      <MissionQueueStatusIndicator
        onQueueUpdate={handleQueueAdded}
        onMissionUpdate={handleMissionUpdate}
      />
      <div className="queue-header">
        <div className="waiting-status">
          {renderHeaderStatus()}
        </div>
      </div>
      <div className="queue-content">
        {/* Phần hiển thị nhiệm vụ đang chạy (không thể kéo) */}
        {runningMission && (
          <div className="mission-item running">
            <div className="mission-info">
              <img src="/assets/icons/mission.png" alt="Mission" className="mission-icon" />
              <div className="mission-details">
                <span className="mission-name">{runningMission.name}</span>
              </div>
            </div>
            <div className="mission-controls">
              <button className={`status-btn ${getStatusClass(runningMission.status)}`}>
                {getStatusText(runningMission.status)}
              </button>
              <button
                className="cancel-btn"
                onClick={() => handleCancel(runningMission.queueId, runningMission.executionUUID)}
                // disabled={runningMission.status === 3 || runningMission.status === 4 || runningMission.status === 5}
                title="Cancel Mission"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Bọc danh sách các nhiệm vụ PENDING bằng DragDropContext */}
                 <DndContext
                     key={pendingMissions.map(m => m.executionUUID).join(',')}
                     sensors={sensors}
                     collisionDetection={closestCenter}
                     onDragStart={handleDragStart}
                     onDragEnd={handleDragEnd}
                 >
                                         <SortableContext
                         items={pendingMissions.map(m => m.executionUUID)}
                         strategy={verticalListSortingStrategy}
                     >
                         {pendingMissions.map(mission => (
                             <SortableMissionItem 
                                 key={mission.executionUUID} 
                                 mission={mission} 
                                 onCancel={handleCancel}
                             />
                         ))}
                     </SortableContext>
                </DndContext>
      </div>
    </div>
  );
};

export default MissionQueueWidgetComponent; 