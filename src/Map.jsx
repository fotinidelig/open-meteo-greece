import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useDimensions } from "./use-dimensions";
import { motion } from "motion/react";
import { data } from "./assets/gr";
import { CITIES } from "./cities";
import pinIcon from "./assets/pin.svg";

export const GreeceMap = ({ width, height, margin, cityName=null, strokeColor='#f0f0f0', fillColor=null }) => {
  const canvasRef = useRef(null);
  const [point, setPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Fit Greece to this canvas. scale/center alone will not match width/height.
    const projection = geoMercator().fitSize([width, height], data);
    const path = geoPath().projection(projection).context(context);

    context.clearRect(0, 0, width, height);
    context.beginPath();
    path(data);
    if (fillColor) {
        context.fillStyle = fillColor;
        context.fill();
    }
    context.strokeStyle = strokeColor;
    context.lineWidth = .5;
    context.stroke();

    // for (const city of CITIES) {
    //   const point = projection([city.lon, city.lat]);
    //   if (point) {
    //     context.beginPath();
    //     context.arc(point[0], point[1], 4, 0, Math.PI * 2);
    //     context.fillStyle = "grey";
    //     context.fill();
    //   }
    // }

    // Projection input is [longitude, latitude], not [lat, lon].
    if (cityName) {
        const coordinates = CITIES.find((c) => c.name === cityName);
        if (coordinates?.lon != null && coordinates?.lat != null) {
            setPoint(projection([coordinates.lon, coordinates.lat]));
        }
    } else {
        setPoint(null);
    }
  }, [width, height, cityName]);

  if (!width || !height) {
    return null;
  }

  const pinSize = 24;
  const opacity = point ? 1 : 0;
  const img = point && (
    <motion.img
        src={pinIcon}
        alt=""
        style={{
            position: "absolute",
            left: point[0],
            top: point[1],
            width: pinSize,
            height: pinSize,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            opacity: opacity,
        }}
        animate={{
            left: point[0],
            top: point[1],
            opacity: opacity,
        }}
        transition={{
            type: "spring",
            stiffness: 260,
            damping: 28,
            mass: 0.7,
        }}
    />
    );

  return (
    <div style={{ position: "relative", top: margin.top, left: margin.left, right: margin.right, bottom: margin.bottom }}>
        <canvas ref={canvasRef} width={width} height={height} />
        {cityName && img}
    </div>
  );
};

export default function ResponsiveGreeceMap(props) {
  const chartRef = useRef(null);
  const chartSize = useDimensions(chartRef);
  return (
    <div ref={chartRef} style={{ width: "100%", height: "100%" }}>
      <GreeceMap width={chartSize.width} height={chartSize.height} {...props} />
    </div>
  );
}
