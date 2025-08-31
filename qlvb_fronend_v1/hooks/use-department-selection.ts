"use client";

import { useState, useEffect, useCallback } from "react";
import { DepartmentDTO, departmentsAPI } from "@/lib/api/departments";
import { UserDTO } from "@/lib/api/users";
import { useToast } from "@/components/ui/use-toast";

export interface DepartmentNode
  extends Omit<DepartmentDTO, "childDepartments"> {
  children: DepartmentNode[];
  childDepartments: DepartmentNode[];
  expanded?: boolean;
}

export interface DepartmentUser extends UserDTO {
  departmentId: number;
}

export function useDepartmentSelection() {
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [primaryDepartment, setPrimaryDepartment] = useState<number | null>(
    null
  );
  const [secondaryDepartments, setSecondaryDepartments] = useState<(number | string)[]>(
    []
  );
  const { toast } = useToast();

  // Function to build hierarchical department tree from flat list
  const buildDepartmentTree = useCallback(
    (departments: any[]): DepartmentNode[] => {
      const departmentMap = new Map();

      // First create a map of all departments
      departments.forEach((dept) => {
        departmentMap.set(dept.id, {
          ...dept,
          children: [],
          childDepartments: dept.childDepartments || [],
          expanded: false,
        });
      });

      // Then build the tree structure
      const rootDepartments: DepartmentNode[] = [];

      departments.forEach((dept) => {
        const departmentNode = departmentMap.get(dept.id);

        if (
          dept.parentDepartmentId === null ||
          !departmentMap.has(dept.parentDepartmentId)
        ) {
          rootDepartments.push(departmentNode);
        } else {
          const parent = departmentMap.get(dept.parentDepartmentId);
          if (parent) {
            parent.children.push(departmentNode);
          } else {
            // If parent doesn't exist in our map, add to root level
            rootDepartments.push(departmentNode);
          }
        }
      });

      return rootDepartments;
    },
    []
  );

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response_ = await departmentsAPI.getAllDepartments();
      const response = response_.data;
      const departmentData = response.content || [];

      // Transform flat list to hierarchical structure
      const hierarchicalData = buildDepartmentTree(departmentData);
      setDepartments(hierarchicalData);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast({
        title: "Lỗi tải dữ liệu phòng ban",
        description: "Không thể tải cấu trúc phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [buildDepartmentTree]); // Remove toast dependency to prevent infinite loop

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const toggleDepartment = useCallback((departmentId: number) => {
    setExpandedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  }, []);

  const expandDepartment = useCallback((departmentId: number) => {
    setExpandedDepartments((prev) => {
      const newSet = new Set(prev);
      newSet.add(departmentId);
      return newSet;
    });
  }, []);

  const selectPrimaryDepartment = useCallback((departmentId: number) => {
    setPrimaryDepartment(departmentId);
    // Remove from secondary if it was there
    setSecondaryDepartments((prev) => prev.filter((id) => {
      // Handle both numeric and composite string IDs
      if (typeof id === "string" && id.includes("-")) {
        const deptId = parseInt(id.split("-")[0]);
        return deptId !== departmentId;
      }
      return id !== departmentId;
    }));
  }, []);

  // Helper function to get all child department IDs recursively
  const getAllChildDepartmentIds = useCallback(
    (department: DepartmentNode): number[] => {
      const childIds: number[] = [];

      if (department.children && department.children.length > 0) {
        department.children.forEach((child) => {
          childIds.push(child.id);
          // Recursively get children of children
          const grandChildren = getAllChildDepartmentIds(child);
          childIds.push(...grandChildren);
        });
      }

      return childIds;
    },
    []
  );

  const findDepartmentById = useCallback(
    (id: number | string): DepartmentNode | null => {
      // If it's a composite ID (departmentId-userId), extract the departmentId
      let departmentId: number;
      if (typeof id === "string" && id.includes("-")) {
        departmentId = parseInt(id.split("-")[0]);
      } else {
        departmentId = typeof id === "string" ? parseInt(id) : id;
      }

      const searchInNodes = (
        nodes: DepartmentNode[]
      ): DepartmentNode | null => {
        for (const node of nodes) {
          if (node.id === departmentId) {
            return node;
          }
          if (node.children) {
            const found = searchInNodes(node.children);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      return searchInNodes(departments);
    },
    [departments]
  );

  const selectSecondaryDepartment = useCallback(
    (departmentId: number | string, forceAdd = false) => {
      console.log('🔄 selectSecondaryDepartment called with:', departmentId, 'forceAdd:', forceAdd);
      
      // Handle composite IDs (departmentId-userId) for individual users
      const id = typeof departmentId === "string" ? departmentId : departmentId;
      
      if (typeof id === "number" && id === primaryDepartment) {
        console.log('⚠️ Cannot select as secondary - already primary:', id);
        return; // Cannot be both primary and secondary
      }

      setSecondaryDepartments((prev) => {
        console.log('📝 Current secondary departments:', prev);
        
        if (prev.includes(id as any)) {
          if (forceAdd) {
            // If forceAdd is true, don't remove - just keep existing selection
            console.log('✅ Already selected, keeping existing:', id);
            return prev;
          } else {
            // If already selected, remove it (toggle behavior for UI)
            const newSelection = prev.filter((existingId) => existingId !== id);
            console.log('➖ Removing from selection:', id, 'New selection:', newSelection);
            return newSelection;
          }
        } else {
          // If not selected, add it
          const newSelection = [...prev, id as any];
          console.log('➕ Adding to selection:', id, 'New selection:', newSelection);
          return newSelection;
        }
      });
    },
    [primaryDepartment]
  );

  const clearSelection = useCallback(() => {
    setPrimaryDepartment(null);
    setSecondaryDepartments([]);
  }, []);

  const getSelectedDepartments = useCallback(() => {
    const selected: {
      primary: DepartmentNode | null;
      secondary: DepartmentNode[];
    } = {
      primary: null,
      secondary: [],
    };

    if (primaryDepartment) {
      selected.primary = findDepartmentById(primaryDepartment);
    }

    selected.secondary = secondaryDepartments
      .map((id) => findDepartmentById(id))
      .filter((dept): dept is DepartmentNode => dept !== null);

    return selected;
  }, [primaryDepartment, secondaryDepartments, findDepartmentById]);

  return {
    departments,
    expandedDepartments,
    isLoading,
    primaryDepartment,
    secondaryDepartments,
    toggleDepartment,
    expandDepartment,
    selectPrimaryDepartment,
    selectSecondaryDepartment,
    clearSelection,
    findDepartmentById,
    getSelectedDepartments,
    refreshDepartments: loadDepartments,
  };
}
