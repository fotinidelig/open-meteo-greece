import { scaleLinear } from "d3-scale";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const TRIANGLE_SPRING = { type: "spring", stiffness: 220, damping: 20, mass: 0.7 };


export const ColorLegend = ({
  height,
  colorScale,
  width,
  leftOffset,
  interactionData,
  margin,
  colorLegendMargin,
  showDifference,
  onHoverValue,
  onHoverEnd,
}) => {
  const canvasRef = useRef(null);
  const [legendHoverX, setLegendHoverX] = useState(null);
  const [legendHoverValue, setLegendHoverValue] = useState(null);
  const boundsWidth =
    width - margin?.right - margin?.left;
  const boundsHeight =
    height;

  const domain = colorScale.domain();
  const max = domain[domain.length - 1];
  const min = domain[0];
  const xScale = scaleLinear().range([0, boundsWidth]).domain([min, max]);

  const tickLabelProps = {
    fontSize: 11,
    fill: "#666",
  };

  const allTicks = xScale.ticks(5).map((tick) => (
    <g key={tick}>
      <line
        x1={xScale(tick)}
        x2={xScale(tick)}
        y1={0}
        y2={boundsHeight + 10}
        stroke="#666"
      />
      <text
        x={xScale(tick)}
        y={boundsHeight + 20}
        textAnchor="middle"
        {...tickLabelProps}
      >
        {tick + "°C"}
      </text>
    </g>
  ));
  const showDifferenceLabels = showDifference && !legendHoverValue && !interactionData;
  const differenceLabels = (
      <motion.g>
        <motion.text
          x={xScale(max)}
          textAnchor="end"
          y={-7}
          {...tickLabelProps}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            opacity: showDifferenceLabels ? 1 : 0,
          }}
          exit={{ y: 0, opacity: 0 }}
          transition={TRIANGLE_SPRING}
        >
          → 2026 hotter than 2025
        </motion.text>
        <motion.text
          x={xScale(min)}
          y={-7}
          textAnchor="start"
          {...tickLabelProps}
          initial={false}
          animate={{
            opacity: showDifferenceLabels ? 1 : 0,
          }}
          transition={TRIANGLE_SPRING}
        >
          2026 colder than 2025 ←
        </motion.text>
      </motion.g>
    );

  const cellValue = interactionData?.value;
  const x =
    legendHoverX ?? (cellValue != null ? xScale(cellValue) : null);

  const triangleWidth = 9;
  const triangleHeight = 6;
  const triangleText = legendHoverValue ? legendHoverValue.toFixed(1) + " °C" : 
  cellValue != null ? cellValue.toFixed(1) + " °C" : "";
  const triangle =
    x != null ? (
      <g>
        <text x={x} y={-10} fontSize={15} textAnchor="middle" fill="#666">
          {triangleText}
        </text>
      <motion.polygon  
        key={triangleText}
        initial={false}
        animate={{
          opacity: legendHoverValue != null ? 1 : 0.5,
          filter: legendHoverValue != null ? `saturate(1)` : `saturate(0.5)`,
        }}
        transition={TRIANGLE_SPRING}
        points={`${x},0 ${x - triangleWidth / 2},${-triangleHeight} ${
          x + triangleWidth / 2
        },${-triangleHeight}`}
        fill="#666"
      />
      </g>
    ) : null;

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(boundsWidth, event.clientX - rect.left));
    setLegendHoverX(px);
    onHoverValue?.(xScale.invert(px));
    setLegendHoverValue(xScale.invert(px));
  };

  const handleMouseLeave = () => {
    setLegendHoverX(null);
    onHoverEnd?.();
    setLegendHoverValue(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!context) {
      return;
    }
    for (let i = 0; i < boundsWidth; ++i) {
      context.fillStyle = colorScale((max - min) * i / boundsWidth + min);
      context.fillRect(i, 0, 1, boundsHeight);
    }

    // Stroke is centered on the path, so 0.5 inset keeps a 1px border on the pixel grid
    // and stops the outer half from being clipped by the canvas edge.
    context.strokeStyle = "grey";
    context.lineWidth = .5;
    context.strokeRect(0.5, 0.5, boundsWidth - 1, boundsHeight - 1);
  }, [width, height, colorScale]);

  return (
    <div style={{ width, height }}>
      <div
        style={{
          position: "relative",
          transform: `translate(${margin?.left + leftOffset}px,
            ${-colorLegendMargin}px)`,
        }}
      >
        <canvas ref={canvasRef} width={boundsWidth} height={boundsHeight} />
        <svg
          width={boundsWidth}
          height={boundsHeight}
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {allTicks}
          {differenceLabels}
          {triangle}
        </svg>
      </div>
    </div>
  );
};
