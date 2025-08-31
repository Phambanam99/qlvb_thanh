"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { usersAPI, UserDTO } from "@/lib/api/users";

export function useDepartmentUsers(
  leadershipRoleOrder: Record<string, number>
) {
  const [departmentUsers, setDepartmentUsers] = useState<
    Record<number, UserDTO[]>
  >({});
  const [isLoadingUsers, setIsLoadingUsers] = useState<Record<number, boolean>>(
    {}
  );
  const { toast } = useToast();

  // Fetch department users when a department is expanded
  const fetchDepartmentUsers = async (departmentId: number) => {
    if (departmentUsers[departmentId] || isLoadingUsers[departmentId]) {
      return; // Avoid duplicate fetches
    }

    try {
      setIsLoadingUsers((prev) => ({ ...prev, [departmentId]: true }));

      // Fetch users for this department from API
      const response_ = await usersAPI.getUsersByDepartmentId(departmentId);
      const response = response_.data;

      // Sort users by leadership roles
      const sortedUsers = sortUsersByLeadershipRole(response || []);

      setDepartmentUsers((prev) => ({
        ...prev,
        [departmentId]: sortedUsers,
      }));
    } catch (error) {
      console.error(
        `Error fetching users for department ${departmentId}:`,
        error
      );
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng của phòng ban",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers((prev) => ({ ...prev, [departmentId]: false }));
    }
  };

  // Sort users by leadership role (leadership roles first)
  const sortUsersByLeadershipRole = (users: UserDTO[]): UserDTO[] => {
    return [...users].sort((a, b) => {
      const aIsLeader =
        a.roles?.some(
          (role) =>
            role.startsWith("ROLE_CUC") ||
            role.startsWith("ROLE_TRUONG") ||
            role.startsWith("ROLE_PHO") ||
            role.startsWith("ROLE_CHINH_UY") ||
            role.startsWith("ROLE_PHO_CHINH_UY")
        ) || false;

      const bIsLeader =
        b.roles?.some(
          (role) =>
            role.startsWith("ROLE_CUC") ||
            role.startsWith("ROLE_TRUONG") ||
            role.startsWith("ROLE_PHO") ||
            role.startsWith("ROLE_CHINH_UY") ||
            role.startsWith("ROLE_PHO_CHINH_UY")
        ) || false;

      if (aIsLeader && !bIsLeader) return -1;
      if (!aIsLeader && bIsLeader) return 1;

      const aHighestRoleOrder = getHighestRolePriority(a.roles || []);
      const bHighestRoleOrder = getHighestRolePriority(b.roles || []);

      return aHighestRoleOrder - bHighestRoleOrder;
    });
  };

  // Get the highest priority role order for a user
  const getHighestRolePriority = (roles: string[]): number => {
    let highestPriority = 1000; // Default lower priority

    for (const role of roles) {
      const priority = leadershipRoleOrder[role] || 1000;
      if (priority < highestPriority) {
        highestPriority = priority;
      }
    }

    return highestPriority;
  };

  // Get leadership role of a user
  const getLeadershipRole = (user: UserDTO): string | null => {
    if (!user.roles || user.roles.length === 0) return null;

    for (const role of user.roles) {
      
      if (leadershipRoleOrder[role]) {
       
        return role;
      }
    }
    
    return null;
  };

  return {
    departmentUsers,
    isLoadingUsers,
    fetchDepartmentUsers,
    getLeadershipRole,
  };
}
