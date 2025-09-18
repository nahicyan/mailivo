// app/src/components/ui/time-picker.tsx
"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  hourCycle?: 12 | 24;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  hourCycle = 24,
  className,
  placeholder = "Select time",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hours, setHours] = React.useState<string>(
    value ? value.getHours().toString().padStart(2, "0") : "00"
  );
  const [minutes, setMinutes] = React.useState<string>(
    value ? value.getMinutes().toString().padStart(2, "0") : "00"
  );
  const [period, setPeriod] = React.useState<"AM" | "PM">(
    value && value.getHours() >= 12 ? "PM" : "AM"
  );

  React.useEffect(() => {
    if (value) {
      const h = value.getHours();
      const m = value.getMinutes();
      
      if (hourCycle === 12) {
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        setHours(displayHour.toString().padStart(2, "0"));
        setPeriod(h >= 12 ? "PM" : "AM");
      } else {
        setHours(h.toString().padStart(2, "0"));
      }
      setMinutes(m.toString().padStart(2, "0"));
    }
  }, [value, hourCycle]);

  const handleTimeChange = (newHours: string, newMinutes: string, newPeriod?: "AM" | "PM") => {
    let hour = parseInt(newHours);
    const minute = parseInt(newMinutes);

    if (hourCycle === 12 && newPeriod) {
      if (newPeriod === "PM" && hour !== 12) hour += 12;
      if (newPeriod === "AM" && hour === 12) hour = 0;
    }

    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hour, minute, 0, 0);
    onChange?.(newDate);
  };

  const handleHourChange = (hour: string) => {
    setHours(hour);
    handleTimeChange(hour, minutes, period);
  };

  const handleMinuteChange = (minute: string) => {
    setMinutes(minute);
    handleTimeChange(hours, minute, period);
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod);
    handleTimeChange(hours, minutes, newPeriod);
  };

  const formatDisplayTime = () => {
    if (!value) return placeholder;
    
    if (hourCycle === 12) {
      return `${hours}:${minutes} ${period}`;
    }
    return `${hours}:${minutes}`;
  };

  const hourOptions = Array.from(
    { length: hourCycle === 12 ? 12 : 24 },
    (_, i) => {
      if (hourCycle === 12) {
        return i === 0 ? 12 : i;
      }
      return i;
    }
  );

  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Hours */}
          <div className="flex flex-col">
            <div className="px-3 py-2 border-b">
              <Label className="text-xs font-semibold">Hour</Label>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {hourOptions.map((hour) => {
                  const hourStr = hour.toString().padStart(2, "0");
                  return (
                    <Button
                      key={hour}
                      size="sm"
                      variant={hours === hourStr ? "secondary" : "ghost"}
                      className="w-full justify-center font-mono"
                      onClick={() => handleHourChange(hourStr)}
                    >
                      {hourStr}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Minutes */}
          <div className="flex flex-col border-l">
            <div className="px-3 py-2 border-b">
              <Label className="text-xs font-semibold">Minute</Label>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {minuteOptions
                  .filter((_, i) => i % 5 === 0) // Show only 5-minute intervals
                  .map((minute) => {
                    const minStr = minute.toString().padStart(2, "0");
                    return (
                      <Button
                        key={minute}
                        size="sm"
                        variant={minutes === minStr ? "secondary" : "ghost"}
                        className="w-full justify-center font-mono"
                        onClick={() => handleMinuteChange(minStr)}
                      >
                        {minStr}
                      </Button>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>

          {/* AM/PM for 12-hour format */}
          {hourCycle === 12 && (
            <div className="flex flex-col border-l">
              <div className="px-3 py-2 border-b">
                <Label className="text-xs font-semibold">Period</Label>
              </div>
              <div className="p-1">
                <Button
                  size="sm"
                  variant={period === "AM" ? "secondary" : "ghost"}
                  className="w-full"
                  onClick={() => handlePeriodChange("AM")}
                >
                  AM
                </Button>
                <Button
                  size="sm"
                  variant={period === "PM" ? "secondary" : "ghost"}
                  className="w-full"
                  onClick={() => handlePeriodChange("PM")}
                >
                  PM
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Direct input option */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              max={hourCycle === 12 ? "12" : "23"}
              value={hours}
              onChange={(e) => handleHourChange(e.target.value.padStart(2, "0"))}
              className="w-14 text-center font-mono"
            />
            <span className="text-lg">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => handleMinuteChange(e.target.value.padStart(2, "0"))}
              className="w-14 text-center font-mono"
            />
            {hourCycle === 12 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePeriodChange(period === "AM" ? "PM" : "AM")}
              >
                {period}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple inline time picker variant
export function SimpleTimePicker({
  value,
  onChange,
  disabled = false,
  hourCycle = 24,
  className,
}: TimePickerProps) {
  const [hours, setHours] = React.useState<string>(
    value ? value.getHours().toString().padStart(2, "0") : "09"
  );
  const [minutes, setMinutes] = React.useState<string>(
    value ? value.getMinutes().toString().padStart(2, "0") : "00"
  );

  const handleChange = (newHours: string, newMinutes: string) => {
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(parseInt(newHours), parseInt(newMinutes), 0, 0);
    onChange?.(newDate);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Input
        type="number"
        min="0"
        max="23"
        value={hours}
        onChange={(e) => {
          const val = e.target.value.padStart(2, "0");
          setHours(val);
          handleChange(val, minutes);
        }}
        disabled={disabled}
        className="w-16 text-center font-mono"
        placeholder="HH"
      />
      <span className="text-lg font-semibold">:</span>
      <Input
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => {
          const val = e.target.value.padStart(2, "0");
          setMinutes(val);
          handleChange(hours, val);
        }}
        disabled={disabled}
        className="w-16 text-center font-mono"
        placeholder="MM"
      />
    </div>
  );
}