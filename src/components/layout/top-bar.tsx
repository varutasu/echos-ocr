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
  UserCircle,
  LifeBuoy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useUserProfile } from "@/lib/user-profile";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { profile, initials } = useUserProfile();

  const handleUploadClick = () => {
    window.dispatchEvent(new CustomEvent("open-upload-modal"));
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeLabel =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

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
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />}
              <AvatarFallback>
                {initials || <User className="size-3.5" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3 px-0.5 py-1">
                <Avatar>
                  {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />}
                  <AvatarFallback className="text-xs">
                    {initials || <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.displayName || "Set up profile"}
                  </p>
                  {profile.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserCircle className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.open("mailto:support@echoocr.app", "_blank")}
            >
              <LifeBuoy className="size-4" />
              Support
            </DropdownMenuItem>
            <DropdownMenuItem onClick={cycleTheme}>
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
              Theme: {themeLabel}
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
