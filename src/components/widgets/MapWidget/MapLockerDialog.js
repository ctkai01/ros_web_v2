import React, { useState, useEffect } from 'react';
import serverConfig from '../../../../config/serverConfig';
import './MapLockerDialog.css';

const MapLockerDialog = ({ isOpen, onClose, onSave, onDelete, widget }) => {
  const [maps, setMaps] = useState([]);

  // CẢI TIẾN: Lấy mapId trực tiếp từ prop `widget`
  const currentMapId = widget ? widget.settings.mapId : null;
  const [selectedMapId, setSelectedMapId] = useState(currentMapId || '');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMaps();
      // Luôn cập nhật state từ prop khi dialog mở hoặc prop thay đổi
      setSelectedMapId(currentMapId || '');
    }
  }, [isOpen, currentMapId]);

  const getCurrentSiteId = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      // Get current site ID from API
      const response = await fetch(`${serverConfig.SERVER_URL}/api/maps/getCurrentSiteId`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('getCurrentSiteId HTTP error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('getCurrentSiteId data', data);

      if (data.success && data.data) {
        return data.data; // API returns site ID directly
      } else {
        return null;
      }
    } catch (error) {
      console.error('getCurrentSiteId: Error getting current site id:', error);
      return null;
    }
  };

  const fetchMaps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      // Get current site ID first
      const currentSiteId = await getCurrentSiteId();

      if (!currentSiteId) {
        console.warn('No current site ID found, using fallback data');
        throw new Error('No site ID available');
      }

      console.log('Fetching maps for site ID:', currentSiteId);

      // Use correct API endpoint for site-specific maps
      const response = await fetch(`${serverConfig.SERVER_URL}/api/sites/${currentSiteId}/maps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Site maps data from server:', data);

        if (Array.isArray(data)) {
          // Convert format to match expected format
          const formattedMaps = data.map(map => ({
            id: map.ID || map.id,
            name: map.mapName || map.name,
            siteId: map.IDSite || map.siteId || currentSiteId,
            data: map.data,
            createdAt: map.createdAt,
            updatedAt: map.updatedAt,
            createdBy: map.createdBy
          })).filter(map =>
            map.id !== undefined &&
            map.id !== null &&
            map.name
          );

          console.log('Formatted maps for site ID', currentSiteId, ':', formattedMaps);
          setMaps(formattedMaps);
        } else {
          throw new Error('Invalid maps data format');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch maps:', response.status, errorText);
        throw new Error(`Failed to fetch maps: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching maps:', error);
      // Fallback with mock data when error occurs
      setMaps([
        { id: 1, name: 'Map A' },
        { id: 2, name: 'Map B' },
        { id: 3, name: 'Map C' },
        { id: 4, name: 'Floor 1 Map' },
        { id: 5, name: 'Floor 2 Map' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedMapId) {
      const selectedMap = maps.find(m => m.id === parseInt(selectedMapId));
      if (selectedMap) {
        onSave({
          mapId: selectedMap.id,
          mapName: selectedMap.name
        });
      }
    } else {
      onSave(null);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(); // Delete widget
    } else {
      onSave(null); // Fallback: remove map
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="map-dialog-overlay">
      <div className="map-dialog">
        <div className="map-dialog-header">
          <h3>Map Locked Widget</h3>
        </div>

        <div className="map-dialog-content">
          <p>You can lock this widget to a specific map by selecting a predefined map from the current site.</p>

          <div className="map-field">
            <label>Map</label>
            <select
              value={selectedMapId}
              onChange={(e) => setSelectedMapId(e.target.value)}
              disabled={loading}
            >
              <option key="no-map" value="">No map selected</option>
              {maps.map((map, index) => (
                <option key={`map-${map.id || `temp-${index}`}`} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="map-dialog-actions">
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </button>
          <button
            className="btn-delete"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </button>
          <button
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapLockerDialog;
