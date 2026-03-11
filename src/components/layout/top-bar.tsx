"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Upload,
  Bell,
  Moon,
  Sun,
  Settings,
  LogOut,
  ScanLine,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopBar() {
  const { theme, setTheme } = useTheme();

  const handleUploadClick = () => {
    window.dispatchEvent(new CustomEvent("open-upload-modal"));
  };

  return (
    <header className="glass-panel fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl gradient-banner shadow-sm">
          <ScanLine className="size-[18px] text-white" />
        </div>
        <span className="text-base font-bold tracking-tight">Echo OCR</span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="hidden rounded-xl sm:inline-flex"
                onClick={handleUploadClick}
              />
            }
          >
            <Upload className="size-4" />
            <span className="ml-1.5">Upload</span>
          </TooltipTrigger>
          <TooltipContent>Upload documents</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl sm:hidden"
                onClick={handleUploadClick}
              />
            }
          >
            <Upload className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Upload documents</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
              />
            }
          >
            <Bell className="size-4" />
            <span className="sr-only">Notifications</span>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-9 rounded-xl" />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>
                <User className="size-3.5" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/settings" />}
            >
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
