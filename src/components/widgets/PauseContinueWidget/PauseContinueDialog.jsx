import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { FaSave, FaTimes, FaTrash } from "react-icons/fa"; // (Tùy chọn) Icons cho nút

const PauseContinueDialog = (props) => {
  // Safely destructure props with defaults
  const {
    isOpen = false,
    onClose = () => {},
    onSave = () => {},
    onDelete = () => {},
    widget = null,
  } = props || {};

  console.log("🎭 PauseContinueDialog: Render called with props:", props);
  console.log("🎭 PauseContinueDialog: isOpen:", isOpen);
  console.log(
    "🎭 PauseContinueDialog: props keys:",
    props ? Object.keys(props) : "null"
  );

  if (!isOpen) {
    console.log("🎭 PauseContinueDialog: Not open, returning null");
    return null;
  }

  console.log("🎭 PauseContinueDialog: Rendering dialog overlay");

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      {" "}
      {/* size="md" hoặc tùy chỉnh */}
      <ModalHeader>Mission Control Widget Settings</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            A Mission Control widget allows you to start, pause, and resume
            robot missions directly from the dashboard. The widget automatically
            syncs with the robot's current mission status and provides real-time
            control capabilities.
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

export default PauseContinueDialog;
