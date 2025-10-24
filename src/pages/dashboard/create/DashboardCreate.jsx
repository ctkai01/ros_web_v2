import { Button, Card, HelperText, Label, TextInput } from "flowbite-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Import thư viện form
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

/**
 * Trang tạo Dashboard mới
 */
const DashboardCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. ĐỊNH NGHĨA SCHEMA VALIDATION (Luật)
  // Dùng useMemo để schema không bị tạo lại mỗi lần render
  const schema = useMemo(
    () =>
      yup.object().shape({
        // Tên 'dashboardName' phải là chuỗi, và là bắt buộc (required)
        dashboardName: yup
          .string()
          .required(t("dashboard.createPage.validation.nameRequired")),
      }),
    [t]
  ); // Phụ thuộc vào `t` để dịch thông báo lỗi

  // 2. KHỞI TẠO REACT-HOOK-FORM
  const {
    control, // Dùng để kết nối <Controller> với form
    handleSubmit, // Dùng để bọc hàm onSubmit
    formState: { errors }, // Chứa các lỗi validation (ví dụ: errors.dashboardName)
  } = useForm({
    resolver: yupResolver(schema), // Kết nối react-hook-form với yup
    defaultValues: {
      dashboardName: "", // Giá trị mặc định ban đầu
    },
  });

  // Hàm quay lại trang trước
  const handleGoBack = () => {
    navigate(-1); // Quay lại 1 trang trong lịch sử trình duyệt
  };

  // 3. HÀM XỬ LÝ SUBMIT
  const onSubmit = (data) => {
    // Hàm này CHỈ CHẠY khi form đã hợp lệ (valid)
    // `data` là đối tượng { dashboardName: "..." }
    console.log("Form data is valid:", data);
    alert("Form hợp lệ! Đang lưu...\n" + JSON.stringify(data, null, 2));
    // TODO: Thêm logic gọi API để tạo mới ở đây

    // Sau khi tạo xong, có thể chuyển hướng:
    // navigate('/dashboard/main');
  };
  console.log("Error: ", errors.dashboardName);
  return (
    <div className="flex flex-col gap-6">
      {/* === 1. HEADER (Tiêu đề & Nút Go Back) === */}
      <div className="flex justify-between items-center">
        {/* Tiêu đề */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("dashboard.createPage.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.createPage.subtitle")}
          </p>
        </div>

        {/* Nút Go Back */}
        <Button
          color="light"
          className="border dark:border-gray-600 cursor-pointer"
          onClick={handleGoBack}
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          {t("dashboard.createPage.goBack")}
        </Button>
      </div>

      {/* === 2. CARD (Chứa Form) === */}
      <Card>
        {/* 4. KẾT NỐI HÀM SUBMIT VỚI <form> */}
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)} // <-- Kết nối ở đây
        >
          {/* 2a. Trường nhập tên */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="dashboard-name" className="font-semibold">
                {t("dashboard.createPage.formLabel")}
              </Label>
            </div>

            {/* 5. DÙNG <Controller> ĐỂ KẾT NỐI VỚI FLOWBITE */}
            <Controller
              name="dashboardName" // Tên này phải khớp với schema
              control={control}
              render={({ field }) => (
                <>
                  <TextInput
                    {...field} // Truyền (value, onChange, onBlur, ref) vào TextInput
                    id="dashboard-name"
                    type="text"
                    // Tự động đổi màu và hiển thị lỗi
                    color={errors.dashboardName ? "failure" : "gray"}
                  />
                  {errors.dashboardName && (
                    <HelperText color="failure">
                      {errors.dashboardName.message}
                    </HelperText>
                  )}
                </>
              )}
            />
          </div>

          {/* 2b. Nút bấm (Create & Cancel) */}
          <div className="flex gap-2 mt-4">
            <Button className="cursor-pointer" type="submit" color="green">
              <FaCheck className="mr-2 h-4 w-4" />
              {t("dashboard.createPage.createButton")}
            </Button>
            <Button
              type="button" // Quan trọng: type="button" để không submit form
              color="light"
              className="border dark:border-gray-600 cursor-pointer"
              onClick={handleGoBack} // Nút Cancel cũng quay lại
            >
              <FaTimes className="mr-2 h-4 w-4" />
              {t("dashboard.createPage.cancelButton")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DashboardCreate;
