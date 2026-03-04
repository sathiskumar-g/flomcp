"use client";

/**
 * Step 2 — API Configuration
 *
 * Optional step: toggle whether the MCP server connects to an external API.
 * If enabled, collects: base URL, auth type, input schema fields,
 * config options (env vars), and API docs link.
 */

import { useState } from "react";
import { useGeneratorStore, type AuthType, type SchemaField } from "@/lib/stores/generator-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Globe,
  Key,
  AlertCircle,
  CheckCircle2,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-types ────────────────────────────────────────────────────────────────

const AUTH_OPTIONS: { value: AuthType; label: string; description: string }[] = [
  { value: "none", label: "No Auth", description: "Public API — no credentials needed" },
  { value: "api_key", label: "API Key", description: "Key sent as a header or query param" },
  { value: "bearer", label: "Bearer Token", description: "Authorization: Bearer <token>" },
  { value: "oauth", label: "OAuth 2.0", description: "OAuth access token flow" },
];

const FIELD_TYPES: SchemaField["type"][] = ["string", "number", "boolean", "object", "array"];

// ─── URL validator ────────────────────────────────────────────────────────────

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step2APIConfig() {
  const {
    apiConfig,
    setApiEnabled,
    setApiUrl,
    setAuthType,
    setApiDocUrl,
    addSchemaField,
    updateSchemaField,
    removeSchemaField,
    addConfigOption,
    updateConfigOption,
    removeConfigOption,
    nextStep,
    prevStep,
  } = useGeneratorStore();

  const [urlTouched, setUrlTouched] = useState(false);

  const urlValid = !apiConfig.enabled || isValidUrl(apiConfig.baseUrl);
  const urlError = urlTouched && apiConfig.enabled && !urlValid;

  const canContinue = !apiConfig.enabled || (apiConfig.baseUrl.length > 0 && urlValid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">API Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Does your MCP server need to connect to an external API?
          This helps generate the correct authentication and request code.
        </p>
      </div>

      {/* Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { value: false, label: "No external API", description: "Local tools only — file system, calculations, etc." },
          { value: true, label: "Yes, connect to an API", description: "REST / GraphQL / webhook integration" },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setApiEnabled(opt.value)}
            className={cn(
              "text-left rounded-lg border p-4 transition-all",
              apiConfig.enabled === opt.value
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-border/80 hover:bg-muted/40"
            )}
          >
            <p className="font-medium text-sm">{opt.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>

      {/* API details (shown when enabled) */}
      {apiConfig.enabled && (
        <div className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              API Base URL
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={apiConfig.baseUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://api.example.com/v1"
              className={cn(urlError && "border-red-500 focus-visible:ring-red-500")}
            />
            {urlError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Enter a valid URL starting with https://
              </p>
            ) : apiConfig.baseUrl && urlValid ? (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid URL
              </p>
            ) : null}
          </div>

          {/* Auth type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Authentication Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAuthType(opt.value)}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-all",
                    apiConfig.authType === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* API docs link */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              API Documentation URL
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </label>
            <Input
              value={apiConfig.apiDocUrl}
              onChange={(e) => setApiDocUrl(e.target.value)}
              placeholder="https://docs.example.com/api"
            />
            <p className="text-xs text-muted-foreground">
              Claude uses this to understand endpoint structure and generate better code
            </p>
          </div>

          {/* Input Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Input Schema Fields</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define the parameters your MCP tools will accept
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addSchemaField}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Field
              </Button>
            </div>

            {apiConfig.inputSchema.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No fields defined — Claude will infer them from your description
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {apiConfig.inputSchema.map((field) => (
                  <SchemaFieldRow
                    key={field.id}
                    field={field}
                    onChange={(patch) => updateSchemaField(field.id, patch)}
                    onRemove={() => removeSchemaField(field.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Config options (env vars) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Environment Variables</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extra config options that will become .env variables
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addConfigOption}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Option
              </Button>
            </div>

            {apiConfig.configOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Optional — e.g. <code className="bg-muted px-1 rounded">BASE_URL</code>,{" "}
                <code className="bg-muted px-1 rounded">TIMEOUT_MS</code>
              </p>
            ) : (
              <div className="space-y-2">
                {apiConfig.configOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Input
                      value={opt.key}
                      onChange={(e) =>
                        updateConfigOption(opt.id, { key: e.target.value.toUpperCase() })
                      }
                      placeholder="KEY_NAME"
                      className="font-mono text-xs flex-1"
                    />
                    <span className="text-muted-foreground text-sm">=</span>
                    <Input
                      value={opt.value}
                      onChange={(e) => updateConfigOption(opt.id, { value: e.target.value })}
                      placeholder="default_value"
                      className="text-xs flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 flex-shrink-0"
                      onClick={() => removeConfigOption(opt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => {
            setUrlTouched(true);
            if (canContinue) nextStep();
          }}
          disabled={!canContinue}
          className="min-w-[160px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Schema Field Row ─────────────────────────────────────────────────────────

function SchemaFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: SchemaField;
  onChange: (patch: Partial<Omit<SchemaField, "id">>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2">
      {/* Name */}
      <Input
        value={field.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="field_name"
        className="text-xs font-mono h-8 flex-1 min-w-0"
      />

      {/* Type */}
      <select
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as SchemaField["type"] })}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground flex-shrink-0 dark:[color-scheme:dark]"
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Description */}
      <Input
        value={field.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Brief description"
        className="text-xs h-8 flex-[2] min-w-0"
      />

      {/* Required toggle */}
      <button
        onClick={() => onChange({ required: !field.required })}
        className={cn(
          "text-xs px-2 py-1 rounded-md border transition-colors flex-shrink-0",
          field.required
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-muted"
        )}
      >
        {field.required ? "Required" : "Optional"}
      </button>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-red-500 flex-shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
