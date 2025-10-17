import React from "react";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const SidebarMenu: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="
          text-[10px] uppercase tracking-[0.08em]
          text-gray-400
          pl-1
        "
      >
        {title}
      </span>

      <div className="flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  );
};

export default SidebarMenu;
