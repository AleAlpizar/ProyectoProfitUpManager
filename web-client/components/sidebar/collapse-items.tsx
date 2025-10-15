import React from "react";

interface Props {
  icon: React.ReactNode;
  title: string;
  items: string[];
  onItemClick?: (item: string, index: number) => void;
}

export const CollapseItems: React.FC<Props> = ({
  icon,
  title,
  items,
  onItemClick,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group w-full rounded-lg border border-white/5 bg-transparent px-4 py-3
                   text-left transition active:scale-[0.99] hover:bg-white/5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#A30862]/15 text-[#A30862]">
              {icon}
            </span>

            <span className="text-sm font-medium text-gray-200">{title}</span>
          </div>

          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {items.map((item, index) => (
            <button
              key={`${item}-${index}`}
              type="button"
              onClick={() => onItemClick?.(item, index)}
              className="w-full rounded-md px-4 py-2 pl-12 text-left text-sm
                         text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
