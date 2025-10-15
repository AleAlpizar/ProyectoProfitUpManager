import React from "react";

export const CompaniesDropdown: React.FC = () => {
  const company = {
    name: "ProfitUpManager",
    location: "Atenas - Alajuela - Costa Rica",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-600 text-xs font-bold text-white">
        PU
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">{company.name}</div>
        <div className="text-xs text-gray-400 truncate">{company.location}</div>
      </div>
    </div>
  );
};
