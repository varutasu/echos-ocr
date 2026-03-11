import type { LucideIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function Header({ title, description, icon: Icon, children }: HeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          {children}
        </div>
      )}
    </header>
  );
}
