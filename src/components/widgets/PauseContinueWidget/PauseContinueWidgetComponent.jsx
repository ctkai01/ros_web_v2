import { Spinner } from "flowbite-react"; // 1. Import Spinner
import { useEffect, useRef, useState } from "react";
import { FaEdit, FaPause, FaPlay } from "react-icons/fa"; // 2. Import Icons

import { SERVER_URL } from "../../../config/serverConfig"; // Giữ nguyên config
import { useMissionContext } from "../../../contexts/MissionContext"; // Giữ nguyên context

const PauseContinueWidgetComponent = ({ widget, onEdit }) => {
  const widgetRef = useRef(null);
  const { missionStatus, isLoading, sendMissionCommand } = useMissionContext();
  const [localMissionStatus, setLocalMissionStatus] = useState("IDLE");

  // Load initial status (logic giữ nguyên)
  useEffect(() => {
    const loadInitialStatus = async () => {
      if (widget.isDesignMode()) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${SERVER_URL}/api/robot/mission-state`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) {
          setLocalMissionStatus(result.data.status);
          // Không cần gọi widget.updateMissionStatus nếu state chỉ quản lý ở đây
        }
      } catch (error) {
        console.error("PauseContinueWidget: Error loading status:", error);
      }
    };
    loadInitialStatus();
  }, [widget]);

  // Update local status from context (logic giữ nguyên)
  useEffect(() => {
    setLocalMissionStatus(missionStatus);
    // Không cần gọi widget.updateMissionStatus
  }, [missionStatus]);

  // Handle click (logic giữ nguyên, chỉ thay đổi tên biến)
  const handleMissionClick = async () => {
    if (widget.isDesignMode() || isLoading) return;

    let command = "";
    switch (localMissionStatus) {
      case "IDLE":
        command = "START";
        break;
      case "RUNNING":
        command = "PAUSE";
        break;
      case "PAUSED":
        command = "RESUME";
        break;
      default:
        return;
    }
    await sendMissionCommand(command);
  };

  // --- 3. LOGIC HIỂN THỊ (ĐÃ CẬP NHẬT) ---

  const status = localMissionStatus; // Dùng state local
  let actionText = "Unknown";
  let ActionIcon = FaPlay; // Icon mặc định
  let buttonColorClasses = "bg-gray-500 border-gray-500 text-white"; // Màu mặc định
  let buttonHoverClasses = "hover:bg-gray-600 hover:border-gray-600";

  switch (status) {
    case "IDLE":
      actionText = "Start Mission"; // Lấy từ t() nếu cần
      ActionIcon = FaPlay;
      buttonColorClasses = "bg-blue-600 border-blue-600 text-white";
      buttonHoverClasses = "hover:bg-blue-700 hover:border-blue-700";
      break;
    case "RUNNING":
      actionText = "Pause Mission";
      ActionIcon = FaPause;
      buttonColorClasses = "bg-yellow-400 border-yellow-400 text-black"; // Màu vàng cho Running
      buttonHoverClasses = "hover:bg-yellow-500 hover:border-yellow-500";
      break;
    case "PAUSED":
      actionText = "Resume Mission";
      ActionIcon = FaPlay; // Dùng lại icon Play cho Resume
      buttonColorClasses = "bg-green-500 border-green-500 text-white"; // Màu xanh lá cho Paused (để Resume)
      buttonHoverClasses = "hover:bg-green-600 hover:border-green-600";
      break;
  }

  const isButtonDisabled = isLoading || widget.isDesignMode(); // Logic disable

  // --- RENDER ---

  // Chế độ Design
  if (widget.isDesignMode()) {
    return (
      <div
        ref={widgetRef}
        // Style Design Mode bằng Tailwind
        className="relative flex flex-col h-full w-full p-4 border-2 border-dashed border-gray-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 rounded-lg"
        data-widget-id={widget.id}
      >
        {/* Header (nếu cần) */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {widget.title}
            </h3>
            {/* <p className="text-xs text-gray-500 dark:text-gray-500">{widget.settings}</p> */}
          </div>
        </div>

        {/* Placeholder cho nút bấm */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 opacity-70">
            <FaPlay size={24} />
            <span className="text-sm font-semibold italic">
              Action Button Preview
            </span>
          </div>
        </div>

        {/* Nút Edit (nếu có) */}
        {onEdit && (
          <button
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => onEdit(widget.id)}
            title="Edit Widget"
          >
            <FaEdit />
          </button>
        )}
      </div>
    );
  }

  // Chế độ Hiển thị (Display)
  return (
    <div
      ref={widgetRef}
      // Style Display Mode bằng Tailwind
      className={`flex flex-col h-full w-full items-center justify-center p-4 bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700`}
      data-widget-id={widget.id}
    >
      <button
        // Class cơ bản + class màu + class hover + class disable
        className={`
          flex items-center justify-center gap-3 px-5 py-3 rounded-lg
          font-semibold text-sm border-2 transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          min-w-[160px] 
          ${buttonColorClasses}
          ${
            isButtonDisabled
              ? "opacity-60 cursor-not-allowed" // Style khi disable
              : `${buttonHoverClasses} transform hover:-translate-y-0.5 hover:shadow-lg focus:ring-opacity-50` // Style khi enable
          }
        `}
        onClick={handleMissionClick}
        disabled={isButtonDisabled}
        title={actionText}
      >
        {/* Hiển thị Spinner hoặc Icon */}
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <ActionIcon className="w-5 h-5 flex-shrink-0" />
        )}
        {/* Hiển thị Text */}
        <span className="truncate">{actionText}</span>
      </button>

      {/* (Tùy chọn) Hiển thị trạng thái nếu cần */}
      {/* <p className="mt-2 text-xs text-muted-foreground">{`Status: ${status}`}</p> */}
    </div>
  );
};

export default PauseContinueWidgetComponent;
