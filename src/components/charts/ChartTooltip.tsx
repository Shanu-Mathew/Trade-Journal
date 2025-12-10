import { ReactNode, useEffect, useState, useRef } from 'react';

interface ChartTooltipProps {
  x: number;
  y: number;
  visible: boolean;
  children: ReactNode;
  containerRef?: React.RefObject<HTMLElement>;
}

export default function ChartTooltip({ x, y, visible, children, containerRef }: ChartTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const container = containerRef?.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const padding = 16;
    const offset = 12;

    let finalX = x;
    let finalY = y;
    let flipH = false;
    let flipV = false;

    if (x + tooltipRect.width + offset + padding > container.right) {
      finalX = x - tooltipRect.width - offset;
      flipH = true;
    } else {
      finalX = x + offset;
    }

    if (finalX < container.left + padding) {
      finalX = container.left + padding;
    }

    if (y + tooltipRect.height + offset + padding > container.bottom) {
      finalY = y - tooltipRect.height - offset;
      flipV = true;
    } else {
      finalY = y + offset;
    }

    if (finalY < container.top + padding) {
      finalY = container.top + padding;
    }

    setPosition({ x: finalX, y: finalY });
    setFlip({ horizontal: flipH, vertical: flipV });
  }, [x, y, visible, containerRef]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none transition-opacity duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 text-sm whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
