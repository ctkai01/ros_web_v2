import { Spinner } from "flowbite-react"; // Import Spinner from Flowbite
import { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Import Edit icon
import serverConfig from "../../../config/serverConfig";
import { TbTargetArrow } from "react-icons/tb";

const MissionButtonWidgetComponent = ({ widget, onEdit }) => {
  // --- State and Logic (Keep most of this) ---
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPending, setIsPending] = useState(false); // Track pending request

  const handleMissionClick = async () => {
    // Prevent action if no mission ID, or if already executing/pending
    if (!widget.settings.missionId || isExecuting || isPending) {
      console.warn("Action prevented:", {
        hasMissionId: !!widget.settings.missionId,
        isExecuting,
        isPending,
      });
      return;
    }

    try {
      setIsPending(true); // Set pending state immediately
      console.log(`🔄 Adding mission ${widget.settings.missionId} to queue...`);

      const token = localStorage.getItem("token");
      // Simplified URL logic (adjust if your specific 8080 port logic is still needed)
      const url = `${serverConfig.SERVER_URL}/api/missions/queue/add`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionId: widget.settings.missionId,
          siteId: widget.settings.siteId || 1, // Default siteId if needed
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear timeout if fetch completes

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status} ${response.statusText} ${errText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ Mission added to queue successfully:", data);
        // Clear indicators immediately on success (optional, depends on desired UX)
        setIsExecuting(false); // Should be handled by status updates, not here
        setIsPending(false);
      } else {
        console.error(
          "❌ Failed to add mission to queue:",
          data.message || "Unknown error"
        );
        // Optionally show an error message to the user
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        console.warn("Mission add request aborted by timeout");
        // Optionally show timeout message
      } else {
        console.error("❌ Error adding mission to queue:", error);
        // Optionally show generic error message
      }
    } finally {
      // Always reset pending state after request attempt, allow retry
      setIsPending(false);
      // Let actual mission status updates handle the 'executing' state
      setIsExecuting(false);
    }
  };

  // --- Render Logic ---
  const isDisabled = isExecuting || isPending;
  const isDesign = widget.displayMode !== "display"; // Check if in design mode

  // --- RENDER DESIGN MODE ---
  if (isDesign) {
    return (
      <div
        className={`
          relative flex flex-col h-full w-full p-4 rounded-lg
          border-2 border-dashed border-gray-400 dark:border-gray-600
          bg-background dark:bg-gray-700 cursor-grab
          ${
            widget.isActive ? "border-green-500 ring-2 ring-green-300" : ""
          } // Example active state highlight
        `}
        data-widget-id={widget.id}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
              {widget.title}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-gray-500 truncate">
              {widget.settings.missionName || "No mission"}
            </p>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          {/* Simple placeholder */}
          <div className="text-center">
            <img
              src="/assets/icons/target-white.png" // Use a placeholder icon, adjust path
              alt="Mission Icon"
              className="w-10 h-10 mx-auto opacity-30"
            />
            <p className="text-xs italic mt-1">Mission Button</p>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(widget.id);
            }} // Prevent drag start on edit click
            title="Edit widget"
          >
            <FaEdit />
          </button>
        )}
      </div>
    );
  }

  // --- RENDER DISPLAY MODE ---
  // Determine background color based on state
  let bgColorClass = "bg-[#8BC34A]"; // Default Green (like CSS)
  let hoverBgClass = "hover:bg-[#7CB342]";
  if (isPending) {
    bgColorClass = "bg-yellow-400"; // Yellow for Pending
    hoverBgClass = ""; // No hover effect when pending
  } else if (isExecuting) {
    bgColorClass = "bg-orange-500"; // Orange for Executing (like CSS)
    hoverBgClass = ""; // No hover effect when executing
  }

  // Determine cursor
  const cursorClass = isDisabled
    ? "cursor-wait"
    : widget.settings.missionId
    ? "cursor-pointer"
    : "cursor-default";

  return (
    <div
      className={`
        relative flex flex-col h-full w-full items-center justify-center
        rounded-lg shadow-md transition-all duration-200 ease-in-out p-4 gap-2
        text-white ${bgColorClass} ${cursorClass}
        ${
          !isDisabled && widget.settings.missionId
            ? `${hoverBgClass} hover:-translate-y-0.5 hover:shadow-lg active:translate-y-px active:shadow-sm`
            : ""
        }
        ${
          isExecuting
            ? "animate-pulse ring-2 ring-orange-300 ring-offset-2 ring-offset-background"
            : ""
        } // Add pulse and ring for executing
      `}
      data-widget-id={widget.id}
      data-mission-id={widget.settings.missionId}
      onClick={isDisabled ? undefined : handleMissionClick}
      title={widget.settings.missionName || "No mission configured"}
    >
      {/* Icon (using inline style for background image) */}
      {/* <div
        className="w-16 h-16 bg-contain bg-no-repeat bg-center flex-shrink-0" // Added flex-shrink-0
        style={{ backgroundImage: "url('/assets/icons/target-white.png')" }} // Make sure this path is correct relative to your public folder
      ></div> */}
      <TbTargetArrow size={60}/>

      {/* Widget Name */}
      <span className="text-sm font-medium text-center truncate w-full">
        {widget.settings.missionId ? widget.settings.missionName : "No mission"}
      </span>

      {/* Executing/Pending Indicator */}
      {(isExecuting || isPending) && (
        // Positioned absolutely, centered at bottom
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-white text-xs font-medium mt-2 bg-black bg-opacity-40 px-2 py-1 rounded">
          <Spinner size="xs" color="inherit" /> {/* Use Flowbite Spinner */}
          <span>{isPending ? "Sending..." : "Adding..."}</span>
        </div>
      )}
    </div>
  );
};

export default MissionButtonWidgetComponent;
