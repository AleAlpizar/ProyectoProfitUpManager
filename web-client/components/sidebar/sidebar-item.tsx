
import React from "react";
import { useRouter } from "next/router";

type Props = {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href: string;
  onClickItem?: () => void;
};

export const SidebarItem: React.FC<Props> = ({
  icon,
  title,
  isActive = false,
  href,
  onClickItem,
}) => {
  const router = useRouter();

  const handleClick = async () => {
    if (router.asPath !== href) {
      await router.push(href);
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClickItem?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group w-full select-none",
        "flex items-center gap-3 rounded-lg px-4 py-2.5",
        "text-sm transition",
        "focus:outline-none focus:ring-2 focus:ring-[#A30862]/30",
        isActive
          ? "bg-[#A30862]/15 ring-1 ring-[#A30862]/30"
          : "hover:bg-white/5",
      ].join(" ")}
      title={title}
    >
      <span
        className={[
          "grid h-8 w-8 place-items-center rounded-md",
          isActive
            ? "bg-[#A30862]/20 text-[#A30862]"
            : "bg-white/5 text-gray-300 group-hover:text-white",
        ].join(" ")}
      >
        {icon}
      </span>

      <span
        className={[
          "truncate",
          isActive ? "text-white" : "text-gray-200 group-hover:text-white",
        ].join(" ")}
      >
        {title}
      </span>
    </button>
  );
};

export default SidebarItem;
