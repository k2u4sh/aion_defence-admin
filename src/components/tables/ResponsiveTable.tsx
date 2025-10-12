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
    <div className={`overflow-x-auto -mx-2 sm:-mx-4 lg:-mx-6 ${className}`}>
      <div className="inline-block min-w-full align-middle px-2 sm:px-4 lg:px-6">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTable;
