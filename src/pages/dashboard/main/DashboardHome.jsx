import {
  Button,
  Card,
  Label,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaEye,
  FaPalette,
  FaPen,
  FaPlus,
  FaTachometerAlt,
  FaTrashAlt,
} from "react-icons/fa";
import { GrClear } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
// 1. Dữ liệu giả (dummy data) cho bảng
const dummyDashboards = [
  {
    id: 30,
    name: "Test",
    createdBy: "Administrator",
  },
  {
    id: 2,
    name: "nam",
    createdBy: "admin",
  },
];

/**
 * Đây là component trang con, sẽ được render vào <Outlet />
 */
const DashboardHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Logic filter (ví dụ)
  const filteredData = dummyDashboards.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = 1; // Tính toán tổng số trang nếu cần

  const handleCreateDashboard = () => {
    navigate("/dashboard/create");
  };

  const handleViewDashboard = (id) => {
    navigate(`/dashboard/view/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* === 1. HEADER (Tiêu đề & Nút bấm) === */}
      <div className="flex justify-between items-center">
        {/* Tiêu đề */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-white">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Nút bấm */}
        <div className="flex gap-2">
          <Button
            color="green"
            className="cursor-pointer"
            onClick={handleCreateDashboard}
          >
            <FaPlus className="mr-2" />
            {t("dashboard.create")}
          </Button>
          <Button
            color="light"
            className="border dark:border-gray-600 cursor-pointer"
          >
            <GrClear className="mr-2" />
            {t("dashboard.clearFilters")}
          </Button>
        </div>
      </div>

      {/* === 2. CARD (Chứa Toolbar & Bảng) === */}
      <Card>
        {/* 2a. Toolbar (Filter & Count) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-name" className="font-semibold">
              {t("dashboard.filter")}:
            </Label>
            <TextInput
              id="filter-name"
              placeholder={t("dashboard.filterPlaceholder")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-72"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredData.length} {t("dashboard.itemsFound")}
          </span>
        </div>

        {/* 2b. Bảng (Table) */}
        <div className="overflow-x-auto">
          <Table hoverable>
            {/* Header của bảng */}
            <TableHead>
              <TableHeadCell>{t("dashboard.table.name")}</TableHeadCell>
              <TableHeadCell className="text-center">
                {t("dashboard.table.createdBy")}
              </TableHeadCell>
              <TableHeadCell className="text-center">
                {t("dashboard.table.functions")}
              </TableHeadCell>
            </TableHead>

            {/* Nội dung bảng */}
            <TableBody className="divide-y">
              {filteredData.map((item) => (
                <TableRow key={item.name} className="bg-white dark:bg-gray-800">
                  {/* Cột Tên */}
                  <TableCell className="whitespace-nowrap font-medium text-foreground dark:text-white">
                    <div className="flex items-center gap-2">
                      <FaTachometerAlt
                        size={20}
                        color=""
                        className="text-green-500"
                      />
                      {item.name}
                    </div>
                  </TableCell>

                  {/* Cột Created By */}
                  <TableCell className="text-center">
                    {item.createdBy}
                  </TableCell>

                  {/* Cột Chức năng (Icons) */}
                  <TableCell>
                    <div className="flex gap-3 justify-center">
                      {/* Dùng thẻ 'a' hoặc 'button' */}
                      <Button
                        className="cursor-pointer"
                        onClick={() => handleViewDashboard(item.id)}
                        color="green"
                        title="View"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        color="purple"
                        title="Design"
                      >
                        <FaPalette />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        color="yellow"
                        title="Edit"
                      >
                        <FaPen />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        color="red"
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 2c. Phân trang (Pagination) */}
        <div className="flex justify-end mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showIcons // Hiển thị icon mũi tên
          />
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;
