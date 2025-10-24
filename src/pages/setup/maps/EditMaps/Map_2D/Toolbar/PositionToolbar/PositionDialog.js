import React, { useState, useEffect } from 'react';
import './PositionDialog.css';
import '../../../../../../../App.css';

const PositionDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    onUseRobotPosition,
    initialPosition = null,
    mode = 'create', // 'create' or 'edit'
    navigationMode = false // Add navigationMode prop
}) => {
    const [formData, setFormData] = useState({
        pointName: '',
        type: 'Robot position',
        orientation: '0',
        coordinateX: '0',
        coordinateY: '0'
    });
    const [errorExist, setErrorExist] = useState('');

    // Reset form when dialog opens/closes or initialPosition changes
    useEffect(() => {
        if (isOpen) {
            if (initialPosition) {
                setFormData({
                    pointName: initialPosition.name || '',
                    type: initialPosition.type || 'Robot position',
                    orientation: ((initialPosition.orientation?.z || 0) * 180 / Math.PI).toFixed(2),
                    coordinateX: initialPosition.position?.x?.toFixed(2) || '0.00',
                    coordinateY: initialPosition.position?.y?.toFixed(2) || '0.00'
                });
            } else {
                setFormData({
                    pointName: '',
                    type: 'Robot position',
                    orientation: '0.00',
                    coordinateX: '0.00',
                    coordinateY: '0.00'
                });
            }
            setErrorExist('');
        }
    }, [isOpen, initialPosition]);

    const validatePointName = (value) => {
        setFormData(prev => ({ ...prev, pointName: value }));
        if (!value.trim()) {
            setErrorExist('Tên điểm không được để trống');
        } else if (value.length > 50) {
            setErrorExist('Tên điểm không được quá 50 ký tự');
        } else {
            setErrorExist('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (errorExist || !formData.pointName.trim()) {
            setErrorExist('Vui lòng nhập tên điểm hợp lệ');
            return;
        }

        // Convert orientation from degrees to radians
        const orientationRadians = (parseFloat(formData.orientation) || 0) * Math.PI / 180;

        const positionData = {
            name: formData.pointName.trim(),
            type: formData.type,
            position: {
                x: parseFloat(formData.coordinateX) || 0,
                y: parseFloat(formData.coordinateY) || 0,
                z: 0.1
            },
            orientation: {
                x: 0,
                y: 0,
                z: orientationRadians,
                w: 1
            }
        };

        onConfirm(positionData);
        onClose();
    };

    const handleUseRobotPosition = () => {
        if (onUseRobotPosition) {
            onUseRobotPosition();
        }
    };

    const handleCancel = () => {
        onClose();
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
        <div className="position-dialog-overlay">
            <div className="position-dialog">
                <div className="position-dialog-header">
                    <h3>{mode === 'create' ? 'Create Position' : 'Edit Position'}</h3>
                </div>
                <div className="position-dialog-body">
                    <form onSubmit={handleSubmit} className="form-container">
                        <div className="form-group-container">
                            <span className="form-group-label">
                                Name:
                            </span>
                            <input 
                                type="text" 
                                className="form-group-input"
                                value={formData.pointName}
                                onChange={(e) => validatePointName(e.target.value)}
                                placeholder="Point name" 
                                required
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div className="form-group-container">
                            <span className="form-group-label">
                                Type:
                            </span>
                            <select 
                                className="form-group-input"
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="Robot position">Robot position</option>
                                <option value="Waypoint">Waypoint</option>
                                <option value="Charging station">Charging station</option>
                                <option value="Pickup point">Pickup point</option>
                                <option value="Dropoff point">Dropoff point</option>
                            </select>
                        </div>

                        <div className="form-double-container">
                            <div className="form-group-container">
                                <span className="form-group-label">
                                    Orientation from X-axis (degrees):
                                </span>
                                <input 
                                    type="number" 
                                    className="form-group-input"
                                    value={formData.orientation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, orientation: e.target.value }))}
                                    step="0.1"
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className="form-group-container">
                                <span className="form-group-label">
                                    X coordinate in meters:
                                </span>
                                <input 
                                    type="number" 
                                    className="form-group-input"
                                    value={formData.coordinateX}
                                    onChange={(e) => setFormData(prev => ({ ...prev, coordinateX: parseFloat(e.target.value).toFixed(2) || '0.00' }))}
                                    step="0.01"
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        <div className="form-group-container">
                            <span className="form-group-label">
                                Y coordinate in meters:
                            </span>
                            <input 
                                type="number" 
                                className="form-group-input"
                                value={formData.coordinateY}
                                onChange={(e) => setFormData(prev => ({ ...prev, coordinateY: parseFloat(e.target.value).toFixed(2) || '0.00' }))}
                                step="0.01"
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {errorExist && (
                            <div className="error-message" style={{ color: '#bd1717', fontSize: '12px', marginTop: '5px' }}>
                                {errorExist}
                            </div>
                        )}

                        <div className="form-group-actions">
                            <button 
                                type="submit" 
                                className="btn-submit"
                                onKeyDown={handleKeyDown}
                            >
                                {mode === 'create' ? 'Create' : 'Update'}
                            </button>
                            <button 
                                type="button" 
                                className="btn-design"
                                onClick={handleUseRobotPosition} 
                                disabled={!navigationMode}
                                onKeyDown={handleKeyDown}
                            >
                                Use robot position
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={handleCancel}
                                onKeyDown={handleKeyDown}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PositionDialog; 