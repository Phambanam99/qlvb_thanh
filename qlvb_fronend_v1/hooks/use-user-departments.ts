import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { departmentsAPI, DepartmentDTO } from "@/lib/api/departments";
import { ResponseDTO } from "@/lib/types/common";

export function useUserDepartments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sử dụng ref để theo dõi quá trình fetch
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Nếu đã fetch trước đó và departmentId không đổi, không fetch lại
    if (hasFetchedRef.current && departments.length > 0) {
      return;
    }

    const fetchUserDepartments = async () => {
      if (!user?.departmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Lấy phòng ban hiện tại của người dùng
        const currentDepartment_ = await departmentsAPI.getDepartmentById(
          user.departmentId
        );
        const currentDepartment = currentDepartment_.data;
        // Khởi tạo danh sách với phòng ban hiện tại
        const userDepartments = [currentDepartment];
          
        try {
          // Thêm các phòng ban con (nếu có)
          const childDepartments_: ResponseDTO<DepartmentDTO> = await departmentsAPI.getChildDepartments(
            user.departmentId
          );
          const childDepartments = childDepartments_.data.childDepartments || [];
          if (Array.isArray(childDepartments) && childDepartments.length > 0) {
            userDepartments.push(...childDepartments);
          }
        } catch (error) {
          // Tiếp tục xử lý ngay cả khi không lấy được phòng ban con
        }

        setDepartments(userDepartments);
        hasFetchedRef.current = true;
      } catch (err: any) {
        setError(err.message || "Không thể tải phòng ban");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDepartments();
  }, [user?.departmentId]);

  // Memoize departmentIds để tránh tính toán lại mỗi khi component re-render
  const departmentIds = useMemo(
    () => departments.map((dept) => dept.id),
    [departments]
  );

  return { departments, loading, error, departmentIds };
}
