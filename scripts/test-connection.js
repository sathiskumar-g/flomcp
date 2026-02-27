/**
 * FloMCP - Supabase Connection Tester
 *
 * Tests DNS resolution, TCP connectivity, and HTTPS response times
 * for all Supabase endpoints.
 *
 * Usage:
 *   node scripts/test-connection.js
 *
 * Run on WiFi first, note the times, then switch to mobile hotspot and run again.
 */

const dns = require("dns");
const net = require("net");
const https = require("https");
const http = require("http");
const { promisify } = require("util");

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// ── Your Supabase project ──────────────────────────────────────────────────
// Read from .env.local if available, otherwise use the value directly
let SUPABASE_URL = "";
try {
  const fs = require("fs");
  const env = fs.readFileSync(".env.local", "utf-8");
  const match = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (match) SUPABASE_URL = match[1].trim();
} catch {}

if (!SUPABASE_URL) {
  SUPABASE_URL = process.argv[2] || "";
}
if (!SUPABASE_URL) {
  console.error("❌  Could not read SUPABASE_URL from .env.local");
  console.error("   Pass it as argument: node scripts/test-connection.js https://xxx.supabase.co");
  process.exit(1);
}

const PROJECT_HOST = new URL(SUPABASE_URL).hostname; // e.g. uwmjditvovqtyrbtwixw.supabase.co

// ── Endpoints to test ─────────────────────────────────────────────────────
const ENDPOINTS = [
  { name: "Auth Health",    url: `${SUPABASE_URL}/auth/v1/health` },
  { name: "REST API",       url: `${SUPABASE_URL}/rest/v1/` },
  { name: "Project Root",   url: `${SUPABASE_URL}/` },
  { name: "supabase.co",    url: "https://supabase.co" },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function color(code, str) {
  return `\x1b[${code}m${str}\x1b[0m`;
}
const green  = (s) => color(32, s);
const yellow = (s) => color(33, s);
const red    = (s) => color(31, s);
const cyan   = (s) => color(36, s);
const bold   = (s) => color(1, s);

function ms(n) {
  if (n < 500)  return green(`${n}ms`);
  if (n < 2000) return yellow(`${n}ms`);
  return red(`${n}ms`);
}

function pad(str, len) {
  return String(str).padEnd(len);
}

// ── DNS resolution ────────────────────────────────────────────────────────

async function testDNS(host) {
  const results = { ipv4: null, ipv6: null, ipv4Ms: null, ipv6Ms: null };

  const t4 = Date.now();
  try {
    const addrs = await resolve4(host);
    results.ipv4Ms = Date.now() - t4;
    results.ipv4 = addrs;
  } catch (e) {
    results.ipv4Ms = Date.now() - t4;
    results.ipv4 = `ERROR: ${e.message}`;
  }

  const t6 = Date.now();
  try {
    const addrs = await resolve6(host);
    results.ipv6Ms = Date.now() - t6;
    results.ipv6 = addrs;
  } catch (e) {
    results.ipv6Ms = Date.now() - t6;
    results.ipv6 = `ERROR: ${e.message}`;
  }

  return results;
}

// ── TCP connect ───────────────────────────────────────────────────────────

function testTCP(host, port, timeout = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;

    const finish = (ok, err) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok, ms: Date.now() - start, error: err });
    };

    socket.setTimeout(timeout);
    socket.on("connect", () => finish(true, null));
    socket.on("timeout", () => finish(false, "TCP timeout"));
    socket.on("error", (e) => finish(false, e.message));
    socket.connect(port, host);
  });
}

// ── HTTPS GET ─────────────────────────────────────────────────────────────

function testHTTPS(url, timeout = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    let firstByteMs = null;
    let done = false;

    const finish = (ok, statusCode, err) => {
      if (done) return;
      done = true;
      resolve({
        ok,
        ms: Date.now() - start,
        firstByteMs,
        statusCode,
        error: err,
      });
    };

    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout }, (res) => {
      firstByteMs = Date.now() - start;
      res.on("data", () => {});
      res.on("end", () => finish(true, res.statusCode, null));
    });

    req.on("timeout", () => {
      req.destroy();
      finish(false, null, `Request timeout (>${timeout}ms)`);
    });
    req.on("error", (e) => finish(false, null, e.message));
    req.setTimeout(timeout);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const label = process.argv[3] || "current network";

  console.log("\n" + bold("═".repeat(60)));
  console.log(bold(`  FloMCP – Supabase Connection Test`));
  console.log(bold(`  Network: ${cyan(label)}`));
  console.log(bold("═".repeat(60)));
  console.log(`  Project:  ${cyan(SUPABASE_URL)}`);
  console.log(`  Host:     ${cyan(PROJECT_HOST)}`);
  console.log();

  // ── 1. DNS ──────────────────────────────────────────────────────────────
  console.log(bold("1. DNS Resolution"));
  console.log("─".repeat(60));

  const dns4Only = dns.getDefaultResultOrder ? dns.getDefaultResultOrder() : "unknown";
  console.log(`   OS DNS order: ${yellow(dns4Only)}`);

  const dnsResult = await testDNS(PROJECT_HOST);
  const ipv4s = Array.isArray(dnsResult.ipv4) ? dnsResult.ipv4 : [dnsResult.ipv4];
  const ipv6s = Array.isArray(dnsResult.ipv6) ? dnsResult.ipv6 : [dnsResult.ipv6];

  if (Array.isArray(dnsResult.ipv4)) {
    console.log(`   IPv4 (${ms(dnsResult.ipv4Ms)}):  ${green(ipv4s.join(", "))}`);
  } else {
    console.log(`   IPv4 (${ms(dnsResult.ipv4Ms)}):  ${red(dnsResult.ipv4)}`);
  }

  if (Array.isArray(dnsResult.ipv6)) {
    console.log(`   IPv6 (${ms(dnsResult.ipv6Ms)}):  ${yellow(ipv6s.join(", "))}`);
  } else {
    console.log(`   IPv6 (${ms(dnsResult.ipv6Ms)}):  ${yellow("(no AAAA record — IPv6 not available, this is fine)")}`);
  }
  console.log();

  // ── 2. TCP ───────────────────────────────────────────────────────────────
  console.log(bold("2. TCP Connect (port 443)"));
  console.log("─".repeat(60));

  // Test direct hostname (OS picks v4 or v6 based on DNS order)
  const tcpResult = await testTCP(PROJECT_HOST, 443);
  if (tcpResult.ok) {
    console.log(`   ${PROJECT_HOST}      ${ms(tcpResult.ms)}   ${green("✓ Connected")}`);
  } else {
    console.log(`   ${PROJECT_HOST}      ${red("✗ " + tcpResult.error)}`);
  }

  // Also test each IPv4 address directly (bypasses DNS resolution)
  if (Array.isArray(dnsResult.ipv4)) {
    for (const ip of dnsResult.ipv4) {
      const r = await testTCP(ip, 443);
      if (r.ok) {
        console.log(`   ${ip}                ${ms(r.ms)}   ${green("✓ Connected")}`);
      } else {
        console.log(`   ${ip}                ${red("✗ " + r.error)}`);
      }
    }
  }
  console.log();

  // ── 3. HTTPS endpoints ───────────────────────────────────────────────────
  console.log(bold("3. HTTPS Endpoint Response Times"));
  console.log("─".repeat(60));

  const maxName = Math.max(...ENDPOINTS.map((e) => e.name.length));

  for (const ep of ENDPOINTS) {
    const r = await testHTTPS(ep.url);
    const nameCol = pad(ep.name, maxName + 2);
    if (r.ok) {
      const fb = r.firstByteMs ? `  first-byte ${ms(r.firstByteMs)}` : "";
      const status = r.statusCode < 400 ? green(`HTTP ${r.statusCode}`) : yellow(`HTTP ${r.statusCode}`);
      console.log(`   ${nameCol}  total ${ms(r.ms)}${fb}   ${status}`);
    } else {
      console.log(`   ${nameCol}  ${red("✗ " + r.error)}`);
    }
  }
  console.log();

  // ── 4. Summary ──────────────────────────────────────────────────────────
  console.log(bold("4. Summary / Root Cause Guide"));
  console.log("─".repeat(60));

  const authResult = await testHTTPS(`${SUPABASE_URL}/auth/v1/health`);
  const tcpMs = tcpResult.ms;
  const authMs = authResult.ms;

  if (!tcpResult.ok) {
    console.log(red("  ✗ TCP BLOCKED — ISP is dropping packets to Supabase on port 443."));
    console.log(yellow("    → Try mobile hotspot. If hotspot works, ISP is the problem."));
    console.log(yellow("    → Nothing in code can fix this — network/ISP issue."));
  } else if (tcpMs > 3000) {
    console.log(yellow(`  ⚠  TCP connected but SLOW (${tcpMs}ms). High latency to Supabase servers.`));
    console.log(yellow("    → Normal for JioFiber routing to Supabase (Singapore/US region)."));
    console.log(yellow("    → Increase server client timeout in lib/supabase-server.ts"));
  } else if (tcpMs < 500 && authMs < 2000) {
    console.log(green("  ✓ Connection is HEALTHY. Supabase is reachable and fast."));
    console.log(green("    → If app is still slow, the issue is code/logic — not network."));
  } else {
    console.log(yellow(`  ⚠  TCP ok (${tcpMs}ms) but HTTPS is slow (${authMs}ms).`));
    console.log(yellow("    → SSL handshake + Supabase cold start adds overhead."));
    console.log(yellow("    → Ensure server timeout > " + authMs + "ms in lib/supabase-server.ts"));
  }

  console.log();
  console.log(bold("HOW TO USE:"));
  console.log("  1. Run on WiFi:          " + cyan("node scripts/test-connection.js  wifi"));
  console.log("  2. Switch to hotspot:    " + cyan("node scripts/test-connection.js  hotspot"));
  console.log("  3. Compare the numbers above.");
  console.log("  4. If hotspot is 10x faster → your WiFi ISP blocks Supabase.");
  console.log("     If both are slow → Supabase region might be far (normal).");
  console.log();
  console.log(bold("═".repeat(60)) + "\n");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
