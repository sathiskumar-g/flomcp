// Two-column settings layout — left sidebar nav + right content panel
// Sections: Account | Security | Profile | Subscription | Legal | API Key | Sign Out | Danger Zone

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  User, Lock, Briefcase, FileText, Key, LogOut, ShieldAlert,
  Eye, EyeOff, CheckCircle2, Loader2, ExternalLink, Trash2,
  CreditCard, Zap, ArrowRight, Crown, Building2,
} from "lucide-react";

// ─── Types & nav config ──────────────────────────────────────────────────────

const PROFILE_ROLES = ["Developer", "Team Lead", "Student", "Researcher", "Other"] as const;
type ProfileRole = (typeof PROFILE_ROLES)[number];

type SectionId = "account" | "security" | "profile" | "subscription" | "legal" | "api" | "signout" | "danger";

interface SettingsNav {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

const NAV_ITEMS: SettingsNav[] = [
  { id: "account",      label: "Account",      icon: User },
  { id: "security",     label: "Security",     icon: Lock },
  { id: "profile",      label: "Profile",      icon: Briefcase },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "legal",        label: "Legal",        icon: FileText },
  { id: "api",          label: "API Key",      icon: Key },
  { id: "signout",      label: "Sign Out",     icon: LogOut },
  { id: "danger",       label: "Danger Zone",  icon: ShieldAlert, danger: true },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function AccountSection({
  email, displayName, setDisplayName, displayNameError, setDisplayNameError, savingAccount, onSave,
}: {
  email: string; displayName: string; setDisplayName: (v: string) => void;
  displayNameError: string | null; setDisplayNameError: (v: string | null) => void;
  savingAccount: boolean; onSave: () => void;
}) {
  return (
    <div>
      <SectionHeader title="Account" description="Your account details and display name." />
      <div className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Email address</label>
          <Input value={email} readOnly disabled className="bg-muted/30 text-muted-foreground cursor-not-allowed" />
          <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="display-name" className="text-xs font-medium text-muted-foreground">Display name</label>
          <Input id="display-name" value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setDisplayNameError(null); }}
            placeholder="Your name" maxLength={64}
            className={cn(displayNameError && "border-red-500/60")} />
          <FieldError msg={displayNameError} />
        </div>
        <Button size="sm" onClick={onSave} disabled={savingAccount} className="gap-2">
          {savingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {savingAccount ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function SecuritySection({
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showNew, setShowNew, showConfirm, setShowConfirm,
  passwordErrors, setPasswordErrors, savingPassword, onSave,
}: {
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showNew: boolean; setShowNew: (v: boolean) => void;
  showConfirm: boolean; setShowConfirm: (v: boolean) => void;
  passwordErrors: { new: string | null; confirm: string | null };
  setPasswordErrors: (v: { new: string | null; confirm: string | null }) => void;
  savingPassword: boolean; onSave: () => void;
}) {
  return (
    <div>
      <SectionHeader title="Security" description="Change your account password." />
      <div className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">New password</label>
          <div className="relative">
            <Input id="new-password" type={showNew ? "text" : "password"} value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors({ ...passwordErrors, new: null }); }}
              placeholder="Min. 8 characters" maxLength={72}
              className={cn("pr-10", passwordErrors.new && "border-red-500/60")} autoComplete="new-password" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError msg={passwordErrors.new} />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground">Confirm password</label>
          <div className="relative">
            <Input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors({ ...passwordErrors, confirm: null }); }}
              placeholder="Re-enter new password" maxLength={72}
              className={cn("pr-10", passwordErrors.confirm && "border-red-500/60")} autoComplete="new-password" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError msg={passwordErrors.confirm} />
        </div>
        <Button size="sm" onClick={onSave} disabled={savingPassword || !newPassword} className="gap-2">
          {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
          {savingPassword ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </div>
  );
}

function ProfileSection({ profileRole, setProfileRole, savingRole, onSave }: {
  profileRole: ProfileRole | ""; setProfileRole: (v: ProfileRole | "") => void;
  savingRole: boolean; onSave: () => void;
}) {
  return (
    <div>
      <SectionHeader title="Profile" description="Tell us how you use FloMCP." />
      <div className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label htmlFor="profile-role" className="text-xs font-medium text-muted-foreground">Role / Purpose</label>
          <select id="profile-role" value={profileRole}
            onChange={(e) => setProfileRole(e.target.value as ProfileRole)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="" disabled>Select your role…</option>
            {PROFILE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={onSave} disabled={savingRole || !profileRole} className="gap-2">
          {savingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {savingRole ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

function SubscriptionSection() {
  const currentPlan = "free";
  return (
    <div>
      <SectionHeader title="Subscription" description="Manage your plan and billing." />
      <div className="space-y-4 max-w-lg">
        {/* Current plan */}
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Free Plan</p>
                  <p className="text-xs text-muted-foreground">5 credits — never expire</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-green-500/40 text-green-600 bg-green-500/5">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade to Pro */}
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Upgrade to Pro</CardTitle>
              <Badge className="text-xs">$29/mo</Badge>
            </div>
            <CardDescription className="text-sm">
              Pro gives you 50 credits/month with rollover, priority queue, MCP Assistant security audit, team workspaces, and email support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
              {[
                "50 credits/month (half unused roll over)",
                "Priority AI generation queue (faster)",
                "MCP Assistant — security audit",
                "Credit top-up packs available",
                "Team workspaces (up to 3 members)",
                "Email support — 48h response",
                "Early access to new features",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/#pricing">
              <Button className="w-full gap-2">
                <Crown className="h-4 w-4" />
                Get Pro — $29/mo
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Enterprise / Custom Build</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Need a bespoke MCP server built to spec for your product or team?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
              {[
                "Custom MCP server built to your exact specification",
                "Private codebase delivery",
                "Security review + full documentation",
                "Ongoing maintenance option",
                "Dedicated support channel",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <a href="mailto:support@flomcp.com?subject=Enterprise%20MCP%20enquiry">
              <Button variant="outline" className="w-full gap-2">
                <ArrowRight className="h-4 w-4" />Contact Us for Enterprise
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Cancel — only for paid plans */}
        {currentPlan !== "free" && (
          <Card className="border-border/60">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Cancel Subscription</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Access continues until end of billing period.</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-500/40 hover:bg-red-500/10">
                  Cancel Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function LegalSection({ termsAccepted }: { termsAccepted: boolean }) {
  return (
    <div>
      <SectionHeader title="Legal" description="Terms and privacy information." />
      <div className="space-y-3 max-w-md">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Terms &amp; Conditions</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {termsAccepted ? "Accepted when you signed up." : "Acceptance not recorded."}
            </p>
          </div>
          {termsAccepted ? (
            <Badge variant="secondary" className="text-xs gap-1 text-green-700 border-green-500/30 bg-green-500/10 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Accepted
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs flex-shrink-0">Pending</Badge>
          )}
        </div>
        {[
          { label: "Privacy Policy", desc: "How we handle your data.", href: "/legal/privacy-policy" },
          { label: "Terms of Service", desc: "Rules and conditions of use.", href: "/legal/terms-of-service" },
          { label: "Acceptable Use Policy", desc: "What you can and can't do.", href: "/legal/acceptable-use" },
        ].map(({ label, desc, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors group">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

function ApiKeySection() {
  return (
    <div>
      <SectionHeader title="API Key" description="Use FloMCP programmatically via REST API." />
      <div className="max-w-md">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Personal API Key</p>
              <Badge variant="secondary" className="text-xs gap-1 inline-flex items-center"><Crown className="h-3 w-3" />Coming Soon</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Generate and manage MCP servers programmatically. Under development.
            </p>
          </div>
          <Button size="sm" variant="outline" disabled className="flex-shrink-0 gap-1.5">
            <Key className="h-3.5 w-3.5" />Generate Key
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("account");

  // Account
  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Security / Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ new: string | null; confirm: string | null }>({ new: null, confirm: null });
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile role
  const [profileRole, setProfileRole] = useState<ProfileRole | "">("");
  const [savingRole, setSavingRole] = useState(false);

  // Danger zone — delete account
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sign-out
  const [signingOut, setSigningOut] = useState(false);

  // ── Load session ──────────────────────────────────────────────────────────

  const loadUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/auth/signin"); return; }
      const u = session.user;
      setUser(u);
      setDisplayName(u.user_metadata?.display_name ?? u.email?.split("@")[0] ?? "");
      setProfileRole((u.user_metadata?.profile_role as ProfileRole) ?? "");
    } catch {
      router.push("/auth/signin");
    } finally {
      setLoading(false);
    }
  }, [router, supabase.auth]);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSaveAccount() {
    setDisplayNameError(null);
    const name = displayName.trim();
    if (!name) { setDisplayNameError("Display name cannot be empty."); return; }
    if (name.length > 64) { setDisplayNameError("Display name must be 64 characters or fewer."); return; }
    setSavingAccount(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to save."); return; }
      toast.success("Display name updated.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSavingAccount(false);
    }
  }

  function validatePassword() {
    const errs = { new: null as string | null, confirm: null as string | null };
    if (!newPassword) { errs.new = "New password is required."; }
    else if (newPassword.length < 8) { errs.new = "Must be at least 8 characters."; }
    else if (newPassword.length > 72) { errs.new = "Must be 72 characters or fewer."; }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errs.confirm = "Passwords do not match.";
    }
    return errs;
  }

  async function handleChangePassword() {
    const errs = validatePassword();
    setPasswordErrors(errs);
    if (errs.new || errs.confirm) return;
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to update password."); return; }
      toast.success("Password updated successfully.");
      setNewPassword(""); setConfirmPassword(""); setPasswordErrors({ new: null, confirm: null });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveRole() {
    if (!profileRole) { toast.error("Please select a role first."); return; }
    setSavingRole(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_role: profileRole }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to save."); return; }
      toast.success("Profile updated.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/auth/signin");
    } catch {
      toast.error("Sign-out failed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteConfirmInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to delete account."); setDeleting(false); return; }
      setDeleteDialogOpen(false);
      toast.success("Your account has been permanently deleted.");
      router.push("/auth/signin");
    } catch {
      toast.error("Network error. Please try again.");
      setDeleting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex gap-6 h-full">
        <div className="w-52 shrink-0 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-28 bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const email = user?.email ?? "";
  const termsAccepted = user?.user_metadata?.terms_accepted === true;

  function renderSection() {
    switch (activeSection) {
      case "account":
        return (
          <AccountSection email={email} displayName={displayName} setDisplayName={setDisplayName}
            displayNameError={displayNameError} setDisplayNameError={setDisplayNameError}
            savingAccount={savingAccount} onSave={handleSaveAccount} />
        );
      case "security":
        return (
          <SecuritySection newPassword={newPassword} setNewPassword={setNewPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            showNew={showNew} setShowNew={setShowNew}
            showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            passwordErrors={passwordErrors} setPasswordErrors={setPasswordErrors}
            savingPassword={savingPassword} onSave={handleChangePassword} />
        );
      case "profile":
        return (
          <ProfileSection profileRole={profileRole} setProfileRole={setProfileRole}
            savingRole={savingRole} onSave={handleSaveRole} />
        );
      case "subscription":
        return <SubscriptionSection />;
      case "legal":
        return <LegalSection termsAccepted={termsAccepted} />;
      case "api":
        return <ApiKeySection />;
      case "signout":
        return (
          <div>
            <SectionHeader title="Sign Out" description="Sign out of your FloMCP account." />
            <Button variant="outline"
              className="gap-2 text-orange-700 border-orange-500/40 hover:bg-orange-500/10 dark:text-orange-400"
              onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {signingOut ? "Signing out…" : "Sign Out"}
            </Button>
          </div>
        );
      case "danger":
        return (
          <div>
            <SectionHeader title="Danger Zone" description="Irreversible actions. Proceed with caution." />
            <div className="max-w-md rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently deletes your account and all generated MCP servers. This cannot be undone.
                  </p>
                </div>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline"
                      className="flex-shrink-0 gap-1.5 border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-500" />Delete your account?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground -mt-1">
                      <ul className="list-disc ml-4 space-y-1 text-xs">
                        <li>All generated MCP servers and their code</li>
                        <li>Your usage history</li>
                        <li>Your profile and settings</li>
                      </ul>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        This action is immediate and cannot be undone.
                      </p>
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-medium text-foreground">
                          Type your email to confirm:{" "}
                          <span className="font-mono text-primary">{email}</span>
                        </label>
                        <Input value={deleteConfirmInput}
                          onChange={(e) => setDeleteConfirmInput(e.target.value)}
                          placeholder={email} className="text-xs" autoComplete="off" />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting} onClick={() => setDeleteConfirmInput("")}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleting || deleteConfirmInput.trim().toLowerCase() !== email.toLowerCase()}
                        onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600 gap-2">
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {deleting ? "Deleting…" : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account, security and preferences.</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-0 flex-1 min-h-0">
        {/* Left sidebar nav */}
        <aside className="w-52 shrink-0 border-r border-border/40 pr-4 mr-6">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon, danger }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  activeSection === id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  danger && "text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                )}>
                <Icon className={cn("h-4 w-4 flex-shrink-0", danger && "text-red-600 dark:text-red-400")} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content panel */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
