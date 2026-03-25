interface TagChipSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const TagChipSelector = ({ label, options, selected, onChange }: TagChipSelectorProps) => {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter(i => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              selected.includes(item)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagChipSelector;
