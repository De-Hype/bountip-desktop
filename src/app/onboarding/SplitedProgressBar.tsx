interface SplitedProgressBarProps {
  length: number;
  filled: number;
  color?: string;
}

const SplitedProgressBar = ({
  length,
  filled,
  color = "#15BA5C",
}: SplitedProgressBarProps) => {
  return (
    <div className="w-full flex h-2.5 gap-1.5">
      {Array.from({ length }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < filled ? color : "#E8E8E8",
          }}
        />
      ))}
    </div>
  );
};

export default SplitedProgressBar;
