"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Save,
  UserCircle,
  Camera,
  X,
  Mail,
  Briefcase,
  Building2,
  Shield,
  Loader2,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user-profile";

export default function ProfilePage() {
  const { profile, updateProfile, initials, authentikUser, isAuthenticated, loading } = useUserProfile();

  const [form, setForm] = React.useState({
    jobTitle: profile.jobTitle,
    company: profile.company,
    bio: profile.bio,
    // Only editable when NOT coming from Authentik
    displayName: profile.displayName,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
  });
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setForm({
      jobTitle: profile.jobTitle,
      company: profile.company,
      bio: profile.bio,
      displayName: profile.displayName,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    const updates: Record<string, string> = {
      jobTitle: form.jobTitle,
      company: form.company,
      bio: form.bio,
    };
    if (!isAuthenticated) {
      updates.displayName = form.displayName;
      updates.email = form.email;
      updates.avatarUrl = form.avatarUrl;
    }
    updateProfile(updates);
    setDirty(false);
    toast.success("Profile updated");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleChange("avatarUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    handleChange("avatarUrl", "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nameFromAuthentik = isAuthenticated && !!authentikUser?.name;
  const emailFromAuthentik = isAuthenticated && !!authentikUser?.email;
  const avatarFromAuthentik = isAuthenticated && !!authentikUser?.avatar;

  return (
    <div className="space-y-6">
      <Header title="Profile" description="Manage your personal information" icon={UserCircle}>
        <Button className="rounded-xl" onClick={handleSave} disabled={!dirty}>
          <Save className="mr-2 size-4" />
          Save Changes
        </Button>
      </Header>

      {isAuthenticated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <Shield className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Signed in via Authentik as <span className="font-medium">{authentikUser?.username}</span>.
            Name, email, and avatar are managed by your identity provider.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Photo</CardTitle>
            <CardDescription>
              {avatarFromAuthentik
                ? "Managed by Authentik"
                : "Your profile picture is visible in the header"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar size="lg" className="!size-24 text-2xl">
                {form.avatarUrl && (
                  <AvatarImage src={form.avatarUrl} alt={form.displayName} />
                )}
                <AvatarFallback className="text-2xl">
                  {initials || <UserCircle className="size-10 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              {!avatarFromAuthentik && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>
            {!avatarFromAuthentik && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                >
                  <Camera className="mr-1.5 size-3" />
                  Upload
                </Button>
                {form.avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground"
                    onClick={removeAvatar}
                  >
                    <X className="mr-1.5 size-3" />
                    Remove
                  </Button>
                )}
              </div>
            )}
            {avatarFromAuthentik && (
              <p className="text-center text-xs text-muted-foreground">
                Update your avatar in{" "}
                <a
                  href="https://auth.stillwell.cloud/if/user/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Authentik
                </a>
              </p>
            )}
            {!avatarFromAuthentik && (
              <p className="text-center text-xs text-muted-foreground">
                JPG, PNG or WebP. Max 2 MB.
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>
              {isAuthenticated
                ? "Some fields are synced from Authentik"
                : "Update your name, email, and other details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <UserCircle className="size-3" />
                  Display Name
                  {nameFromAuthentik && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">SSO</Badge>
                  )}
                </Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="Your name"
                  readOnly={nameFromAuthentik}
                  className={nameFromAuthentik ? "bg-muted/40 cursor-default" : ""}
                />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail className="size-3" />
                  Email
                  {emailFromAuthentik && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">SSO</Badge>
                  )}
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  readOnly={emailFromAuthentik}
                  className={emailFromAuthentik ? "bg-muted/40 cursor-default" : ""}
                />
              </div>
            </div>

            {isAuthenticated && authentikUser?.groups && authentikUser.groups.length > 0 && (
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Shield className="size-3" />
                  Groups
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">SSO</Badge>
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {authentikUser.groups.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Briefcase className="size-3" />
                  Job Title
                </Label>
                <Input
                  value={form.jobTitle}
                  onChange={(e) => handleChange("jobTitle", e.target.value)}
                  placeholder="e.g. Project Manager"
                />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Building2 className="size-3" />
                  Company
                </Label>
                <Input
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="e.g. Echo Labs"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Bio
              </Label>
              <Textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="min-h-24 resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
