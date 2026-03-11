"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Upload,
  Settings,
  Moon,
  Sun,
  ScanLine,
  Menu,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]",
              isActive
                ? "bg-primary/10 text-primary shadow-sm dark:bg-primary/15"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "opacity-60")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        }
      >
        <Sun className="size-[18px] dark:hidden" />
        <Moon className="hidden size-[18px] dark:block" />
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent side="right">
        {theme === "dark" ? "Switch to light" : "Switch to dark"}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl gradient-banner shadow-md">
          <ScanLine className="size-[18px] text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            Echo OCR
          </span>
          <span className="text-[11px] text-muted-foreground">
            Document Scanner
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-auto py-4">
        <div className="mb-2 px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Menu
          </span>
        </div>
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 border-t border-sidebar-border/50 p-3">
        <div className="flex items-center justify-between rounded-xl px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {/* Theme icon inline */}
              <Sun className="size-3.5 dark:hidden" />
              <Moon className="hidden size-3.5 dark:block" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-3 top-3.5 z-40 size-10 rounded-xl glass-card md:hidden"
            />
          }
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[260px] border-sidebar-border/50 glass-sidebar p-0"
          showCloseButton={true}
        >
          <div className="flex h-full w-full flex-col">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col glass-sidebar",
          "md:flex"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
