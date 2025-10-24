import React from 'react';
import './IOStatusWidget.css';

const IOStatusWidgetComponent = ({ widget, onEdit }) => {
  if (widget.displayMode === 'display') {
    return renderDisplayMode(widget);
  } else {
    return renderDesignMode(widget, onEdit);
  }
};

const renderDesignMode = (widget, onEdit) => {
  return (
    <div 
      className={`io-status-widget design-mode ${widget.ioType}`}
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
  return (
    <div 
      className={`io-status-widget display-mode ${widget.ioType} ${widget.isMonitoring ? 'monitoring' : ''}`}
      data-widget-id={widget.id}
    >
      <div className="widget-header">
        <div className="widget-info">
          <h3 className="widget-title">{widget.title}</h3>
          <p className="widget-settings">{widget.settings}</p>
        </div>
        
        <div className="io-controls">
          <button 
            className={`monitor-btn ${widget.isMonitoring ? 'active' : ''}`}
            onClick={() => widget.toggleMonitoring()}
            title={widget.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          >
            {widget.isMonitoring ? '⏸️' : '▶️'}
          </button>
          <button 
            className="refresh-btn"
            onClick={() => widget.refreshChannels()}
            title="Refresh Channels"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div className="io-content">
        <div className="io-info">
          <div className="info-item">
            <span className="info-label">Type:</span>
            <span className="info-value">{widget.ioType.toUpperCase()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Direction:</span>
            <span className="info-value">{widget.ioDirection}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Channels:</span>
            <span className="info-value">{widget.channels.length}</span>
          </div>
        </div>
        
        <div className="channels-list">
          {widget.channels.length === 0 ? (
            <div className="no-channels">
              <span className="no-channels-icon">🔌</span>
              <span className="no-channels-text">No I/O channels configured</span>
            </div>
          ) : (
            widget.channels.map((channel, index) => (
              <div key={channel.id} className={`channel-item ${channel.type} ${channel.status} ${channel.enabled ? 'enabled' : 'disabled'}`}>
                <div className="channel-info">
                  <span className="channel-label">{channel.name}</span>
                  <span className="channel-type">{channel.type}</span>
                  <span className="channel-status">{widget.getChannelStatusText(channel)}</span>
                </div>
                <div className="channel-controls">
                  {widget.ioDirection === 'output' || widget.ioDirection === 'bidirectional' ? (
                    <button 
                      className="toggle-btn"
                      onClick={() => widget.toggleChannel(index)}
                      disabled={!channel.enabled}
                      title="Toggle Channel"
                    >
                      {channel.status === 'active' ? '🔴' : '⚫'}
                    </button>
                  ) : null}
                  <button 
                    className={`enable-btn ${channel.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => widget.setChannelEnabled(index, !channel.enabled)}
                    title={channel.enabled ? 'Disable' : 'Enable'}
                  >
                    {channel.enabled ? '🔓' : '🔒'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IOStatusWidgetComponent; 