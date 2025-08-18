"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-64 border-r border-border bg-card">
      <div className="p-4 text-lg font-semibold text-foreground">Admin</div>
      <nav className="py-2">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                'block px-4 py-2 text-sm ' +
                (isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground')
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


