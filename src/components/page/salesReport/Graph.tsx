import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Graph = (props: { graphData; xAxis: string; lines: string[] }) => {
    const { graphData, xAxis, lines } = props;

    return (
        <ResponsiveContainer width="99%">
            <LineChart
                data={graphData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                {lines.map((l, i) => (
                    <Line key={i} type="monotone" dataKey={l} stroke="#8884d8" />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};
