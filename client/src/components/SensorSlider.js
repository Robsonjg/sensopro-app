import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
export default function SensorSlider({ value, onChange, min = 0, max = 100, }) {
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const percentage = ((value - min) / (max - min)) * 100;
    function handleMouseUp() {
        setIsDragging(false);
    }
    function handleTouchEnd() {
        setIsDragging(false);
    }
    function updateValueFromPosition(clientX) {
        if (!sliderRef.current)
            return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newValue = Math.round((newPercentage / 100) * (max - min) + min);
        onChange(newValue);
        setIsInteracting(true);
    }
    function handleMouseDown(e) {
        setIsDragging(true);
        updateValueFromPosition(e.clientX);
    }
    function handleTrackClick(e) {
        if (e.target.closest('[role="slider"]'))
            return;
        updateValueFromPosition(e.clientX);
    }
    function handleMouseMove(e) {
        if (!isDragging || !sliderRef.current)
            return;
        updateValueFromPosition(e.clientX);
    }
    function handleTouchStart(e) {
        setIsDragging(true);
        if (e.touches.length > 0) {
            updateValueFromPosition(e.touches[0].clientX);
        }
    }
    function handleTouchMove(e) {
        if (!isDragging || !sliderRef.current || e.touches.length === 0)
            return;
        updateValueFromPosition(e.touches[0].clientX);
    }
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.addEventListener("touchmove", handleTouchMove);
            document.addEventListener("touchend", handleTouchEnd);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
            };
        }
    }, [isDragging, min, max]);
    return (_jsxs("div", { className: "w-full space-y-8", children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { ref: sliderRef, className: "relative h-12 flex items-center cursor-pointer select-none", onMouseDown: handleMouseDown, onTouchStart: handleTouchStart, onClick: handleTrackClick, role: "slider", "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value, children: [_jsx("div", { className: "absolute w-full h-1 bg-slate-300 rounded-full" }), _jsxs("div", { className: "absolute w-full h-full flex items-center justify-between px-0", children: [_jsx("div", { className: "flex flex-col items-center", children: _jsx("div", { className: "w-1 h-6 bg-slate-400" }) }), _jsx("div", { className: "flex flex-col items-center", children: _jsx("div", { className: "w-1 h-6 bg-slate-400" }) })] }), isInteracting && (_jsxs("div", { className: "absolute transform -translate-x-1/2 flex flex-col items-center transition-all", style: { left: `${percentage}%` }, children: [_jsx("div", { className: "w-1 h-8 bg-blue-500 rounded-sm" }), _jsx("div", { className: "w-4 h-4 bg-blue-500 rounded-full mt-1 shadow-md" })] }))] }), _jsxs("div", { className: "relative w-full flex items-start justify-between px-0 text-xs font-medium text-slate-700", children: [_jsx("div", { className: "text-left", children: _jsx("p", { children: "Pouco" }) }), _jsx("div", { className: "text-right", children: _jsx("p", { children: "Muito" }) })] })] }), _jsx("div", { className: "text-center text-xs text-muted-foreground", children: isInteracting ? "Clique em qualquer ponto para ajustar" : "Clique na linha para avaliar" })] }));
}
