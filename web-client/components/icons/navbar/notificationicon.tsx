import React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export const NotificationIcon: React.FC<Props> = (props) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.03)" />
      <path
        d="M12 4.5a4.5 4.5 0 00-4.5 4.5v2.4c0 .48-.19.94-.53 1.28l-1.25 1.25c-.78.78-.23 2.07.88 2.07h10.8c1.11 0 1.66-1.29.88-2.07l-1.25-1.25a1.8 1.8 0 01-.53-1.28V9A4.5 4.5 0 0012 4.5z"
        fill="none"
        stroke="#E6E9EA"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.75 17.5a1.25 1.25 0 002.5 0"
        fill="none"
        stroke="#E6E9EA"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
};
