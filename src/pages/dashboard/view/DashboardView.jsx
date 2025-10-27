import { Button, Card, ListGroup, ListGroupItem } from "flowbite-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaCheckCircle, // Icon cho bản đồ (ví dụ)
  FaCrosshairs, // Icon cho các nút mission
  FaExclamationTriangle,
  FaMapMarkerAlt, // Icon cho TestDock
  FaPlay, // Icon Success
  FaTimesCircle,
} from "react-icons/fa";
import { TbTargetArrow } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
// import MissionActionLogWidget from "../../../components/widgets/MissionActionLogWidget";
// import MissionButtonGroupWidget from "../../../components/widgets/MissionButtonGroupWidget";
import serverConfig from "../../../config/serverConfig";
import MissionButtonWidget from "../designDashboard/MissionButtonWidget/MissionButtonWidget";
import MissionButtonGroupWidget from "../designDashboard/MissionButtonGroupWidget";
import MissionActionLogWidget from "../designDashboard/MissionActionLogWidget/MissionActionLogWidget";
import PauseContinueWidget from "../designDashboard/PauseContinueWidget/PauseContinueWidget";
import MissionQueueWidget from "../designDashboard/MissionQueueWidget/MissionQueueWidget";
import IOStatusWidget from "../designDashboard/IOStatusWidget/IOStatusWidget";
import JoystickWidget from "../designDashboard/JoystickWidget/JoystickWidget";
import MapWidget from "../designDashboard/MapWidget/MapWidget";
// import MapLockedWidget from "../designDashboard/MapLockedWidget/MapLockedWidget";
// import Widget from "../designDashboard/Widget/Widget";
;
// --- COMPONENT CON (WIDGETS) ---
// Chúng ta tạo các component con cho sạch sẽ

// const WidgetRenderer = React.memo(({ widget }) => {
//   if (widget.render) {
//     // Gọi hàm render() của đối tượng widget
//     return widget.render();
//   }

//   // Fallback (dự phòng) nếu widget không có hàm render
//   return (
//     <div className="p-4">
//       <h3 className="font-bold text-lg text-foreground">{widget.title}</h3>
//       <p className="text-sm text-muted-foreground">
//         (Widget type: {widget.type})
//       </p>
//     </div>
//   );
// });

// // 1. Widget Bản đồ (Cột trái)
// const MapWidget = () => {
//   return (
//     <Card
//       // row-span-4: Chiếm 4 hàng, col-span-2: Chiếm 2 cột
//       className="col-span-3 lg:col-span-2 row-span-4 flex flex-col h-full"
//       theme={{ root: { base: "bg-background flex flex-col h-full" } }}
//     >
//       {/* Toolbar của bản đồ (ví dụ) */}
//       <div className="flex justify-between items-center p-2 border-b border-border">
//         <span className="font-semibold text-foreground">Map View</span>
//         {/* Thêm các nút zoom, v.v. ở đây */}
//       </div>
//       {/* Khu vực bản đồ (Placeholder) */}
//       <div className="flex-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
//         <FaMapMarkerAlt size={50} className="text-muted-foreground" />
//       </div>
//     </Card>
//   );
// };

// // 2. Widget TestDock (Xanh lá)
// const TestDockWidget = () => {
//   return (
//     <Card className="bg-green-500 text-white col-span-3 lg:col-span-1">
//       <div className="flex flex-col items-center justify-center gap-2">
//         <FaCrosshairs size={30} />
//         <span className="text-lg font-semibold">TestDock</span>
//       </div>
//     </Card>
//   );
// };

// // 3. Widget Start Mission (Xanh dương)
// const StartMissionWidget = () => {
//   return (
//     <Card className="bg-gray-800 col-span-3 lg:col-span-1">
//       <Button color="blue" fullSized>
//         <FaPlay className="mr-2 h-4 w-4" />
//         Start Mission
//       </Button>
//     </Card>
//   );
// };

// // 4. Widget Mission Queue (Hàng chờ)
// const MissionQueueWidget = () => {
//   return (
//     <Card className="col-span-3 lg:col-span-1">
//       <p className="text-sm text-muted-foreground italic">
//         Waiting for mission queue...
//       </p>
//     </Card>
//   );
// };

// // 5. Widget Mission Log (Nhật ký)
// const MissionLogWidget = () => {
//   return (
//     <Card className="col-span-3 lg:col-span-1 row-span-2">
//       <ListGroup className="border-0">
//         {/* Mục Error */}
//         <ListGroupItem className="border-0 p-2 flex items-center gap-2">
//           <FaTimesCircle className="text-red-500 mr-2" />
//           <span className="text-xs text-red-500">
//             Error: ... executing actions.
//           </span>
//           <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 rounded">
//             26.02
//           </span>
//         </ListGroupItem>
//         {/* Mục Warning */}
//         <ListGroupItem className="border-0 p-2 flex items-center gap-2">
//           <FaExclamationTriangle className="text-yellow-400 mr-2" />
//           <span className="text-xs text-muted-foreground">
//             Mission: Sub-mission finished...
//           </span>
//           <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 rounded">
//             26.01
//           </span>
//         </ListGroupItem>
//         {/* Mục Success */}
//         <ListGroupItem className="border-0 p-2 flex items-center gap-2">
//           <FaCheckCircle className="text-green-500 mr-2" />
//           <span className="text-xs text-muted-foreground">
//             Mover: Successfully loaded pose...
//           </span>
//           <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 rounded">
//             25.53
//           </span>
//         </ListGroupItem>
//       </ListGroup>
//     </Card>
//   );
// };

// // 6. Widget Nhóm nút Mission
// const MissionButtonsWidget = () => {
//   return (
//     <Card className="col-span-3 lg:col-span-1">
//       <div className="grid grid-cols-3 gap-2">
//         <MissionButton icon={<TbTargetArrow />} label="DD_Mission" />
//         <MissionButton
//           icon={<TbTargetArrow />}
//           label="DDE_Mission_Move_To_P1"
//         />
//         <MissionButton
//           icon={<TbTargetArrow />}
//           label="Go to factorydsdssssssssssssssssssss"
//         />
//         {/* Nút này sẽ tự động xuống hàng */}
//         <MissionButton icon={<TbTargetArrow />} label="Go to asdas" />
//       </div>
//     </Card>
//   );
// };

// const MissionButton = ({ icon, label }) => {
//   return (
//     <button
//       type="button"
//       className="w-full flex items-center justify-center gap-2 py-2 px-4
//                  bg-teal-700 text-white font-semibold rounded-lg shadow-md
//                  hover:bg-teal-800 focus:outline-none focus:ring-2
//                  focus:ring-teal-500 focus:ring-opacity-50
//                  transition-colors duration-200"
//     >
//       {/* Icon */}
//       <div className="flex-shrink-0">{icon}</div>

//       {/* 'truncate' vẫn giữ nguyên để cắt ngắn text nếu cần */}
//       <span className="truncate">{label}</span>
//     </button>
//   );
// };

// --- COMPONENT CHA (TRANG CHÍNH) ---
const DashboardView = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);

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
          const loadedWidgets = data.properties.widgets
            .filter((w) => {
              return (
                w.type === "mission-button-group" ||
                w.type === "mission-action-log"
              );
            })
            .map((widgetData) => {
              // ... (toàn bộ logic switch/case của bạn giữ nguyên)
              console.log("widgetData", widgetData);
              //   // ... (toàn bộ logic switch/case của bạn giữ nguyên)
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
                // case "map-locked":
                //   widget = MapLockedWidget.fromJSON(widgetData);
                //   break;
                // default:
                //   widget = Widget.fromJSON(widgetData);
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
  console.log("widgets: ", widgets);
  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. Header (Tiêu đề) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard: Test
          </h1>
          <p className="text-muted-foreground mt-1">Contains 6 widget(s)</p>
        </div>
        <div>
          <Button className="cursor-pointer">Open in DashboardDesigner</Button>
        </div>
      </div>

      {/* 2. Grid Layout */}
      {/* Grid 3 cột trên desktop (lg:grid-cols-3)
        Grid 1 cột trên mobile (grid-cols-1)
        Khoảng cách (gap-4)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       
        {/* <MapWidget /> */}

        <div className="col-span-3 lg:col-span-1 flex flex-col gap-4">
          {/* <TestDockWidget /> */}
          {/* <StartMissionWidget /> */}
          {/* <MissionQueueWidget /> */}
          
          {widgets.map((widget, index) => {
            if (widget.render) {
              return widget.render();
            } else {
              return widget;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
