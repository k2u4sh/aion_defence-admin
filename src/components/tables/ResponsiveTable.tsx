"use client";

import React from "react";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="inline-block w-full align-middle">
        <div className="w-full overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-[1400px] w-full divide-y divide-gray-300 dark:divide-gray-700">
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTable;
