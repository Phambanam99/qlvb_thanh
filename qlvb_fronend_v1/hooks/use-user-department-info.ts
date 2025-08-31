import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { departmentsAPI, DepartmentDTO } from "@/lib/api/departments";

interface UserDepartmentInfo {
  departmentName: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook để lấy thông tin đơn vị của người dùng hiện tại
 * @returns Thông tin đơn vị bao gồm tên, trạng thái loading và error
 */
export function useUserDepartmentInfo(): UserDepartmentInfo {
  const { user } = useAuth();
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentInfo = async () => {
      if (!user?.departmentId) {
        setDepartmentName(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const department_ = await departmentsAPI.getDepartmentById(user.departmentId);
        const department = department_?.data || null;
        setDepartmentName(department?.name || null);
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin đơn vị");
        setDepartmentName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentInfo();
  }, [user?.departmentId]);

  return {
    departmentName,
    isLoading,
    error,
  };
}
