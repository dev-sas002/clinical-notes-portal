/**
 * Capture the README screenshots from a running instance.
 *
 * Shots are viewport-sized at 1440x900 so every image frames the same way.
 *
 * The app is booted with CARE_NOTES_DATA_SOURCE=demo, so the data is the
 * seeded synthetic corpus: fully populated, entirely fictional, and identical
 * on every run. No backend and no hand-mocked fixtures are involved.
 *
 *   docker compose up -d        # from the repository root
 *   npm run screenshots
 */
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:8170"
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "a.rivera@northfield.example"
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "demo-pass"

const here = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.resolve(here, "../../../docs/screenshots")

const shots = [
  {
    file: "01-care-notes.png",
    async run(page) {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
      await page.getByRole("heading", { name: "Recent notes" }).waitFor()
      await page.locator("article").first().waitFor()
    },
  },
  {
    file: "02-dashboard.png",
    async run(page) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" })
      await page.getByLabel("Period").selectOption("this_month")
      await page.getByRole("heading", { name: "Notes by facility" }).waitFor()
      await page.waitForTimeout(600)
    },
  },
  {
    file: "03-filtered-feed.png",
    async run(page) {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
      await page.getByRole("button", { name: "Elmwood Lodge" }).click()
      await page.getByLabel("Notes per page").selectOption("100")
      await page.locator('[data-testid="notes-scroller"]').waitFor()
      await page.waitForTimeout(600)
    },
  },
  {
    file: "04-new-note.png",
    async run(page) {
      await page.goto(`${BASE_URL}/add-note`, { waitUntil: "networkidle" })
      await page.getByLabel("Patient ID").fill("PT-1042")
      await page.getByLabel("Facility").selectOption({ label: "Brookvale Court" })
      await page.getByLabel("Category").selectOption("treatment")
      await page.getByLabel("Priority").selectOption("4")
      await page.getByLabel("Care provider name").fill("A. Rivera (RN)")
      await page
        .getByLabel("Care note")
        .fill(
          "Dressing changed on the left lower leg. Wound clean and dry with no sign of infection. " +
            "Repositioning chart updated and the district nurse informed ahead of tomorrow's review.",
        )
      await page.getByLabel("Patient ID").blur()
    },
  },
]

const main = async () => {
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" })
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.getByRole("heading", { name: "Care notes" }).first().waitFor()

  for (const shot of shots) {
    await shot.run(page)
    const file = path.join(outputDir, shot.file)
    await page.screenshot({ path: file })
    console.warn(`captured ${shot.file}`)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
