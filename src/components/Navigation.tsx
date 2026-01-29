'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Calendar, History, Settings } from 'lucide-react';

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: 'Generate', href: '/dashboard', icon: Sparkles },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'History', href: '/history', icon: History },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <>
            {/* Desktop Navigation (Top Pills) */}
            <div className="hidden md:block container mx-auto px-4 py-4">
                <nav className="flex items-center gap-1 w-fit rounded-xl bg-secondary p-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile Navigation (Bottom Fixed) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
                <nav className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors ${active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? 'fill-current/10' : ''}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
