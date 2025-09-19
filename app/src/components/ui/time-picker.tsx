"use client";

import * as React from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  hourCycle: initialHourCycle = 24,
  className,
  placeholder = "Select time",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hourCycle, setHourCycle] = React.useState(initialHourCycle);
  
  const getDisplayHour = (date: Date) => {
    const h = date.getHours();
    if (hourCycle === 12) {
      return h === 0 ? 12 : h > 12 ? h - 12 : h;
    }
    return h;
  };

  const [hours, setHours] = React.useState<number>(() => {
    if (value) return getDisplayHour(value);
    return hourCycle === 12 ? 12 : 9;
  });

  const [minutes, setMinutes] = React.useState<number>(
    value ? value.getMinutes() : 0
  );

  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    if (!value) return "AM";
    return value.getHours() >= 12 ? "PM" : "AM";
  });

  React.useEffect(() => {
    if (value) {
      setHours(getDisplayHour(value));
      setMinutes(value.getMinutes());
      setPeriod(value.getHours() >= 12 ? "PM" : "AM");
    }
  }, [value, hourCycle]);

  const handleTimeChange = React.useCallback(() => {
    let actualHour = hours;
    
    if (hourCycle === 12) {
      if (period === "PM" && hours !== 12) actualHour += 12;
      if (period === "AM" && hours === 12) actualHour = 0;
    }

    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(actualHour, minutes, 0, 0);
    onChange?.(newDate);
  }, [hours, minutes, period, hourCycle, value, onChange]);

  React.useEffect(() => {
    handleTimeChange();
  }, [hours, minutes, period]);

  const incrementHour = () => {
    const max = hourCycle === 12 ? 12 : 23;
    const min = hourCycle === 12 ? 1 : 0;
    setHours(h => h >= max ? min : h + 1);
  };

  const decrementHour = () => {
    const max = hourCycle === 12 ? 12 : 23;
    const min = hourCycle === 12 ? 1 : 0;
    setHours(h => h <= min ? max : h - 1);
  };

  const incrementMinute = () => {
    setMinutes(m => m >= 59 ? 0 : m + 1);
  };

  const decrementMinute = () => {
    setMinutes(m => m <= 0 ? 59 : m - 1);
  };

  const formatDisplayTime = () => {
    if (!value) return placeholder;
    
    const h = getDisplayHour(value);
    const m = value.getMinutes();
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    
    if (hourCycle === 12) {
      return `${timeStr} ${period}`;
    }
    return timeStr;
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const max = hourCycle === 12 ? 12 : 23;
    const min = hourCycle === 12 ? 1 : 0;
    if (val >= min && val <= max) {
      setHours(val);
    }
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    if (val >= 0 && val <= 59) {
      setMinutes(val);
    }
  };

  const toggleHourCycle = () => {
    const newCycle = hourCycle === 12 ? 24 : 12;
    setHourCycle(newCycle);
    
    if (newCycle === 12) {
      // Converting from 24 to 12 hour
      const h = hours;
      if (h === 0) {
        setHours(12);
        setPeriod("AM");
      } else if (h > 12) {
        setHours(h - 12);
        setPeriod("PM");
      } else if (h === 12) {
        setPeriod("PM");
      } else {
        setPeriod("AM");
      }
    } else {
      // Converting from 12 to 24 hour
      if (period === "PM" && hours !== 12) {
        setHours(hours + 12);
      } else if (period === "AM" && hours === 12) {
        setHours(0);
      }
    }
  };

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
        <div className="p-4">
          {/* Header with format toggle */}
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Select time</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="hour-format" className="text-xs text-muted-foreground">
                {hourCycle === 12 ? "12h" : "24h"}
              </Label>
              <Switch
                id="hour-format"
                checked={hourCycle === 12}
                onCheckedChange={(checked: boolean) => toggleHourCycle()}
                className="h-5 w-9"
              />
            </div>
          </div>

          {/* Time selector */}
          <div className="flex items-center justify-center space-x-2">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={incrementHour}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Input
                type="text"
                value={hours.toString().padStart(2, "0")}
                onChange={handleHourInput}
                className="w-14 h-10 text-center font-mono text-lg"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={decrementHour}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-lg font-semibold pb-5">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={incrementMinute}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Input
                type="text"
                value={minutes.toString().padStart(2, "0")}
                onChange={handleMinuteInput}
                className="w-14 h-10 text-center font-mono text-lg"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={decrementMinute}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* AM/PM selector for 12-hour format */}
            {hourCycle === 12 && (
              <div className="flex flex-col space-y-1 ml-2">
                <Button
                  variant={period === "AM" ? "default" : "outline"}
                  size="sm"
                  className="h-[18px] w-12 text-xs"
                  onClick={() => setPeriod("AM")}
                >
                  AM
                </Button>
                <Button
                  variant={period === "PM" ? "default" : "outline"}
                  size="sm"
                  className="h-[18px] w-12 text-xs"
                  onClick={() => setPeriod("PM")}
                >
                  PM
                </Button>
              </div>
            )}
          </div>

          {/* Quick select buttons */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: "12:00 AM", h: 0, m: 0 },
                { label: "6:00 AM", h: 6, m: 0 },
                { label: "9:00 AM", h: 9, m: 0 },
                { label: "12:00 PM", h: 12, m: 0 },
                { label: "3:00 PM", h: 15, m: 0 },
                { label: "6:00 PM", h: 18, m: 0 },
                { label: "9:00 PM", h: 21, m: 0 },
                { label: "11:59 PM", h: 23, m: 59 },
              ].map((time) => {
                const display = hourCycle === 12 ? time.label : `${time.h.toString().padStart(2, "0")}:${time.m.toString().padStart(2, "0")}`;
                return (
                  <Button
                    key={time.label}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      const newDate = value ? new Date(value) : new Date();
                      newDate.setHours(time.h, time.m, 0, 0);
                      onChange?.(newDate);
                      setIsOpen(false);
                    }}
                  >
                    {display}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple inline time picker variant (for forms without popover)
export function SimpleTimePicker({
  value,
  onChange,
  disabled = false,
  hourCycle: initialHourCycle = 24,
  className,
}: TimePickerProps) {
  const [hourCycle, setHourCycle] = React.useState(initialHourCycle);

  const getDisplayHour = (date: Date) => {
    const h = date.getHours();
    if (hourCycle === 12) {
      return h === 0 ? 12 : h > 12 ? h - 12 : h;
    }
    return h;
  };

  const [hours, setHours] = React.useState<string>(() => {
    if (value) return getDisplayHour(value).toString().padStart(2, "0");
    return hourCycle === 12 ? "12" : "09";
  });

  const [minutes, setMinutes] = React.useState<string>(
    value ? value.getMinutes().toString().padStart(2, "0") : "00"
  );

  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    if (!value) return "AM";
    return value.getHours() >= 12 ? "PM" : "AM";
  });

  const handleChange = () => {
    let actualHour = parseInt(hours);
    
    if (hourCycle === 12) {
      if (period === "PM" && actualHour !== 12) actualHour += 12;
      if (period === "AM" && actualHour === 12) actualHour = 0;
    }

    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(actualHour, parseInt(minutes), 0, 0);
    onChange?.(newDate);
  };

  React.useEffect(() => {
    handleChange();
  }, [hours, minutes, period]);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Input
        type="number"
        min={hourCycle === 12 ? "1" : "0"}
        max={hourCycle === 12 ? "12" : "23"}
        value={hours}
        onChange={(e) => {
          const val = e.target.value.padStart(2, "0");
          setHours(val);
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
        }}
        disabled={disabled}
        className="w-16 text-center font-mono"
        placeholder="MM"
      />
      {hourCycle === 12 && (
        <Button
          variant={period === "PM" ? "default" : "outline"}
          onClick={() => setPeriod(period === "AM" ? "PM" : "AM")}
          disabled={disabled}
          className="w-14"
          size="sm"
        >
          {period}
        </Button>
      )}
      <div className="flex items-center gap-2 ml-2">
        <Label htmlFor="inline-hour-format" className="text-xs text-muted-foreground">
          {hourCycle}h
        </Label>
        <Switch
          id="inline-hour-format"
          checked={hourCycle === 12}
          onCheckedChange={(checked: boolean) => setHourCycle(checked ? 12 : 24)}
          disabled={disabled}
          className="h-4 w-8"
        />
      </div>
    </div>
  );
}