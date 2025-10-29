import { useEffect, useState } from "react";
import serverConfig from "../../../config/serverConfig";
// 1. Import các component từ Flowbite-React
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Spinner,
} from "flowbite-react";
import { FaSave, FaTimes, FaTrash } from "react-icons/fa"; // (Tùy chọn) Icons cho nút

const MissionButtonGroupDialog = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  widget,
}) => {
  const [groups, setGroups] = useState([]);
  const currentGroupId = widget ? widget.settings.groupId : null;

  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      // Chuyển currentGroupId sang string để khớp với value của <Select>
      setSelectedGroupId(currentGroupId ? String(currentGroupId) : "");
    }
  }, [isOpen, currentGroupId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      console.log("Fetching groups from database");
      const response = await fetch(`${serverConfig.SERVER_URL}/api/groups`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Groups data from server:", data);
        if (Array.isArray(data)) {
          const formattedGroups = data.map((group) => ({
            id: group.ID, // Chuyển thành string để Select hoạt động tốt
            name: group.groupName,
          }));
          console.log("Formatted groups:", formattedGroups);
          setGroups(formattedGroups);
        } else {
          throw new Error("Invalid groups data format");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch groups:", response.status, errorText);
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      // Fallback data khi lỗi
      setGroups([
        { id: 1, name: "Group A" },
        { id: 2, name: "Group B" },
        { id: 3, name: "Group C" },
        { id: 4, name: "Patrol Group" },
        { id: 5, name: "Delivery Group" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedGroupId) {
      const selectedGroup = groups.find(
        (g) => String(g.id) === selectedGroupId
      ); // So sánh string
      if (selectedGroup) {
        onSave({
          groupId: parseInt(selectedGroup.id, 10), // Chuyển về số nếu cần
          groupName: selectedGroup.name,
        });
      }
    } else {
      onSave(null); // Gửi null nếu "No group" được chọn
    }
    onClose(); // Đóng modal sau khi lưu
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(); // Gọi hàm xóa widget nếu có
    } else {
      onSave(null); // Fallback: Xóa group khỏi widget
    }
    onClose(); // Đóng modal sau khi xóa
  };

  // Không cần handleKeyDown vì Flowbite Modal xử lý escape key
  // và nút submit form không gây reload trang trong React

  // 2. Sử dụng component Modal của Flowbite
  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      {" "}
      {/* size="md" hoặc tùy chỉnh */}
      <ModalHeader>Mission button group</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          {" "}
          {/* Tailwind class cho khoảng cách */}
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            You can start a mission group from the dashboard by adding a Mission
            Button Group widget and selecting a predefined group.
          </p>
          <div>
            {/* 3. Sử dụng Label và Select của Flowbite */}
            <div className="mb-2 block">
              <Label htmlFor="group-select" value="Group" />
            </div>
            <Select
              id="group-select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">No group</option>
              {groups.map((group, index) => (
                // Đảm bảo value là string
                <option
                  key={`group-${group.id || `temp-${index}`}`}
                  value={String(group.id)}
                >
                  {group.name}
                </option>
              ))}
            </Select>
            {/* Hiển thị spinner khi đang tải */}
            {loading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Spinner
                  aria-label="Loading groups"
                  size="sm"
                  className="mr-2"
                />
                Loading groups...
              </div>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {/* 4. Sử dụng Button của Flowbite */}
        <Button
          className="cursor-pointer"
          color="green"
          onClick={handleSave}
          disabled={loading}
        >
          <FaSave className="mr-2 h-5 w-5" /> Save
        </Button>
        <Button
          className="cursor-pointer"
          color="red"
          onClick={handleDelete}
          disabled={loading}
        >
          <FaTrash className="mr-2 h-5 w-5" /> Delete
        </Button>
        <Button
          className="cursor-pointer"
          color="light"
          onClick={onClose}
          disabled={loading}
        >
          <FaTimes className="mr-2 h-5 w-5" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MissionButtonGroupDialog;
