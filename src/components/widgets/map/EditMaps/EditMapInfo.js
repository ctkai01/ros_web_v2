import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../../config/serverConfig';
import MessageDialog from '../../../common/MessageDialog';
import '../CreateMap/CreateMap.css';

const EditMapInfo = () => {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const [mapName, setMapName] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});

  useEffect(() => {
    loadSites();
    loadMapInfo();
  }, [mapId]);

  const loadSites = async () => {
    try {
      const token = localStorage.getItem('token');
      const sitesData = await apiCallWithRetry(`${SERVER_URL}/api/sites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setMessageData({
        title: 'Load Sites Failed',
        message: 'Failed to load sites. Please try again.',
      });
      setShowMessage(true);
    }
  };

  const loadMapInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const mapData = await apiCallWithRetry(`${SERVER_URL}/api/maps/${mapId}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (mapData) {
        setMapName(mapData.mapName || '');
        setSelectedSite(mapData.IDSite || '');
      }
    } catch (error) {
      console.error('Error loading map info:', error);
      setMessageData({
        title: 'Load Map Info Failed',
        message: 'Failed to load map information. Please try again.',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mapName || !selectedSite) {
      setMessageData({
        title: 'Validation Error',
        message: 'Please fill in all required fields.',
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);

      // Check for duplicate map name (excluding current map)
      const token = localStorage.getItem('token');
      const existingMaps = await apiCallWithRetry(`${SERVER_URL}/api/sites/${selectedSite}/maps`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (existingMaps && existingMaps.some(map => 
        map.mapName.toLowerCase() === mapName.toLowerCase() && map.ID !== parseInt(mapId)
      )) {
        setMessageData({
          title: 'Duplicate Map Name',
          message: 'A map with this name already exists in the selected site. Please choose a different name.',
        });
        setShowMessage(true);
        return;
      }

      const requestData = {
        mapName,
        IDSite: parseInt(selectedSite)
      };
      
      console.log('Sending update request:', requestData);
      
      await apiCallWithRetry(`${SERVER_URL}/api/maps/${mapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: requestData
      });

      // Show success message
      console.log('Setting success message dialog...');
      setMessageData({
        title: 'Update Success',
        message: `Map "${mapName}" updated successfully.`,
        onClose: () => {
          setShowMessage(false);
          navigate(`/setup/maps/edit/${mapId}`);
        }
      });
      setShowMessage(true);
      console.log('Success dialog should be visible now');
    } catch (error) {
      console.error('Error updating map:', error);
      setMessageData({
        title: 'Update Failed',
        message: `Error updating map: ${error.message}`,
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/setup/maps/edit/${mapId}`);
  };

  const handleManageSites = () => {
    navigate('/setup/maps/create/sites');
  };

  const handleBack = () => {
    navigate(`/setup/maps/edit/${mapId}`);
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

  if (loading && !mapName) {
    return (
      <div className="create-map-page">
        <div className="page-header">
          <div className="header-title">
            <h2>Edit Map Info</h2>
            <span className="subtitle">Loading map information...</span>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-map-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Edit Map Info</h2>
          <span className="subtitle">Update map details below</span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleBack}>
            <span className="go-back-icon"></span>
            Go Back
          </button>
        </div>
      </div>
      

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group-container">
          <span className="form-group-label">
            Map Name:
          </span>
          <input className="form-group-input"
            type="text"
            id="mapName"
            name="mapName"
            placeholder="Enter map name"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            required
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <div className="form-group-container">
          <span className="form-group-label">
            Site:
          </span>
          <div className="site-select-container">
            <select className="form-group-input"
              id="mapSite"
              name="mapSite"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              disabled={loading}
            >
              <option value="">Select a site</option>
              {sites.map(site => (
                <option key={site.ID} value={site.ID}>
                  {site.siteName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-create"
              onClick={handleManageSites}
              disabled={loading}
            >
              Create/Edit
            </button>
          </div>
        </div>
        <div className="form-group-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            <span className="save-icon"></span>
            {loading ? 'Updating...' : 'Update'}
          </button>
          <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
            <span className="cancel-icon"></span>
            Cancel
          </button>
        </div>
      </form>

      {/* Message Dialog */}
      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={messageData.onClose || (() => setShowMessage(false))}
      />
      {console.log('showMessage:', showMessage, 'messageData:', messageData)}
    </div>
  );
};

export default EditMapInfo;
