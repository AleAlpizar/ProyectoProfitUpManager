import React from "react";
import Image from "next/image";
import Link from "next/link";

export const CompaniesDropdown: React.FC = () => {
  const company = {
    name: "ProfitUpManager",
    location: "Atenas - Alajuela - Costa Rica",
  };

  return (
    <Link href="/" className="block">
      <div className="flex items-center gap-3">
        <Image
          src="/brand/pum-logo.jpg"
          alt="ProfitUpManager"
          width={32}
          height={32}
          priority
          className="rounded-md"
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{company.name}</div>
          <div className="text-xs text-gray-400 truncate">{company.location}</div>
        </div>
      </div>
    </Link>
  );
};
