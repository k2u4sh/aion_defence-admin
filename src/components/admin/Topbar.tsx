import React from 'react';

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-14 flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">Aion Defence Admin</div>
        <div className="flex items-center gap-3 text-sm">
          <button className="px-3 py-1 rounded-md bg-card border border-border text-foreground">
            Profile
          </button>
        </div>
      </div>
    </header>
  );
}


