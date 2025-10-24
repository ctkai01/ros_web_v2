import React, { useState, useEffect } from 'react';
import './MissionButtonGroupWidget.css';
import serverConfig from '../../../../config/serverConfig';

const MissionButtonGroupWidgetComponent = ({ widget, onEdit }) => {
  const [executingMissions, setExecutingMissions] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState(new Set()); // Track pending requests
  const [groupMissions, setGroupMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Load missions by group ID
  const loadGroupMissions = async (groupId) => {
    if (widget.isDesignMode()) {
        return;
    }
    if (!groupId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('loadGroupMissions called with result:', result);
          setGroupMissions(result.data);
        } else {
          console.error('Failed to load group missions:', result.message);
          setGroupMissions([]);
        }
      } else {
        console.error('Error loading group missions:', response.statusText);
        setGroupMissions([]);
      }
    } catch (error) {
      console.error('Error loading group missions:', error);
      setGroupMissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load group missions when groupId changes
  useEffect(() => {
    if (widget.settings.groupId) {
      loadGroupMissions(widget.settings.groupId);
    }
  }, [widget.settings.groupId]);

  // Monitor container size changes for responsive layout
  useEffect(() => {
    const updateContainerSize = () => {
      const container = document.querySelector('.mission-button-group-widget');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size measurement
    updateContainerSize();

    // Set up resize observer for dynamic size changes
    const resizeObserver = new ResizeObserver(updateContainerSize);
    const container = document.querySelector('.mission-button-group-widget');
    if (container) {
      resizeObserver.observe(container);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle mission button click
  const handleMissionClick = async (mission) => {

    if (widget.isDesignMode()) {
        return;
    }
    // Kiểm tra điều kiện biên: mission phải có id
    if (!mission || !mission.id) {
      console.warn('Mission không có ID, bỏ qua');
      return;
    }

    // Kiểm tra xem mission đã đang thực thi chưa để tránh double click
    const missionId = mission.id || mission.missionId;
    if (executingMissions.has(missionId) || pendingRequests.has(missionId)) {
      console.log('Mission đang thực thi hoặc request đang pending, bỏ qua click');
      return;
    }

    // Set pending state ngay lập tức để tránh double click
    setPendingRequests(prev => new Set(prev).add(missionId));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${serverConfig.SERVER_URL}/api/missions/queue/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          missionId: mission.id || mission.missionId,
          siteId: mission.siteId || 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Mission added to queue successfully:', result.data);
          // Set executing state sau khi server trả về thành công
          setExecutingMissions(prev => new Set(prev).add(missionId));
          // Giữ executing state trong 2 giây để tránh spam click
          setTimeout(() => {
            setExecutingMissions(prev => {
              const newSet = new Set(prev);
              newSet.delete(missionId);
              return newSet;
            });
          }, 2000);
        } else {
          console.error('Failed to add mission to queue:', result.message);
        }
      } else {
        console.error('Error adding mission to queue:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding mission to queue:', error);
    } finally {
      // Luôn reset pending state sau khi request hoàn thành (thành công hoặc thất bại)
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(missionId);
        return newSet;
      });
    }
  };

  // Get button size class
  const getButtonSizeClass = () => {
    switch (widget.settings.buttonSize) {
      case 'small': return 'btn-small';
      case 'large': return 'btn-large';
      default: return 'btn-medium';
    }
  };

  // Get layout class based on container size and settings
  const getLayoutClass = () => {
    // If user explicitly set layout, use it
    if (widget.settings.layout) {
      return widget.settings.layout === 'vertical' ? 'layout-vertical' : 'layout-horizontal';
    }
    
    // Auto-calculate layout based on container size
    if (containerSize.width > 0 && containerSize.height > 0) {
      const aspectRatio = containerSize.width / containerSize.height;
      
      // If container is taller than wide, use vertical layout
      if (aspectRatio < 1.2) {
        return 'layout-vertical';
      }
    }
    
    // Default to horizontal layout
    return 'layout-horizontal';
  };

  // Calculate grid columns based on widget colspan
  const getResponsiveGridStyle = () => {
    // Use widget colspan to determine number of columns
    // colspan 1 = 2 columns, colspan 2 = 4 columns, etc.
    const columns = (widget.colspan || 1) * 2;
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridAutoRows: 'minmax(48px, auto)', // Auto height for rows
      gridAutoFlow: 'row', // Flow by rows
      gap: '8px',
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '4px',
      boxSizing: 'border-box',
      alignContent: 'start', // Start from top
      justifyContent: 'start' // Start from left
    };
  };

  if (widget.isDesignMode()) {
    return (
      <div className="mission-button-group-widget design-mode">
        <div className="widget-header">
          <div className="widget-info">
            <div className="widget-title">{widget.title}</div>
            <div className="widget-settings">
              {widget.settings.groupId ? (
                `Group ID: ${widget.settings.groupId} | Group Name: ${widget.settings.groupName}`
              ) : (
                "No Settings"
              )}
            </div>
          </div>
          <div className="widget-actions">
            <button 
              className="edit-button"
              onClick={() => onEdit(widget.id)}
              title="Edit Widget"
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // Display mode
  return (
    <div className="mission-button-group-widget display-mode">
      <div className="widget-content">
        
        {/* Kiểm tra điều kiện hiển thị */}
        {(() => {
          // Nếu có groupId, hiển thị missions từ group
          if (widget.settings.groupId) {
            if (loading) {
              return (
                <div className="loading-message">
                  <p>Loading missions...</p>
                </div>
              );
            }
            
            if (groupMissions.length === 0) {
              return (
                <div className="no-settings-message">
                  <p>No missions found in group</p>
                </div>
              );
            }
            
                         // Hiển thị mission buttons từ group
             return (
               <div 
                 className={`mission-buttons-container ${getLayoutClass()}`}
                 style={getResponsiveGridStyle()}
               >
                 {groupMissions.map((mission, index) => {
                   const isExecuting = executingMissions.has(mission.id);
                   const isPending = pendingRequests.has(mission.id);
                   const isDisabled = isExecuting || isPending;
                   return (
                     <div key={mission.id || index} className="mission-button-item">
                       <button 
                         className={`mission-btn ${getButtonSizeClass()} ${isExecuting ? 'executing' : ''} ${isPending ? 'pending' : ''}`}
                         onClick={isDisabled ? undefined : () => handleMissionClick(mission)}
                         disabled={isDisabled}
                         style={{ cursor: isDisabled ? 'wait' : 'pointer' }}
                       >
                         <div className="target-icon"></div>
                         <span className="button-text">
                           {mission.name || `Mission ${index + 1}`}
                         </span>
                         {(isExecuting || isPending) && (
                           <span className="executing-indicator">
                             <i className="fas fa-spinner fa-spin"></i>
                             <span>{isPending ? 'Sending...' : 'Adding...'}</span>
                           </span>
                         )}
                       </button>
                     </div>
                   );
                 })}
               </div>
             );
          }
          
          // Nếu không có groupId, sử dụng missions từ settings
          if (!widget.settings.missions || widget.settings.missions.length === 0) {
            return (
              <div className="no-settings-message">
                <p>No settings</p>
              </div>
            );
          }
          
          // Lọc missions có missionId
          const validMissions = widget.settings.missions.filter(mission => mission && mission.missionId);
          
          // Nếu không có missions hợp lệ, hiển thị "No settings"
          if (validMissions.length === 0) {
            return (
              <div className="no-settings-message">
                <p>No settings</p>
              </div>
            );
          }
          
                     // Hiển thị mission buttons từ settings
           return (
             <div 
               className={`mission-buttons-container ${getLayoutClass()}`}
               style={getResponsiveGridStyle()}
             >
               {validMissions.map((mission, index) => {
                 const isExecuting = executingMissions.has(mission.missionId);
                 const isPending = pendingRequests.has(mission.missionId);
                 const isDisabled = isExecuting || isPending;
                 return (
                   <div key={mission.missionId || index} className="mission-button-item">
                     <button 
                       className={`mission-btn ${getButtonSizeClass()} ${isExecuting ? 'executing' : ''} ${isPending ? 'pending' : ''}`}
                       onClick={isDisabled ? undefined : () => handleMissionClick(mission)}
                       disabled={isDisabled}
                       style={{ cursor: isDisabled ? 'wait' : 'pointer' }}
                     >
                       <div className="target-icon"></div>
                       <span className="button-text">
                         {(() => {
                           const buttonText = mission.buttonText;
                           const missionName = mission.missionName;
                           
                           // Kiểm tra và chuyển đổi thành string
                           if (buttonText && typeof buttonText === 'string') {
                             return buttonText;
                           } else if (missionName && typeof missionName === 'string') {
                             return missionName;
                           } else if (buttonText && typeof buttonText === 'object') {
                             return buttonText.name || buttonText.title || 'Mission';
                           } else if (missionName && typeof missionName === 'object') {
                             return missionName.name || missionName.title || 'Mission';
                           } else {
                             return `Mission ${index + 1}`;
                           }
                         })()}
                       </span>
                       {(isExecuting || isPending) && (
                         <span className="executing-indicator">
                           <i className="fas fa-spinner fa-spin"></i>
                           <span>{isPending ? 'Sending...' : 'Adding...'}</span>
                         </span>
                       )}
                     </button>
                   </div>
                 );
               })}
             </div>
           );
        })()}
      </div>
    </div>
  );
};

export default MissionButtonGroupWidgetComponent; 