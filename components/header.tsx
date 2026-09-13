'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { useHydrated } from '@/lib/use-hydrated';
const links = [
  ['Home', '/'],
  ['Events', '/events'],
  ['Weddings', '/weddings'],
  ['Gallery', '/gallery'],
  ['About', '/about'],
  ['Contact', '/contact'],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const hydrated = useHydrated();
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </nav>
        <Button asChild className="desktop-nav">
          <Link href="/reserve">
            Plan Your Event <ArrowUpRight size={14} />
          </Link>
        </Button>
        <Button
          className="mobile-toggle"
          disabled={!hydrated}
          variant="ghost"
          size="icon"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
        {open && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link onClick={() => setOpen(false)} key={href} href={href}>
                {label}
              </Link>
            ))}
            <Button asChild>
              <Link href="/reserve" onClick={() => setOpen(false)}>
                Plan Your Event <ArrowUpRight size={14} />
              </Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
