'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarOff,
  Images,
  Flower2,
  Settings,
  ClipboardList,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from './brand';
const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/blocked-dates', label: 'Blocked Dates', icon: CalendarOff },
  { href: '/admin/gallery', label: 'Gallery', icon: Images },
  { href: '/admin/services', label: 'Services', icon: Flower2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];
export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      router.replace('/admin/login');
      router.refresh();
    } catch {
      toast.error('Sign out failed. Please try again.');
      setBusy(false);
    }
  }
  return (
    <div className="admin-layout">
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Brand />
        <div className="workspace-label">VENUE WORKSPACE</div>
        <nav className="admin-links" aria-label="Admin navigation">
          {links
            .filter((l) => l.href !== '/admin/settings' || role === 'admin')
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={
                  (l.href === '/admin' ? path === l.href : path.startsWith(l.href)) ? 'active' : ''
                }
              >
                <l.icon size={17} strokeWidth={1.6} />
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="admin-profile">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#48634d] w-9 h-9 grid place-items-center">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              {name}
              <small>{role}</small>
            </div>
          </div>
          <button className="admin-logout" onClick={logout} disabled={busy}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}Sign
            out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            <button
              className="admin-mobile-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle sidebar"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#829573]" />
              Soleil Garden <span className="text-[#a5ad9a]">/</span>{' '}
              {links.find((l) => l.href === path)?.label || 'Bookings'}
            </span>
          </div>
          <Link href="/" target="_blank" className="flex items-center gap-2">
            View website <ArrowUpRight size={13} />
          </Link>
        </header>
        <main id="main-content" className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
