"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  items: SearchableSelectItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  loadingMessage?: string;
}

export function SearchableSelect({
  items = [],
  value,
  onValueChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả",
  disabled = false,
  className,
  loading = false,
  loadingMessage = "Đang tải...",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchValue) return items;
    
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.value.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [items, searchValue]);

  // Find selected item
  const selectedItem = items.find((item) => item.value === value);

  // Handle selection
  const handleSelect = (selectedValue: string) => {
    const item = items.find((item) => item.value === selectedValue);
    if (item && !item.disabled) {
      onValueChange?.(selectedValue);
      setOpen(false);
      setSearchValue("");
    }
  };

  // Handle open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedItem && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          {loading 
            ? loadingMessage
            : selectedItem 
              ? selectedItem.label 
              : placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b">
           
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {loading ? (
              <CommandEmpty>{loadingMessage}</CommandEmpty>
            ) : filteredItems.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={handleSelect}
                    disabled={item.disabled}
                    className={cn(
                      "flex items-center justify-between",
                      item.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="flex-1">{item.label}</span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedItem?.value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 