import React from "react";
// 1. Import các component của Flowbite
import { Button, Card, Badge, Tabs, Dropdown, DropdownItem, TabItem } from "flowbite-react";
// 2. Import các icon cần thiết
import {
  FaSave,
  FaTimes,
  FaTrash,
  FaPen, // Icons cho các nút
  FaMap,
  FaTasks,
  FaWaveSquare,
  FaEllipsisH, // Icons cho các tab
  FaPlus, // Icon cho Dropdown Item
} from "react-icons/fa";

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
const DashboardEditor = () => {
  // --- Helper: Tạo label cho Dropdown ---
  // Hàm này giúp tạo ra label có icon và chữ, dùng cho mỗi Dropdown
  const createDropdownLabel = (Icon, text) => (
    <div className="flex items-center gap-2">
      <Icon />
      {text}
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* 1. Thanh Header Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 px-4 lg:px-6">
        {/* --- ĐÃ CẬP NHẬT: MỖI TAB LÀ MỘT DROPDOWN --- */}
        <Tabs aria-label="Dashboard tabs" >
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

        {/* 4. Grid Layout chính */}
        {/* Nội dung này sẽ được hiển thị khi tab "Maps" active.
           Bạn cần dùng state để thay đổi nội dung này khi click các tab khác.
        */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-2/3">
            <WidgetCard title="Map">No settings</WidgetCard>
          </div>
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <WidgetCard title="Mission Button Group">
              Group ID: 1 | Group Name: Move
            </WidgetCard>
            <div className="grid grid-cols-2 gap-4">
              <WidgetCard title="Mission Control">
                Pause/Continue Mission
              </WidgetCard>
              <WidgetCard title="Mission Queue">No settings</WidgetCard>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <WidgetCard title="Mission Button">TestDock</WidgetCard>
              <WidgetCard title="Mission Action Log">
                Limit: 10 | Auto Scroll: true | ShowTimestamp: true | Filter
                Level: all
              </WidgetCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEditor;
