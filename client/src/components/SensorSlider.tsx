import { useEffect, useRef, useState } from "react";

interface SensorSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function SensorSlider({
  value,
  onChange,
  min = 0,
  max = 100,
}: SensorSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;
  const hasValue = value > min;

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleTouchEnd() {
    setIsDragging(false);
  }

  function updateValueFromPosition(clientX: number) {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round((newPercentage / 100) * (max - min) + min);

    onChange(newValue);
    setIsInteracting(true);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    updateValueFromPosition(e.clientX);
  }

  function handleTrackClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[role="slider"]')) return;
    updateValueFromPosition(e.clientX);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !sliderRef.current) return;
    updateValueFromPosition(e.clientX);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setIsDragging(true);
    if (e.touches.length > 0) {
      updateValueFromPosition(e.touches[0].clientX);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging || !sliderRef.current || e.touches.length === 0) return;
    updateValueFromPosition(e.touches[0].clientX);
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove as any);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove as any);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, min, max]);

  return (
    <div className="w-full space-y-8">
      <div className="space-y-8">
        <div
          ref={sliderRef}
          className="relative h-12 flex items-center cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleTrackClick}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          <div className="absolute w-full h-1 bg-slate-300 rounded-full" />

          <div className="absolute w-full h-full flex items-center justify-between px-0">
            <div className="flex flex-col items-center">
              <div className="w-1 h-6 bg-slate-400" />
            </div>

            <div className="flex flex-col items-center">
              <div className="w-1 h-6 bg-slate-400" />
            </div>
          </div>

          {(hasValue || isInteracting) && (
            <div
              className="absolute transform -translate-x-1/2 flex flex-col items-center transition-all"
              style={{ left: `${percentage}%` }}
            >
              <div className="w-1 h-8 bg-blue-500 rounded-sm" />
              <div className="w-4 h-4 bg-blue-500 rounded-full mt-1 shadow-md" />
            </div>
          )}
        </div>

        <div className="relative w-full flex items-start justify-between px-0 text-xs font-medium text-slate-700">
          <div className="text-left">
            <p>Pouco</p>
          </div>

          <div className="text-right">
            <p>Muito</p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        {hasValue || isInteracting
          ? "Clique em qualquer ponto para ajustar"
          : "Clique na linha para avaliar"}
      </div>
    </div>
  );
}
