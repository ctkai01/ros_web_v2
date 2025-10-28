import { useEffect, useRef, useState } from "react";
// import MissionActionLogDialog from './MissionActionLogDialog';
import { ListGroup, ListGroupItem } from "flowbite-react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";
import MissionQueueStatusIndicator from "../../../common/MissionQueueStatusIndicator";
import serverConfig from "../../../config/serverConfig";

const MissionActionLogWidgetComponent = ({ widget, onEdit }) => {
  const widgetRef = useRef(null);
  const wsRef = useRef(null);
  const logContainerRef = useRef(null);

  // State for logs and controls
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);

  // State for edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load recent logs from database on component mount
  useEffect(() => {
    if (widget.displayMode === "display") {
      loadRecentLogs();
    }
  }, [widget.displayMode]);

  // Handle mission logs from MissionQueueStatusIndicator
  const handleMissionUpdate = (update) => {
    if (update && update.type === "mission_log_update") {
      // Convert mission log to component format
      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: update.logEntry.timestamp || new Date().toISOString(),
        level: mapLogLevel(update.logEntry.levelName || update.logEntry.level),
        levelName: update.logEntry.levelName || "INFO",
        name: update.logEntry.name || "mission",
        message: update.logEntry.message || "",
        file: update.logEntry.file || "",
        function: update.logEntry.function || "",
        line: update.logEntry.line || 0,
      };

      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, logEntry];
        // Keep only last 500 entries to prevent memory issues
        return newLogs.slice(-500);
      });
    }
  };

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Map log levels from server to component levels
  const mapLogLevel = (levelName) => {
    if (typeof levelName === "string") {
      switch (levelName.toUpperCase()) {
        case "SUCCESS":
          return "success";
        case "INFO":
          return "info";
        case "WARN":
        case "WARNING":
          return "warning";
        case "ERROR":
        case "FATAL":
          return "error";
        case "DEBUG":
          return "success"; // Map DEBUG to success based on user change
        default:
          return "info";
      }
    }

    // Handle numeric levels
    switch (levelName) {
      case 1:
        return "success"; // DEBUG -> SUCCESS
      case 2:
        return "info"; // INFO
      case 4:
        return "warning"; // WARN
      case 8:
      case 16:
        return "error"; // ERROR/FATAL
      default:
        return "info";
    }
  };

  // Get log level icon
  // const getLogLevelIcon = (level) => {
  //   switch (level) {
  //     case "success":
  //       return "✅";
  //     case "info":
  //       return "ℹ️";
  //     case "warning":
  //       return "⚠️";
  //     case "error":
  //       return "❌";
  //     default:
  //       return "ℹ️";
  //   }
  // };

  const getLogLevelIcon = (level) => {
    switch (level) {
      case "success":
        // return <FaCheckCircle className="text-green-500 mr-2" />;
        return <FaCheckCircle className="text-green-500 flex-shrink-0 mr-2" />;
      case "info":
        // return <IoInformationCircle className="text-gray-500 mr-2" />;
        return <FaInfoCircle className="text-gray-400 flex-shrink-0 mr-2" />;
      case "warning":
        // return <FaExclamationTriangle className="text-yellow-400 mr-2" />;
        return (
          <FaExclamationTriangle className="text-yellow-400 flex-shrink-0 mr-2" />
        );
      case "error":
        return <FaTimesCircle className="text-red-500 flex-shrink-0 mr-2" />;
      // return <FaTimesCircle className="text-red-500 mr-2" />;
      default:
        // return <IoInformationCircle className="text-gray-500 mr-2" />;
        return <FaInfoCircle className="text-gray-400 flex-shrink-0 mr-2" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  // Filter logs based on level
  const getFilteredLogs = () => {
    if (filterLevel === "all") return logs;
    return logs.filter((log) => log.level === filterLevel);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Toggle auto scroll
  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll);
  };

  // Toggle timestamp display
  const toggleTimestamp = () => {
    setShowTimestamp(!showTimestamp);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  // Handle dialog save
  const handleDialogSave = (updatedWidget) => {
    console.log("💾 Saving widget changes:", updatedWidget);

    // Update widget properties
    widget.title = updatedWidget.title;
    widget.settings = updatedWidget.settings;

    // Call parent onEdit if provided
    if (onEdit && typeof onEdit === "function") {
      onEdit(updatedWidget.id, updatedWidget);
    }

    setIsDialogOpen(false);
  };

  // Load recent logs from database
  const loadRecentLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn(
          "MissionActionLogWidget: No token found for loading recent logs"
        );
        return;
      }

      console.log(
        "🔍 MissionActionLogWidget: Loading recent logs from database..."
      );

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/missions/logs/recent?limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "🔍 MissionActionLogWidget: API response status:",
        response.status
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "🚨 MissionActionLogWidget: API error response:",
          errorText
        );
        throw new Error(
          `HTTP error! status: ${response.status}, response: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("🔍 MissionActionLogWidget: API result:", result);

      if (result.success && result.data) {
        console.log(
          "✅ MissionActionLogWidget: Loaded recent mission logs from database:",
          result.data.length
        );
        console.log("📋 MissionActionLogWidget: Log entries:", result.data);

        // Map database logs to component format
        const dbLogs = result.data.map((entry, index) => ({
          id: `db-${entry.id}-${index}`,
          timestamp: entry.timestamp,
          level: entry.level,
          levelName: entry.levelName,
          name: entry.name || "mission",
          message: entry.message || "",
          file: entry.file || "",
          function: entry.function || "",
          line: entry.line || 0,
        }));

        setLogs(dbLogs);
        console.log(
          "✅ MissionActionLogWidget: Set logs state with",
          dbLogs.length,
          "entries"
        );
      } else {
        console.warn(
          "⚠️ MissionActionLogWidget: API returned no data or failed:",
          result
        );
        // Set empty logs if no data
        setLogs([]);
      }
    } catch (error) {
      console.error(
        "🚨 MissionActionLogWidget: Error loading recent mission logs from database:",
        error
      );
      // Set empty logs on error
      setLogs([]);
    }
  };

  const mainContent =
    widget.displayMode === "display" ? renderDisplayMode() : renderDesignMode();

  return (
    <>
      {mainContent}
      {/* MissionQueueStatusIndicator for receiving mission logs */}
      {widget.displayMode === "display" && (
        <MissionQueueStatusIndicator
          onQueueUpdate={null}
          onMissionUpdate={handleMissionUpdate}
        />
      )}
      {/* <MissionActionLogDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        widget={widget}
      /> */}
    </>
  );

  function renderDesignMode() {
    return (
      <div
        ref={widgetRef}
        className="mission-action-log-widget design-mode"
        data-widget-id={widget.id}
      >
        <div className="widget-header">
          <div className="widget-info">
            <h3 className="widget-title">{widget.title}</h3>
            <p className="widget-settings">
              {"Limit: " +
                (widget.settings.limit || 10) +
                " | " +
                "Auto Scroll: " +
                (widget.settings.autoScroll || true) +
                " | " +
                "ShowTimestamp: " +
                (widget.settings.showTimestamp || true) +
                " | " +
                "Filter Level: " +
                (widget.settings.filterLevel || "all")}
            </p>
          </div>
        </div>
        {onEdit && (
          <button
            className="widget-edit-btn"
            onClick={() => setIsDialogOpen(true)}
            title="Edit Widget"
          >
            <span className="edit-icon"></span>
          </button>
        )}
      </div>
    );
  }

  function renderDisplayMode() {
    const filteredLogs = getFilteredLogs();
    console.log("filteredLogs: ", filteredLogs);
    return (
      // <Card
      //   className="col-span-3 lg:col-span-1 row-span-2"
      //   // 1. THAY ĐỔI: Ép Card lấp đầy chiều cao và dùng flex-col
      //   // Điều này rất quan trọng để "flex-1" bên dưới hoạt động
      //   theme={{ root: { base: "flex flex-col h-full" } }}
      // >
      //   {filteredLogs.length === 0 ? (
      //     // 2. THAY ĐỔI: Thêm "flex-1" để "empty state" căn giữa
      //     <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      //       <div className="text-4xl">📝</div> {/* Làm icon to hơn */}
      //       <div className="mt-2 text-sm">No log entries available</div>
      //     </div>
      //   ) : (
      //     // 3. THAY ĐỔI: Thêm "flex-1" và "overflow-y-auto"
      //     // - "flex-1": Lấp đầy không gian còn lại trong Card
      //     // - "overflow-y-auto": Tự động hiển thị thanh cuộn khi nội dung tràn
      //     <ListGroup className="border-0 flex-1 overflow-y-auto">
      //       {filteredLogs.map((entry, index) => {
      //         return (
      //           <ListGroupItem
      //             key={entry.id || index}
      //             className="border-0 p-2 flex items-center gap-2"
      //           >
      //             {getLogLevelIcon(entry.level)}
      //             <span className="text-xs text-muted-foreground">
      //               {entry.message}
      //             </span>
      //             <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 rounded">
      //               {showTimestamp && formatTimestamp(entry.timestamp)}
      //             </span>
      //           </ListGroupItem>
      //         );
      //       })}
      //     </ListGroup>
      //   )}
      // </Card>
      <div
      // className="col-span-3 lg:col-span-1 row-span-2"
      // Keep flex-col h-full to ensure the Card fills its grid area
      // and the empty state centers correctly.
      // theme={{ root: { base: "flex flex-col h-full" } }}
      >
        {filteredLogs.length === 0 ? (
          // Empty state remains the same, using flex-1 to center vertically
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="text-4xl">📝</div>
            <div className="mt-2 text-sm">No log entries available</div>
          </div>
        ) : (
          // **CHANGED HERE:**
          // - REMOVED `flex-1`
          // - ADDED `max-h-[500px]`
          <ListGroup className="border-0 overflow-y-auto p-1 max-h-[300px]">
            {filteredLogs.map((entry, index) => {
              return (
                <ListGroupItem
                  key={entry.id || index}
                  className="border-0 p-2 flex items-center gap-2"
                >
                  {getLogLevelIcon(entry.level)}
                  <span className="text-xs text-muted-foreground">
                    {entry.message}
                  </span>
                  <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 rounded">
                    {showTimestamp && formatTimestamp(entry.timestamp)}
                  </span>
                </ListGroupItem>
              );
            })}
          </ListGroup>
        )}
      </div>
      // <Card className="col-span-3 lg:col-span-1 row-span-2 flex flex-col h-full">
      //   <div className="flex-1 overflow-y-auto space-y-2 pr-2">
      //     {filteredLogs.map((entry, index) => {
      //       return (
      //         <div className="flex justify-between items-start gap-2 p-1">
      //           <div className="flex items-center gap-2">
      //             {getLogLevelIcon(entry.level)}
      //             <span className="text-xs text-muted-foreground flex-1">
      //               {entry.message}
      //             </span>
      //           </div>

      //           {showTimestamp && (
      //             <span className="ml-auto text-xs text-blue-500 flex-shrink-0">
      //               {formatTimestamp(entry.timestamp)}
      //             </span>
      //           )}
      //         </div>
      //       );
      //     })}
      //   </div>
      // </Card>
      // <div
      //   ref={widgetRef}
      //   className="mission-action-log-widget display-mode"
      //   data-widget-id={widget.id}
      // >
      //   <div
      //     ref={logContainerRef}
      //     className={`log-container ${autoScroll ? "auto-scroll" : ""}`}
      //   >
      //     {filteredLogs.length === 0 ? (
      //       <div className="no-logs">
      //         <div className="no-logs-icon">📝</div>
      //         <div className="no-logs-text">No log entries available</div>
      //       </div>
      //     ) : (
      //       filteredLogs.map((entry) => (
      //         <div key={entry.id} className={`log-entry ${entry.level}`}>
      //           <span className="log-icon">{getLogLevelIcon(entry.level)}</span>
      //           <span className="log-message">{entry.message}</span>
      //           {showTimestamp && (
      //             <span className="log-timestamp">
      //               {formatTimestamp(entry.timestamp)}
      //             </span>
      //           )}
      //         </div>
      //       ))
      //     )}
      //   </div>
      // </div>
    );
  }
};

export default MissionActionLogWidgetComponent;
