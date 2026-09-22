import styles from "./tooltip.module.css";


export const Tooltip = ({ interactionData, width, height, showDifference = false }) => {
  if (!interactionData) {
    return null;
  }
  const temperature = interactionData.value.toFixed(1);
  const valueLabel = showDifference ? "Difference (2026 - 2025)" : "Temperature";
  return (
    // Wrapper div: a rect on top of the viz area
    <div
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <div
        className={styles.tooltip}
        style={{
          position: "absolute",
          left: interactionData.xPos,
          top: interactionData.yPos,
        }}
      >
        <span><b>{interactionData.city} ({interactionData.year})</b></span>
        <br />
        <span>Week {interactionData.week}</span>
        <br />
        <span>{valueLabel}: <b>{temperature} °C</b></span>
      </div>
    </div>
  );
};
