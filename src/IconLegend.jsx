import maxTempIcon from "./assets/max_temperature_icon_legend.svg";
import minTempIcon from "./assets/min_temperature_icon.svg";

export function IconLegend({ isMobile, leftOffset = 0, margin, iconLegendMargin = 0 }) {
    const ICON = isMobile ? 12 : 16;
  return (
      <div style={{        
         transform: `translate(${(margin?.left ?? 0) + leftOffset}px, ${-iconLegendMargin}px)`,
         display: "flex", 
         flexDirection: "column", 
         alignItems: "left", 
         gap: 1 }}>
        <div style={{        
            transform: `translate(${(margin?.left ?? 0) + leftOffset}px, ${-iconLegendMargin}px)`,
    display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
            <img
                src={maxTempIcon}
                alt=""
                width={ICON}
                height={ICON}
                style={{ display: "block", flexShrink: 0 }}
            />
            <div
                style={{
                fontFamily: "Gudea, sans-serif",
                fontSize: 11,
                fontColor: "#7C1024",
                color: "#666",
                //   lineHeight: 1.2,
                }}
            >
                /
            </div>
            <img
                src={minTempIcon}
                alt=""
                width={ICON}
                height={ICON}
                style={{ display: "block", flexShrink: 0 }}
            />
            <div
                style={{
                fontFamily: "Gudea, sans-serif",
                fontSize: 11,
                fontStyle: "italic",
                color: "#666",
                lineHeight: 1.2,
                }}
            >
                {" Minimum/maximum temperature per city"}
            </div>
        </div>
        <div
            style={{
            fontFamily: "Gudea, sans-serif",
            fontSize: 11,
            fontStyle: "italic",
            color: "#666",
            // lineHeight: 1.2,
            }}
        >
            {"Temperatures shown are averages over one week"}
        </div>
    </div>
  );
}
