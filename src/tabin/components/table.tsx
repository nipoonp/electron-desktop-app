export const Table = (props: ITable) => {
    const { cols, rows, className } = props;
    return (
        <table className={className}>
            <thead>
                <tr key="0">
                    { cols && cols.map((c, index) => (
                        <th key={index}>{c}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                { rows && rows.map((row, i) => {
                    return (
                        <tr key={i}>
                            {row.map((r, index) => (
                                <td key={index}>{r}</td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

interface ITable {
    cols: string[] | undefined;
    rows: any[] | undefined;
    className?: string;
    children?: React.ReactNode;
}
