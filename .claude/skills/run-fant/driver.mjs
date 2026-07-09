// Playwright smoke driver for FANT.
// Assumes mongod, the backend (port 8000), and the frontend dev server
// (port 3000) are already running — see SKILL.md "Run (agent path)".
//
// Usage:
//   node .claude/skills/run-fant/driver.mjs
//
// Env vars (all optional):
//   BASE_URL       default http://localhost:3000
//   ADMIN_USERNAME default admin
//   ADMIN_PASSWORD default Admin@123!
//   SCREENSHOT_DIR default <this dir>/screenshots
//
// Logs into FANT as the seeded admin, opens the New Donor page, checks the
// tab order/labels, the Ancestry dropdown options, and the per-tooth
// NAPD + Wear Score dropdowns, submits the form to create a real donor, then
// repeats the tab/label checks on the resulting read-only donor view page.
// Screenshots are written at each step. Exits non-zero on any failed check.

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123!";
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.join(__dirname, "screenshots");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const log = (...a) => console.log(new Date().toISOString(), ...a);
let failures = 0;
const check = (label, cond) => {
  if (cond) {
    log("PASS:", label);
  } else {
    log("FAIL:", label);
    failures += 1;
  }
};

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on("pageerror", (err) => log("PAGE ERROR:", err.message));

  try {
    // ---- Login ----
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Username").fill(ADMIN_USERNAME);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/dash/, { timeout: 15000 });
    log("Logged in, on dashboard");

    // ---- Create Donor page ----
    await page.goto(`${BASE_URL}/donor/create`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-create-donor.png"), fullPage: true });

    const tabTexts = await page.locator('[role="tab"]').allTextContents();
    check(
      `create-page tab order is [Skeletal Inventory, Skeletal Analysis] (got ${JSON.stringify(tabTexts)})`,
      JSON.stringify(tabTexts) === JSON.stringify(["Skeletal Inventory", "Skeletal Analysis"])
    );
    check(
      "no 'Williams Analysis' text on create page",
      (await page.getByText("Williams Analysis").count()) === 0
    );

    await page.getByRole("tab", { name: "Skeletal Inventory" }).click();
    await page.waitForTimeout(300);

    const ancestryLabel = page.getByText("Ancestry", { exact: true });
    const ancestrySelect = await ancestryLabel.evaluateHandle(
      (label) => label.parentElement.querySelector("select")
    );
    const ancestryOptions = await ancestrySelect.evaluate((sel) =>
      Array.from(sel.options).map((o) => o.textContent)
    );
    check(
      `Ancestry options exclude Oceanian/European (got ${JSON.stringify(ancestryOptions)})`,
      !ancestryOptions.includes("oceanian") && !ancestryOptions.includes("european")
    );

    await page.getByText("Dentition", { exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-dentition.png"), fullPage: true });

    const wearScoreSelects = page.locator('select[title="Wear Score"]');
    const wearScoreCount = await wearScoreSelects.count();
    check(`32 Wear Score dropdowns present (got ${wearScoreCount})`, wearScoreCount === 32);

    const firstWearOptions = await wearScoreSelects.first().evaluate((sel) =>
      Array.from(sel.options).map((o) => o.textContent)
    );
    check(
      `Wear Score options are [—,1,2,3,4,5] (got ${JSON.stringify(firstWearOptions)})`,
      JSON.stringify(firstWearOptions) === JSON.stringify(["—", "1", "2", "3", "4", "5"])
    );

    // ---- Submit to create a real donor, then check the read-only view ----
    await ancestrySelect.evaluate((sel) => {
      sel.value = "african";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await wearScoreSelects.first().selectOption("3");
    await page.getByRole("button", { name: /create donor/i }).click();
    await page.waitForURL(/\/donor\/[^/]+$/, { timeout: 15000 });
    log("Donor created:", page.url());

    await page.waitForSelector('[role="tab"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-donor-view.png"), fullPage: true });

    const viewTabTexts = await page.locator('[role="tab"]').allTextContents();
    check(
      `donor-view tab order is [Skeletal Inventory, Skeletal Analysis] (got ${JSON.stringify(viewTabTexts)})`,
      JSON.stringify(viewTabTexts) === JSON.stringify(["Skeletal Inventory", "Skeletal Analysis"])
    );

    const refButtonText = await page
      .getByRole("button", { name: /Collection Forms/i })
      .textContent();
    check(
      `reference button reads "Skeletal Analysis Collection Forms (.docx)" (got "${refButtonText}")`,
      refButtonText === "Skeletal Analysis Collection Forms (.docx)"
    );

    await page.getByRole("tab", { name: "Skeletal Inventory" }).click();
    await page.waitForTimeout(200);
    await page.getByText("Dentition", { exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-donor-view-dentition.png"), fullPage: true });

    const tooth1Text = await page.locator(".text-center").first().innerText();
    check(
      `tooth 1 shows number/NAPD/wear score ("1\\nN\\n3", got ${JSON.stringify(tooth1Text)})`,
      tooth1Text === "1\nN\n3"
    );

    if (failures === 0) {
      log(`ALL CHECKS PASSED. Screenshots in ${SCREENSHOT_DIR}`);
    } else {
      log(`${failures} CHECK(S) FAILED. Screenshots in ${SCREENSHOT_DIR}`);
      process.exitCode = 1;
    }
  } catch (err) {
    log("DRIVER THREW:", err.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "ERROR.png"), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
