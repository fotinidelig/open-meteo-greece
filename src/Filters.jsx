import { useRef } from "react";
import { useDimensions } from "./use-dimensions";

const MARGIN = { top: 20, right: 0, bottom: 90, left: 0 };

export const Filters = ({ years, selection, setSelection, isMobile }) => {
  return (
    <div
      className="filters"
      role="radiogroup"
      aria-label="Year"
      style={{
        width: "100%",
        height: "100%",
        paddingRight: MARGIN.right,
        boxSizing: "border-box",
        margin: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        gap: 13,
        flexWrap: "wrap",
      }}
    >

      {years.map((year) => (
        <button
          key={year}
          type="button"
          role="radio"
          aria-checked={selection === year}
          className={`filters__option${selection === year ? " is-active" : ""} ${isMobile ? "is-mobile" : ""}`}
          onClick={() => setSelection(year)}
        >
          {year}
        </button>
      ))}

      <button
        type="button"
        role="radio"
        aria-checked={selection === "difference"}
        className={`filters__option${selection === "difference" ? " is-active" : ""} ${isMobile ? "is-mobile" : ""}`}
        onClick={() => setSelection("difference")}
      >
        Difference
      </button>
    </div>
  );
};

export const ResponsiveFilters = (props) => {
  const ref = useRef(null);
  const { width, height, ...rest } = useDimensions(ref);
  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <Filters width={width} height={height} {...rest} />
    </div>
  );
};
