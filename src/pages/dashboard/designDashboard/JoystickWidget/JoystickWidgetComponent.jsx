import React, { useState, useRef, useEffect } from 'react';
import './JoystickWidget.css';
import { SERVER_URL, WS_URL } from '../../../../config/serverConfig';

const JoystickWidgetComponent = ({ widget, onEdit }) => {
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const continuousUpdateRef = useRef(null);
  const wsRef = useRef(null);
  const [currentRobotSpeed, setCurrentRobotSpeed] = useState({ linear: 0, angular: 0 });

  // Send joystick data to server
  const sendJoystickData = async (data) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${SERVER_URL}/api/joystick/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error sending joystick data:', error);
      throw error;
    }
  };

  // Calculate adaptive velocities based on current robot speed
  const calculateAdaptiveVelocities = (x, y) => {
    // Base velocity constants (maximum velocities)
    const MAX_LINEAR_VELOCITY = 0.6;  // m/s
    const MAX_ANGULAR_VELOCITY = 1.0; // rad/s
    
    // Calculate desired velocities from joystick input
    const desiredLinearVelocity = -y * MAX_LINEAR_VELOCITY;
    const desiredAngularVelocity = -x * MAX_ANGULAR_VELOCITY;
    
    // Current robot velocities (from odometry)
    const currentLinearVelocity = currentRobotSpeed.linear;
    const currentAngularVelocity = currentRobotSpeed.angular;
    
    // Calculate velocity differences (error signals)
    const linearVelocityError = desiredLinearVelocity - currentLinearVelocity;
    const angularVelocityError = desiredAngularVelocity - currentAngularVelocity;
    
    // Adaptive control parameters
    const ACCELERATION_GAIN = 0.8;      // Gain for acceleration
    const DECELERATION_GAIN = 1.2;      // Gain for deceleration (higher for faster stopping)
    const VELOCITY_THRESHOLD = 0.05;    // Minimum velocity threshold
    const MAX_ACCELERATION = 0.3;       // Maximum acceleration rate
    const MAX_DECELERATION = 0.4;       // Maximum deceleration rate
    
    // Calculate adaptive linear velocity
    let adaptiveLinearVelocity = 0;
    
    if (Math.abs(linearVelocityError) > VELOCITY_THRESHOLD) {
      if (linearVelocityError > 0) {
        // Need to accelerate (positive error)
        const accelerationRate = Math.min(MAX_ACCELERATION, Math.abs(linearVelocityError) * ACCELERATION_GAIN);
        adaptiveLinearVelocity = currentLinearVelocity + accelerationRate;
        
        // Limit to desired velocity
        adaptiveLinearVelocity = Math.min(adaptiveLinearVelocity, desiredLinearVelocity);
      } else {
        // Need to decelerate (negative error)
        const decelerationRate = Math.min(MAX_DECELERATION, Math.abs(linearVelocityError) * DECELERATION_GAIN);
        adaptiveLinearVelocity = currentLinearVelocity - decelerationRate;
        
        // Limit to desired velocity
        adaptiveLinearVelocity = Math.max(adaptiveLinearVelocity, desiredLinearVelocity);
      }
    } else {
      // Within threshold, maintain current velocity
      adaptiveLinearVelocity = currentLinearVelocity;
    }
    
    // Calculate adaptive angular velocity
    let adaptiveAngularVelocity = 0;
    
    if (Math.abs(angularVelocityError) > VELOCITY_THRESHOLD) {
      if (angularVelocityError > 0) {
        // Need to accelerate rotation
        const accelerationRate = Math.min(MAX_ACCELERATION, Math.abs(angularVelocityError) * ACCELERATION_GAIN);
        adaptiveAngularVelocity = currentAngularVelocity + accelerationRate;
        
        // Limit to desired velocity
        adaptiveAngularVelocity = Math.min(adaptiveAngularVelocity, desiredAngularVelocity);
        
      } else {
        // Need to decelerate rotation
        const decelerationRate = Math.min(MAX_DECELERATION, Math.abs(angularVelocityError) * DECELERATION_GAIN);
        adaptiveAngularVelocity = currentAngularVelocity - decelerationRate;
        
        // Limit to desired velocity
        adaptiveAngularVelocity = Math.max(adaptiveAngularVelocity, desiredAngularVelocity);
        
      }
    } else {
      // Within threshold, maintain current velocity
      adaptiveAngularVelocity = currentAngularVelocity;
    }
    
    // Smooth deceleration when joystick is near center (dead zone)
    const joystickMagnitude = Math.sqrt(x * x + y * y);
    const DEAD_ZONE_RADIUS = 0.1;
    
    if (joystickMagnitude < DEAD_ZONE_RADIUS) {
      // Apply exponential decay in dead zone
      const decayFactor = Math.pow(joystickMagnitude / DEAD_ZONE_RADIUS, 2);
      adaptiveLinearVelocity *= decayFactor;
      adaptiveAngularVelocity *= decayFactor;
    }
    
    // Safety limits
    adaptiveLinearVelocity = Math.max(-MAX_LINEAR_VELOCITY, Math.min(MAX_LINEAR_VELOCITY, adaptiveLinearVelocity));
    adaptiveAngularVelocity = Math.max(-MAX_ANGULAR_VELOCITY, Math.min(MAX_ANGULAR_VELOCITY, adaptiveAngularVelocity));
    
    return {
      linear: adaptiveLinearVelocity,
      angular: adaptiveAngularVelocity
    };
  };

  // Enable/Disable joystick and initialize WebSocket connection
  useEffect(() => {
    if (widget.isDisplayMode()) {
      const enableJoystickAndConnect = async () => {
        try {
          console.log('Enabling joystick for widget...');
          const response = await fetch(`${SERVER_URL}/api/joystick/enable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
            
            // Initialize WebSocket connection for odometry data
            if (!wsRef.current) {
              console.log('Initializing WebSocket connection for joystick odometry...');
              
              try {
                const ws = new WebSocket(WS_URL);
                
                ws.onopen = () => {
                  console.log('WebSocket connected for joystick odometry');
                };
                
                ws.onmessage = (event) => {
                  try {
                    const message = JSON.parse(event.data);
                    
                    // Handle odometry updates for joystick speed control
                    if (message.type === 'odom_update') {
                      const odomData = message.data;
                      
                      if (odomData && odomData.twist && odomData.twist.twist) {
                        const twist = odomData.twist.twist;
                        const currentSpeed = {
                          linear: Math.abs(twist.linear.x || 0),
                          angular: Math.abs(twist.angular.z || 0)
                        };
                        
                        setCurrentRobotSpeed(currentSpeed);
                      }
                    }
                  } catch (error) {
                    console.error('Error processing WebSocket message in joystick:', error);
                  }
                };
                
                ws.onerror = (error) => {
                  console.error('WebSocket error in joystick:', error);
                };
                
                ws.onclose = () => {
                  console.log('WebSocket connection closed for joystick');
                  wsRef.current = null;
                };
                
                wsRef.current = ws;
              } catch (error) {
                console.error('Error initializing WebSocket for joystick:', error);
              }
            }
          } else {
            console.error('Failed to enable joystick:', data.error);
          }
        } catch (error) {
          console.error('Error enabling joystick:', error);
        }
      };
      
      enableJoystickAndConnect();
    } else {
      // Disable joystick when widget is not in display mode
      const disableJoystickAndDisconnect = async () => {
        try {
          const response = await fetch(`${SERVER_URL}/api/joystick/disable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
          } else {
            console.error('Failed to disable joystick:', data.error);
          }
        } catch (error) {
          console.error('Error disabling joystick:', error);
        }
        
        // Close WebSocket connection
        if (wsRef.current) {
          console.log('Closing WebSocket connection for joystick');
          wsRef.current.close();
          wsRef.current = null;
          setCurrentRobotSpeed({ linear: 0, angular: 0 });
        }
      };
      
      disableJoystickAndDisconnect();
    }
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [widget.isDisplayMode()]);

  // Continuous update when joystick is active
  useEffect(() => {
    if(widget.isDisplayMode()){
    if (isJoystickActive && (joystickPosition.x !== 0 || joystickPosition.y !== 0) && widget.isDisplayMode()) {
      // Start continuous updates every 100ms
      continuousUpdateRef.current = setInterval(async () => {
        const velocities = calculateAdaptiveVelocities(joystickPosition.x, joystickPosition.y);
        try {
          await sendJoystickData({
            position: joystickPosition,
            velocities: velocities
          });
        } catch (error) {
          console.error('Error in continuous joystick update:', error);
        }
      }, 100);
    } else {
      // Stop continuous updates
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    }
  }
    // Cleanup on unmount
    return () => {
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    };
  }, [isJoystickActive, joystickPosition, widget.isDisplayMode()]);

  // Reset joystick position when widget changes mode
  useEffect(() => {
    if (!widget.isDisplayMode()) {
      setJoystickPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setIsJoystickActive(false);
      // Stop continuous updates
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    }
  }, [widget.isDisplayMode()]);

  const [knobX, setKnobX] = useState(0);
  const [knobY, setKnobY] = useState(0);

  const setKnobPosition = (x, y) => {
    setKnobX(x);
    setKnobY(y);
    setJoystickPosition({ x, y });
  };

  // Handle joystick movement
  const handleStickMove = async (event) => {
    if (!isDragging || !joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    // Clamp values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    
    setJoystickPosition({ x: clampedX, y: clampedY });
    setKnobPosition(clampedX, clampedY);
    
    // Check if joystick is at non-zero position
    if (clampedX !== 0 || clampedY !== 0) {
      setIsJoystickActive(true);
    } else {
      setIsJoystickActive(false);
    }
  };

  const handleStickHover = async (event) => {
    if (!isDragging) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    // Clamp values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    
    setJoystickPosition({ x: clampedX, y: clampedY });
    setKnobPosition(clampedX, clampedY);
    
    // Check if joystick is at non-zero position
    if (clampedX !== 0 || clampedY !== 0) {
      setIsJoystickActive(true);
    } else {
      setIsJoystickActive(false);
    }
  };

  const handleStickStart = () => {
    if (widget.isDesignMode()) return;
    setIsDragging(true);
  };

  const handleStickEnd = () => {
    setIsDragging(false);
    setIsJoystickActive(false);
    // Reset position when released
    setJoystickPosition({ x: 0, y: 0 });
    setKnobPosition(0, 0);
    // Send zero position and velocities to stop movement
    sendJoystickData({
      position: { x: 0, y: 0 },
      velocities: { linear: 0, angular: 0 }
    }).catch(console.error);
  };

  const handleMouseDown = (e) => {
    if (widget.isDesignMode()) return;
    e.preventDefault();
    handleStickStart();
  };

  const handleTouchStart = (e) => {
    if (widget.isDesignMode()) return;
    e.preventDefault();
    
    // Only handle single touch
    if (e.touches.length === 1) {
      handleStickStart();
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !joystickRef.current) return;
    e.preventDefault(); // Prevent scrolling

    // Only handle single touch
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate position relative to center (-1 to 1)
      const x = (touch.clientX - centerX) / (rect.width / 2);
      const y = (touch.clientY - centerY) / (rect.height / 2);
      
      // Clamp values between -1 and 1
      const clampedX = Math.max(-1, Math.min(1, x));
      const clampedY = Math.max(-1, Math.min(1, y));
      
      setJoystickPosition({ x: clampedX, y: clampedY });
      setKnobPosition(clampedX, clampedY);
      
      // Check if joystick is at non-zero position
      if (clampedX !== 0 || clampedY !== 0) {
        setIsJoystickActive(true);
      } else {
        setIsJoystickActive(false);
      }
    }
  };

  const handleTouchEnd = () => {
    handleStickEnd();
  };

  if (widget.isDisplayMode()) {
    return renderDisplayMode(widget, {
      isDragging,
      joystickRef,
      knobRef,
      knobX,
      knobY,
      handleMouseDown,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleStickMove,
      handleStickHover,
      handleStickStart,
      handleStickEnd,
      currentRobotSpeed
    });
  } else {
    return renderDesignMode(widget, onEdit);
  }
};

const renderDesignMode = (widget, onEdit) => {
  return (
    <div 
      className="joystick-widget design-mode"
      data-widget-id={widget.id}
      style={{
        gridColumn: `span ${widget.colspan}`,
        gridRow: `span ${widget.rowspan}`
      }}
    >
      <div className="widget-header">
        <div className="widget-info">
          <div className="widget-title">{widget.title}</div>
          <div className="widget-settings">{widget.settings}</div>
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
};

const renderDisplayMode = (widget, handlers) => {
  const { 
    isDragging, 
    joystickRef, 
    knobRef, 
    knobX, 
    knobY, 
    handleMouseDown, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd,
    handleStickMove,
    handleStickHover,
    handleStickStart,
    handleStickEnd,
    currentRobotSpeed
  } = handlers;
  
  return (
    <div 
      className="joystick-widget display-mode"
      data-widget-id={widget.id}
    >
      <div className="widget-content">
        <div className="joystick-container">
          <div 
            ref={joystickRef}
            className="joystick-base"
            onMouseMove={handleStickMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleStickEnd}
            onMouseLeave={handleStickEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }} // Prevent default touch behaviors
          >
            <div 
              ref={knobRef}
              className={`joystick-stick ${isDragging ? 'dragging' : ''}`}
              style={{
                transform: isDragging 
                  ? `translate(calc(-50% + ${knobX * 40}px), calc(-50% + ${knobY * 40}px))`
                  : 'translate(-50%, -50%)',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoystickWidgetComponent; 