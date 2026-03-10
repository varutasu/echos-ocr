"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Save, Wifi, WifiOff, Trash2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Settings = {
  ollamaUrl: string;
  model: string;
  watchDir: string;
  watching: boolean;
  sourceRetentionDays: number;
  imageRetentionDays: number;
};

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings>({
    ollamaUrl: "",
    model: "",
    watchDir: "",
    watching: false,
    sourceRetentionDays: 30,
    imageRetentionDays: 180,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [ollamaStatus, setOllamaStatus] = React.useState<"unknown" | "connected" | "error">("unknown");
  const [cleanupStatus, setCleanupStatus] = React.useState<{ sourcesEligible: number; imagesEligible: number } | null>(null);
  const [cleaning, setCleaning] = React.useState(false);

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

  const testOllamaConnection = async () => {
    setOllamaStatus("unknown");
    try {
      const url = settings.ollamaUrl || "http://192.168.68.108:11434";
      const res = await fetch(`${url}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setOllamaStatus("connected");
        toast.success("Connected to Ollama");
      } else {
        setOllamaStatus("error");
        toast.error("Ollama responded with an error");
      }
    } catch {
      setOllamaStatus("error");
      toast.error("Cannot reach Ollama. Check the URL and ensure it's running.");
    }
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

  return (
    <div className="space-y-6">
      <Header title="Settings" description="Configure OCR and app settings">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save Settings
        </Button>
      </Header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ollama Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ollama Configuration</CardTitle>
                <CardDescription>Connect to your Ollama instance for OCR processing</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={
                  ollamaStatus === "connected"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : ollamaStatus === "error"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : ""
                }
              >
                {ollamaStatus === "connected" && <Wifi className="mr-1 size-3" />}
                {ollamaStatus === "error" && <WifiOff className="mr-1 size-3" />}
                {ollamaStatus === "connected" ? "Connected" : ollamaStatus === "error" ? "Error" : "Not tested"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ollama URL</Label>
              <Input
                value={settings.ollamaUrl}
                onChange={(e) => setSettings((s) => ({ ...s, ollamaUrl: e.target.value }))}
                placeholder="http://192.168.68.108:11434"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</Label>
              <Input
                value={settings.model}
                onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                placeholder="llava:7b"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Recommended: llava:7b, moondream, or llama3.2-vision
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={testOllamaConnection}>
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Folder Watch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Folder Monitoring</CardTitle>
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
            <div className="flex items-center gap-3">
              <Button
                variant={settings.watching ? "destructive" : "outline"}
                size="sm"
                onClick={toggleWatch}
                disabled={!settings.watchDir}
              >
                {settings.watching ? "Stop Watching" : "Start Watching"}
              </Button>
              {settings.watching && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage & Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage & Cleanup</CardTitle>
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
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
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

        {/* Monday.com Integration (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monday.com Integration</CardTitle>
            <CardDescription>Push scanned card data to Monday.com boards (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                API endpoints are ready. Configure Monday.com connection in a future update.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Use the REST API at <code className="rounded bg-muted px-1 py-0.5">/api/cards</code> to
                integrate with n8n, Zapier, or Monday.com directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
