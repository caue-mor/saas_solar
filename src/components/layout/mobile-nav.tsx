"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sun,
  Kanban,
  Settings,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Kanban",
    href: "/dashboard/kanban",
    icon: Kanban,
  },
  {
    title: "Contatos",
    href: "/dashboard/contatos",
    icon: Users,
  },
  {
    title: "Sistemas",
    href: "/dashboard/sistemas",
    icon: Sun,
  },
  {
    title: "Config",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-solar-600"
                  : "text-muted-foreground hover:text-solar-600"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-solar-600")} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
