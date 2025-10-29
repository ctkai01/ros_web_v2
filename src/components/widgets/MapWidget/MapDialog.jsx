import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { FaSave, FaTimes, FaTrash } from "react-icons/fa"; // (Tùy chọn) Icons cho nút

const MapDialog = (props) => {
  // Safely destructure props with defaults
  const {
    isOpen = false,
    onClose = () => {},
    onSave = () => {},
    onDelete = () => {},
    widget = null,
  } = props || {};

  console.log("🎭 MapDialog: Render called with props:", props);
  console.log("🎭 MapDialog: isOpen:", isOpen);
  console.log("🎭 MapDialog: props keys:", props ? Object.keys(props) : "null");

  if (!isOpen) {
    console.log("🎭 MapDialog: Not open, returning null");
    return null;
  }

  console.log("🎭 MapDialog: Rendering dialog overlay");

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      {" "}
      {/* size="md" hoặc tùy chỉnh */}
      <ModalHeader>Map Widget Settings</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            A Map widget makes the active map visible on the dashboard. You can
            add and edit positions and markers in the widget and adjust the
            robot's position.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        {/* 4. Sử dụng Button của Flowbite */}
        <Button className="cursor-pointer" color="light" onClick={onClose}>
          <FaSave className="mr-2 h-5 w-5" /> Close
        </Button>
        <Button className="cursor-pointer" color="red" onClick={onDelete}>
          <FaTrash className="mr-2 h-5 w-5" /> Delete
        </Button>
        <Button className="cursor-pointer" color="light" onClick={onClose}>
          <FaTimes className="mr-2 h-5 w-5" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MapDialog;
