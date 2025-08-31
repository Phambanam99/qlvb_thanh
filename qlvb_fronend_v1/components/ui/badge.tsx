import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",

        // 🎯 Thêm success ở đây
        success: "bg-emerald-200 text-emerald-900 hover:bg-emerald-300",
        // Custom statuses
        draft: "bg-gray-200 text-gray-800",
        registered: "bg-blue-100 text-blue-800",
        distributed: "bg-green-100 text-green-800",
        dept_assigned: "bg-yellow-100 text-yellow-800",
        pending_approval: "bg-orange-100 text-orange-800",
        specialist_processing: "bg-indigo-100 text-indigo-800",
        specialist_submitted: "bg-indigo-200 text-indigo-900",
        leader_reviewing: "bg-purple-100 text-purple-800",
        leader_approved: "bg-green-200 text-green-900",
        leader_commented: "bg-purple-200 text-purple-900",
        published: "bg-green-300 text-green-900",
        completed: "bg-green-400 text-green-900",
        rejected: "bg-red-300 text-red-900",
        archived: "bg-gray-400 text-gray-900",
        department_reviewing: "bg-yellow-100 text-yellow-800",
        department_approved: "bg-green-200 text-green-900",
        department_commented: "bg-purple-200 text-purple-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
