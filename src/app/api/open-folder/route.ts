import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req: Request) {
  const { path } = await req.json().catch(() => ({ path: null }));
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  // Only allow paths that look like real folder paths (basic safety)
  if (!/^[A-Za-z]:[\\\/]/.test(path) && !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const platform = process.platform;
  let cmd: string;
  if (platform === "win32") {
    cmd = `explorer "${path.replace(/\//g, "\\")}"`;
  } else if (platform === "darwin") {
    cmd = `open "${path}"`;
  } else {
    cmd = `xdg-open "${path}"`;
  }

  exec(cmd, (err) => {
    if (err) console.error("open-folder error:", err);
  });

  return NextResponse.json({ ok: true });
}
