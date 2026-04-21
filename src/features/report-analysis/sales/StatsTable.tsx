interface Column {
  label: string;
  key: string;
}

interface StatsTableProps {
  columns: Column[];
  data: Record<string, any>[];
  emptyMessage?: string;
}

const StatsTable = ({
  columns,
  data,
  emptyMessage = "No data available",
}: StatsTableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr className="text-gray-400">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-3 px-4">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-b-gray-200 last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-4 text-gray-700 px-4">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StatsTable;
