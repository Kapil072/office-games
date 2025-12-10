import React, { useEffect, useRef } from "react";
interface BubbleBlastProps {
  x: number | string;
  y: number | string;
  onEnd?: () => void;
}
const DOTS = 12;
const DISTANCE = 40; // px

export const BubbleBlast: React.FC<BubbleBlastProps> = ({ x, y, onEnd }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onEnd) onEnd();
    }, 600);
    return () => clearTimeout(timeout);
  }, [onEnd]);

  return (
    <div
      className="bubble-blast pointer-events-none"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
      }}
      ref={ref}
    >
      {Array.from({ length: DOTS }).map((_, i) => {
        const angle = (i / DOTS) * Math.PI * 2;
        const dx = Math.cos(angle) * DISTANCE;
        const dy = Math.sin(angle) * DISTANCE;
        return (
          <span
            key={i}
            className="bubble-dot"
            style={
              {
                "--x": `${dx}px`,
                "--y": `${dy}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}; 