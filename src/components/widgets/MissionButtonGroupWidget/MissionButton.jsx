import { Spinner } from "flowbite-react"; // Import Spinner của Flowbite

/**
 * Component MissionButton "thông minh"
 * Đã tích hợp logic 'isExecuting', 'isPending', và 'isDisabled'
 */
const MissionButton = ({
  icon, // Icon JSX (ví dụ: <TbTargetArrow />)
  label, // Tên của nút
  onClick, // Hàm để gọi khi nhấn
  isExecuting, // State: Đang thực thi?
  isPending, // State: Đang gửi request?
}) => {
  // 1. TÍNH TOÁN STATE (Từ code cũ)
  const isLoading = isExecuting || isPending;
  const isDisabled = isLoading; // Nút bị vô hiệu hóa khi đang tải

  // 2. XÁC ĐỊNH CLASS ĐỘNG
  // Các class cơ bản (lấy từ code mới của bạn)
  const baseClasses = `
    w-full flex items-center justify-center gap-2 py-2 px-4
    bg-teal-700 text-white font-semibold rounded-lg shadow-md
    transition-colors duration-200
    focus:outline-none focus:ring-2
    focus:ring-teal-500 focus:ring-opacity-50
  `;

  // Class dựa trên state (lấy từ logic cũ)
  const stateClasses = isDisabled
    ? "opacity-75 cursor-wait" // Mờ đi và hiển thị con trỏ "chờ"
    : "hover:bg-teal-800 cursor-pointer"; // Cho phép hover và con trỏ "nhấn"

  return (
    <button
      type="button"
      className={`${baseClasses} ${stateClasses}`} // Kết hợp các class
      onClick={isDisabled ? undefined : onClick} // Chỉ cho phép click khi không bị vô hiệu hóa
      disabled={isDisabled} // Vô hiệu hóa nút
    >
      {/* 3. HIỂN THỊ CÓ ĐIỀU KIỆN (Từ code cũ) */}
      {isLoading ? (
        // Nếu đang tải: Hiển thị Spinner và text
        <>
          <Spinner size="sm" />
          <span className="truncate">
            {isPending ? "Sending..." : "Adding..."}
          </span>
        </>
      ) : (
        // Nếu bình thường: Hiển thị Icon và Label
        <>
          {/* Icon */}
          <div className="flex-shrink-0">{icon}</div>

          {/* 'truncate' vẫn giữ nguyên để cắt ngắn text nếu cần */}
          <span className="truncate">{label}</span>
        </>
      )}
    </button>
  );
};

export default MissionButton;
