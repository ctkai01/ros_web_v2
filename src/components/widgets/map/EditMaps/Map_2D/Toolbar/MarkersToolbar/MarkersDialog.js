import React, { useState, useEffect } from 'react';
import { SERVER_URL } from '../../../../../../../config/serverConfig.js';
import './MarkersDialog.css';

const MarkersDialog = ({
    isOpen,
    onClose,
    initialMarker = null,
    mode = 'create', // 'create', 'edit', or 'delete'
    mapRef = null // Thêm mapRef để truy cập trực tiếp vào map
}) => {
    const [markerId, setMarkerId] = useState('');
    const [markerName, setMarkerName] = useState('');
    const [type, setType] = useState('V-marker');
    const [arucoId, setArucoId] = useState('0');
    const [orientation, setOrientation] = useState('0');
    const [coordinateX, setCoordinateX] = useState('0');
    const [coordinateY, setCoordinateY] = useState('0');
    const [offsetY, setOffsetY] = useState('0');
    const [offsetOrientation, setOffsetOrientation] = useState('0');
    const [errorExist, setErrorExist] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectError, setDetectError] = useState('');

    // Reset form when dialog opens/closes or initialMarker changes
    useEffect(() => {
        if (isOpen) {
            if (initialMarker) {
                setMarkerId(initialMarker.id || '');
                setMarkerName(initialMarker.name || '');
                setType(initialMarker.type || 'V-marker');
                setArucoId(String(initialMarker.arucoId || '0'));
                
                // Convert quaternion to yaw (degrees) using the same function as drawPosition.js
                const quaternionToYaw = (x, y, z, w) => {
                    const siny_cosp = 2 * (w * z + x * y);
                    const cosy_cosp = 1 - 2 * (y * y + z * z);
                    return Math.atan2(siny_cosp, cosy_cosp);
                };
                
                // Convert quaternion to yaw then to degrees
                const yawRadians = quaternionToYaw(
                    initialMarker.orientation?.x || 0,
                    initialMarker.orientation?.y || 0,
                    initialMarker.orientation?.z || 0,
                    initialMarker.orientation?.w || 1
                );
                const orientationDegrees = (yawRadians * 180 / Math.PI).toFixed(4);
                setOrientation(orientationDegrees);
                
                setCoordinateX(initialMarker.position?.x?.toFixed(4) || '0');
                setCoordinateY(initialMarker.position?.y?.toFixed(4) || '0');
                setOffsetY(initialMarker.offsetY?.toFixed(4) || '0');
                setOffsetOrientation(initialMarker.offsetOrientation?.toFixed(4) || '0');
            } else {
                setMarkerName('');
                setType('V-marker');
                setArucoId('0');
                setOrientation('0');
                setCoordinateX('0');
                setCoordinateY('0');
                setOffsetY('0');
                setOffsetOrientation('0');
            }
            setErrorExist('');
        }
    }, [isOpen, initialMarker]);

    const validateMarkerName = (value) => {
        setMarkerName(value);
        if (!value.trim()) {
            setErrorExist('Tên marker không được để trống');
        } else if (value.length > 50) {
            setErrorExist('Tên marker không được quá 50 ký tự');
        } else {
            setErrorExist('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // For delete mode, handle deletion directly
        if (mode === 'delete') {
            if (mapRef && mapRef.current && mapRef.current.toolDrawMarkers) {
                const result = mapRef.current.toolDrawMarkers.deleteMarker(initialMarker);
                if (result) {
                    console.log('Marker deleted successfully');
                    // Clear selection and reset map state
                    mapRef.current.toolDrawMarkers.clearSelectedMarker();
                    if (mapRef.current.markersToolbar) {
                        mapRef.current.markersToolbar.hideEditActions();
                        mapRef.current.markersToolbar.deactivateAllTools();
                    }
                    if (mapRef.current) {
                        mapRef.current.applyMapTool();
                    }
                    onClose();
                } else {
                    setErrorExist('Lỗi khi xóa marker khỏi bản đồ');
                }
            }
            return;
        }
        
        // Validate marker name for create/edit modes
        if (!markerName.trim()) {
            setErrorExist('Tên marker không được để trống');
            return;
        }
        
        if (markerName.trim().length > 50) {
            setErrorExist('Tên marker không được quá 50 ký tự');
            return;
        }
        
        // Validate Aruco ID for Aruco-marker type
        if (type === 'Aruco-marker') {
            const arucoIdNum = parseInt(arucoId);
            if (isNaN(arucoIdNum) || arucoIdNum < 0 || arucoIdNum > 100) {
                setErrorExist('Aruco ID phải là số từ 0 đến 100');
                return;
            }
        }
        
        // Validate marker name uniqueness using mapRef
        if (mapRef && mapRef.current && mapRef.current.toolDrawMarkers) {
            const existingMarkers = mapRef.current.toolDrawMarkers.getAllMarkers() || [];
            const trimmedName = markerName.trim();
            
            if (mode === 'edit') {
                const duplicateMarker = existingMarkers.find(marker => 
                    marker.name === trimmedName && marker.id !== initialMarker?.id
                );
                if (duplicateMarker) {
                    setErrorExist('Tên marker đã tồn tại. Vui lòng chọn tên khác.');
                    return;
                }
            } else { // create mode
                const duplicateMarker = existingMarkers.find(marker => marker.name === trimmedName);
                if (duplicateMarker) {
                    setErrorExist('Tên marker đã tồn tại. Vui lòng chọn tên khác.');
                    return;
                }
            }
        }
        
        // Clear any previous errors
        setErrorExist('');
        setDetectError('');

        // Convert orientation from degrees to radians
        const orientationRadians = (parseFloat(orientation) || 0) * Math.PI / 180;

        // Convert yaw to quaternion using the same function as drawPosition.js
        const yawToQuaternion = (yaw) => {
            const halfYaw = yaw * 0.5;
            return {
                x: 0,
                y: 0,
                z: Math.sin(halfYaw),
                w: Math.cos(halfYaw)
            };
        };

        const quaternion = yawToQuaternion(orientationRadians);

        const markerData = {
            id: markerId,
            name: markerName.trim(),
            type: type,
            arucoId: type === 'Aruco-marker' ? parseInt(arucoId) || 0 : undefined,
            position: {
                x: parseFloat(coordinateX) || 0,
                y: parseFloat(coordinateY) || 0,
                z: 0.1
            },
            orientation: quaternion,
            offsetY: parseFloat(offsetY) || 0,
            offsetOrientation: parseFloat(offsetOrientation) || 0
        };

        // Handle create/edit directly using mapRef
        if (mapRef && mapRef.current && mapRef.current.toolDrawMarkers) {
            let result;
            if (mode === 'edit') {

                console.log('markerData', markerData);
                result = mapRef.current.toolDrawMarkers.updateMarker(markerData);
            } else {
                result = mapRef.current.toolDrawMarkers.createMarkerFromData(markerData);
            }
            
            if (result) {
                console.log(`Marker ${mode === 'edit' ? 'updated' : 'created'} successfully`);
                // Clear selection and reset map state
                mapRef.current.toolDrawMarkers.clearSelectedMarker();
                if (mapRef.current.markersToolbar) {
                    mapRef.current.markersToolbar.hideEditActions();
                    mapRef.current.markersToolbar.deactivateAllTools();
                }
                if (mapRef.current) {
                    mapRef.current.applyMapTool();
                }
                onClose();
            } else {
                setErrorExist(`Lỗi khi ${mode === 'edit' ? 'cập nhật' : 'tạo'} marker trên bản đồ`);
            }
        }
    };



    const handleCancel = () => {
        // Clear selection and reset map state if available
        if (mapRef && mapRef.current && mapRef.current.toolDrawMarkers) {
            mapRef.current.toolDrawMarkers.clearSelectedMarker();
        }
        
        if (mapRef && mapRef.current && mapRef.current.markersToolbar) {
            mapRef.current.markersToolbar.hideEditActions();
            mapRef.current.markersToolbar.deactivateAllTools();
        }
        
        if (mapRef && mapRef.current) {
            mapRef.current.applyMapTool();
        }
        
        onClose();
    };

    const handleDetect = async () => {
        setIsDetecting(true);
        setDetectError('');

        try {
            // Prepare request body based on marker type
            let requestBody;
            
            if (type === 'Aruco-marker') {
                // Validate Aruco ID for Aruco-marker type
                const arucoIdNum = parseInt(arucoId);
                if (isNaN(arucoIdNum) || arucoIdNum < 0 || arucoIdNum > 100) {
                    setDetectError('Aruco ID phải là số từ 0 đến 100');
                    return;
                }
                
                requestBody = {
                    type: 'aruco',
                    id: arucoIdNum,
                    timeout: 10.0
                };
            } else {
                // For V-marker type
                requestBody = {
                    type: 'pattern',
                    timeout: 10.0
                };
            }

            const response = await fetch(`${SERVER_URL}/api/robot/get-pattern-pose`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

                    const data = await response.json();
        console.log('Full response data:', data);
        
        if (data.success && data.data && data.data.pose) {
                const pose = data.data.pose;
                
                // Update form with detected pose
                setCoordinateX(pose.position.x.toFixed(4));
                setCoordinateY(pose.position.y.toFixed(4));
                
                // Convert quaternion to yaw then to degrees
                const quaternionToYaw = (x, y, z, w) => {
                    const siny_cosp = 2 * (w * z + x * y);
                    const cosy_cosp = 1 - 2 * (y * y + z * z);
                    return Math.atan2(siny_cosp, cosy_cosp);
                };
                
                const yawRadians = quaternionToYaw(
                    pose.orientation.x,
                    pose.orientation.y,
                    pose.orientation.z,
                    pose.orientation.w
                );
                const orientationDegrees = (yawRadians * 180 / Math.PI).toFixed(4);
                setOrientation(orientationDegrees);
                
                console.log('Marker pose detected:', pose);
            } else {
                console.log('Response data:', data);
                setDetectError(data.message || 'Failed to detect marker pose');
            }
        } catch (error) {
            console.error('Error detecting marker pose:', error);
            setDetectError('Failed to detect marker pose. Please try again.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleKeyDown = (e) => {
        // Prevent Enter key from submitting form and refreshing page
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          
          // On mobile, blur the input to hide virtual keyboard
          if (e.target && typeof e.target.blur === 'function') {
            e.target.blur();
          }
        }
      };

    if (!isOpen) return null;

    return (
        <div className="markers-dialog-overlay">
            <div className="markers-dialog">
                <div className="markers-dialog-header">
                    <h3>{mode === 'create' ? 'Create Marker' : mode === 'delete' ? 'Delete Marker' : 'Edit Marker'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="markers-dialog-body">
                    {mode === 'delete' ? (
                        <div className="form-group-container">
                            <div className="delete-confirmation" style={{ textAlign: 'center', padding: '20px' }}>
                                <h3>Confirm Delete</h3>
                                <p>Are you sure you want to delete marker "{markerName}"?</p>
                                <p style={{ color: '#666', fontSize: '14px' }}>This action cannot be undone.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="form-group-container">
                                <span className="form-group-label">
                                    Name:
                                </span>
                                <input
                                    className="form-group-input"
                                    type="text"
                                    id="markerName"
                                    name="markerName"
                                    value={markerName}
                                    onChange={(e) => validateMarkerName(e.target.value)}
                                    placeholder="Please enter marker name"
                                    title="Enter a unique name for this marker (max 50 characters)"
                                    required
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            
                            <div className="form-double-container">
                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Type:
                                    </span>
                                    <select
                                        className="form-group-input"
                                        id="type"
                                        name="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        required
                                        onKeyDown={handleKeyDown}
                                    >
                                        <option value="V-marker">V-marker</option>
                                        <option value="Aruco-marker">Aruco-marker</option>
                                    </select>
                                </div>

                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Orientation from X-axis (degrees):
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="orientation"
                                        name="orientation"
                                        value={orientation}
                                        onChange={(e) => setOrientation(e.target.value)}
                                        step="0.1"
                                        required
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>

                            {type === 'Aruco-marker' && (
                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Aruco ID (0-100):
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="arucoId"
                                        name="arucoId"
                                        value={arucoId}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (value >= 0 && value <= 100) {
                                                setArucoId(e.target.value);
                                            }
                                        }}
                                        min="0"
                                        max="100"
                                        required
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            )}

                            <div className="form-double-container">
                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        X coordinate in meters:
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="coordinateX"
                                        name="coordinateX"
                                        value={coordinateX}
                                        onChange={(e) => setCoordinateX(e.target.value)}
                                        step="0.01"
                                        required
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>

                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Y coordinate in meters:
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="coordinateY"
                                        name="coordinateY"
                                        value={coordinateY}
                                        onChange={(e) => setCoordinateY(e.target.value)}
                                        step="0.01"
                                        required
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>

                            <div className="form-double-container">
                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Offset Y in meters:
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="offsetY"
                                        name="offsetY"
                                        value={offsetY}
                                        onChange={(e) => setOffsetY(e.target.value)}
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group-container">
                                    <span className="form-group-label">
                                        Offset Orientation (degrees):
                                    </span>
                                    <input
                                        className="form-group-input"
                                        type="number"
                                        id="offsetOrientation"
                                        name="offsetOrientation"
                                        value={offsetOrientation}
                                        onChange={(e) => setOffsetOrientation(e.target.value)}
                                        step="0.1"
                                        required
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>

                            {detectError && (
                                <div className="form-group-container">
                                    <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                                        {detectError}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="form-group-actions">
                        <button type="submit" className="btn-submit" onKeyDown={handleKeyDown}>
                            {mode === 'create' ? 'Create' : mode === 'delete' ? 'Confirm Delete' : 'Update'}
                        </button>
                        {mode !== 'delete' && (
                            <button 
                                type="button"
                                className="btn-detect" 
                                onClick={handleDetect}
                                disabled={isDetecting}
                            >
                                {isDetecting ? 'Detecting...' : 'Detect'}
                                onKeyDown={handleKeyDown}
                            </button>
                        )}

                        <button type="button" className="btn-cancel" onClick={handleCancel} onKeyDown={handleKeyDown}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkersDialog;
