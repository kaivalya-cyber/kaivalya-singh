#!/usr/bin/env node
/**
 * CDP scroll-crash harness — drives the production build in headless Chrome
 * through the exact motion that kills the user's WebKit browser: load a
 * project page, then step-scroll the full height so every scroll-triggered
 * animation (figure draw-in, telemetry, prose cascade) fires.
 *
 * Asserts: zero uncaught exceptions, zero console errors, document alive at
 * the bottom. Exit 1 on any failure. Usage: node scripts/scroll-crash-test.mjs [port] [slug]
 */
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = process.argv[2] ?? "3007";
const SLUG = process.argv[3] ?? "variational-qec-decoder";
const URL_ = `http://localhost:${PORT}/projects/${SLUG}`;
const profile = mkdtempSync(join(tmpdir(), "cdp-prof-"));

const chrome = execFile(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    `--remote-debugging-port=9777`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9777/json/list");
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {
      /* chrome still starting */
    }
    await sleep(250);
  }
  throw new Error("chrome devtools endpoint never came up");
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    const text =
      d.exception?.description ?? d.text ?? JSON.stringify(d).slice(0, 200);
    exceptions.push(text);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    consoleErrors.push(msg.params.entry.text?.slice(0, 200) ?? "log error");
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push(
      msg.params.args?.map((a) => a.value ?? a.description).join(" ")?.slice(0, 200) ??
        "console.error",
    );
  }
};

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout: ${method}`));
      }
    }, 20000);
  });
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");

await send("Page.navigate", { url: URL_ });
// Wait for load + a beat so hydration finishes before we touch anything.
await sleep(4500);

const alive0 = await send("Runtime.evaluate", {
  expression: "document.readyState",
  returnByValue: true,
});
if (alive0.result.value !== "complete") {
  console.error("FAIL: document never reached complete —", alive0.result.value);
  process.exit(1);
}

// Step-scroll the full document like a reader: 420px every 130ms.
const { result: dims } = await send("Runtime.evaluate", {
  expression:
    "JSON.stringify({ h: document.documentElement.scrollHeight, vh: window.innerHeight })",
  returnByValue: true,
});
const { h, vh } = JSON.parse(dims.value);
let scrolled = 0;
while (scrolled < h - vh) {
  scrolled += 420;
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, ${scrolled})`,
    returnByValue: true,
  });
  await sleep(130);
}
// Let every in-view trigger fire and every animation run out.
await sleep(3500);

const probe = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    ready: document.readyState,
    y: Math.round(window.scrollY),
    body: document.body ? document.body.children.length : -1,
    proseWords: document.querySelectorAll('.prose-word').length,
    visibleProse: document.querySelectorAll('.prose-word').length
      ? getComputedStyle(document.querySelector('.prose-word')).opacity
      : null,
    figBars: document.querySelectorAll('.fig-bar').length,
    maxScroll: ${h - vh},
  })`,
  returnByValue: true,
});
const state = JSON.parse(probe.result.value);

console.log("── scroll-crash harness ─────────────────────────");
console.log(`page:            ${URL_}`);
console.log(`docHeight:       ${h}px, scrolled to y=${state.y}/${state.maxScroll}`);
console.log(`document:        ${state.ready}, body children: ${state.body}`);
console.log(`prose words:     ${state.proseWords}`);
console.log(`first word op:   ${state.visibleProse}`);
console.log(`figure bars:     ${state.figBars}`);
console.log(`exceptions:      ${exceptions.length}`);
console.log(`console errors:  ${consoleErrors.length}`);
if (exceptions.length) console.log("EXCEPTIONS:\n" + exceptions.join("\n---\n"));
if (consoleErrors.length) console.log("CONSOLE ERRORS:\n" + consoleErrors.join("\n"));

const pass =
  exceptions.length === 0 &&
  consoleErrors.length === 0 &&
  state.ready === "complete" &&
  state.y >= state.maxScroll - 50 &&
  state.body > 0;

console.log(pass ? "PASS ✅" : "FAIL ❌");

ws.close();
chrome.kill();
await sleep(800); // let Chrome finish writing the profile before cleanup
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
process.exit(pass ? 0 : 1);
