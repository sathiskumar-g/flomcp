"use client";

/**
 * Step 1 — MCP Description
 *
 * User describes what their MCP server should do.
 * Includes example prompts, character counter, and helpful hints.
 */

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGeneratorStore } from "@/lib/stores/generator-store";
import { Lightbulb, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  {
    label: "GitHub",
    text: "Create an MCP server that lets Claude search GitHub repositories, read file contents, create issues, and comment on pull requests. Use the GitHub REST API with personal access token auth.",
  },
  {
    label: "Weather",
    text: "Build an MCP server that provides current weather, 7-day forecast, and weather alerts for any city. Use OpenWeatherMap API with API key authentication.",
  },
  {
    label: "Database",
    text: "Create an MCP server that allows Claude to query a PostgreSQL database with read-only access, list tables, describe schemas, and run SELECT queries with parameterized inputs.",
  },
  {
    label: "File System",
    text: "Build an MCP server to read, write, and list files in a specified directory. Include path validation, size limits, and support for text and JSON files only.",
  },
  {
    label: "Slack",
    text: "Create an MCP server for Slack that can send messages to channels, list recent messages, create posts, and search message history. OAuth 2.0 authentication.",
  },
  {
    label: "Custom API",
    text: "Build an MCP server that wraps a REST API. It should authenticate using an API key in the header, handle JSON requests and responses, and retry failed requests.",
  },
];

const MAX_CHARS = 2000;
const MIN_CHARS = 50;

// ─── Component ────────────────────────────────────────────────────────────────

export function Step1Description() {
  const { serverName, setServerName, description, setDescription, nextStep } = useGeneratorStore();
  const [touched, setTouched] = useState(false);

  const charCount = description.length;
  const isNameValid = serverName.trim().length >= 3;
  const isDescValid = charCount >= MIN_CHARS;
  const isValid = isNameValid && isDescValid;
  const showNameError = touched && !isNameValid;
  const showDescError = touched && !isDescValid;

  const charColor =
    charCount > MAX_CHARS
      ? "text-red-500"
      : charCount >= MIN_CHARS
      ? "text-green-500"
      : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Create your MCP server</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Give it a name, then describe what it should do in detail.
        </p>
      </div>

      {/* Server name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Server name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g. GitHub Assistant, Weather Tools, Slack Bot"
          value={serverName}
          onChange={(e) =>
            setServerName(
              e.target.value
                .replace(/[^a-zA-Z0-9 _-]/g, "")
                .slice(0, 60)
            )
          }
          onBlur={() => setTouched(true)}
          className={cn(
            "text-sm",
            showNameError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {showNameError ? (
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            Minimum 3 characters
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Short, descriptive name for your server (letters, numbers, spaces)
          </span>
        )}
      </div>

      {/* Description textarea */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </label>
        <Textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setDescription(e.target.value);
            }
          }}
          onBlur={() => setTouched(true)}
          placeholder="E.g. Create an MCP server that lets Claude access GitHub repositories — search code, read files, create issues, and leave comments on pull requests. Use the GitHub REST API with personal access token authentication."
          rows={7}
          className={cn(
            "resize-none text-sm leading-relaxed",
            showDescError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        <div className="flex items-center justify-between">
          {showDescError ? (
            <span className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              At least {MIN_CHARS} characters required to get quality output
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Be specific — mention API names, auth methods, and tool behaviours
            </span>
          )}
          <span className={`text-xs tabular-nums ${charColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Example prompts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span>Quick-start examples — click to use</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <Badge
              key={ex.label}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs py-1.5 px-3"
              onClick={() => {
                setDescription(ex.text);
                setTouched(true);
              }}
            >
              {ex.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">Tips for great results:</p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Name the specific API(s) you want to integrate (GitHub, Stripe, OpenAI…)</li>
          <li>Mention the authentication method (API key, OAuth, Bearer token)</li>
          <li>List the tools/actions Claude should be able to perform</li>
          <li>Describe error handling expectations (retries, timeouts, fallbacks)</li>
          <li>Specify any rate limits or constraints the server should respect</li>
        </ul>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setTouched(true);
            if (isValid) nextStep();
          }}
          disabled={!isValid}
          className="min-w-[160px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
