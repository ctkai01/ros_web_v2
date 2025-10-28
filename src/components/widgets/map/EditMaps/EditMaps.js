import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../../config/serverConfig';
import { Map2D } from './Map_2D/Map_2D';
import './EditMaps.css';
import { Buffer } from "buffer";
import serverConfig from '../../../../config/serverConfig';
import ConfirmDialog from '../../../common/ConfirmDialog';
import MessageDialog from '../../../common/MessageDialog';
import SuccessDialog from '../../../common/SuccessDialog';
import JSZip from 'jszip';
import { ForbiddenZoneToolbar } from './Map_2D/Toolbar/ForbiddenZoneToolbar/ForbiddenZoneToolbar.js';
import { PreferredZoneToolbar } from './Map_2D/Toolbar/PreferredZoneToolbar/PreferredZoneToolbar.js';
import { UnpreferredZoneToolbar } from './Map_2D/Toolbar/UnpreferredZoneToolbar/UnpreferredZoneToolbar.js';
import { CriticalZoneToolbar } from './Map_2D/Toolbar/CriticalZoneToolbar/CriticalZoneToolbar.js';
import { VirtualWallToolbar } from './Map_2D/Toolbar/VirtualWallToolbar/VirtualWallToolbar.js';
import { WallToolbar } from './Map_2D/Toolbar/WallToolbar/WallToolbar.js';
import { FloorToolbar } from './Map_2D/Toolbar/FloorToolbar/FloorToolbar.js';
import { PositionToolbar } from './Map_2D/Toolbar/PositionToolbar/PositionToolbar.js';
import PositionDialog from './Map_2D/Toolbar/PositionToolbar/PositionDialog.js';
import { MarkersToolbar } from './Map_2D/Toolbar/MarkersToolbar/MarkersToolbar.js';
import MarkersDialog from './Map_2D/Toolbar/MarkersToolbar/MarkersDialog.js';

const EditMaps = () => {
  const { mapId } = useParams();
  const [searchParams] = useSearchParams();
  const [mapName, setMapName] = useState(null);
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedObjectType, setSelectedObjectType] = useState('no-object-type');
  const [showObjectTypeSelector, setShowObjectTypeSelector] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const moreButtonRef = useRef(null);
  const [pointName, setpointName] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);
  const [isNavGoalMode, setIsNotNavGoalMode] = useState(true);
  const [mapPositionExists] = useState([]);
  const [errorExist, seterrorExist] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({}); // { title, message, onConfirm }
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});

  const [forbiddenZones, setForbiddenZones] = useState([]);
  const [preferredZones, setPreferredZones] = useState([]);
  const [unpreferredZones, setUnpreferredZones] = useState([]);
  const [criticalZones, setCriticalZones] = useState([]);
  const [virtualWalls, setVirtualWalls] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(null);
  const [currentSiteId, setCurrentSiteId] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showForbiddenZonesContainer, setShowForbiddenZonesContainer] = useState(false);
  const [showPreferredZonesContainer, setShowPreferredZonesContainer] = useState(false);
  const [showForbiddenZoneToolbar, setShowForbiddenZoneToolbar] = useState(false);
  const [showPreferredZoneToolbar, setShowPreferredZoneToolbar] = useState(false);
  const [showUnpreferredZoneToolbar, setShowUnpreferredZoneToolbar] = useState(false);
  const [showCriticalZoneToolbar, setShowCriticalZoneToolbar] = useState(false);
  const [showPositionToolbar, setShowPositionToolbar] = useState(false);
  const [showVirtualWallToolbar, setShowVirtualWallToolbar] = useState(false);
  const [showMarkersToolbar, setShowMarkersToolbar] = useState(false);
  const [showWallToolbar, setShowWallToolbar] = useState(false);
  const [showFloorToolbar, setShowFloorToolbar] = useState(false);

  // Position dialog state
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [positionDialogMode, setPositionDialogMode] = useState('create');
  const [pendingPosition, setPendingPosition] = useState(null);
  const [navigationMode, setNavigationMode] = useState(false); // Add navigationMode state

  // Markers dialog state
  const [showMarkersDialog, setShowMarkersDialog] = useState(false);
  const [markersDialogMode, setMarkersDialogMode] = useState('create');
  const [pendingMarker, setPendingMarker] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Refs
  const mapContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageDialogConfig, setMessageDialogConfig] = useState({});
  const [shouldCheckCurrentMap, setShouldCheckCurrentMap] = useState(false);

  useEffect(() => {
    if (!mapId) {
      setMapData(null); // Clear old map data when mapId is invalid/undefined
      setCurrentMapId(null);
      setCurrentSiteId(null);
      return;
    }

    // Store mapId in state
    setCurrentMapId(mapId);

    // Load map data and handle all initialization
    const initializeMapData = async () => {
      try {
        // Get site id from map id
        await getCurrentSiteId();

        // Auto load map data when page opens
        await loadMapData();
      } catch (error) {
        console.error('Error initializing map data:', error);
      }
    };

    initializeMapData();

  }, [mapId]);

  // Set siteId when mapData is loaded
  useEffect(() => {
    if (mapData && mapData.siteId) {
      setCurrentSiteId(mapData.siteId);
    }
  }, [mapData]);



  // Sync navigationMode state with mapRef.current.navigationMode
  useEffect(() => {
    if (mapRef.current) {
      setNavigationMode(mapRef.current.navigationMode || false);
    }
  }, [mapRef.current?.navigationMode]);

  // Sync navigationMode when mapRef changes
  useEffect(() => {
    if (mapRef.current) {
      setNavigationMode(mapRef.current.navigationMode || false);
    }
  }, [mapRef.current]);




  const getCurrentSiteId = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response_siteId = await fetch(`${SERVER_URL}/api/maps/getSiteIdFromMapId/${mapId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response_siteId.ok) {
        console.error('getCurrentSiteId HTTP error:', response_siteId.status, response_siteId.statusText);
        return null;
      }

      const data = await response_siteId.json();
      // console.log('getCurrentSiteId data', data);
      // set current site id
      if (data.success && data.data) {
        setCurrentSiteId(data.data.siteId);
        setMapName(data.data.mapName);
        return data.data.siteId;
      }
      else {
        return null;
      }

    } catch (error) {
      console.error('getCurrentSiteId: Error getting current site id:', error);
      console.error('getCurrentSiteId error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  const getCurrentMapId = async (siteId) => {
    try {
      if (!siteId || siteId === '[object Promise]') {
        console.error('Invalid siteId provided:', siteId);
        return null;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response_mapId = await fetch(`${SERVER_URL}/api/maps/getCurrentMapId/${siteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response_mapId.ok) {
        console.error('getCurrentMapId HTTP error:', response_mapId.status, response_mapId.statusText);
        return null;
      }

      const data = await response_mapId.json();
      console.log('getCurrentMapId data', data);

      if (data.success && data.data) {
        return data.data;
      }
      else {
        return null;
      }
    } catch (error) {
      console.error('Error getting current map id:', error);
      console.error('getCurrentMapId error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  }
  const changeCurrentMap = async (currentSiteId_) => {
    try {
      const token = localStorage.getItem('token');
      // Change map set to server map id

      const response_changeMap = await fetch(`${SERVER_URL}/api/maps/${mapId}/setCurrent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteId: currentSiteId_,
          mapId: mapId
        })
      });

      const changeData = await response_changeMap.json();

      if (changeData.success) {
        // call api to change map current
        const response_changeMapCurrent = await fetch(`${SERVER_URL}/api/missions/map/change`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            mapId: mapId,
            siteId: currentSiteId_
          })
        });

      } else {
        console.error('changeCurrentMap: Failed to change map:', changeData.message);
        setError('Failed to change map. Please try again.');
      }
    } catch (error) {
      console.error('changeCurrentMap: Error changing map:', error);
      setError('Error changing map. Please try again.');
    }
  }

  const checkCurrentMap = async () => {
    console.log('checkCurrentMap');
    try {
      // Get current site id from server
      const currentSiteId_ = await getCurrentSiteId();

      if (currentSiteId_ == null) {
        return;
      }

      // Validate siteId before passing to getCurrentMapId
      if (typeof currentSiteId_ !== 'number' && typeof currentSiteId_ !== 'string') {
        console.error('checkCurrentMap: Invalid siteId type:', typeof currentSiteId_, 'value:', currentSiteId_);
        return;
      }

      const currentMapId_ = await getCurrentMapId(currentSiteId_);
      console.log('currentMapId_', currentMapId_);
      if (currentMapId_ == null) {
        // Show dialog when no current map is set
        setShowConfirm(true);
        setConfirmData({
          title: 'No Current Map',
          message: 'No current map has been set for this site. Do you want to set this map as the current map?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
              setIsNotNavGoalMode(false);
            } catch (error) {
              console.error('checkCurrentMap: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
        return;
      }

      // Validate currentMapId_ structure
      if (!currentMapId_ || typeof currentMapId_ !== 'object' || !currentMapId_.hasOwnProperty('mapId')) {
        console.error('checkCurrentMap: Invalid currentMapId_ structure:', currentMapId_);
        return;
      }

      // Validate mapId values before comparison
      if (!mapId) {
        console.error('checkCurrentMap: Invalid mapId from URL:', mapId);
        return;
      }

      // Handle case when serverMapId is null (no current map set)
      if (!currentMapId_.mapId) {
        console.log('checkCurrentMap: No current map set (serverMapId is null)');
        // Show dialog when no current map is set
        setShowConfirm(true);
        setConfirmData({
          title: 'No Current Map',
          message: 'No current map has been set for this site. Do you want to set this map as the current map?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
              setIsNotNavGoalMode(false);
            } catch (error) {
              console.error('checkCurrentMap: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
        return;
      }

      if (currentMapId_.mapId != mapId) {
        // Show dialog to user
        setShowConfirm(true);
        setConfirmData({
          title: 'Change map?',
          message: 'This map is not the current map. Do you want to change map?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
              setIsNotNavGoalMode(false);
            } catch (error) {
              console.error('checkCurrentMap: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
      }
      else {
        setIsNotNavGoalMode(false);
      }
    } catch (error) {
      console.error('checkCurrentMap: Error checking current map:', error);
      console.error('checkCurrentMap: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }



  const loadMapData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiCallWithRetry(`${SERVER_URL}/api/maps/load/${mapId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mapId,
          timeout: 30000
        })
      });

      if (response.success && response.data) {
        setMapData(response.data);

        // Load virtual walls, forbidden zones, positions, and markers
        if (mapRef.current) {
          console.log('loadVirtualWallsFromDatabase');
          await mapRef.current.loadVirtualWallsFromDatabase();
          console.log('loadForbiddenZonesFromDatabase');
          await mapRef.current.loadForbiddenZonesFromDatabase();
          console.log('loadPreferredZonesFromDatabase');
          await mapRef.current.loadPreferredZonesFromDatabase();
          console.log('loadUnpreferredZonesFromDatabase');
          await mapRef.current.loadUnpreferredZonesFromDatabase();
          console.log('loadCriticalZonesFromDatabase');
          await mapRef.current.loadCriticalZonesFromDatabase();
          console.log('loadPointsFromDatabase');
          await mapRef.current.loadPointsFromDatabase();
          console.log('loadMarkersFromDatabase');
          await mapRef.current.loadMarkersFromDatabase();
        }

        // Enable save button
        setIsDisabled(false);
        setError(null);

        // Show object type selector when map data is loaded successfully
        setShowObjectTypeSelector(true);
        const objectTypeSelector = document.querySelector('.object-type-selector');
        if (objectTypeSelector) objectTypeSelector.style.display = 'flex';

        // check if map id is current map id
        if (response.data.mapData) {
        checkCurrentMap();
        }
      } else {
        throw new Error(response.message || 'Failed to load map data');
      }
    } catch (error) {
      console.error('loadMapData: Error loading map data:', error);
      console.error('loadMapData error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError('Failed to load map data. Please try again.');
    } finally {
      setLoading(false);
    }
  };







  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const checkCurrentMapForRecordAppend = async () => {
    try {
      // Get current site id from server
      const currentSiteId_ = await getCurrentSiteId();

      if (currentSiteId_ == null) {
        return;
      }

      // Validate siteId before passing to getCurrentMapId
      if (typeof currentSiteId_ !== 'number' && typeof currentSiteId_ !== 'string') {
        console.error('checkCurrentMapForRecordAppend: Invalid siteId type:', typeof currentSiteId_, 'value:', currentSiteId_);
        return;
      }

      const currentMapId_ = await getCurrentMapId(currentSiteId_);
      console.log('checkCurrentMapForRecordAppend - currentMapId_', currentMapId_);

      if (currentMapId_ == null) {
        // Show dialog when no current map is set
        setShowConfirm(true);
        setConfirmData({
          title: 'No Current Map',
          message: 'No current map has been set for this site. Do you want to set this map as the current map before recording?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
            } catch (error) {
              console.error('checkCurrentMapForRecordAppend: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
        return;
      }

      // Validate currentMapId_ structure
      if (!currentMapId_ || typeof currentMapId_ !== 'object' || !currentMapId_.hasOwnProperty('mapId')) {
        console.error('checkCurrentMapForRecordAppend: Invalid currentMapId_ structure:', currentMapId_);
        return;
      }

      // Validate mapId values before comparison
      if (!mapId) {
        console.error('checkCurrentMapForRecordAppend: Invalid mapId from URL:', mapId);
        return;
      }

      // Handle case when serverMapId is null (no current map set)
      if (!currentMapId_.mapId) {
        console.log('checkCurrentMapForRecordAppend: No current map set (serverMapId is null)');
        // Show dialog when no current map is set
        setShowConfirm(true);
        setConfirmData({
          title: 'No Current Map',
          message: 'No current map has been set for this site. Do you want to set this map as the current map before recording?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
    } catch (error) {
              console.error('checkCurrentMapForRecordAppend: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
        return;
      }

      if (currentMapId_.mapId != mapId) {
        // Show dialog to user
        setShowConfirm(true);
        setConfirmData({
          title: 'Change Current Map?',
          message: 'This map is not the current map. Do you want to change the current map before recording?',
          onConfirm: async () => {
            setShowConfirm(false);
            try {
              await changeCurrentMap(currentSiteId_);
            } catch (error) {
              console.error('checkCurrentMapForRecordAppend: Error in onConfirm:', error);
            }
          },
          onCancel: () => {
            setShowConfirm(false);
          }
        });
      }
    } catch (error) {
      console.error('checkCurrentMapForRecordAppend: Error checking current map:', error);
    }
  };

  const handleUploadMap = async () => {
    try {
      // Create file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.zip';
      fileInput.style.display = 'none';

      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          // Read ZIP file
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);

          // Extract files from ZIP
          const pgmFile = Object.values(zipContent.files).find(f => f.name.endsWith('.pgm'));
          const yamlFile = Object.values(zipContent.files).find(f => f.name.endsWith('.yaml'));
          const pbstreamFile = Object.values(zipContent.files).find(f => f.name.endsWith('.pbstream'));

          if (!pgmFile || !yamlFile || !pbstreamFile) {
            throw new Error('ZIP file must contain .pgm, .yaml, and .pbstream files');
          }

          // Convert files to Uint8Array
          const pgmData = await pgmFile.async('uint8array');
          const yamlData = await yamlFile.async('uint8array');
          const poseData = await pbstreamFile.async('uint8array');

          // Upload to server
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

          const formData = new FormData();
          formData.append('mapId', mapId.toString());
          formData.append('pgmData', new Blob([pgmData]), 'map.pgm');
          formData.append('yamlData', new Blob([yamlData]), 'map.yaml');
          formData.append('poseData', new Blob([poseData]), 'map.pbstream');

          const response = await fetch(`${SERVER_URL}/api/maps/upload`, {
            method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to upload map');
          }

          const result = await response.json();
          if (result.success) {
            // Reload map data
            loadMapData();
          } else {
            throw new Error(result.message || 'Upload failed');
          }

    } catch (error) {
          console.error('Error uploading map:', error);
          setMessageData({
            title: 'Upload Failed',
            message: `Failed to upload map: ${error.message}`
          });
          setShowMessage(true);
        }

        // Clean up
        document.body.removeChild(fileInput);
      };

      // Trigger file selection
      document.body.appendChild(fileInput);
      fileInput.click();

    } catch (error) {
      console.error('Error setting up upload:', error);
    }
  };

  const handleDownloadMap = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get map metadata (includes Info, mapData, poseData)
      const metadataResponse = await apiCallWithRetry(`${SERVER_URL}/api/maps/${mapId}/metadata`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!metadataResponse) {
        throw new Error('Failed to load map metadata');
      }

      console.log('metadataResponse', metadataResponse);

      // Get raw data from database
      const rawPgmData = new Uint8Array(metadataResponse.mapData.data);
      const yamlData = new Uint8Array(metadataResponse.Info.data);
      const poseData = new Uint8Array(metadataResponse.poseData.data);

      // Parse PGM data to find header and image data
      const pgmBuffer = Buffer.from(rawPgmData);
      const pgmText = pgmBuffer.toString('utf-8');

      // Split by lines to find header
      const lines = pgmText.split('\n');
      let headerLines = 0;
      const headerValues = [];

      for (const line of lines) {
        headerLines++;
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('#')) {
          continue; // Skip comments
        }
        headerValues.push(...trimmedLine.split(/\s+/).filter(v => v));

        // Valid P5 header has 4 parts: "P5", width, height, max_value
        if (headerValues.length >= 4) {
          break;
        }
      }

      // Find start of image data
      let dataStartIndex = 0;
      let newlineCount = 0;
      for (let i = 0; i < rawPgmData.length; i++) {
        if (rawPgmData[i] === 10) { // newline character
          newlineCount++;
          if (newlineCount === headerLines) {
            dataStartIndex = i + 1;
            break;
          }
        }
      }

      // Extract header and image data
      const headerData = rawPgmData.slice(0, dataStartIndex);
      const imageData = rawPgmData.slice(dataStartIndex);

      console.log('PGM header lines:', headerLines);
      console.log('Data start index:', dataStartIndex);
      console.log('Header size:', headerData.length);
      console.log('Image data size:', imageData.length);

      // Debug: Convert YAML data to string to see content
      try {
        const yamlString = new TextDecoder().decode(yamlData);
        console.log('YAML content:', yamlString);
    } catch (error) {
        console.error('Error decoding YAML:', error);
      }

      // Create file names with database timestamp
      const mapName = metadataResponse.mapName || `map_${mapId}`;
      const dbTimestamp = metadataResponse.dateTime ? new Date(metadataResponse.dateTime) : new Date();
      const timestamp = dbTimestamp.toISOString().replace(/[:.]/g, '-');
      const pgmFileName = `${mapName}.pgm`;
      const yamlFileName = `${mapName}.yaml`;
      const pbstreamFileName = `${mapName}.pbstream`;
      const zipFileName = `${mapName}_${timestamp}.zip`;

      // Create ZIP file with all map files
      const zip = new JSZip();

      // Add PGM file to ZIP
      zip.file(pgmFileName, rawPgmData);

      // Add YAML file to ZIP
      zip.file(yamlFileName, yamlData);

      // Add PBSTREAM file to ZIP
      zip.file(pbstreamFileName, poseData);

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP file
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipLink = document.createElement('a');
      zipLink.href = zipUrl;
      zipLink.download = zipFileName;
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);
      URL.revokeObjectURL(zipUrl);

      // Download completed silently

    } catch (error) {
      console.error('Error downloading map:', error);
      setMessageData({
        title: 'Download Failed',
        message: `Failed to download map: ${error.message}`
      });
      setShowMessage(true);
    }
  };

  const handleOptionClick = async (action) => {
    setShowMoreMenu(false); // Ẩn menu

    switch (action) {
      case 'upload-overwrite':
        handleUploadMap();
        break;
      case 'record-overwrite':
        {
          // hide all button
          const zoomButton = document.querySelector('.zoom-tools .tool-button');
          if (zoomButton) zoomButton.style.display = 'none';
          const panButton = document.querySelector('.pan-tools .tool-button');
          if (panButton) panButton.style.display = 'none';
          const saveButton = document.querySelector('.save-tools .tool-button');
          if (saveButton) saveButton.style.display = 'none';
          const moreButton = document.querySelector('.more-button-container .tool-button');
          if (moreButton) moreButton.style.display = 'none';
          // hide reset view button
          const resetViewButton = document.querySelector('.reset-view-button');
          if (resetViewButton) resetViewButton.style.display = 'none';
          // hide zoom in button
          const zoomInButton = document.querySelector('.zoom-in-button');
          if (zoomInButton) zoomInButton.style.display = 'none';
          // hide zoom out button
          const zoomOutButton = document.querySelector('.zoom-out-button');
          if (zoomOutButton) zoomOutButton.style.display = 'none';

          // hide object type selector
          const objectTypeSelector = document.querySelector('.object-type-selector');
          if (objectTypeSelector) objectTypeSelector.style.display = 'none';

          // hide map info bar
          const mapInfoBar = document.querySelector('.map-info-bar');
          if (mapInfoBar) mapInfoBar.style.display = 'none';

          // hide navigation tools
          const navigationTools = document.querySelector('.navigation-tool');
          if (navigationTools) navigationTools.style.display = 'none';

          // show record button
          const recordButton = document.querySelector('.record-tools');
          if (recordButton) recordButton.style.display = 'flex';
          // show record map info bar
          const recordMapInfoBar = document.querySelector('.record-map-info-bar');
          if (recordMapInfoBar) recordMapInfoBar.style.display = 'flex';
          // show recording indicator
          const recordingIndicator = document.querySelector('.recording-indicator');
          if (recordingIndicator) recordingIndicator.style.display = 'flex';

          // Initialize Map2D if not already initialized
          if (!mapRef.current && canvasRef.current) {
            mapRef.current = new Map2D(canvasRef.current);

            // Set mapId and siteId using state values
            mapRef.current.mapId = currentMapId || mapId;
            mapRef.current.siteId = mapData?.siteId || currentSiteId;

            mapRef.current.initialize();
          }

          // Set flag to NOT check current map after SLAM stops (overwrite mode)
          setShouldCheckCurrentMap(false);

          // Start SLAM and subscribe to map updates
          startSLAMAndSubscribe();
        }
        break;
      case 'upload-append':
        loadMapData();
        break;
      case 'record-append':
        // hide all button
        const zoomButton = document.querySelector('.zoom-tools .tool-button');
        if (zoomButton) zoomButton.style.display = 'none';
        const panButton = document.querySelector('.pan-tools .tool-button');
        if (panButton) panButton.style.display = 'none';
        const saveButton = document.querySelector('.save-tools .tool-button');
        if (saveButton) saveButton.style.display = 'none';
        const moreButton = document.querySelector('.more-button-container .tool-button');
        if (moreButton) moreButton.style.display = 'none';
        // hide reset view button
        const resetViewButton = document.querySelector('.reset-view-button');
        if (resetViewButton) resetViewButton.style.display = 'none';
        // hide zoom in button
        const zoomInButton = document.querySelector('.zoom-in-button');
        if (zoomInButton) zoomInButton.style.display = 'none';
        // hide zoom out button
        const zoomOutButton = document.querySelector('.zoom-out-button');
        if (zoomOutButton) zoomOutButton.style.display = 'none';

        // hide object type selector
        const objectTypeSelector = document.querySelector('.object-type-selector');
        if (objectTypeSelector) objectTypeSelector.style.display = 'none';

        // hide map info bar
        const mapInfoBar = document.querySelector('.map-info-bar');
        if (mapInfoBar) mapInfoBar.style.display = 'none';

        // hide navigation tools
        const navigationTools = document.querySelector('.navigation-tool');
        if (navigationTools) navigationTools.style.display = 'none';

        // show record button
        const recordButton = document.querySelector('.record-tools');
        if (recordButton) recordButton.style.display = 'flex';
        // show record map info bar
        const recordMapInfoBar = document.querySelector('.record-map-info-bar');
        if (recordMapInfoBar) recordMapInfoBar.style.display = 'flex';
        // show recording indicator
        const recordingIndicator = document.querySelector('.recording-indicator');
        if (recordingIndicator) recordingIndicator.style.display = 'flex';

        // Initialize Map2D if not already initialized
        if (!mapRef.current && canvasRef.current) {
          mapRef.current = new Map2D(canvasRef.current);

          // Set mapId and siteId using state values
          mapRef.current.mapId = currentMapId || mapId;
          mapRef.current.siteId = mapData?.siteId || currentSiteId;

          mapRef.current.initialize();
        }

        // Set flag to check current map after SLAM stops
        setShouldCheckCurrentMap(true);

        // Start SLAM and subscribe to map updates
        startSLAMAndSubscribe();
        break;
      case 'download':
        handleDownloadMap();
        break;
      default:
        break;
    }
  };

  const startSLAMAndSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');

      // // Clear existing map and tools before starting SLAM
      // if (mapRef.current) {
      //   console.log('🧹 Clearing existing map and tools before starting SLAM...');
        
      //   // Clear map data
      //   mapRef.current.clearMap();
        
      //   // Clear all tools and their data
      //   if (mapRef.current.toolDrawVirtualWall) {
      //     mapRef.current.toolDrawVirtualWall.clearAllVirtualWalls();
      //   }
      //   if (mapRef.current.toolDrawForbiddenZone) {
      //     mapRef.current.toolDrawForbiddenZone.clearAllForbiddenZones();
      //   }
      //   if (mapRef.current.toolDrawPreferredZone) {
      //     mapRef.current.toolDrawPreferredZone.clearAllPreferredZones();
      //   }
      //   if (mapRef.current.toolDrawUnpreferredZone) {
      //     mapRef.current.toolDrawUnpreferredZone.clearAllunpreferredZones();
      //   }
      //   if (mapRef.current.toolDrawCriticalZone) {
      //     mapRef.current.toolDrawCriticalZone.clearAllcriticalZones();
      //   }
      //   if (mapRef.current.toolDrawPosition) {
      //     mapRef.current.toolDrawPosition.clearAllPositions();
      //   }
      //   if (mapRef.current.toolDrawMarkers) {
      //     mapRef.current.toolDrawMarkers.clearAllMarkers();
      //   }
        
      //   console.log('✅ Map and tools cleared successfully');
      // }

      // Call API to start SLAM
      const response = await apiCallWithRetry(`${SERVER_URL}/api/robot/start-slam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success) {
        // Initialize map after SLAM start
        await initializeMapAfterSLAM();

      } else {
        throw new Error(response.message || 'Failed to start SLAM');
      }
    } catch (error) {
      console.error('Error starting SLAM:', error);
      setError('Failed to start SLAM. Please try again.');
    }
  };

  // Helper function to initialize map after SLAM start
  const initializeMapAfterSLAM = async () => {
    try {
      // Initialize WebSocket connection for map and tf updates
      const ws = new WebSocket(serverConfig.WS_URL);

      ws.onopen = async () => {
        // Store WebSocket reference for cleanup
        if (mapRef.current) {
          mapRef.current.mapWebSocket = ws;

          // Ensure mapId and siteId are set
          if (!mapRef.current.mapId) {
            mapRef.current.mapId = currentMapId || mapId;
          }
          if (!mapRef.current.siteId) {
            mapRef.current.siteId = mapData?.siteId || currentSiteId;
          }

          // Initialize map if not already initialized
          if (!mapRef.current.isInitialized) {
            console.log('mapRef.current.isInitialized', mapRef.current.isInitialized);
            const initSuccess = await mapRef.current.initialize();
            if (!initSuccess) {
              console.error('Failed to initialize map after starting SLAM');
              setError('Failed to initialize map after starting SLAM');
            } else {
              console.log('mapRef isInitialized', mapRef.current.isInitialized);
              // Create robot frame for visualization
              // mapRef.current.createRobotFrame();
              mapRef.current.showRobot();
              if (mapRef.current.robot) {
                mapRef.current.robot.setPathVisible(true);
              }

              // Fit camera to map if map data is available
              if (mapData && mapData.info) {
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
              mapRef.current.robot.setPathVisible(true);
            }
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle map updates
          if (message.type === 'map_update' && mapRef.current) {
            // Handle map initialization asynchronously
            const handleMapUpdate = async () => {
              // Ensure map is initialized before updating
              if (!mapRef.current.isInitialized) {
                const initSuccess = await mapRef.current.initialize();
                if (!initSuccess) {
                  console.error('Failed to initialize map for update');
                  return;
                }
              }

              // Update map with SLAM data - pass only the data portion
              mapRef.current.updateMapFromSLAM(message.data);

              // Fit camera to the new map data
              setTimeout(() => {
                if (mapRef.current && mapRef.current.isInitialized) {
                  mapRef.current.fitCameraToMap();
                }
              }, 500);
            };

            handleMapUpdate();
          }
          // Handle robot TF updates
          else if (message.type === 'robot_tf' && mapRef.current) {
            const robotTFs = message.data;
            if (robotTFs && robotTFs.transforms) {
              if (mapRef.current.robot) {
                mapRef.current.robot.setTF(robotTFs.transforms);
              }
            } else {
              console.warn('Invalid TF data format:', robotTFs);
            }
          }
          // Handle laser scan updates
          else if (message.type === 'scan_update' && mapRef.current) {
            const scanData = message.data;

            // Check if map has data before processing scan
            if (mapRef.current.mapMesh && mapRef.current.isInitialized) {
              if (mapRef.current.robot) {
                mapRef.current.robot.updateScan(scanData);
              }
            } else {
              console.warn('Cannot process scan - map not initialized or no map data');
            }
          }
          // Handle odometry updates from joystick
          else if (message.type === 'odom_update' && mapRef.current) {
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
              console.warn('Cannot process odom - map not initialized');
            }
          }
        } catch (error) {
          console.error('WebSocket message processing error:', {
            error: error.message,
            stack: error.stack,
            data: event.data
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Lost connection to server. Please refresh the page.');
      };

      ws.onclose = () => {
        // Try to reconnect if connection was lost
        if (mapRef.current && mapRef.current.displayRobot) {
          setTimeout(() => {
            startSLAMAndSubscribe();
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Error initializing map after SLAM:', error);
      setError('Failed to initialize map after SLAM start');
    }
  };

  // start websocket after navigation
  const startWebsocketAfterNavigation = async () => {
    try {
      // Initialize WebSocket connection for map and tf updates
      const ws = new WebSocket(serverConfig.WS_URL);

      ws.onopen = async () => {
        // Store WebSocket reference for cleanup
        if (mapRef.current) {
          mapRef.current.mapWebSocket = ws;

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              // Handle robot TF updates
              if (message.type === 'robot_tf' && mapRef.current) {
                const robotTFs = message.data;

                if (robotTFs && robotTFs.transforms) {
                  if (mapRef.current.robot) {
                    mapRef.current.robot.setTF(robotTFs.transforms);
                  }
                }
              }
              // Handle laser scan updates
              else if (message.type === 'scan_update' && mapRef.current) {
                const scanData = message.data;

                // Check if map has data before processing scan
                if (mapRef.current.mapMesh && mapRef.current.isInitialized) {
                  if (mapRef.current.robot) {
                    mapRef.current.robot.updateScan(scanData);
                  }
                }
              }
              // Handle nav global path planning updates
              else if (message.type === 'nav_global_path_planning' && mapRef.current) {
                const pathData = message.data;
                if (mapRef.current.robot) {
                  mapRef.current.robot.updatePath(pathData);
                }
              }

            } catch (error) {
              console.error('WebSocket message processing error:', {
                error: error.message,
                stack: error.stack,
                data: event.data
              });
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Lost connection to server. Please refresh the page.');
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
          };

        }
      }
    } catch (error) {
      console.error('Error starting websocket after navigation:', error);
      setError('Failed to start websocket after navigation');
    }
  };

  const handlePauseRecording = async () => {
    try {
      // Remove robot frame
      if (mapRef.current) {
        // enable map click handler
        mapRef.current.initMapClickHandler();
        // enable mouse mode selection
        mapRef.current.initMouseModeSelection();

        // Set up position dialog callback
        mapRef.current.setPositionDialogCallback(handleShowPositionDialog);

        // Set up markers dialog callback
        mapRef.current.setMarkersDialogCallback(handleShowMarkersDialog);

        // Set up pose estimate callback
        mapRef.current.setPoseEstimateCallback(handleInitPoseEstimate);
        mapRef.current.setNavGoalCallback(handleNavGoal);

        mapRef.current.hideRobot();
        if (mapRef.current.robot) {
          mapRef.current.robot.setPathVisible(false);
          mapRef.current.robot.dispose();
          mapRef.current.robot = null;
        }
      }
      // Close WebSocket connection properly
      if (mapRef.current && mapRef.current.mapWebSocket) {
        const ws = mapRef.current.mapWebSocket;
        mapRef.current.mapWebSocket = null; // Clear reference first
        ws.close(); // Then close connection
      }

      const token = localStorage.getItem('token');

      // Call API to stop SLAM
      const response = await apiCallWithRetry(`${SERVER_URL}/api/robot/pause-slam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success) {
        // save map data - use state values and fallbacks
        const finalMapId = currentMapId || mapRef.current?.mapId || mapId;
        let finalSiteId = currentSiteId;


        if (!finalSiteId) {
          console.error('Cannot save map data - siteId is undefined');
          return;
        }

        if (finalMapId && finalSiteId) {
          const requestBody = {
            mapId: finalMapId,
            siteId: finalSiteId
          };

          const responseSaveMap = await apiCallWithRetry(`${SERVER_URL}/api/robot/save-all-config`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            data: requestBody
          });

          if (!responseSaveMap.success) {
            console.error('Failed to save map data:', responseSaveMap.message);
          }

          const responseStopSLAM = await apiCallWithRetry(`${SERVER_URL}/api/robot/stop-slam`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!responseStopSLAM.success) {
            console.error('Failed to stop SLAM:', responseStopSLAM.message);
          }
          else {
            console.log('SLAM stopped successfully');
          }
        } else {
          console.error('Cannot save map data - missing mapId or siteId:', {
            mapId: finalMapId,
            siteId: finalSiteId
          });
        }

        // Hide recording UI elements
        const recordMapInfoBar = document.querySelector('.record-map-info-bar');
        const recordingIndicator = document.querySelector('.recording-indicator');
        if (recordMapInfoBar) recordMapInfoBar.style.display = 'none';
        if (recordingIndicator) recordingIndicator.style.display = 'none';

        // Hide record button (pause button)
        const recordButton = document.querySelector('.record-tools');
        if (recordButton) recordButton.style.display = 'none';

        // Show all other buttons except more button
        const zoomButton = document.querySelector('.zoom-tools .tool-button');
        if (zoomButton) zoomButton.style.display = 'flex';
        const panButton = document.querySelector('.pan-tools .tool-button');
        if (panButton) panButton.style.display = 'flex';

        const saveButton = document.querySelector('.save-tools .tool-button');
        if (saveButton) saveButton.style.display = 'flex';
        // enable save button
        setIsDisabled(false);


        // Show reset view button
        const resetViewButton = document.querySelector('.reset-view-button');
        if (resetViewButton) resetViewButton.style.display = 'flex';

        // Show zoom in button
        const zoomInButton = document.querySelector('.zoom-in-button');
        if (zoomInButton) zoomInButton.style.display = 'flex';

        // Show zoom out button
        const zoomOutButton = document.querySelector('.zoom-out-button');
        if (zoomOutButton) zoomOutButton.style.display = 'flex';

        // Show object type selector
        setShowObjectTypeSelector(true);
        const objectTypeSelector = document.querySelector('.object-type-selector');
        if (objectTypeSelector) objectTypeSelector.style.display = 'flex';

        // Show map info bar
        const mapInfoBar = document.querySelector('.map-info-bar');
        if (mapInfoBar) mapInfoBar.style.display = 'flex';

        // Show navigation tools
        const navigationTools = document.querySelector('.navigation-tool');
        if (navigationTools) navigationTools.style.display = 'flex';

        // Only check current map if shouldCheckCurrentMap is true (record-append mode)
        if (shouldCheckCurrentMap) {
        try {
          // Get current site id from server
          const currentSiteId_ = await getCurrentSiteId();

          if (currentSiteId_ == null) {
            return;
          }

          // Validate siteId before passing to getCurrentMapId
          if (typeof currentSiteId_ !== 'number' && typeof currentSiteId_ !== 'string') {
            console.error('checkCurrentMap: Invalid siteId type:', typeof currentSiteId_, 'value:', currentSiteId_);
            return;
          }

          const currentMapId_ = await getCurrentMapId(currentSiteId_);
          console.log('currentMapId_', currentMapId_);
          if (currentMapId_ == null) {
              // Show dialog when no current map is set
              setShowConfirm(true);
              setConfirmData({
                title: 'No Current Map',
                message: 'No current map has been set for this site. Do you want to set this map as the current map?',
                onConfirm: async () => {
                  setShowConfirm(false);
                  try {
                    await changeCurrentMap(currentSiteId_);
                    setIsNotNavGoalMode(false);
                  } catch (error) {
                    console.error('checkCurrentMap: Error in onConfirm:', error);
                  }
                },
                onCancel: () => {
                  setShowConfirm(false);
                }
              });
            return;
          }

          // Validate currentMapId_ structure
          if (!currentMapId_ || typeof currentMapId_ !== 'object' || !currentMapId_.hasOwnProperty('mapId')) {
            console.error('checkCurrentMap: Invalid currentMapId_ structure:', currentMapId_);
            return;
          }

          // Validate mapId values before comparison
            if (!mapId) {
              console.error('checkCurrentMap: Invalid mapId from URL:', mapId);
              return;
            }

            // Handle case when serverMapId is null (no current map set)
            if (!currentMapId_.mapId) {
              console.log('checkCurrentMap: No current map set (serverMapId is null)');
              // Show dialog when no current map is set
              setShowConfirm(true);
              setConfirmData({
                title: 'No Current Map',
                message: 'No current map has been set for this site. Do you want to set this map as the current map?',
                onConfirm: async () => {
                  setShowConfirm(false);
                  try {
                    await changeCurrentMap(currentSiteId_);
                    setIsNotNavGoalMode(false);
                  } catch (error) {
                    console.error('checkCurrentMap: Error in onConfirm:', error);
                  }
                },
                onCancel: () => {
                  setShowConfirm(false);
                }
            });
            return;
          }
            if (currentMapId_.mapId == mapId) {
            console.log('mapId is the same as the server mapId');
            setIsNotNavGoalMode(false);
          }
          else {
            console.log('mapId is not the same as the server mapId');
            // Show dialog to user
            setShowConfirm(true);
            setConfirmData({
              title: 'Change map?',
              message: 'This map is not the current map. Do you want to change map?',
              onConfirm: async () => {
                setShowConfirm(false);
                try {
                  await changeCurrentMap(currentSiteId_);
                  setIsNotNavGoalMode(false);
                } catch (error) {
                  console.error('checkCurrentMap: Error in onConfirm:', error);
                }
              },
              onCancel: () => {
                setShowConfirm(false);
              }
            });
          }
        } catch (error) {
          console.error('Error pausing SLAM:', error);
          setError('Failed to pause SLAM. Please try again.');
          }
        } else {
          // For record-overwrite mode, just set navigation mode without checking current map
          setIsNotNavGoalMode(false);
        }



      } else {
        throw new Error(response.message || 'Failed to pause SLAM');
      }
    } catch (error) {
      console.error('Error pausing SLAM:', error);
      setError('Failed to pause SLAM. Please try again.');
    }
  };


  useEffect(() => {
    if (mapData && canvasRef.current) {
      console.log('Initializing map with data:', mapData);
      if (!isInitialized) {
      initializeMap();
        setIsInitialized(true);
    }
    }
  }, [mapData]); // Remove canvasRef.current from dependency to prevent unnecessary re-initialization

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreButtonRef.current && !moreButtonRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Reset navigationMode when component unmounts
      setNavigationMode(false);
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && mapRef.current.isInitialized && canvasRef.current) {
        // Delay resize handling to ensure DOM has updated
        setTimeout(() => {
          if (mapRef.current && mapRef.current.canvas) {
            // Update canvas size to match container
            const container = canvasRef.current;
            const rect = container.getBoundingClientRect();
            const adjustedHeight = rect.height - 60; // Trừ đi 60px cho margin-top

            // Update canvas dimensions
            mapRef.current.canvas.width = rect.width;
            mapRef.current.canvas.height = adjustedHeight;

            // Update camera and viewport
            if (mapRef.current.camera) {
              mapRef.current.camera.aspect = rect.width / adjustedHeight;
              mapRef.current.camera.updateProjectionMatrix();
            }

            // Update renderer size
            if (mapRef.current.renderer) {
              mapRef.current.renderer.setSize(rect.width, rect.height);
            }

            // Re-render the scene
            if (mapRef.current.render) {
              mapRef.current.render();
            }
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const initializeMap = async () => {

    // first, dispose the old map
    if (mapRef.current) {
      mapRef.current.dispose();
      setNavigationMode(false); // Reset navigationMode when old map is disposed
    }
    // check map data
    if (!mapData || !mapData.siteId) {
      console.error('Missing required map data:', mapData);
      setError('Invalid map data: missing site ID');
      return;
    }

    if (!canvasRef.current) {
      console.error('Map container not found');
      setError('Map container not found');
      return;
    }

    try {
      mapRef.current = new Map2D(canvasRef.current);


      console.log('mapData', mapData);
      // Set the site and map IDs
      mapRef.current.siteId = mapData.siteId;
      mapRef.current.mapId = mapData.id;


      // Initialize the map
      const initSuccess = await mapRef.current.initialize();

      if (!initSuccess || !mapRef.current.isInitialized) {
        throw new Error('Failed to initialize map');
      }

      if (mapData.info && mapData.mapData) {

        // Update map after initialization
        requestAnimationFrame(() => {
          if (mapRef.current && mapRef.current.isInitialized) {
            mapRef.current.setMapData(mapData);
            mapRef.current.fitCameraToMap();
          }
        });
      } else {
        console.error('Missing map data:', mapData);
      }

      // Initialize additional handlers after successful initialization
      if (mapRef.current.isInitialized) {
        mapRef.current.initMapClickHandler();
        mapRef.current.initMouseModeSelection();

        // Set up position dialog callback
        mapRef.current.setPositionDialogCallback(handleShowPositionDialog);

        // Set up markers dialog callback
        mapRef.current.setMarkersDialogCallback(handleShowMarkersDialog);

        // Set up pose estimate callback
        mapRef.current.setPoseEstimateCallback(handleInitPoseEstimate);
        mapRef.current.setNavGoalCallback(handleNavGoal);

        // Sync navigationMode state
        setNavigationMode(mapRef.current.navigationMode || false);

        // Load positions after map initialization
        if (mapRef.current) {
          console.log('loadPointsFromDatabase...');
          await mapRef.current.loadPointsFromDatabase();
          await mapRef.current.loadForbiddenZonesFromDatabase();
          await mapRef.current.loadPreferredZonesFromDatabase();
          await mapRef.current.loadUnpreferredZonesFromDatabase();
          await mapRef.current.loadCriticalZonesFromDatabase();
          await mapRef.current.loadVirtualWallsFromDatabase();
          await mapRef.current.loadMarkersFromDatabase();

        }
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try again.');
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
        setNavigationMode(false); // Reset navigationMode when map is disposed due to error
      }
    }
  };

  const handleGoBack = () => {
    if (mapRef.current) {
      mapRef.current.dispose();
      setNavigationMode(false); // Reset navigationMode when map is disposed
    }
    navigate('/setup/maps');
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.fitCameraToMap();
      // Reset only zoom and pan button states
      const zoomButton = document.querySelector('.zoom-tools .tool-button');
      const panButton = document.querySelector('.pan-tools .tool-button');
      if (zoomButton) zoomButton.classList.remove('active');
      if (panButton) panButton.classList.remove('active');
      setMapInteractionMode('none');
    }
  };

  const handlePan = () => {
    handleMapInteraction('pan');
  };


  // start navigation
  const startNavigation = async () => {

    console.log('Starting navigation with mapId:', currentMapId, 'and siteId:', currentSiteId);
    const token = localStorage.getItem('token');
    const response = await apiCallWithRetry(`${SERVER_URL}/api/robot/start-navigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        mapId: currentMapId,
        siteId: currentSiteId
      }
    });


    if (response.success) {
      console.log('Navigation started successfully');
      return true;
    } else {
      console.error('Failed to start navigation:', response.message);
      return false;
    }
  };

  // stop navigation
  const stopNavigation = async (savePose = false) => {
    const token = localStorage.getItem('token');
    const response = await apiCallWithRetry(`${SERVER_URL}/api/robot/stop-navigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        mapId: currentMapId,
        savePose: savePose
      }
    });

    if (response.success) {
      console.log('Navigation stopped successfully');
      return true;
    } else {
      console.error('Failed to stop navigation:', response.message);
      return false;
    }
  };

  const handleNavigate = () => {
    if (mapRef.current) {
      const navigationTools = document.querySelector('.navigation-tool .tool-button');
      if (navigationTools) {
        if (navigationTools.classList.contains('active')) {

          showConfirmDialog('Are you sure you want to stop navigation and save pose?').then(result => {
            if (result) {
              // stop navigation
              stopNavigation(true).then(result => {
                if (result) {
                  console.log('Navigation stopped successfully');
                  navigationTools.classList.remove('active');
                  mapRef.current.hideNavigateToolbar();
                  if (mapRef.current) {
                    // set navigation mode
                    mapRef.current.navigationMode = false;
                    setNavigationMode(false); // Sync state

                    if (mapRef.current.robot) {
                      mapRef.current.hideRobot();
                      mapRef.current.robot.dispose();
                      mapRef.current.robot = null;
                    }
                    if (mapRef.current.mapWebSocket) {
                      mapRef.current.mapWebSocket.close();
                    }
                  }
                } else {
                  console.error('Failed to stop navigation');
                }
              });
            }
          });
        }
        else {
          navigationTools.classList.add('active');
    
              // start navigation
              startNavigation().then(result => {
                if (result) {
                  console.log('Navigation started successfully');
                  // set navigation mode
                  mapRef.current.navigationMode = true;
                  setNavigationMode(true); // Sync state
                  // show navigate toolbar
                  mapRef.current.showNavigateToolbar();
                  // start websocket
                  if (mapRef.current.robot) {
                    // show robot
                    mapRef.current.showRobot();
                    // show global path planning
                    mapRef.current.robot.setGlobalPathPlanningVisible(true);
                    // hide path
                    mapRef.current.robot.setPathVisible(false);
                  }
                  else {
                    console.log('Robot is not initialized');
                    mapRef.current.loadRobotSettings();
                    if (mapRef.current.robot) {
                      // show robot
                      mapRef.current.showRobot();
                      // show global path planning
                      mapRef.current.robot.setGlobalPathPlanningVisible(true);
                      // hide path
                      mapRef.current.robot.setPathVisible(false);
                    }
                  }
                  startWebsocketAfterNavigation();

                } else {
                  console.error('Failed to start navigation');
                }
              });
       

        }
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  // Map interaction state management
  const [mapInteractionMode, setMapInteractionMode] = useState('none'); // 'none', 'zoom', 'pan'

  // Centralized map interaction handler for zoom and pan only
  const handleMapInteraction = (mode) => {
    if (!mapRef.current) return;

    // Reset only zoom and pan button states
    const zoomButton = document.querySelector('.zoom-tools .tool-button');
    const panButton = document.querySelector('.pan-tools .tool-button');
    if (zoomButton) zoomButton.classList.remove('active');
    if (panButton) panButton.classList.remove('active');

    // Handle mode switching
    switch (mode) {
      case 'zoom':
        if (mapRef.current.setZoomMode()) {
          if (zoomButton) zoomButton.classList.add('active');
          setMapInteractionMode('zoom');
        } else {
          setMapInteractionMode('none');
        }
        break;
      
      case 'pan':
        if (mapRef.current.setPanMode()) {
          if (panButton) panButton.classList.add('active');
          setMapInteractionMode('pan');
        } else {
          setMapInteractionMode('none');
        }
        break;
      
      case 'none':
      default:
        setMapInteractionMode('none');
        break;
    }
  };



  const handleZoom = () => {
    handleMapInteraction('zoom');
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleObjectTypeSelect = (objectType) => {
    // ==================================================================
    // ==                    GIAI ĐOẠN 1: KIỂM TRA THAY ĐỔI           ==
    // ==================================================================
    
    // Kiểm tra xem selectedObjectType có thay đổi không
    if (selectedObjectType === objectType) {
      console.log('Object type unchanged:', objectType);
      setIsDropdownOpen(false);
      return; // Không làm gì nếu không thay đổi
    }
    
    console.log('Object type changed from', selectedObjectType, 'to', objectType);
    
    // ==================================================================
    // ==                    GIAI ĐOẠN 2: CANCEL VÀ ẨN TOOLBAR CŨ     ==
    // ==================================================================
    
    // Chỉ cancel và ẩn toolbar của object type cũ đã chọn
    if (mapRef.current) {
      // Cancel và ẩn PositionToolbar nếu đang active
      if (selectedObjectType === 'positions' && mapRef.current.positionToolbar) {
        mapRef.current.hidePositionToolbar();
        mapRef.current.positionToolbar.cancelChangesPosition();
      }
      
      // Cancel và ẩn MarkersToolbar nếu đang active
      if (selectedObjectType === 'markers' && mapRef.current.markersToolbar) {
        mapRef.current.hideMarkersToolbar();
        mapRef.current.markersToolbar.cancelChangesMarker();
      }
      
      // Cancel và ẩn VirtualWallToolbar nếu đang active
      if (selectedObjectType === 'virtual-walls' && mapRef.current.wallToolbar) {
        mapRef.current.hideVirtualWallToolbar();
        mapRef.current.wallToolbar.cancelChangesWall();
      }
      
      // Cancel và ẩn ForbiddenZoneToolbar nếu đang active
      if (selectedObjectType === 'forbidden-zones' && mapRef.current.forbiddenZoneToolbar) {
        mapRef.current.hideForbiddenZoneToolbar();
        mapRef.current.forbiddenZoneToolbar.cancelChangesForbiddenZone();
      }

      // Cancel và ẩn PreferredZoneToolbar nếu đang active
      if (selectedObjectType === 'preferred-zones' && mapRef.current.preferredZoneToolbar) {
        mapRef.current.hidePreferredZoneToolbar();
        mapRef.current.preferredZoneToolbar.cancelChangesPreferredZone();
      }

      // Cancel và ẩn UnpreferredZoneToolbar nếu đang active
      if (selectedObjectType === 'unpreferred-zones' && mapRef.current.unpreferredZoneToolbar) {
        mapRef.current.hideUnpreferredZoneToolbar();
        mapRef.current.unpreferredZoneToolbar.cancelChangesUnpreferredZone();
      }

      // Cancel và ẩn CriticalZoneToolbar nếu đang active
      if (selectedObjectType === 'critical-zones' && mapRef.current.criticalZoneToolbar) {
        mapRef.current.hideCriticalZoneToolbar();
        mapRef.current.criticalZoneToolbar.cancelChangesCriticalZone();
      }
      
      // Cancel và ẩn FloorToolbar nếu đang active
      if (selectedObjectType && selectedObjectType.startsWith('floor') && mapRef.current.floorToolbar) {
        mapRef.current.hideFloorToolbar();
        mapRef.current.floorToolbar.cancelChangesFloor();
      }
    }
    
    // Ẩn wall tools cũ nếu đang active
    if (selectedObjectType === 'walls') {
      const wallTools = document.querySelector('.wall-tools');
      if (wallTools) {
        wallTools.style.display = 'none';
      }
    }
    
    // Reset markers toolbar state nếu đang active
    if (selectedObjectType === 'markers') {
      setShowMarkersToolbar(false);
    }
    
    // ==================================================================
    // ==                    GIAI ĐOẠN 3: HIỂN THỊ TOOLBAR MỚI        ==
    // ==================================================================
    
    // Cập nhật state
    setSelectedObjectType(objectType);
    setIsDropdownOpen(false);
    mapRef.current.object_type = objectType;
    
    // Hiển thị toolbar tương ứng với object type mới
      if (mapRef.current) {
      if (objectType === 'walls') {
        mapRef.current.showWallToolbar();
      // wallTools.style.display = 'flex';
      // const wallActionsContainer = document.getElementById('actions-container');
      // if (wallActionsContainer) {
      //   wallActionsContainer.style.display = 'none';
      // }
    }
    
    // Handle position toolbar
    if (objectType === 'positions') {
        mapRef.current.showPositionToolbar();
    }
    
    // Handle virtual wall toolbar
    if (objectType === 'virtual-walls') {
        mapRef.current.showVirtualWallToolbar();
    }
    
    // Handle forbidden zone toolbar
    if (objectType === 'forbidden-zones') {
        mapRef.current.showForbiddenZoneToolbar();
      }

      // Handle preferred zone toolbar
      if (objectType === 'preferred-zones') {
        mapRef.current.showPreferredZoneToolbar();
      }

      // Handle unpreferred zone toolbar
      if (objectType === 'unpreferred-zones') {
        mapRef.current.showUnpreferredZoneToolbar();
      }

      // Handle critical zone toolbar
      if (objectType === 'critical-zones') {
        mapRef.current.showCriticalZoneToolbar();
    }
    
    // Handle markers toolbar
    if (objectType === 'markers') {
        mapRef.current.showMarkersToolbar();
      setShowMarkersToolbar(true);
    }
    
    // Handle floor toolbar
    if (objectType.startsWith('floor')) {
        mapRef.current.showFloorToolbar();
      }
    }
    
    setShowObjectTypeSelector(true);

    // hide map info bar
    const mapInfoBar = document.querySelector('.map-info-bar');
    if (mapInfoBar) {
      mapInfoBar.style.display = 'none';
    }
  };


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleObjectTypeSelector = () => {
    setShowObjectTypeSelector(!showObjectTypeSelector);
    // Close dropdown if it's open when hiding selector
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };


  // Thêm xử lý cho nút change map
  const changeMapBtn = document.getElementById('change-map');
  if (changeMapBtn) {
    changeMapBtn.addEventListener('click', async () => {
      try {
        if (mapRef.current && mapRef.current.currentRotation !== 0) {
          // Hiển thị confirm dialog
          const confirmRotate = confirm('Do you want to save the current map rotation?');
          if (confirmRotate) {
            // Rotate map
            await mapRef.current.rotateMap();

            // Save map sau khi rotate
            const saveResult = await this.saveMap();
            if (saveResult) {
              this.showNotification('success', 'Map rotation and configuration saved successfully');

              mapRef.current.setEnableRotateMap(false);

              this.setMapToolsViewState('edit-map');
              // stop subscriber map  
              mapRef.current.stopMapSubscriber();
              // start subscriber map
              mapRef.current.startMapSubscriber();
            }
          }
        }
        else if (mapRef.current && mapRef.current.currentRotation === 0) {
          // Save map sau khi rotate
          const saveResult = await this.saveMap();
          if (saveResult) {
            this.showNotification('success', 'Map saved successfully');
            this.setMapToolsViewState('edit-map');
            // stop subscriber map  
            mapRef.current.stopMapSubscriber();
            // start subscriber map
            mapRef.current.startMapSubscriber();
          }
        }
      } catch (error) {
        console.error('Error handling map:', error);
        this.showNotification('error', 'Failed to save map: ' + error.message);
      }
    });
  }

  function isArrayOfVector3(array) {
    return Array.isArray(array) && array.every(item => item instanceof THREE.Vector3);
  }
  // Xử lý cho nút apply changes
  const applyChangesBtn = document.getElementById('map-apply-changes-button');
  if (applyChangesBtn) {
    applyChangesBtn.addEventListener('click', () => {
      // hiển thị apply changes button
      applyChangesBtn.style.display = 'none';
      const saveMapBtn = document.getElementById('map-save-button');
      if (saveMapBtn) {
        setIsDisabled(false);
      }
      //saveMapBtn.disabled = false;
      // apply map tool
      if (mapRef.current) {
        mapRef.current.applyMapTool();
      }
      // xóa các active của các button
      const toolButtons = document.querySelectorAll('.wall-tools .tool-button');
      toolButtons.forEach(btn => btn.classList.remove('active'));
      // xử lý cho  draw line settings container
      const drawLineSettingsContainer = document.querySelector('.wall-draw-line-container');
      if (drawLineSettingsContainer) {
        if (drawLineSettingsContainer.style.display == 'flex') {
          drawLineSettingsContainer.style.display = 'none';
        }
        // remove active class các button trong draw line settings container
        const toolButtons = document.querySelectorAll('.wall-draw-line-container .tool-button');
        toolButtons.forEach(btn => btn.classList.remove('active'));
      }
      // xử lý cho slider 
      const slider = document.getElementById('wall-draw-line-slider');
      if (slider) {
        if (slider.style.display == 'flex') {
          slider.style.display = 'none';
        }
      }
      // xử lý cho forbidden zones settings container
      const forbiddenZonesBtn = document.getElementById('map-forbidden-zones-button');
      if (forbiddenZonesBtn) {
        if (forbiddenZonesBtn.classList.contains('active')) {
          forbiddenZonesBtn.classList.remove('active');
        }

      }
      // xử lý cho eraser settings container
      const eraserSettingsContainer = document.querySelector('.wall-eraser-container');
      if (eraserSettingsContainer) {
        if (eraserSettingsContainer.style.display == 'flex') {
          eraserSettingsContainer.style.display = 'none';
        }
      }
      // xử lý cho slider
      const sliderEraser = document.getElementById('eraser-size-slider');
      if (sliderEraser) {
        if (sliderEraser.style.display == 'flex') {
          sliderEraser.style.display = 'none';
        }
      }
    });
  }



  const validatePointName = (value) => {

    //  console.log("validatePointName",value);
    //console.log("mapPositionExist",mapPositionExists);
    setpointName(value);
    if (mapPositionExists.includes(value.trim())) {
      seterrorExist(" The point name already exists. Please choose a different name.");
    } else {
      seterrorExist("");
    }
  };

  // Save possition to map
  const handleCreatePosition = async () => {
    // This will now be handled by the PositionDialog component
    console.log('Position creation will be handled by PositionDialog');
  };

  const handlePositionDialogConfirm = async (positionData) => {
    try {
      // Validate position data
      if (!positionData.name || !positionData.name.trim()) {
        seterrorExist('Tên điểm không được để trống');
        return;
      }

      // Create position data for server
      const positionDataForCreate = {
        name: positionData.name,
        type: positionData.type,
        position: positionData.position,
        orientation: positionData.orientation
      };

      // Check if we're in edit mode or create mode
      if (positionDialogMode === 'edit') {
        // Update existing position
        const result = mapRef.current.toolDrawPosition.updatePosition(positionDataForCreate);

        if (result) {
          console.log('Position updated successfully:', result);

          // Close dialog
          setShowPositionDialog(false);
          setPendingPosition(null);
          seterrorExist('');

          // Hide edit actions and show apply/cancel buttons
          if (mapRef.current.positionToolbar) {
            mapRef.current.positionToolbar.hideEditActions();
            mapRef.current.positionToolbar.showActionButtons();
          }
        } else {
          console.error('Failed to update position');
          seterrorExist('Lỗi khi cập nhật position');
        }
      } else {
        // Create new position
        const result = mapRef.current.toolDrawPosition.createPosition(positionDataForCreate);

        if (result) {
          console.log('Position created successfully:', result);

          // Close dialog
          setShowPositionDialog(false);
          setPendingPosition(null);
          seterrorExist('');

          // Reload positions if needed
          // await loadMapPoint();
        } else {
          console.error('Failed to create position');
          seterrorExist('Lỗi khi tạo position');
        }
      }

    } catch (error) {
      console.error('Error handling position:', error);
      seterrorExist('Lỗi kết nối server');
    }
  };

  const handlePositionDialogClose = () => {
    setShowPositionDialog(false);
    setPendingPosition(null);
    seterrorExist('');
  };

  const handleUseRobotPosition = () => {
    if (mapRef.current && mapRef.current.robotMesh) {
      const robotPosition = mapRef.current.robotMesh.position;
      const robotRotation = mapRef.current.robotMesh.rotation;

      // Update pending position with robot position
      setPendingPosition({
        position: {
          x: robotPosition.x,
          y: robotPosition.y,
          z: robotPosition.z
        },
        orientation: {
          x: 0,
          y: 0,
          z: robotRotation.z,
          w: 1
        }
      });
    }
  };



  const handleMarkersDialogClose = () => {
    // Close dialog
    setShowMarkersDialog(false);
    setPendingMarker(null);
    seterrorExist('');
  };



  // Callback function to handle pose estimate from NavigateToolbar
  const handleInitPoseEstimate = async (poseEstimateData) => {

    try {
      console.log('EditMaps: handleInitPoseEstimate called with data:', poseEstimateData);

      if (!poseEstimateData) {
        console.warn('EditMaps: No pose estimate data provided');
        return;
      }

      const { position, orientation } = poseEstimateData;

      if (!position || !orientation) {
        console.warn('EditMaps: Invalid pose estimate data - missing position or orientation');
        return;
      }

      // Validate position data
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        console.warn('EditMaps: Invalid position data');
        return;
      }

      // Validate orientation data (quaternion)
      if (typeof orientation.x !== 'number' || typeof orientation.y !== 'number' ||
        typeof orientation.z !== 'number' || typeof orientation.w !== 'number') {
        console.warn('EditMaps: Invalid orientation data');
        return;
      }

      console.log('EditMaps: Pose estimate validated successfully:', {
        position: { x: position.x, y: position.y, z: position.z },
        orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w }
      });

      // Call API to publish pose estimate to ROS
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${SERVER_URL}/api/robot/init-pose-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          poseEstimate: {
            position: {
              x: position.x,
              y: position.y,
              z: position.z || 0.0
            },
            orientation: {
              x: orientation.x,
              y: orientation.y,
              z: orientation.z,
              w: orientation.w
            }
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('EditMaps: Pose estimate published to ROS successfully');

        // Show success message
        setMessageDialogConfig({
          title: 'Pose Estimate Applied',
          message: `Robot pose has been updated to: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`,
          onConfirm: () => setShowMessageDialog(false),
          onClose: () => setShowMessageDialog(false)
        });
        setShowMessageDialog(true);
      } else {
        throw new Error(result.message || 'Failed to publish pose estimate');
      }

    } catch (error) {
      console.error('EditMaps: Error handling pose estimate:', error);

      // Show error message
      setMessageDialogConfig({
        title: 'Error',
        message: `Failed to apply pose estimate: ${error.message}`,
        onConfirm: () => setShowMessageDialog(false),
        onClose: () => setShowMessageDialog(false)
      });
      setShowMessageDialog(true);
    }
  };

  // Callback function to handle navigation goal from NavigateToolbar
  const handleNavGoal = async (navGoalData) => {

    try {
      console.log('EditMaps: handleNavGoal called with data:', navGoalData);

      if (!navGoalData) {
        console.warn('EditMaps: No navigation goal data provided');
        return;
      }

      const { position, orientation } = navGoalData;

      if (!position || !orientation) {
        console.warn('EditMaps: Invalid navigation goal data - missing position or orientation');
        return;
      }

      // Validate position data
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        console.warn('EditMaps: Invalid position data');
        return;
      }

      // Validate orientation data (quaternion)
      if (typeof orientation.x !== 'number' || typeof orientation.y !== 'number' ||
        typeof orientation.z !== 'number' || typeof orientation.w !== 'number') {
        console.warn('EditMaps: Invalid orientation data');
        return;
      }

      console.log('EditMaps: Navigation goal validated successfully:', {
        position: { x: position.x, y: position.y, z: position.z },
        orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w }
      });

      // Call API to publish navigation goal to ROS
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${SERVER_URL}/api/robot/nav-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          navGoal: {
            position: {
              x: position.x,
              y: position.y,
              z: position.z || 0.0
            },
            orientation: {
              x: orientation.x,
              y: orientation.y,
              z: orientation.z,
              w: orientation.w
            }
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('EditMaps: Navigation goal published to ROS successfully');

        // Show success message
        setMessageDialogConfig({
          title: 'Navigation Goal Set',
          message: `Navigation goal has been set to: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`,
          onConfirm: () => setShowMessageDialog(false),
          onClose: () => setShowMessageDialog(false)
        });
        setShowMessageDialog(true);
      } else {
        throw new Error(result.message || 'Failed to publish navigation goal');
      }

    } catch (error) {
      console.error('EditMaps: Error handling navigation goal:', error);

      // Show error message
      setMessageDialogConfig({
        title: 'Error',
        message: `Failed to set navigation goal: ${error.message}`,
        onConfirm: () => setShowMessageDialog(false),
        onClose: () => setShowMessageDialog(false)
      });
      setShowMessageDialog(true);
    }
  };

  // Callback function to show position dialog from PositionToolbar
  const handleShowPositionDialog = (pendingPosition, mode) => {
    setPendingPosition(pendingPosition);
    setPositionDialogMode(mode);
    setShowPositionDialog(true);
  };

  // Callback function to show markers dialog from MarkersToolbar
  const handleShowMarkersDialog = (pendingMarker, mode) => {
    if (mode === undefined) {
      return;
    }
    console.log('handleShowMarkersDialog called with mode:', mode);
    setPendingMarker(pendingMarker);
    setMarkersDialogMode(mode);
    setShowMarkersDialog(true);
  };
  const handleSaveMap = async () => {
    if (mapRef.current) {
        try {
          console.log("Chuẩn bị save map");

        // Use the new saveToDatabase method from Map_2D
        const result = await mapRef.current.saveToDatabase();

        if (result.success) {
                  setShowSuccessDialog(true);
          console.log('Map saved successfully');
                } else {
          throw new Error(result.message || 'Failed to save map');
        }

                    } catch (error) {
        console.error('Error saving map:', error);
        // Hiển thị dialog lỗi thay vì setError
        setMessageData({
          title: "Save Map Error",
          message: `Failed to save map: ${error.message}`,
          onConfirm: null,
          onClose: () => setShowMessage(false)
        });
        setShowMessage(true);
      }

      hideLoadingSpinner();
    }
  };

  const loadingSpinner = document.getElementById('loadingSpinner');


  const hideLoadingSpinner = () => {
    setShowLoadingSpinner(false);
  };

  const closePositionsPopupDialog = document.getElementById('close-positions-popup-dialog');
  if (closePositionsPopupDialog) {
    closePositionsPopupDialog.addEventListener('click', () => {
      const positionsPopupDialog = document.getElementById('positions-popup-dialog');
      if (positionsPopupDialog) {
        positionsPopupDialog.style.display = 'none';
      }
      const overlay = document.getElementById('overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
  }



  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading map data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={loadMapData}>
          Retry Loading
        </button>
        <button className="go-back-button" onClick={handleGoBack}>
          Go Back
        </button>
      </div>
    );
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Message to display
   * @param {string} title - Dialog title (optional)
   * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
   */
  const showConfirmDialog = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setConfirmData({
        title: title,
        message: message,
        onConfirm: () => {
          setShowConfirm(false);
          resolve(true);
        },
        onCancel: () => {
          setShowConfirm(false);
          resolve(false);
        }
      });
      setShowConfirm(true);
    });
  };

  return (
    <>
      <div className="edit-maps-container">
        <div className="edit-maps-header">
          <div className="header-title">
            <div className="edit-maps-title-row">
            <h2>{mapName || 'Edit Map'}</h2>
              <button className="mission-edit-button" onClick={() => navigate(`/setup/maps/edit/${mapId}/info`)}>
                <img src="/assets/icons/settings-black.png" alt="Edit Map Info" className="mission-edit-icon" />
              </button>
            </div>
            <span className="subtitle">Edit and draw the map</span>
          </div>
          <button className="go-back-button" onClick={handleGoBack}>
            Go back
          </button>
        </div>
        <div className="edit-maps-content">
          <div className="map-toolbar">
            <div className="toolbar-left-group">
              <div className="record-tools" style={{ display: 'none' }}>
                <button className="tool-button" title="Pause recording"
                  onClick={handlePauseRecording}
                >
                  <span className="tool-icon stop-record-icon"></span>
                </button>
              </div>
              <div className="zoom-tools">
                <button
                  className="tool-button"
                  title="Zoom"
                  onClick={handleZoom}
                >
                  <span className="tool-icon zoom-icon"></span>
                </button>
              </div>
              <div className="more-button-container" ref={moreButtonRef}>
                <button
                  className="tool-button"
                  title="More"
                  onClick={handleMoreClick}
                >
                  <span className="tool-icon more-icon"></span>
                </button>
                {showMoreMenu && (
                  <div className="more-options-popup">
                    <h3>Upload, download and record maps</h3>
                    <div className="options-list">
                      <div className="option-item" onClick={() => handleOptionClick('upload-overwrite')}>
                        <div className="option-icon upload-overwrite"></div>
                        <div className="option-content">
                          <h4>Upload and overwrite</h4>
                          <p>Replace existing map with uploaded map.</p>
                        </div>
                      </div>
                      <div className="option-item" onClick={() => handleOptionClick('record-overwrite')}>
                        <div className="option-icon record-overwrite"></div>
                        <div className="option-content">
                          <h4>Record and overwrite</h4>
                          <p>Replace existing map with new recording of map.</p>
                        </div>
                      </div>
                      <div className="option-item" onClick={() => handleOptionClick('upload-append')}>
                        <div className="option-icon upload-append"></div>
                        <div className="option-content">
                          <h4>Upload and append</h4>
                          <p>Upload a new map and append it to current map.</p>
                        </div>
                      </div>
                      <div className="option-item" onClick={() => handleOptionClick('record-append')}>
                        <div className="option-icon record-append"></div>
                        <div className="option-content">
                          <h4>Record and append</h4>
                          <p>Record a new map and append it to current map.</p>
                        </div>
                      </div>
                      <div className="option-item" onClick={() => handleOptionClick('download')}>
                        <div className="option-icon download"></div>
                        <div className="option-content">
                          <h4>Download map</h4>
                          <p>Download the current map.</p>
                        </div>
                      </div>
                    </div>
                    <div className="popup-actions">
                      <button className="cancel-button" onClick={() => setShowMoreMenu(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="save-tools">
                <button
                  id="map-save-button"
                  className="tool-button"
                  title="Save" onClick={() => handleSaveMap()}
                  disabled={isDisabled}

                >
                  <span className="tool-icon save-icon"></span>
                </button>
              </div>
              <div className="pan-tools">
                <button
                  className="tool-button"
                  title="Pan"
                  onClick={handlePan}
                >
                  <span className="tool-icon pan-icon"></span>
                </button>
              </div>
              <div className="navigation-tool">
                <button
                  className="tool-button"
                  title="Navigate"
                  onClick={handleNavigate}
                  disabled={isNavGoalMode}
                >
                  <span className="tool-icon navigation-icon"></span>
                </button>
              </div>
              {/* Wall tools - now managed by WallToolbar.js */}
              {/* Removed static wall-tools div to avoid conflicts */}

            </div>

            <div className="toolbar-right-group">
              {showObjectTypeSelector && (
                <div className="object-type-selector">
                  <div className="selector-header" onClick={toggleDropdown}>
                    {selectedObjectType !== 'no-object-type' && (
                      <span className="item-icon" style={{
                        backgroundColor: selectedObjectType === 'walls' ? '#000000' :
                          selectedObjectType === 'floors' ? '#ffffff' :
                            selectedObjectType === 'positions' ? 'transparent' :
                              selectedObjectType === 'markers' ? 'transparent' :
                                selectedObjectType === 'directional-zones' ? '#2196F3' :
                                  selectedObjectType === 'preferred-zones' ? '#90EE90' :
                                    selectedObjectType === 'unpreferred-zones' ? '#8e92eb' :
                                      selectedObjectType === 'critical-zones' ? '#ffbb00' :
                                      selectedObjectType === 'virtual-walls' ? '#d94c61' :
                                        selectedObjectType === 'forbidden-zones' ? '#FFB6C1' :
                                          '#e0e0e0',
                        backgroundImage: selectedObjectType === 'positions' ? 'url(/assets/icons/positions.png)' : 
                                        selectedObjectType === 'markers' ? 'url(/assets/icons/add-location.png)' : 'none',
                        backgroundSize: (selectedObjectType === 'positions' || selectedObjectType === 'markers') ? 'contain' : 'auto',
                        backgroundRepeat: (selectedObjectType === 'positions' || selectedObjectType === 'markers') ? 'no-repeat' : 'repeat',
                        backgroundPosition: (selectedObjectType === 'positions' || selectedObjectType === 'markers') ? 'center' : 'initial',
                        border: selectedObjectType === 'floors' ? '1px solid #ccc' : 'none'
                      }}></span>
                    )}
                    <span className="selected-text">
                      {selectedObjectType === 'no-object-type'
                        ? 'No object-type selected'
                        : selectedObjectType.split('-').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')
                      }
                    </span>
                    <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                  </div>
                  {isDropdownOpen && (
                    <div className="selector-dropdown">
                      <div
                        className="object-type-item"
                        data-value="no-object-type"
                        onClick={() => handleObjectTypeSelect('no-object-type')}
                      >
                        {/* <span className="item-icon" style={{ backgroundColor: '#e0e0e0' }}></span> */}
                        <span className="item-text" >No object-type selected</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="walls"
                        onClick={() => handleObjectTypeSelect('walls')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#000000' }}></span>
                        <span className="item-text">Walls</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="floors"
                        onClick={() => handleObjectTypeSelect('floors')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#ffffff', border: '1px solid #ccc' }}></span>
                        <span className="item-text">Floors</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="positions"
                        onClick={() => handleObjectTypeSelect('positions')}
                      >
                        <span className="item-icon" style={{ 
                          backgroundImage: 'url(/assets/icons/positions.png)',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundColor: 'transparent'
                        }}></span>
                        <span className="item-text">Positions</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="markers"
                        onClick={() => handleObjectTypeSelect('markers')}
                      >
                        <span className="item-icon" style={{ 
                          backgroundImage: 'url(/assets/icons/add-location.png)',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundColor: 'transparent'
                        }}></span>
                        <span className="item-text">Markers</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="directional-zones"
                        onClick={() => handleObjectTypeSelect('directional-zones')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#2196F3' }}></span>
                        <span className="item-text">Directional zones</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="preferred-zones"
                        onClick={() => handleObjectTypeSelect('preferred-zones')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#90EE90' }}></span>
                        <span className="item-text">Preferred zones</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="unpreferred-zones"
                        onClick={() => handleObjectTypeSelect('unpreferred-zones')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#8e92eb' }}></span>
                        <span className="item-text">Unpreferred zones</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="critical-zones"
                        onClick={() => handleObjectTypeSelect('critical-zones')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#ffbb00' }}></span>
                        <span className="item-text">Critical zones</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="virtual-walls"
                        onClick={() => handleObjectTypeSelect('virtual-walls')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#d94c61' }}></span>
                        <span className="item-text">Virtual walls</span>
                      </div>
                      <div
                        className="object-type-item"
                        data-value="forbidden-zones"
                        onClick={() => handleObjectTypeSelect('forbidden-zones')}
                      >
                        <span className="item-icon" style={{ backgroundColor: '#FFB6C1' }}></span>
                        <span className="item-text">Forbidden zones</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <button className="tool-button" title="Zoom In" onClick={handleZoomIn}>
                  <span className="tool-icon zoom-in-icon"></span>
                </button>
              </div>
              <div className="zoom-out-button">
                <button className="tool-button" title="Zoom Out" onClick={handleZoomOut}>
                  <span className="tool-icon zoom-out-icon"></span>
                </button>
              </div>
            </div>
          </div>
          <div className="map-canvas" ref={canvasRef}></div>
          <div className="map-info-bar">
            <span>Drag the map to move your view or use the zoom-in and -out buttons to zoom</span>
          </div>
          <div className="record-map-info-bar" style={{ display: 'none' }}>
            <span>User the Joystick to move robot around. As the robot's laser scanners detects obstacles, they will be recorded as walls.</span>
          </div>
          <div className="recording-indicator" style={{ display: 'none' }}>
            <span className="recording-dot"></span>
            <span>Recording</span>
          </div>
        </div>
      </div>
      <div id="loadingSpinner" style={{ display: 'none' }}><span>Đang lưu...</span></div>
      <div className="overlay" id='overlay' style={{ display: 'none' }}></div>
      <ConfirmDialog
        visible={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={confirmData.onCancel}
        confirmButtonText={confirmData.title === "Confirm Delete" ? "Delete" : "Change"}
      />
      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={() => setShowMessage(false)}
      />

      <SuccessDialog
        visible={showSuccessDialog}
        title="Success"
        message="Map saved successfully!"
        details="All map data including positions, virtual walls, forbidden zones, and markers have been synchronized with the database."
        onClose={() => setShowSuccessDialog(false)}
        buttonText="OK"
      />

      {/* Position Dialog */}
      <PositionDialog
        isOpen={showPositionDialog}
        onClose={handlePositionDialogClose}
        onConfirm={handlePositionDialogConfirm}
        onUseRobotPosition={handleUseRobotPosition}
        initialPosition={pendingPosition}
        mode={positionDialogMode}
        navigationMode={navigationMode}
      />

      {/* Markers Dialog */}
      <MarkersDialog
        isOpen={showMarkersDialog}
        onClose={handleMarkersDialogClose}
        initialMarker={pendingMarker}
        mode={markersDialogMode}
        mapRef={mapRef}
      />

      {/* Message Dialog */}
      <MessageDialog
        isOpen={showMessageDialog}
        title={messageDialogConfig.title}
        message={messageDialogConfig.message}
        onConfirm={messageDialogConfig.onConfirm}
        onClose={messageDialogConfig.onClose}
      />
    </>);
};

export default EditMaps; 