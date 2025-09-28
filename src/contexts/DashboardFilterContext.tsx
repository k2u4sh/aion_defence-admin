"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface FilterState {
  period: 'monthly' | 'yearly';
  year: number;
  month: number;
}

interface DashboardFilterContextType {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  updatePeriod: (period: 'monthly' | 'yearly') => void;
  updateYear: (year: number) => void;
  updateMonth: (month: number) => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export const useDashboardFilters = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
};

interface DashboardFilterProviderProps {
  children: React.ReactNode;
}

export const DashboardFilterProvider: React.FC<DashboardFilterProviderProps> = ({ children }) => {
  const [filters, setFiltersState] = useState<FilterState>({
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const updatePeriod = (period: 'monthly' | 'yearly') => {
    setFiltersState(prev => ({ ...prev, period }));
  };

  const updateYear = (year: number) => {
    setFiltersState(prev => ({ ...prev, year }));
  };

  const updateMonth = (month: number) => {
    setFiltersState(prev => ({ ...prev, month }));
  };

  return (
    <DashboardFilterContext.Provider
      value={{
        filters,
        setFilters,
        updatePeriod,
        updateYear,
        updateMonth,
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
};

