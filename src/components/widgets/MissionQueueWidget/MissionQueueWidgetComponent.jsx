import { Card, Spinner } from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import { FaEdit, FaTimes } from "react-icons/fa";

// Dnd-Kit imports
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, // Import arrayMove helper
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Other imports
import MissionQueueStatusIndicator from "../../../common/MissionQueueStatusIndicator"; // Giả sử component này đã được style
import serverConfig from "../../../config/serverConfig";

// --- Helper Functions ---

// Hàm gọi API để sắp xếp lại hàng đợi
const reorderMissionQueueAPI = async (orderedIds) => {
  console.log("🚀 Sending reorder request:", orderedIds);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${serverConfig.SERVER_URL}/api/missions/queue/reorder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedExecutionIds: orderedIds }),
      }
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(errorData.message || "Failed to reorder queue");
    }
    console.log("✅ Mission queue reordered successfully on the server.");
    return await response.json();
  } catch (error) {
    console.error("❌ Error reordering mission queue:", error);
    // Có thể hiển thị thông báo lỗi cho người dùng ở đây
    throw error; // Ném lỗi ra để xử lý ở handleDragEnd
  }
};

// Lấy text trạng thái
const getStatusText = (status) => {
  switch (status) {
    case 0:
      return "PENDING";
    case 1:
      return "RUNNING";
    case 2:
      return "PAUSED";
    case 3:
      return "COMPLETED";
    case 4:
      return "FAILED";
    case 5:
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
};

// Lấy class màu trạng thái
const getStatusColorClasses = (status) => {
  switch (status) {
    case 0:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"; // Pending
    case 1:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 animate-pulse"; // Running
    case 2:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"; // Paused
    case 3:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"; // Completed
    case 4:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"; // Failed
    case 5:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"; // Cancelled
    default:
      return "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300"; // Unknown
  }
};

// --- Sortable Item Component ---
const SortableMissionItem = ({ mission, onCancel }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Sử dụng isDragging từ useSortable
  } = useSortable({ id: mission.executionUUID });

  // Style cho việc transform item khi kéo
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto", // Đưa item đang kéo lên trên
  };

  const statusColorClasses = getStatusColorClasses(mission.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} // Áp dụng attributes (không phải listener) vào đây
      // Style cơ bản + style khi kéo (shadow, nghiêng nhẹ)
      className={`
        flex items-center justify-between p-2 mb-2 rounded-md transition-shadow
        bg-background dark:bg-gray-800 border border-border dark:border-gray-700
        ${
          isDragging
            ? "shadow-lg rotate-1 bg-gray-100 dark:bg-gray-700"
            : "shadow-sm"
        }
      `}
    >
      {/* Thông tin Mission (Icon kéo, Tên) */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Tay cầm để kéo - Gắn listener vào đây */}
        <div
          {...listeners}
          className="drag-handle p-1 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          title="Drag to reorder"
        >
          {/* Icon kéo thả (ví dụ SVG) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
        {/* Chi tiết Mission */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">
            {mission.name}
          </span>
          {/* Bạn có thể thêm mô tả hoặc thông tin khác ở đây */}
        </div>
      </div>

      {/* Điều khiển Mission (Trạng thái, Nút Hủy) */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${statusColorClasses}`}
          title={`Status: ${getStatusText(mission.status)}`}
        >
          {getStatusText(mission.status)}
        </span>
        <button
          className="
            w-6 h-6 flex items-center justify-center rounded
            bg-red-600 hover:bg-red-700 text-white
            text-sm font-bold transition-colors disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
          "
          onClick={(e) => {
            e.stopPropagation();
            onCancel(mission.queueId, mission.executionUUID);
          }} // Ngăn sự kiện kéo khi nhấn hủy
          disabled={mission.status >= 3} // Vô hiệu hóa nếu đã Hoàn thành, Lỗi, hoặc Hủy
          title="Cancel Mission"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// --- Main Widget Component ---
const MissionQueueWidgetComponent = ({ widget, onEdit }) => {
  // --- State and Hooks ---
  const [queueData, setQueueData] = useState(null);
  // const [currentSite, setCurrentSite] = useState(null); // Giữ lại nếu cần hiển thị tên site
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestMissionLog, setLatestMissionLog] = useState(null); // Cho header status
  const [isDragging, setIsDragging] = useState(false); // Theo dõi trạng thái kéo thả
  const queueDataRef = useRef(null); // Giữ tham chiếu data hiện tại (nếu cần cho WebSocket)

  // --- Effects ---
  useEffect(() => {
    loadQueueData();
    // Khởi tạo kết nối WebSocket hoặc SSE ở đây nếu cần
    // Ví dụ: const ws = new WebSocket(...); setWsConnection(ws);
    // return () => ws?.close(); // Cleanup khi component unmount
  }, []); // Chỉ chạy 1 lần khi mount

  // --- API/WebSocket Handlers ---

  // Hàm tải dữ liệu hàng đợi từ API
  const loadQueueData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 giây

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/missions/queue/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => `HTTP error! status: ${response.status}`);
        throw new Error(errorText);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setQueueData(result.data);
        queueDataRef.current = result.data;
        // setCurrentSite({ id: result.data.siteId, name: result.data.siteName });
        console.log("✅ Mission queue loaded:", result.data);
      } else {
        console.warn(
          "⚠️ API response not successful or no data for mission queue."
        );
        const emptyData = {
          missions: [],
          totalCount: 0,
          pendingCount: 0,
          runningCount: 0,
          pausedCount: 0,
          highPriorityCount: 0,
        };
        setQueueData(emptyData);
        queueDataRef.current = emptyData;
      }
    } catch (error) {
      console.error("🚨 MissionQueueWidget: Error loading data:", error);
      setError(
        error.name === "AbortError"
          ? "Request timeout"
          : error.message || "Failed to load mission queue"
      );
      // Giữ lại data cũ hoặc set về rỗng khi lỗi? Tùy UX.
      // const emptyData = { missions: [], ... }; setQueueData(emptyData); queueDataRef.current = emptyData;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Hàm xử lý khi có cập nhật từ WebSocket (thêm mission)
  const handleQueueAdded = (newData) => {
    console.log("Queue Update Received (Add Logic):", newData);
    // Cần logic để hợp nhất newData với state queueData hiện tại
    // Ví dụ đơn giản: Tải lại toàn bộ
    loadQueueData(false); // Tải lại mà không hiện spinner
  };

  // Hàm xử lý khi có cập nhật từ WebSocket (trạng thái mission)
  const handleMissionUpdate = (update) => {
    if (isDragging) return; // Không cập nhật UI khi đang kéo thả
    console.log("Mission Update Received (Add Logic):", update);
    // Cần logic để tìm và cập nhật mission cụ thể trong state queueData
    // Ví dụ đơn giản: Tải lại toàn bộ
    loadQueueData(false);
    // Cập nhật log mới nhất cho header
    if (update?.type === "mission_log_update" && update.logEntry) {
      setLatestMissionLog(update.logEntry);
    }
  };

  // Hàm xử lý khi nhấn nút hủy mission
  const handleCancel = async (queueId, executionUUID) => {
    console.log(`Attempting to cancel mission: ${executionUUID}`);
    // Nên có xác nhận trước khi hủy? (confirm dialog)
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/missions/queue/cancel/${executionUUID}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to send cancel command");
      const result = await response.json();
      if (result.success) {
        console.log("✅ Cancel command sent for:", executionUUID);
        // Cập nhật UI ngay lập tức (optimistic) hoặc chờ WebSocket/tải lại
        setQueueData((prev) => {
          if (!prev) return null;
          const updatedMissions = prev.missions.filter(
            (m) => m.executionUUID !== executionUUID
          );
          // Tính lại counts nếu cần
          return {
            ...prev,
            missions: updatedMissions,
            totalCount: updatedMissions.length,
          };
        });
        // loadQueueData(false); // Hoặc tải lại để chắc chắn
      } else {
        throw new Error(result.message || "Cancel command failed");
      }
    } catch (error) {
      console.error("❌ Error cancelling mission:", error);
      // Hiển thị thông báo lỗi cho người dùng
      setError(`Failed to cancel: ${error.message}`);
    }
  };

  // --- Drag and Drop Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    setIsDragging(false);
    const { active, over } = event;

    // Chỉ xử lý nếu kéo thả vào vị trí khác và có dữ liệu
    if (active && over && active.id !== over.id && queueData?.missions) {
      // Chỉ cho phép sắp xếp các mission đang PENDING
      const runningOrPausedMissions = queueData.missions.filter(
        (m) => m.status === 1 || m.status === 2
      );
      let pendingMissions = queueData.missions.filter((m) => m.status === 0);

      const oldIndex = pendingMissions.findIndex(
        (m) => m.executionUUID === active.id
      );
      const newIndex = pendingMissions.findIndex(
        (m) => m.executionUUID === over.id
      );

      // Nếu tìm thấy cả item cũ và mới trong danh sách pending
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPendingMissions = arrayMove(
          pendingMissions,
          oldIndex,
          newIndex
        );
        const newFullQueue = [
          ...runningOrPausedMissions,
          ...reorderedPendingMissions,
        ];

        // 1. Cập nhật giao diện ngay lập tức (Optimistic Update)
        const optimisticData = {
          ...queueData,
          missions: newFullQueue,
          pendingCount: reorderedPendingMissions.length,
          // Cập nhật các count khác nếu cần
        };
        setQueueData(optimisticData);
        queueDataRef.current = optimisticData; // Cập nhật ref

        // 2. Gọi API để lưu thứ tự mới
        const orderedExecutionIds = reorderedPendingMissions.map(
          (item) => item.executionUUID
        );
        reorderMissionQueueAPI(orderedExecutionIds).catch((apiError) => {
          // 3. Nếu API lỗi, hoàn tác lại thay đổi trên giao diện
          console.error("Reverting UI due to API reorder error:", apiError);
          setQueueData(queueData); // Hoàn tác về trạng thái trước khi kéo
          queueDataRef.current = queueData;
          setError("Failed to save new order."); // Thông báo lỗi
        });
      } else {
        console.warn("Drag ended but indices not found in pending missions.");
      }
    }
  };

  // --- RENDER LOGIC ---

  // Lấy style kích thước tùy chỉnh (nếu có)
  const getCustomStyle = () => {
    const customStyle = {};
    if (widget.properties && widget.properties.resized) {
      customStyle.width = `${widget.properties.width}px`;
      customStyle.height = `${widget.properties.height}px`;
      customStyle.minWidth = `${widget.properties.width}px`;
      customStyle.minHeight = `${widget.properties.height}px`;
    }
    return customStyle;
  };
  const customStyle = getCustomStyle();

  // --- RENDER DESIGN MODE ---
  if (widget.displayMode !== "display") {
    return (
      <div
        className="
          relative flex flex-col h-full w-full p-4 rounded-lg
          border-2 border-dashed border-gray-400 dark:border-gray-600
          bg-background dark:bg-gray-700 cursor-grab text-center
        "
        data-widget-id={widget.id}
        style={customStyle}
      >
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
          {widget.title}
        </h3>
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <p className="text-xs italic">Mission Queue</p>
        </div>
        {onEdit && (
          <button
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(widget.id);
            }}
            title="Edit widget"
          >
            <FaEdit />
          </button>
        )}
      </div>
    );
  }

  // --- RENDER DISPLAY MODE ---
  const renderHeaderStatus = () => {
    if (loading && !queueData) return "Loading queue...";
    if (error && !queueData?.missions?.length) return `Error: ${error}`;
    if (!queueData || !queueData.missions || queueData.missions.length === 0)
      return "Waiting for mission queue...";
    if (latestMissionLog?.message) return latestMissionLog.message;

    const runningCount = queueData.missions.filter(
      (m) => m.status === 1
    ).length;
    const pendingCount = queueData.missions.filter(
      (m) => m.status === 0
    ).length;
    return `Running: ${runningCount}, Queued: ${pendingCount}`;
  };

  const runningMission = queueData?.missions.find((m) => m.status === 1);
  const pendingMissions =
    queueData?.missions.filter((m) => m.status === 0) || [];

  return (
    <Card
      className="flex flex-col h-full w-full p-0" // Xóa padding mặc định của Card
      data-widget-id={widget.id}
      style={customStyle}
      theme={{
        root: {
          base: "flex flex-col h-full bg-background dark:bg-gray-800 overflow-hidden",
        },
      }} // Quan trọng: overflow-hidden
    >
      {/* Chỉ báo kết nối thời gian thực */}
      <MissionQueueStatusIndicator
        onQueueUpdate={handleQueueAdded}
        onMissionUpdate={handleMissionUpdate}
      />

      {/* Header */}
      <div className="p-2 border-b border-border dark:border-gray-700 flex-shrink-0">
        <p
          className={`text-xs font-medium truncate ${
            error ? "text-red-600" : "text-muted-foreground dark:text-gray-400"
          }`}
        >
          {renderHeaderStatus()}
        </p>
      </div>

      {/* Vùng nội dung cuộn được */}
      <div className="flex-1 p-2 overflow-y-auto min-h-0">
        {" "}
        {/* min-h-0 RẤT QUAN TRỌNG */}
        {/* Trạng thái Loading ban đầu */}
        {loading && !queueData && (
          <div className="flex justify-center items-center h-full">
            {" "}
            <Spinner size="md" />{" "}
          </div>
        )}
        {/* Trạng thái Lỗi (chỉ hiện khi không có data) */}
        {!loading && error && !pendingMissions.length && !runningMission && (
          <div className="flex justify-center items-center h-full text-red-600 text-sm p-4 text-center">
            {" "}
            {error}{" "}
          </div>
        )}
        {/* Trạng thái Rỗng */}
        {!loading && !error && !pendingMissions.length && !runningMission && (
          <div className="flex flex-col justify-center items-center h-full text-muted-foreground dark:text-gray-500 text-sm">
            📝 <span className="mt-1">No missions in queue</span>
          </div>
        )}
        {/* Render danh sách mission nếu có */}
        {(runningMission || pendingMissions.length > 0) && (
          <>
            {/* Mission đang chạy (không kéo thả được) */}
            {runningMission && (
              <div className="flex items-center justify-between p-2 mb-2 rounded-md bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 animate-pulse">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img
                    src="/assets/icons/mission.png"
                    alt="Running"
                    className="w-5 h-5 opacity-70 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate block">
                      {runningMission.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColorClasses(
                      runningMission.status
                    )}`}
                  >
                    {getStatusText(runningMission.status)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      handleCancel(
                        runningMission.queueId,
                        runningMission.executionUUID
                      )
                    }
                    title="Cancel Mission"
                  >
                    {" "}
                    <FaTimes />{" "}
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách Mission đang chờ (kéo thả được) */}
            <DndContext
              // Thêm key để đảm bảo DndContext cập nhật khi items thay đổi
              key={pendingMissions.map((m) => m.executionUUID).join("-")}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pendingMissions.map((m) => m.executionUUID)}
                strategy={verticalListSortingStrategy}
              >
                {pendingMissions.map((mission) => (
                  <SortableMissionItem
                    key={mission.executionUUID}
                    mission={mission}
                    onCancel={handleCancel}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </Card>
  );
};

export default MissionQueueWidgetComponent;
