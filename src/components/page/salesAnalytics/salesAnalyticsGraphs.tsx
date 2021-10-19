import { useState } from "react";
import { Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";

export const LineGraph = (props: { graphData; xAxis: string; lines: string[]; fill: string }) => {
    const { graphData, xAxis, lines, fill } = props;

    return (
        <ResponsiveContainer width="99%">
            <LineChart
                data={graphData}
                margin={{
                    top: 5,
                    right: 5,
                    left: 5,
                    bottom: 5,
                }}
            >
                <XAxis dataKey={xAxis} tick={{ fontSize: 14 }} />
                <YAxis
                    tick={{ fontSize: 14 }}
                    tickFormatter={(tick) => {
                        return `$${tick}`;
                    }}
                />
                <Tooltip
                    formatter={(value, name, props) => {
                        return `$${value}`;
                    }}
                />
                <Legend verticalAlign="top" />
                {lines.map((l, i) => (
                    <Line key={i} type="monotone" dataKey={l} stroke={fill} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
        <g>
            <text x={cx} y={0} dy={30} textAnchor="middle" fill={fill}>
                {`${payload.name} ${value}`}
            </text>
            <text x={cx} y={0} dy={45} textAnchor="middle" fill="#999">
                {`(Rate ${(percent * 100).toFixed(2)}%)`}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            {/* <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name} ${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(Rate ${(percent * 100).toFixed(2)}%)`}
            </text> */}
        </g>
    );
};

export const PieGraph = (props: { data; fill: string }) => {
    const { data, fill } = props;
    const [activeIndex, setActiveIndex] = useState(0);
    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill={fill}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};
