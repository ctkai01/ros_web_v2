// 1. Import các component của Flowbite
import {
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownItem,
  TabItem,
  Tabs,
} from "flowbite-react";
import { useEffect, useState } from "react";
// 2. Import các icon cần thiết
import {
  FaEllipsisH, // Icons cho các nút
  FaMap,
  FaPen, // Icons cho các tab
  FaPlus,
  FaSave,
  FaTasks,
  FaTimes,
  FaTrash,
  FaWaveSquare,
} from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MapWidget from "../../../components/widgets/MapWidget";
import MissionButtonWidgetAA from "../../../components/widgets/missionButton";
import MissionButtonGroupWidget from "../../../components/widgets/MissionButtonGroupWidget";
import PauseContinueWidget from "../../../components/widgets/PauseContinueWidget";
import MissionQueueWidget from "../../../components/widgets/MissionQueueWidget";
import MissionButtonWidget from "../../../components/widgets/MissionButtonWidget";

import serverConfig from "../../../config/serverConfig";
import widgetRegistry from "./initWidgetRegistry";
import { ConfirmDialog, SuccessDialog } from "../../../components/common/";
/**
 * Một component Card có thể tái sử dụng cho mỗi widget
 * (Giữ nguyên như code trước)
 */
const WidgetCard = ({ title, children }) => {
  return (
    <Card className="h-full shadow-md">
      <div className="relative h-full">
        <h5 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h5>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {children}
        </div>
        <div className="absolute bottom-0 left-0">
          <Badge color="success" icon={FaPen} />
        </div>
      </div>
    </Card>
  );
};

/**
 * Component chính cho toàn bộ giao diện
 */
const DashboardDesign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { from, dashboardId } = location.state || {};
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editingWidget, setEditingWidget] = useState(null);

  const [activeDialog, setActiveDialog] = useState(null);
  const [dialogProps, setDialogProps] = useState({});
  const [widgets, setWidgets] = useState([]);
  //   const widgetsRef = useRef(widgets);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidget, setResizingWidget] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = useState({ colspan: 1, rowspan: 1 });
  const [resizePreview, setResizePreview] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [id]);

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
            let widget;
            switch (widgetData.type) {
              case "mission-button":
                widget = MissionButtonWidget.fromJSON(widgetData);
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "mission-action-log":
                // widget = MissionActionLogWidget.fromJSON(widgetData);
                widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "pause-continue":
                widget = PauseContinueWidget.fromJSON(widgetData);
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "mission-queue":
                widget = MissionQueueWidget.fromJSON(widgetData);
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "mission-button-group":
                widget = MissionButtonGroupWidget.fromJSON(widgetData);
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "io-status":
              case "io-status-2":
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "joystick":
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "map":
                widget = MapWidget.fromJSON(widgetData);
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              case "map-locked":
                // widget = MissionButtonWidgetAA.fromJSON(widgetData);
                widget = MissionButtonWidgetAA.fromJSON(widgetData);
                break;
              default:
                widget = MissionButtonWidgetAA.fromJSON(widgetData);
            }
            widget.displayMode = "design";
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
  // --- Helper: Tạo label cho Dropdown ---
  // Hàm này giúp tạo ra label có icon và chữ, dùng cho mỗi Dropdown
  const createDropdownLabel = (Icon, text) => (
    <div className="flex items-center gap-2">
      <Icon />
      {text}
    </div>
  );

  const handleDialogSave = (widgetId, data) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => {
        if (widget.id === widgetId) {
          const updatedWidget = widget.clone();
          if (typeof updatedWidget.updateSettings === "function") {
            updatedWidget.updateSettings(data);
          } else {
            Object.assign(updatedWidget, data);
          }
          return updatedWidget;
        }
        return widget;
      })
    );
    handleDialogClose();
  };

  const handleDialogClose = () => {
    setActiveDialog(null);
    setDialogProps({});
    setEditingWidget(null);
  };

  const handleDialogDelete = (widgetId) => {
    const updatedWidgets = widgets.filter((widget) => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    widgetRegistry.handleWidgetDelete(widgetId);
    handleDialogClose();
  };

  const handleWidgetEdit = (widgetId) => {
    console.log("handleWidgetEdit called with widgetId:", widgetId);
    const widget = widgets.find((w) => w.id === widgetId);
    console.log("Found widget:", widget);
    const editResult = widgetRegistry.handleWidgetEdit(widget.id, widget);
    console.log("editResult: ", editResult);
    if (editResult.hasDialog) {
      const finalDialogProps = {
        ...editResult.dialogProps,
        isOpen: true,
        onClose: handleDialogClose,
        onSave: (data) => handleDialogSave(widget.id, data),
        onDelete: () => handleDialogDelete(widget.id),
      };
      setActiveDialog(() => editResult.dialogComponent);
      setDialogProps(finalDialogProps);
    } else {
      console.log(
        "Widget edit requested but no dialog registered:",
        widget.type
      );
    }
  };
  const renderActiveDialog = () => {
    if (!activeDialog || !dialogProps.isOpen) {
      return null;
    }
    const DialogComponent = activeDialog;
    return <DialogComponent {...dialogProps} />;
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/dashboards/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("dashboardDeleted", {
            detail: { dashboardId: id },
          })
        );
        if (from === "view") {
          navigate(`/dashboard/view/${dashboardId || id}`);
        } else {
          navigate("/dashboard/list");
        }
      }
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      alert("Failed to delete dashboard");
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };
  console.log("widgets: ", widgets);
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* 1. Thanh Header Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 px-4 lg:px-6">
        {/* --- ĐÃ CẬP NHẬT: MỖI TAB LÀ MỘT DROPDOWN --- */}
        <Tabs aria-label="Dashboard tabs">
          {/* Dropdown "Maps" */}
          <TabItem
            active // Tab Maps đang được chọn
            title={
              <Dropdown inline label={createDropdownLabel(FaMap, "Maps")}>
                <DropdownItem icon={FaPlus}>Add Map Widget</DropdownItem>
                <DropdownItem icon={FaPlus}>Add Map Locked Widget</DropdownItem>
              </Dropdown>
            }
          >
            {/* Nội dung của tab "Maps" sẽ hiển thị bên dưới khi tab này active */}
          </TabItem>

          {/* Dropdown "Mission" */}
          <TabItem
            title={
              <Dropdown inline label={createDropdownLabel(FaTasks, "Mission")}>
                <DropdownItem icon={FaPlus}>Add Mission Item 1</DropdownItem>
                <DropdownItem icon={FaPlus}>Add Mission Item 2</DropdownItem>
              </Dropdown>
            }
          />

          {/* Dropdown "I/O status" */}
          <TabItem
            title={
              <Dropdown
                inline
                label={createDropdownLabel(FaWaveSquare, "I/O status")}
              >
                <DropdownItem icon={FaPlus}>Add I/O Item 1</DropdownItem>
              </Dropdown>
            }
          />

          {/* Dropdown "Miscellaneous" */}
          <TabItem
            title={
              <Dropdown
                inline
                label={createDropdownLabel(FaEllipsisH, "Miscellaneous")}
              >
                <DropdownItem icon={FaPlus}>Add Misc Item 1</DropdownItem>
                <DropdownItem icon={FaPlus}>Add Misc Item 2</DropdownItem>
              </Dropdown>
            }
          />
        </Tabs>
      </div>

      {/* 2. Container cho nội dung bên dưới */}
      <div className="p-4 lg:p-6">
        {/* 3. Header Phụ (Tiêu đề và các nút Save) */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Design the dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <Button color="green">
              <FaSave className="mr-2 h-5 w-5" />
              Save
            </Button>
            <Button color="light">
              <FaTimes className="mr-2 h-5 w-5" />
              Cancel
            </Button>
            <Button color="red">
              <FaTrash className="mr-2 h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 dark:bg-gray-800">
          {widgets.map((widget, index) => {
            const widgetStyle = {
              // CSS Grid lines are 1-based, your position is 0-based
              gridColumnStart: widget.position.col + 1,
              gridRowStart: widget.position.row + 1,
              // Use gridColumnEnd/gridRowEnd for spanning
              gridColumnEnd: `span ${widget.colspan || 1}`, // Default to span 1 if undefined
              gridRowEnd: `span ${widget.rowspan || 1}`, // Default to span 1 if undefined
            };

            // (Optional) Add your custom size logic here if needed
            if (widget.properties && widget.properties.resized) {
              widgetStyle.width = `${widget.properties.width}px`;
              widgetStyle.height = `${widget.properties.height}px`;
              widgetStyle.minWidth = `${widget.properties.width}px`;
              widgetStyle.minHeight = `${widget.properties.height}px`;
            }
            if (widget.render) {
              return (
                <div
                  style={widgetStyle}
                  className="bg-white rounded-lg shadow dark:bg-gray-700"
                  // className="bg-white rounded-lg shadow dark:bg-gray-700"
                >
                  {/* <div style={widgetStyle} className={widgetClasses}> */}
                  {widget.render(handleWidgetEdit)}
                </div>
              );
            } else {
              return <div className={widgetClasses}>111</div>;
            }
          })}
        </div>
        {renderActiveDialog()}
        <SuccessDialog
          visible={showSuccessDialog}
          title="Success"
          message="Dashboard saved successfully!"
          details="All widgets and their configurations have been saved to the database."
          onClose={() => setShowSuccessDialog(false)}
          buttonText="OK"
        />
        <ConfirmDialog
          visible={showDeleteConfirm}
          title="Confirm Delete"
          message={`Are you sure you want to delete dashboard "${
            dashboard?.name || "Dashboard"
          }"?`}
          onConfirm={() => {
            handleDelete();
            closeDeleteConfirm();
          }}
          onCancel={closeDeleteConfirm}
        />
      </div>
    </div>
  );
};

export default DashboardDesign;
