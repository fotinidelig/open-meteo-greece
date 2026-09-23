import { useEffect, useMemo, useRef, useState } from "react";
import { geoArea, geoMercator, geoPath } from "d3-geo";
import { useDimensions } from "./use-dimensions";
import { motion } from "motion/react";
// import { data } from "./assets/gr";
import { data } from "./assets/gr_small";
import { CITIES } from "./cities";
import pinIcon from "./assets/pin.svg";

/**
 * Simplified GeoJSON often has reversed ring winding. D3 then treats each
 * polygon as covering most of the sphere, so fitSize zooms out to the world.
 *
 * GeoJSON rule: exterior rings counterclockwise, holes clockwise.
 * On the sphere, an exterior with area > 2π is wound the wrong way → reverse it.
 */
function rewindRing(ring, isExterior) {
  const area = geoArea({ type: "Polygon", coordinates: [ring] });
  const wrong =
    isExterior ? area > 2 * Math.PI : area < 2 * Math.PI;
  return wrong ? ring.slice().reverse() : ring;
}

function rewindPolygonCoords(coords) {
  return coords.map((ring, i) => rewindRing(ring, i === 0));
}

function rewindFeature(feature) {
  const g = feature.geometry;
  if (!g) return feature;
  if (g.type === "Polygon") {
    return {
      ...feature,
      geometry: { ...g, coordinates: rewindPolygonCoords(g.coordinates) },
    };
  }
  if (g.type === "MultiPolygon") {
    return {
      ...feature,
      geometry: {
        ...g,
        coordinates: g.coordinates.map(rewindPolygonCoords),
      },
    };
  }
  return feature;
}

function rewindGeoJson(collection) {
  if (!collection?.features) return collection;
  return {
    ...collection,
    features: collection.features.map(rewindFeature),
  };
}

export const GreeceMap = ({
  width,
  height,
  margin,
  cityName = null,
  lineWidth = 0,
  showMap = false,
}) => {
  const canvasRef = useRef(null);
  const [point, setPoint] = useState(null);

  // Rewind once per dataset (not every render of canvas size).
  const mapData = useMemo(() => rewindGeoJson(data), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height || !mapData) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // 1) Fit the (rewound) GeoJSON to the canvas — uses real data bounds.
    const projection = geoMercator().fitSize([width, height], mapData);

    const path = geoPath().projection(projection).context(context);

    context.clearRect(0, 0, width, height);
    context.beginPath();
    path(mapData);
    context.strokeStyle = "#505050";
    context.lineWidth = 0.5;
    if (showMap) {
      context.stroke();
    }

    // Projection input is [longitude, latitude], not [lat, lon].
    if (cityName) {
      const coordinates = CITIES.find((c) => c.name === cityName);
      if (coordinates?.lon != null && coordinates?.lat != null) {
        setPoint(projection([coordinates.lon, coordinates.lat]));
      }
    } else {
      setPoint(null);
    }
  }, [width, height, cityName, mapData, lineWidth]);

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
    <div
      style={{
        position: "relative",
        top: margin.top,
        left: margin.left,
        right: margin.right,
        bottom: margin.bottom,
      }}
    >
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
