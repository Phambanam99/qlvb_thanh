import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UrgencyLevel,
  getUrgencyLabel,
  getUrgencyBadgeVariant,
  getUrgencyIcon,
  getUrgencyColor,
  isHighUrgency,
  isCriticalUrgency,
} from "@/lib/types/urgency";

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  variant?: "default" | "outline" | "colored";
}

export function UrgencyBadge({
  level,
  size = "md",
  showIcon = true,
  showText = true,
  className,
  variant = "default",
}: UrgencyBadgeProps) {
  const label = getUrgencyLabel(level);
  const icon = getUrgencyIcon(level);
  const color = getUrgencyColor(level);
  const badgeVariant = getUrgencyBadgeVariant(level);
  const isHigh = isHighUrgency(level);
  const isCritical = isCriticalUrgency(level);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const baseClasses = cn(
    "inline-flex items-center gap-1 font-medium",
    sizeClasses[size],
    {
      "animate-pulse": isCritical,
      "border-2": isHigh && variant === "outline",
    },
    className
  );

  if (variant === "colored") {
    return (
      <span
        className={cn(baseClasses, "border rounded-full text-white")}
        style={{
          backgroundColor: color,
          borderColor: color,
        }}
      >
        {showIcon && icon && <span className="text-current">{icon}</span>}
        {showText && <span>{label}</span>}
      </span>
    );
  }

  return (
    <Badge variant={badgeVariant} className={baseClasses}>
      {showIcon && icon && <span className="text-current">{icon}</span>}
      {showText && <span>{label}</span>}
    </Badge>
  );
}

// Component cho Select options
interface UrgencyOptionProps {
  level: UrgencyLevel;
  isSelected?: boolean;
}

export function UrgencyOption({ level, isSelected }: UrgencyOptionProps) {
  const label = getUrgencyLabel(level);
  const icon = getUrgencyIcon(level);
  const color = getUrgencyColor(level);

  return (
    <div className="flex items-center gap-2 w-full">
      <span style={{ color }}>{icon}</span>
      <span className={cn("flex-1", isSelected && "font-medium")}>{label}</span>
    </div>
  );
}

// Urgency Badge cho hiển thị trong table/list
export function UrgencyIndicator({ level }: { level: UrgencyLevel }) {
  const isHigh = isHighUrgency(level);
  const isCritical = isCriticalUrgency(level);

  if (!isHigh) {
    return null; // Không hiển thị gì cho mức độ thấp
  }

  return (
    <UrgencyBadge
      level={level}
      size="sm"
      showText={false}
      variant="colored"
      className={cn("ml-2", isCritical && "animate-bounce")}
    />
  );
}

export default UrgencyBadge;
