interface LegendProps {
  items: { name: string; color: string }[];
}

const Legend = ({ items }: LegendProps) => {
  return (
    <div className="flex flex-wrap gap-5 justify-center">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span
            className="w-4 h-4 rounded-md"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;
