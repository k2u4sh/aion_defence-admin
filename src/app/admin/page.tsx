'use client';
import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview and quick actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="mt-2 text-3xl font-bold">1,284</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Products</div>
          <div className="mt-2 text-3xl font-bold">342</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Orders</div>
          <div className="mt-2 text-3xl font-bold">89</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="mt-2 text-3xl font-bold">$12.4k</div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="text-muted-foreground">• User John created a new role</li>
          <li className="text-muted-foreground">• Tag &quot;Maintenance&quot; updated</li>
          <li className="text-muted-foreground">• Product #349 price changed</li>
        </ul>
      </div>
    </div>
  );
}


