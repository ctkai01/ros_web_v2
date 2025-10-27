import { useState } from "react";
import { TbTargetArrow } from "react-icons/tb";
import serverConfig from "../../../config/serverConfig";
// import MissionButton from "./MissionButton";

const MissionButtonWidgetComponent = ({ widget, onEdit }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleMissionClick = async () => {
    if (!widget.settings.missionId) {
      console.warn("No mission ID configured");
      return;
    }

    if (isExecuting || isPending) {
      console.log("Mission is already executing or request is pending");
      return;
    }

    try {
      setIsPending(true); // Set pending state immediately to prevent double click
      console.log(`🔄 Adding mission ${widget.settings.missionId} to queue...`);

      const token = localStorage.getItem("token");
      const url =
        typeof window !== "undefined" &&
        window.location &&
        window.location.port === "8080"
          ? "/api/missions/queue/add"
          : `${serverConfig.SERVER_URL}/api/missions/queue/add`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionId: widget.settings.missionId,
          siteId: widget.settings.siteId || 1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status} ${response.statusText} ${errText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ Mission added to queue successfully:", data);
        // Clear indicators immediately on success
        setIsExecuting(false);
        setIsPending(false);
      } else {
        console.error("❌ Failed to add mission to queue:", data);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        console.warn("Mission add request aborted by timeout");
      } else {
        console.error("❌ Error adding mission to queue:", error);
      }
    } finally {
      try {
        clearTimeout(timeoutId);
      } catch (_) {}
      // Always reset states after request completes (ensure spinner stops)
      setIsPending(false);
      setIsExecuting(false);
    }
  };

  if (widget.displayMode === "display") {
    return (
      <MissionButton
        icon={<TbTargetArrow />}
        isExecuting={isExecuting}
        isPending={isPending}
        handleMissionClick={handleMissionClick}
        label={widget.settings.missionName}
        missionId={widget.settings.missionId}
      />
    );
    // return MissionButton(icon widget, handleMissionClick, isExecuting, isPending);
  } else {
    // return renderDesignMode(widget, onEdit);
    // return MissionButton(widget, handleMissionClick, isExecuting, isPending);
    return (
      <MissionButton
        icon={<TbTargetArrow />}
        isExecuting={isExecuting}
        isPending={isPending}
        handleMissionClick={handleMissionClick}
        label={widget.settings.missionName}
        missionId={widget.settings.missionId}
      />
    );
  }
};

const renderDisplayMode = (
  widget,
  handleMissionClick,
  isExecuting,
  isPending
) => {
  const isDisabled = isExecuting || isPending;
  return (
    <div
      className={`mission-button-widget display-mode ${
        isExecuting ? "executing" : ""
      } ${isPending ? "pending" : ""}`}
      data-widget-id={widget.id}
      data-mission-id={widget.settings.missionId}
      onClick={isDisabled ? undefined : handleMissionClick}
      style={{
        cursor: isDisabled
          ? "wait"
          : widget.settings.missionId
          ? "pointer"
          : "default",
      }}
    >
      <div className="widget-content">
        <span className="target-icon"></span>
        <span className="widget-name">
          {widget.settings.missionId
            ? widget.settings.missionName
            : "No mission"}
        </span>
        {(isExecuting || isPending) && (
          <div className="executing-indicator">
            <span className="loading-spinner"></span>
            <span>
              {isPending ? "Sending request..." : "Adding to queue..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionButtonWidgetComponent;
