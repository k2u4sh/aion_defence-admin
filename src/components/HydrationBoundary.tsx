"use client";

import { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationBoundary({ children, fallback = null }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure hydration is complete
    setIsHydrated(true);
  }, []);

  // During SSR and initial hydration, show fallback
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // After hydration, show the actual content
  return <>{children}</>;
}
