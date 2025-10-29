import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { FaSave, FaTimes, FaTrash } from "react-icons/fa"; // (Tùy chọn) Icons cho nút

const MissionQueueDialog = ({
  isOpen = false,
  widget,
  onSave,
  onClose,
  onDelete,
}) => {
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      {" "}
      {/* size="md" hoặc tùy chỉnh */}
      <ModalHeader>Mission Queue Widget</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            The Mission Queue Widget displays and manages a list of missions
            that are queued for execution. It provides real-time status updates
            and allows users to monitor mission progress.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        {/* 4. Sử dụng Button của Flowbite */}
        <Button className="cursor-pointer" color="light" onClick={handleClose}>
          <FaSave className="mr-2 h-5 w-5" /> Close
        </Button>
        <Button className="cursor-pointer" color="red" onClick={handleDelete}>
          <FaTrash className="mr-2 h-5 w-5" /> Delete
        </Button>
        <Button className="cursor-pointer" color="light" onClick={handleClose}>
          <FaTimes className="mr-2 h-5 w-5" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MissionQueueDialog;
