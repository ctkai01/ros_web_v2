import { Button, Card, Spinner } from "flowbite-react"; // Import Flowbite
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // Import i18n
import { useNavigate, useParams } from "react-router-dom";

// Import các widget (giữ nguyên)
import serverConfig from "../../../config/serverConfig";
import Widget from "../../../models/Widget";
import IOStatusWidget from "../designDashboard/IOStatusWidget/IOStatusWidget";
import JoystickWidget from "../designDashboard/JoystickWidget/JoystickWidget";
import MapLockedWidget from "../designDashboard/MapWidget/MapLockedWidget";
import MapWidget from "../designDashboard/MapWidget/MapWidget";
import MissionActionLogWidget from "../designDashboard/MissionActionLogWidget/MissionActionLogWidget";
import MissionButtonGroupWidget from "../designDashboard/MissionButtonGroupWidget/MissionButtonGroupWidget";
import MissionButtonWidget from "../designDashboard/MissionButtonWidget/MissionButtonWidget";
import MissionQueueWidget from "../designDashboard/MissionQueueWidget/MissionQueueWidget";
import PauseContinueWidget from "../designDashboard/PauseContinueWidget/PauseContinueWidget";

// TÁCH RIÊNG WidgetRenderer RA NGOÀI VÀ THÊM STYLE TAILWIND
const WidgetRenderer = React.memo(({ widget }) => {
  if (widget.render) {
    return widget.render();
  } else {
    // Fallback render (nếu có) được style bằng Tailwind
    return (
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground">{widget.title}</h3>
        <p className="text-sm text-muted-foreground">{widget.settings}</p>
      </div>
    );
  }
});

const DashboardView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Lấy hàm t
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  // XÓA BỎ: useEffect áp dụng size bằng DOM
  // Lý do: Logic render bên dưới đã xử lý việc này bằng inline style,
  // dùng useEffect là thừa và không phải là "cách của React".
  useEffect(() => {
    if (!loading && widgets.length > 0) {
      // Delay để đảm bảo DOM đã render hoàn toàn
      const applyTimer = setTimeout(() => {
        console.log("=== ViewDashboard APPLYING SIZES ===");

        widgets.forEach((widget) => {
          const hasCustomSize = widget.hasCustomSize
            ? widget.hasCustomSize()
            : widget.properties && widget.properties.resized;

          if (hasCustomSize) {
            const widgetElement = document.querySelector(
              `[data-widget-id="${widget.id}"]`
            );
            if (widgetElement) {
              const customSize = widget.getSize
                ? widget.getSize()
                : widget.properties && widget.properties.resized
                ? {
                    width: widget.properties.width,
                    height: widget.properties.height,
                  }
                : null;

              if (customSize) {
                widgetElement.style.width = `${customSize.width}px`;
                widgetElement.style.height = `${customSize.height}px`;
                widgetElement.style.minWidth = `${customSize.width}px`;
                widgetElement.style.minHeight = `${customSize.height}px`;

                console.log(`✅ Applied DOM size to widget ${widget.id}:`, {
                  width: customSize.width,
                  height: customSize.height,
                  type: widget.type,
                  title: widget.title,
                });
              }
            } else {
              console.warn(
                "⚠️ Widget element not found for size application:",
                {
                  widgetId: widget.id,
                  title: widget.title,
                  selector: `[data-widget-id="${widget.id}"]`,
                }
              );
            }
          }
        });
      }, 300); // Delay 300ms sau khi loading hoàn tất

      return () => clearTimeout(applyTimer);
    }
  }, [loading, widgets.length]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/dashboards/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);

        if (data.properties && data.properties.widgets) {
          const loadedWidgets = data.properties.widgets.map((widgetData) => {
            // ... (toàn bộ logic switch/case của bạn giữ nguyên)
            let widget;
            switch (widgetData.type) {
              case "mission-button":
                widget = MissionButtonWidget.fromJSON(widgetData);
                break;
              case "mission-button-group":
                widget = MissionButtonGroupWidget.fromJSON(widgetData);
                break;
              case "mission-action-log":
                widget = MissionActionLogWidget.fromJSON(widgetData);
                break;
              case "pause-continue":
                widget = PauseContinueWidget.fromJSON(widgetData);
                break;
              case "mission-queue":
                widget = MissionQueueWidget.fromJSON(widgetData);
                break;
              case "io-status":
              case "io-status-2":
                widget = IOStatusWidget.fromJSON(widgetData);
                break;
              case "joystick":
                widget = JoystickWidget.fromJSON(widgetData);
                break;
              case "map":
                widget = MapWidget.fromJSON(widgetData);
                console.log("mapwidget", widgetData);
                break;
              case "map-locked":
                widget = MapLockedWidget.fromJSON(widgetData);
                break;
              default:
                widget = Widget.fromJSON(widgetData);
            }
            if (widget && widget.setDisplayMode) {
              widget.setDisplayMode();
            }
            return widget;
          });
          setWidgets(loadedWidgets);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/design/${id}`, {
      state: { from: "view", dashboardId: id },
    });
  };

   const handleBack = () => {
     navigate("/dashboard/list");
   };

  // Giao diện Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="xl" />
        <span className="ml-4 text-muted-foreground">
          {t("dashboard.view.loading")}
        </span>
      </div>
    );
  }

  // Giao diện Lỗi
  if (!dashboard) {
    return (
      <div className="flex justify-center items-center h-full text-red-600">
        {t("dashboard.view.notFound")}
      </div>
    );
  }

  // Giao diện chính (ĐÃ REFACTOR VỚI TAILWIND & FLOWBITE)
  return (
    <div className="flex flex-col w-full gap-6">
      {/* === 1. HEADER (Style lại giống trang Create) === */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            {dashboard.name}
          </h1>
          <span className="text-muted-foreground pt-1">
            | {t("dashboard.view.contains", { count: widgets.length })}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            color="light"
            className="border dark:border-gray-600"
            onClick={handleEdit}
          >
            {t("dashboard.view.openDesigner")}
          </Button>
        </div>
      </div>

      {/* === 2. GRID (Style lại bằng Tailwind) === */}
      <div
        className="grid grid-cols-4 grid-rows-10 gap-4"
        // Dùng grid-auto-rows để set chiều cao row tối thiểu
        // Lấy từ CSS cũ: grid-template-rows: repeat(10, minmax(120px, 1fr));
        style={{ gridAutoRows: "minmax(120px, 1fr)" }}
      >
        {widgets.map((widget) => {
          // LOGIC STYLE CỦA BẠN (ĐÃ TỐI ƯU)
          // Logic này xác định VỊ TRÍ và KÍCH THƯỚC
          const widgetStyle = {
            gridRow: `${widget.position.row + 1} / span ${widget.rowspan || 1}`,
            gridColumn: `${widget.position.col + 1} / span ${
              widget.colspan || 1
            }`,
          };

          const hasCustomSize = widget.properties && widget.properties.resized;
          if (hasCustomSize) {
            const customSize = widget.properties;
            widgetStyle.width = `${customSize.width}px`;
            widgetStyle.height = `${customSize.height}px`;
            widgetStyle.minWidth = `${customSize.width}px`;
            widgetStyle.minHeight = `${customSize.height}px`;
          }

          // === 3. WIDGET ITEM (Dùng <Card> của Flowbite) ===
          return (
            <Card
              key={widget.id}
              // Thêm hiệu ứng hover từ CSS cũ
              className="transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-xl p-0"
              style={widgetStyle}
              data-widget-id={widget.id}
              // Bắt buộc Card phải fill đầy ô grid của nó
              theme={{ root: { base: "bg-background flex flex-col h-full" } }}
            >
              <WidgetRenderer widget={widget} />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(DashboardView);
