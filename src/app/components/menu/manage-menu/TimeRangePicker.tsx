import { useState, useEffect } from "react";

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onChange,
}: TimeRangePickerProps) {
  const [localStartTime, setLocalStartTime] = useState(startTime || "09:00");
  const [localEndTime, setLocalEndTime] = useState(endTime || "21:00");

  useEffect(() => {
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
  }, [startTime, endTime]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setLocalStartTime(newStartTime);
    onChange(newStartTime, localEndTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setLocalEndTime(newEndTime);
    onChange(localStartTime, newEndTime);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="time"
        className="input input-bordered input-sm flex-1"
        value={localStartTime}
        onChange={handleStartTimeChange}
      />
      <span className="text-base-content/70">to</span>
      <input
        type="time"
        className="input input-bordered input-sm flex-1"
        value={localEndTime}
        onChange={handleEndTimeChange}
      />
    </div>
  );
}
