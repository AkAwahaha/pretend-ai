import { CATEGORIES, type Category } from "../data/sources";

interface FilterChipsProps {
  value: Category;
  onChange: (value: Category) => void;
}

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="chips" role="tablist" aria-label="内容分类">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={value === category}
          className={value === category ? "chip chip--active" : "chip"}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
