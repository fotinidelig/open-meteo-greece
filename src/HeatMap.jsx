import { useState, useMemo, useEffect, useRef } from "react";
import { extent } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { useDimensions } from "./use-dimensions";
import { motion } from "motion/react";
import { ColorLegend } from "./ColorLegend";
import { Tooltip } from "./Tooltip";
import { CITIES } from "./cities";
import { GreeceMap } from "./Map";
import { fetchYearData } from "./FetchData";
import { fetchDiff } from "./ComputeDiff";

const RECT_SPRING = { type: 'spring', stiffness: 100, damping: 18 }; //{ type: "spring", stiffness: 260, damping: 28, mass: 0.7 };

const colorLegendHeight = 8
const colorLegendMargin = 0;
const MARGIN = { top: 20, right: 0, bottom: 60, left: 0 };
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASON_OF_MONTH = [
    "Winter", "Winter",
    "Spring", "Spring", "Spring",
    "Summer", "Summer", "Summer",
    "Autumn", "Autumn", "Autumn",
    "Winter",
];

// Band domain key: week restarts at 0 each year, so week alone is not unique.
const weekKey = ({ year, week }) => `${year}-${week}`;
const weekStart = (year, week) => new Date(year, 0, 1 + week * 7);
const seasonOf = (year, week) => SEASON_OF_MONTH[weekStart(year, week).getMonth()];

function buildXTicks(yearWeeks) {
    const yearTicks = [];
    const monthTicks = [];
    const seasonTicks = [];
    const seasonStartMonthTicks = [];
    let prevYear = null;
    let prevMonthKey = null;
    let prevSeason = null;

    for (const d of yearWeeks) {
        const key = weekKey(d);
        if (d.year !== prevYear) {
            yearTicks.push({ key, label: String(d.year) });
            prevYear = d.year;
        }
        const month = weekStart(d.year, d.week).getMonth();
        const monthKey = `${d.year}-${month}`;
        if (monthKey !== prevMonthKey) {
            monthTicks.push({ key, label: MONTH_ABBR[month] });
            prevMonthKey = monthKey;
        }
        const season = seasonOf(d.year, d.week);
        if (season !== prevSeason) {
            seasonTicks.push({ startKey: key, endKey: key, label: season });
            // First month of this season (for sparse mobile x labels)
            seasonStartMonthTicks.push({ key, label: MONTH_ABBR[month] });
            prevSeason = season;
        } else {
            seasonTicks[seasonTicks.length - 1].endKey = key;
        }
    }
    return { yearTicks, monthTicks, seasonTicks, seasonStartMonthTicks };
}

export const HeatMap = ({width, height, years, activeYear, showDifference = false, isMobile = false, ...props}) => {
    // One row per city × week: { city, year, week, value }
    const [heatmapData, setHeatmapData] = useState(null);
    const [hoveredXY, setHoveredXY] = useState(null);
    const [hoveredLegendValue, setHoveredLegendValue] = useState(null);
    const hoveredValueError = showDifference ? .3 : .8; // we will highlight legend values within this range of the hovered value
    const [interactionData, setInteractionData] = useState(null);
    const [error, setError] = useState(null);

    const fromYear = years?.[0] ?? 2025;
    const toYear = years?.[1] ?? 2026;

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError(null);
                const data = showDifference
                    ? await fetchDiff(fromYear, toYear)
                    : await fetchYearData(activeYear);
                if (!cancelled) setHeatmapData(data);
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError(err.message || "Could not load temperature data.");
                    setHeatmapData(null);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [activeYear, showDifference, fromYear, toYear]);

    const { xScale, yScale, colorScale, monthTicks, seasonTicks } = useMemo(() => {
        if (!heatmapData || !width || !height) {
            return { xScale: null, yScale: null, colorScale: null, monthTicks: [], seasonTicks: [] };
        }

        // Unique (year, week) columns, chronological. Do not use d.week alone:
        // week 0 of 2025 and week 0 of 2026 would share one band.
        const yearWeeks = [
            ...new Map(
                heatmapData.map((d) => [weekKey(d), { year: d.year, week: d.week }]),
            ).values(),
        ].sort((a, b) => a.year - b.year || a.week - b.week);

        const padding = isMobile ? 0.0 : 0.05;
        const xScale = scaleBand()
            .domain(yearWeeks.map(weekKey))
            .range([0, width])
            .padding(padding);

        const cityNames = CITIES.map((c) => c.name);
        const yScale = scaleBand()
            .domain(cityNames)
            .range([MARGIN.top, height - MARGIN.bottom])
            .padding(padding);

        const [minTemp, maxTemp] = extent(heatmapData, (d) => d.value);
        const domain = 
            showDifference ? 
                [Math.min(minTemp, 0), 0, maxTemp] : 
                [Math.min(minTemp, 10), 10, maxTemp];
        const colorScale = scaleLinear()
            .domain(domain)
            .range(["#83EBD8", "#ffffff", "#7C1024"])
            .interpolate(interpolateRgb)
            .clamp(true);

        const { monthTicks: allMonthTicks, seasonTicks, seasonStartMonthTicks } = buildXTicks(yearWeeks);
        // Mobile: only the first month of each season (Dec/Mar/Jun/Sep etc.)
        const monthTicks = isMobile ? seasonStartMonthTicks : allMonthTicks;

        return { xScale, yScale, colorScale, monthTicks, seasonTicks };
    }, [heatmapData, width, height, showDifference, isMobile]);

    if (error) {
        return <div>Could not load data: {error}</div>;
    }

    // First render(s): fetch not finished yet → heatmapData is still null.
    // Don't build scales / marks until data exists.
    if (!heatmapData || !width || !height || !xScale) {
        return <div>Loading…</div>;
    }

    const colorLegend = (
    <ColorLegend
        isMobile={isMobile}
        height={colorLegendHeight}
        leftOffset={isMobile ? 0 : width / 2}
        width={isMobile ? width : width / 2}
        colorScale={colorScale}
        margin={MARGIN}
        showDifference={showDifference}
        colorLegendMargin={isMobile ? - MARGIN.top - 10 : colorLegendMargin}
        interactionData={interactionData}
        onHoverValue={setHoveredLegendValue}
        onHoverEnd={() => setHoveredLegendValue(null)}
    />
    );

    const allRects = heatmapData.map((d) => {
        const x = xScale(weekKey(d));
        const y = yScale(d.city);
        const w = xScale.bandwidth();
        const h = yScale.bandwidth();
        const key = d.city + d.week;

        // No difference available → flat gray cell, no hover / tooltip
        if (d.value == null) {
            return (
                <motion.rect
                    key={key}
                    rx={3}
                    x={x}
                    y={y}
                    fill="#666"
                    pointerEvents="none"
                    initial={{opacity: 0, width: 0, height: 0}}
                    animate={{
                        width: w,
                        height: h,
                        opacity: 0.3,
                    }}
                    exit={{opacity: 0, width: 0, height: 0}}
                    transition={RECT_SPRING}
                />
            );
        }

        const matchesLegend =
            hoveredLegendValue != null &&
            Math.abs(d.value - hoveredLegendValue) <= hoveredValueError;

        const isHovered = hoveredXY != null &&
            (hoveredXY.weekKey === weekKey(d) || hoveredXY.city === d.city);
        const saturation = hoveredLegendValue != null
            ? (matchesLegend ? 1 : 0.3)
            : hoveredXY
                ? (isHovered ? 1 : 0.3)
                : 1;

        return (
            <g key={key}>
                <motion.rect
                    x={x}
                    y={y}
                    rx={3}
                    fill={colorScale(d.value)}
                    pointerEvents="none"
                    initial={{opacity: 0, width: 0, height: 0}}
                    animate={{
                        width: w,
                        height: h,
                        opacity: saturation,
                        filter: `saturate(${saturation})`,
                        stroke: matchesLegend ? "#7C1024" : "transparent",
                        strokeWidth: 0.5
                    }}
                    exit={{opacity: 0, width: 0, height: 0}}
                    transition={RECT_SPRING}
                />
                <rect
                    x={x - (xScale.step() - w) / 2}
                    y={y - (yScale.step() - h) / 2}
                    width={xScale.step()}
                    height={yScale.step()}
                    fill="transparent"
                    onMouseEnter={() => {
                        setHoveredXY({
                            weekKey: weekKey(d),
                            city: d.city,
                        });
                        setInteractionData({
                            xPos: x,
                            yPos: y + h / 2,
                            city: d.city,
                            year: d.year,
                            week: d.week,
                            value: d.value,
                        });
                    }}
                    onMouseLeave={() => {
                        setInteractionData(null);
                        setHoveredXY(null);
                    }}
                />
            </g>
        );
      });

    const cityLabels = CITIES.map((c) => {
        const hovered = hoveredXY?.city === c.name;
        return (
            <text
                key={c.name}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="Gudea, sans-serif"
                fontSize={hovered ? 15 : 11}
                fill={"#666"}
                opacity={hovered || !hoveredXY ? 1 : 0.5}
                x={0 - 5}
                y={yScale(c.name) + yScale.bandwidth() / 2}
            >
                {c.name}
            </text>
        );
    });

    const axisY = height - MARGIN.bottom;
    const xAxis = (
        <g aria-hidden="true">
            {monthTicks.map((t) => {
                const x = xScale(t.key);
                if (x == null) return null;
                return (
                    <g key={`month-${t.key}`} transform={`translate(${x}, 0)`}>
                        <line
                            x1={0}
                            x2={0}
                            y1={axisY}
                            y2={axisY + 4}
                            stroke="#666"
                            strokeWidth={1}
                        />
                        <text
                            x={1}
                            y={axisY + 12}
                            fontSize={11}
                            fill="#666"
                            fontFamily="Gudea, sans-serif"
                        >
                            {t.label}
                        </text>
                    </g>
                );
            })}
            {seasonTicks.map((t) => {
                const x0 = xScale(t.startKey);
                const xEnd = xScale(t.endKey);
                if (x0 == null || xEnd == null) return null;
                const x1 = xEnd + xScale.bandwidth();
                const y0 = axisY + 16;
                const y1 = axisY + 22;
                const wideEnough = x1 - x0 > 40;
                return (
                    <g key={`season-${t.startKey}`}>
                        <path
                            d={`M ${x0} ${y0} L ${x0} ${y1} L ${x1} ${y1}`}
                            fill="none"
                            stroke="#666"
                            strokeWidth={1}
                        />
                        {wideEnough && (
                            <text
                                x={(x0 + x1) / 2}
                                y={y1 + 11}
                                fontSize={10}
                                fill="#666"
                                textAnchor="middle"
                                fontFamily="Gudea, sans-serif"
                            >
                                {t.label}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );

    const mapMargin = {
        top: MARGIN.top + 10,
        left: 0,
        right: 0,
        bottom: MARGIN.bottom + 10,
      };
    return (
        <div>
            {/* Mobile: legend sits under the year filters (above the chart) */}
            {isMobile && (
                <div style={{ width: "100%", marginBottom: 0, minHeight: 50 }}>
                    {colorLegend}
                </div>
            )}
            <div style={{ position: "relative", width, height }}>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {<GreeceMap 
                    margin={mapMargin}
                    width={width - mapMargin.left - mapMargin.right} 
                    height={height - mapMargin.top - mapMargin.bottom} 
                    cityName={hoveredXY?.city}
                    showMap={hoveredXY ? true : false}
                    />}
                </div>
                <svg
                    // style={{ position: "relative", zIndex: hoveredXY?.city ? 0 : 1 }}
                    width={width}
                    height={height}
                    role="img"
                    aria-label="Heatmap of Greece's cities temperatures"
                    overflow="visible"
                >
                    {cityLabels}
                    {allRects}
                    {xAxis}
                </svg>
                <Tooltip
                    interactionData={interactionData}
                    width={width}
                    height={height}
                    showDifference={showDifference}
                />
            </div>
            {!isMobile && colorLegend}
        </div>
    );
}

export default function ResponsiveHeatMap (props) {
    const chartRef = useRef(null);
    const chartSize = useDimensions(chartRef);
    return (
      <div ref={chartRef} style={{ width: "100%", height: "100%" }}>
        <HeatMap width={chartSize.width} height={chartSize.height} {...props} />
      </div>
    );
}