// Smoke test against a running build (npm run smoke builds and serves it).
// Uses the installed Google Chrome, signed out, so playback is 30 s previews.
// Checks: saved volume applied before playback, browse, search, preview
// playback, collection dialog, queue drag and drop, no page errors.
import { chromium } from "playwright-core";

const url = process.argv[2] || "http://localhost:3000/";
const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"]
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => {
  if (m.type() === "error" && !/cloudflare|ERR_FAILED/.test(m.text())) errors.push(m.text());
});
// An old-style saved linear gain of 0.125 should become slider position 0.5.
await page.addInitScript(() => {
  if (!localStorage.getItem("volume-pos")) localStorage.setItem("volume", "0.125");
});

try {
  await page.goto(url);
  await page.waitForSelector(".panel", { timeout: 30000 });
  const mk = fn => page.evaluate(fn);
  check((await mk(() => MusicKit.getInstance().volume)) === 0.125, "saved volume applied before playback");
  check((await mk(() => localStorage.getItem("volume-pos"))) === "0.5", "old linear volume migrated");

  await page.waitForSelector(".browseList li", { timeout: 30000 });
  check((await page.locator(".browseList li").count()) > 0, "browse shows charts");

  await page.fill(".searchBar input", "radiohead");
  await page.waitForSelector(".songResults li", { timeout: 30000 });
  check((await page.locator(".songResults li").count()) > 0, "search returns songs");

  await mk(() => document.querySelector(".songResults li .trackImage").click());
  await page.waitForFunction(() => MusicKit.getInstance().isPlaying, null, { timeout: 30000 });
  check(await mk(() => MusicKit.getInstance().isPlaying), "preview plays");
  check((await mk(() => document.getElementById("apple-music-player").volume)) === 0.125, "playing at saved volume");

  await page.fill(".searchBar input", "");
  await page.getByRole("tab", { name: "Browse" }).click();
  await page.locator(".browseList li .title span").first().click();
  await page.waitForSelector(".collection ol.playlist li", { timeout: 30000 });
  check(true, "collection dialog opens");
  await mk(() => document.querySelector(".collection .header .browseIcon").click());
  await page.waitForFunction(() => MusicKit.getInstance().queue.length > 3, null, { timeout: 30000 });
  await page.keyboard.press("Escape");
  await page.waitForSelector(".collection", { state: "detached", timeout: 10000 }).catch(() => {});

  await page.getByRole("tab", { name: "Queue" }).click();
  const titles = () => mk(() => MusicKit.getInstance().queue.items.slice(0, 4).map(i => i.title));
  const before = await titles();
  await page.locator(".panel ol.playlist li").nth(3).focus();
  for (const key of ["Space", "ArrowUp", "ArrowUp", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(600);
  const after = await titles();
  check(after[1] === before[3] && after[2] === before[1], "queue drag and drop reorders");

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
} catch (e) {
  check(false, "smoke run: " + e.message.split("\n")[0]);
} finally {
  await browser.close();
}
process.exit(failures.length ? 1 : 0);
