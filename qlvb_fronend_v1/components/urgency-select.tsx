import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  UrgencyLevel,
  URGENCY_LEVELS,
  getUrgencyOptions,
  getUrgencyLabel,
  getUrgencyIcon,
  getUrgencyColor,
  DEFAULT_URGENCY,
  isValidUrgencyLevel,
} from "@/lib/types/urgency";

interface UrgencySelectProps {
  value?: UrgencyLevel;
  onValueChange?: (value: UrgencyLevel) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcons?: boolean;
  includeDefault?: boolean;
}

export function UrgencySelect({
  value,
  onValueChange,
  placeholder = "Chọn độ khẩn",
  label,
  description,
  required = false,
  disabled = false,
  className,
  size = "md",
  showIcons = true,
  includeDefault = true,
}: UrgencySelectProps) {
  const options = getUrgencyOptions();

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const handleValueChange = (newValue: string) => {
    if (isValidUrgencyLevel(newValue) && onValueChange) {
      onValueChange(newValue);
    }
  };

  const selectedOption = value
    ? options.find((opt) => opt.value === value)
    : null;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <Select
        value={value || ""}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(sizeClasses[size], "w-full")}>
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div className="flex items-center gap-2">
                {showIcons && (
                  <span
                    style={{ color: getUrgencyColor(selectedOption.value) }}
                  >
                    {selectedOption.icon}
                  </span>
                )}
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                {showIcons && (
                  <span
                    className="text-sm"
                    style={{ color: getUrgencyColor(option.value) }}
                  >
                    {option.icon}
                  </span>
                )}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Compact variant for use in forms where space is limited
export function CompactUrgencySelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: {
  value?: UrgencyLevel;
  onValueChange?: (value: UrgencyLevel) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <UrgencySelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
      size="sm"
      showIcons={true}
      includeDefault={false}
      placeholder="Độ khẩn"
    />
  );
}

// Hook for form integration
export function useUrgencySelect(initialValue?: UrgencyLevel) {
  const [urgencyLevel, setUrgencyLevel] = React.useState<UrgencyLevel>(
    initialValue || DEFAULT_URGENCY
  );

  const handleChange = React.useCallback((value: UrgencyLevel) => {
    setUrgencyLevel(value);
  }, []);

  const reset = React.useCallback(() => {
    setUrgencyLevel(DEFAULT_URGENCY);
  }, []);

  const isHighPriority = React.useMemo(() => {
    return (
      urgencyLevel === URGENCY_LEVELS.HOA_TOC ||
      urgencyLevel === URGENCY_LEVELS.HOA_TOC_HEN_GIO
    );
  }, [urgencyLevel]);

  return {
    urgencyLevel,
    setUrgencyLevel: handleChange,
    reset,
    isHighPriority,
  };
}

export default UrgencySelect;
