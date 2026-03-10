"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Download, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CardData = {
  id: string;
  name: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  maritalStatusOther: string | null;
  visitType: string | null;
  cellPhone: string | null;
  homePhone: string | null;
  email: string | null;
  address: string | null;
  aptNumber: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  prayerRequests: string | null;
  prayerForTeam: boolean;
  prayerConfidential: boolean;
  messageTopics: string[] | null;
  messageTopicsOther: string | null;
  nextStep: string[] | null;
  attendanceDuration: string | null;
  campusPreference: string[] | null;
  campusPreferenceOther: string | null;
  howHeard: string[] | null;
  howHeardOther: string | null;
  serviceAttended: string | null;
  ocrStatus: string;
  reviewStatus: string;
  ocrConfidence: number | null;
  ocrError: string | null;
  rawOcrResponse: Record<string, unknown> | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
};

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [card, setCard] = React.useState<CardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [showRawOcr, setShowRawOcr] = React.useState(false);

  const fetchCard = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCard(data);
      setEdits({});
    } catch {
      toast.error("Failed to load card");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  const getValue = (field: keyof CardData): string => {
    if (field in edits) return edits[field];
    const val = card?.[field];
    if (val === null || val === undefined) return "";
    return String(val);
  };

  const setField = (field: string, value: string) => {
    setEdits((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(edits).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edits),
      });
      if (!res.ok) throw new Error();
      toast.success("Card updated");
      await fetchCard();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReviewed = async () => {
    await fetch(`/api/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus: "reviewed" }),
    });
    toast.success("Marked as reviewed");
    fetchCard();
  };

  const handleExport = async () => {
    await fetch(`/api/cards/${id}/export`, { method: "POST" });
    toast.success("Marked as exported");
    fetchCard();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <Header title="Card Not Found" />
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const confidence = card.ocrConfidence;
  const ocrStatus = card.ocrStatus;
  const reviewStatus = card.reviewStatus;
  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-1 size-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn(
            "capitalize",
            ocrStatus === "complete" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            ocrStatus === "error" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            ocrStatus === "processing" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          )}>
            OCR: {ocrStatus}
          </Badge>
          <Badge variant="secondary" className={cn(
            "capitalize",
            reviewStatus === "reviewed" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            reviewStatus === "exported" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            reviewStatus === "unreviewed" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
          )}>
            {reviewStatus}
          </Badge>
          {confidence != null && (
            <Badge variant="outline" className={cn(
              confidence < 50 && "text-red-600 border-red-200",
              confidence >= 50 && confidence <= 75 && "text-amber-600 border-amber-200",
              confidence > 75 && "text-green-600 border-green-200",
            )}>
              {Math.round(confidence)}% confidence
            </Badge>
          )}
        </div>
      </div>

      <Header title={String(card.name || "Unnamed Card")}>
        <div className="flex gap-2">
          {reviewStatus !== "reviewed" && (
            <Button variant="outline" size="sm" onClick={handleMarkReviewed}>
              <Check className="mr-1 size-4" /> Mark Reviewed
            </Button>
          )}
          {reviewStatus !== "exported" && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 size-4" /> Export
            </Button>
          )}
          {hasEdits && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </Header>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Scanned Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scanned Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImagePanel label="Response Card (Back)" url={card.backImageUrl as string | null} />
              <ImagePanel label="Survey (Front)" url={card.frontImageUrl as string | null} />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={getValue("name")} onChange={(v) => setField("name", v)} />
              <Field label="Email" value={getValue("email")} onChange={(v) => setField("email", v)} />
              <Field label="Cell Phone" value={getValue("cellPhone")} onChange={(v) => setField("cellPhone", v)} />
              <Field label="Home Phone" value={getValue("homePhone")} onChange={(v) => setField("homePhone", v)} />
              <SelectField label="Gender" value={getValue("gender")} options={["Male", "Female"]} onChange={(v) => setField("gender", v)} />
              <Field label="Date of Birth" value={getValue("dateOfBirth")} onChange={(v) => setField("dateOfBirth", v)} />
              <SelectField label="Marital Status" value={getValue("maritalStatus")} options={["Married", "Single", "Other"]} onChange={(v) => setField("maritalStatus", v)} />
              <SelectField label="Visit Type" value={getValue("visitType")} options={["First/Second Time Guest", "Update My Information"]} onChange={(v) => setField("visitType", v)} />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" value={getValue("address")} onChange={(v) => setField("address", v)} />
              <Field label="Apt #" value={getValue("aptNumber")} onChange={(v) => setField("aptNumber", v)} />
              <Field label="City" value={getValue("city")} onChange={(v) => setField("city", v)} />
              <Field label="State" value={getValue("state")} onChange={(v) => setField("state", v)} />
              <Field label="Zip" value={getValue("zip")} onChange={(v) => setField("zip", v)} />
            </div>
            <Separator />
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prayer Requests</Label>
              <Textarea
                value={getValue("prayerRequests") as string || ""}
                onChange={(e) => setField("prayerRequests", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Survey Info */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Survey Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">Message Topics</Label>
                <div className="flex flex-wrap gap-1.5">
                  {card.messageTopics && card.messageTopics.length > 0 ? card.messageTopics.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">Next Steps</Label>
                <div className="flex flex-wrap gap-1.5">
                  {card.nextStep && card.nextStep.length > 0 ? card.nextStep.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <SelectField label="Attendance Duration" value={getValue("attendanceDuration")} options={["Less than 6 months", "6 Months - 1 Year", "1-3 Years", "4-6 Years", "7+ Years"]} onChange={(v) => setField("attendanceDuration", v)} />
              <div>
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">Campus Preference</Label>
                <div className="flex flex-wrap gap-1.5">
                  {card.campusPreference && card.campusPreference.length > 0 ? card.campusPreference.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">How Heard</Label>
                <div className="flex flex-wrap gap-1.5">
                  {card.howHeard && card.howHeard.length > 0 ? card.howHeard.map((h) => (
                    <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <SelectField label="Service Attended" value={getValue("serviceAttended")} options={["A", "B", "C", "D"]} onChange={(v) => setField("serviceAttended", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Raw OCR Response */}
        {card.rawOcrResponse && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setShowRawOcr(!showRawOcr)}
              >
                <CardTitle className="text-base">Raw OCR Response</CardTitle>
                {showRawOcr ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </CardHeader>
            {showRawOcr && (
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
                  {JSON.stringify(card.rawOcrResponse, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-1 size-4" /> All Cards
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-1 size-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImagePanel({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {url ? (
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
          <Image src={url} alt={label} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center rounded-lg border bg-muted/50">
          <ImageIcon className="size-12 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value || "__none__"} onValueChange={(v: string | null) => onChange(!v || v === "__none__" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
