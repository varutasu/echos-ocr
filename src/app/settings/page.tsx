"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Loader2,
  Save,
  Wifi,
  WifiOff,
  Trash2,
  Brain,
  FolderSearch,
  HardDrive,
  Plug,
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AI_PROVIDERS = [
  {
    value: "gateway",
    label: "Vercel AI Gateway",
    defaultModel: "openai/gpt-4o-mini",
    hint: "openai/gpt-4o-mini, google/gemini-2.5-flash, anthropic/claude-sonnet-4-20250514",
  },
  {
    value: "ollama",
    label: "Ollama (Local)",
    defaultModel: "llava:7b",
    hint: "llava:7b, moondream, llama3.2-vision",
  },
] as const;

type SettingsData = {
  ollamaUrl: string;
  model: string;
  watchDir: string;
  watching: boolean;
  sourceRetentionDays: number;
  imageRetentionDays: number;
  aiProvider: string;
  aiModel: string;
};

const NOTIFICATION_STORAGE_KEY = "echo-ocr-notification-prefs";

type NotificationPrefs = {
  processingComplete: boolean;
  processingErrors: boolean;
  folderWatchAlerts: boolean;
  cleanupReminders: boolean;
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  processingComplete: true,
  processingErrors: true,
  folderWatchAlerts: true,
  cleanupReminders: false,
};

function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_NOTIFICATION_PREFS;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = React.useState<SettingsData>({
    ollamaUrl: "",
    model: "",
    watchDir: "",
    watching: false,
    sourceRetentionDays: 30,
    imageRetentionDays: 180,
    aiProvider: "gateway",
    aiModel: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [aiTestStatus, setAiTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle");
  const [cleanupStatus, setCleanupStatus] = React.useState<{ sourcesEligible: number; imagesEligible: number } | null>(null);
  const [cleaning, setCleaning] = React.useState(false);
  const [notifPrefs, setNotifPrefs] = React.useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  React.useEffect(() => {
    setNotifPrefs(loadNotificationPrefs());
  }, []);

  const updateNotifPref = (key: keyof NotificationPrefs, value: boolean) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    toast.success("Notification preference updated");
  };

  const fetchCleanupStatus = React.useCallback(() => {
    fetch("/api/cleanup")
      .then((r) => r.json())
      .then((data) => {
        if (data.sourcesEligible !== undefined) setCleanupStatus(data);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    fetchCleanupStatus();
  }, [fetchCleanupStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const testAiProvider = async () => {
    setAiTestStatus("testing");
    try {
      const res = await fetch("/api/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.aiProvider,
          model: settings.aiModel,
          ollamaUrl: settings.ollamaUrl,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        setAiTestStatus("success");
        toast.success("AI provider connected successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        setAiTestStatus("error");
        toast.error(data.error || "AI provider test failed");
      }
    } catch {
      setAiTestStatus("error");
      toast.error("Cannot reach AI provider. Check your configuration and API keys.");
    }
  };

  const handleProviderChange = (value: string | null) => {
    if (!value) return;
    const provider = AI_PROVIDERS.find((p) => p.value === value);
    setSettings((s) => ({
      ...s,
      aiProvider: value,
      aiModel: provider?.defaultModel || "",
    }));
    setAiTestStatus("idle");
  };

  const toggleWatch = async () => {
    try {
      const action = settings.watching ? "stop" : "start";
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, watchDir: settings.watchDir }),
      });
      if (!res.ok) throw new Error();
      setSettings((s) => ({ ...s, watching: !s.watching }));
      toast.success(action === "start" ? "Folder watching started" : "Folder watching stopped");
    } catch {
      toast.error("Failed to toggle folder watching");
    }
  };

  const runCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(
        `Cleanup complete: ${data.sourcesDeleted} source files, ${data.imagesDeleted} images, ${data.jobsPurged} jobs removed`
      );
      fetchCleanupStatus();
    } catch {
      toast.error("Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun, description: "Clean and bright interface" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes in low light" },
    { value: "system", label: "System", icon: Monitor, description: "Follows your OS preference" },
  ] as const;

  return (
    <div className="space-y-6">
      <Header title="Settings" description="Configure your app and preferences" icon={Settings}>
        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save Settings
        </Button>
      </Header>

      <Tabs defaultValue="application">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card variant="glass">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="size-4 text-primary" />
                      AI Provider
                    </CardTitle>
                    <CardDescription>Choose the AI model for OCR processing</CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      aiTestStatus === "success"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : aiTestStatus === "error"
                        ? "bg-red-500/10 text-red-700 dark:text-red-300"
                        : ""
                    }
                  >
                    {aiTestStatus === "success" && <Wifi className="mr-1 size-3" />}
                    {aiTestStatus === "error" && <WifiOff className="mr-1 size-3" />}
                    {aiTestStatus === "testing" && <Loader2 className="mr-1 size-3 animate-spin" />}
                    {aiTestStatus === "success"
                      ? "Connected"
                      : aiTestStatus === "error"
                      ? "Error"
                      : aiTestStatus === "testing"
                      ? "Testing..."
                      : "Not tested"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider</Label>
                  <Select value={settings.aiProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</Label>
                  <Input
                    value={settings.aiModel}
                    onChange={(e) => setSettings((s) => ({ ...s, aiModel: e.target.value }))}
                    placeholder={AI_PROVIDERS.find((p) => p.value === settings.aiProvider)?.defaultModel || ""}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {AI_PROVIDERS.find((p) => p.value === settings.aiProvider)?.hint || ""}
                  </p>
                </div>

                {settings.aiProvider === "ollama" && (
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ollama URL</Label>
                    <Input
                      value={settings.ollamaUrl}
                      onChange={(e) => setSettings((s) => ({ ...s, ollamaUrl: e.target.value }))}
                      placeholder="http://192.168.68.108:11434"
                    />
                  </div>
                )}

                {settings.aiProvider === "gateway" && (
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Uses the <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground/80">AI_GATEWAY_API_KEY</code> env
                      var. Model format: <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground/80">provider/model</code>
                    </p>
                  </div>
                )}

                <Button variant="outline" size="sm" className="rounded-xl" onClick={testAiProvider} disabled={aiTestStatus === "testing"}>
                  {aiTestStatus === "testing" ? (
                    <Loader2 className="mr-2 size-3 animate-spin" />
                  ) : (
                    <Wifi className="mr-2 size-3" />
                  )}
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderSearch className="size-4 text-primary" />
                  Folder Monitoring
                </CardTitle>
                <CardDescription>Automatically process new PDFs dropped into a folder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Watch Directory</Label>
                  <Input
                    value={settings.watchDir}
                    onChange={(e) => setSettings((s) => ({ ...s, watchDir: e.target.value }))}
                    placeholder="/data/watch"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Absolute path on the server. Mount a host folder into the container.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant={settings.watching ? "destructive" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={toggleWatch}
                    disabled={!settings.watchDir}
                  >
                    {settings.watching ? "Stop Watching" : "Start Watching"}
                  </Button>
                  {settings.watching && (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="size-4 text-primary" />
                  Storage & Cleanup
                </CardTitle>
                <CardDescription>Auto-purge uploaded files and images to save storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Source PDF Retention (days)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.sourceRetentionDays}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        sourceRetentionDays: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Original uploaded PDFs are deleted after this many days. Card data is kept.
                  </p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Image Retention (days)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.imageRetentionDays}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        imageRetentionDays: parseInt(e.target.value) || 180,
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scanned card images are removed after this many days. Card data is kept.
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      {cleanupStatus ? (
                        <>
                          <span className="font-medium">{cleanupStatus.sourcesEligible}</span> source files
                          {" and "}
                          <span className="font-medium">{cleanupStatus.imagesEligible}</span> card images eligible
                        </>
                      ) : (
                        "Checking..."
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0 rounded-xl"
                      onClick={runCleanup}
                      disabled={cleaning || !cleanupStatus || (cleanupStatus.sourcesEligible === 0 && cleanupStatus.imagesEligible === 0)}
                    >
                      {cleaning ? <Loader2 className="mr-2 size-3 animate-spin" /> : <Trash2 className="mr-2 size-3" />}
                      Run Cleanup Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plug className="size-4 text-primary" />
                  Monday.com Integration
                </CardTitle>
                <CardDescription>Push scanned card data to Monday.com boards (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border-2 border-dashed border-muted-foreground/15 p-6 sm:p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    API endpoints are ready. Configure Monday.com connection in a future update.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use the REST API at <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground/80">/api/cards</code> to
                    integrate with n8n, Zapier, or Monday.com directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sun className="size-4 text-primary dark:hidden" />
                  <Moon className="hidden size-4 text-primary dark:block" />
                  Appearance
                </CardTitle>
                <CardDescription>Choose how Echo OCR looks to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                          active
                            ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20"
                            : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div
                          className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
                            {opt.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Control which events generate toast notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/50">
                  {([
                    { key: "processingComplete" as const, title: "Processing complete", desc: "When a PDF finishes OCR processing" },
                    { key: "processingErrors" as const, title: "Processing errors", desc: "When a job fails or encounters an error" },
                    { key: "folderWatchAlerts" as const, title: "Folder watch alerts", desc: "When the folder watcher starts, stops, or finds new files" },
                    { key: "cleanupReminders" as const, title: "Cleanup reminders", desc: "Periodic reminders when files are eligible for cleanup" },
                  ]).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[item.key]}
                        onCheckedChange={(val: boolean) => updateNotifPref(item.key, val)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
