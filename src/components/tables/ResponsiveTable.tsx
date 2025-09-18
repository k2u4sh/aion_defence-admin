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
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTable;
