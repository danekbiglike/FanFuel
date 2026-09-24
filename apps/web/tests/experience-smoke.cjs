/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, process, console, URL, document, innerWidth, getComputedStyle, localStorage, setTimeout, navigator, Storage */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const out =
  process.env.FANFUEL_SCREENSHOTS ||
  path.join(require("node:os").tmpdir(), "fanfuel-experience-qa");
fs.mkdirSync(out, { recursive: true });
const base = process.env.FANFUEL_TEST_URL || "http://localhost:3000";
const categories = [
  ["games", "marketplace.categories.games.name"],
  ["software", "marketplace.categories.software.name"],
  ["game-assets", "marketplace.categories.gameAssets.name"],
  ["design-assets", "marketplace.categories.designAssets.name"],
  ["digital-services", "marketplace.categories.digitalServices.name"],
  ["coaching", "marketplace.categories.coaching.name"],
  ["obs-packs", "marketplace.categories.obsPacks.name"],
  ["creator-assets", "marketplace.categories.creatorAssets.name"]
].map(([slug, key], i) => ({ id: "category-" + i, slug, name_i18n_key: key, status: "active" }));
const titles = [
  "Коллекция графики для твоего проекта",
  "Помощь с интерфейсом проекта",
  "Личная сессия по дизайну",
  "Минималистичный OBS-пак",
  "Набор для сообщества"
];
const products = Array.from({ length: 16 }, (_, i) => ({
  id: "product-" + i,
  slug: "test-item-" + i,
  status: "published",
  title: titles[i % 5],
  description: "Тестовые данные только для проверки интерфейса",
  kind: ["design_asset", "digital_service", "coaching", "obs_pack"][i % 4],
  price_amount_minor: 45000 + i * 15000,
  currency: "RUB",
  delivery_type: ["digital_file", "manual", "session"][i % 3],
  category: categories[i % 5],
  seller: { display_name: ["Pixel Workshop", "Ира рисует", "North Studio", "Тихий эфир"][i % 4] }
}));
let browser;
(async () => {
  browser = await chromium.launch({
    headless: true,
    channel:
      process.env.FANFUEL_BROWSER_CHANNEL || (process.platform === "win32" ? "msedge" : undefined)
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light"
  });
  const page = await context.newPage();
  const errors = [];
  let mode = "normal";
  let auth = "guest";
  let apiCalls = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products" || url.pathname === "/api/v1/commerce/search") {
      apiCalls.push(url.search);
      if (mode === "slow") await new Promise((resolve) => setTimeout(resolve, 1300));
      if (mode === "error")
        return route.fulfill({ status: 503, json: { error: { code: "unavailable" } } });
      if (mode === "empty") return route.fulfill({ json: { items: [], pagination: { total: 0 } } });
      let items = products.filter(
        (p) =>
          !url.searchParams.get("category") || p.category.slug === url.searchParams.get("category")
      );
      if (url.searchParams.get("query"))
        items = items.filter((p) =>
          p.title.toLowerCase().includes(url.searchParams.get("query").toLowerCase())
        );
      const total = items.length;
      const offset = Number(url.searchParams.get("offset") || 0);
      items = items.slice(offset, offset + Number(url.searchParams.get("limit") || 20));
      return route.fulfill({ json: { items, pagination: { total } } });
    }
    if (url.pathname === "/api/v1/categories")
      return route.fulfill({ json: { items: categories } });
    if (url.pathname.startsWith("/api/v1/products/"))
      return route.fulfill({
        json:
          products.find(
            (p) =>
              p.id === url.pathname.split("/").pop() || p.slug === url.pathname.split("/").pop()
          ) || products[0]
      });
    if (url.pathname === "/api/v1/auth/me") {
      if (auth === "member")
        return route.fulfill({
          json: {
            user: { id: "qa-user", email: "qa@example.test" },
            roles: ["buyer"],
            profile: { display_name: "Покупатель", slug: "qa" }
          }
        });
      if (auth === "error")
        return route.fulfill({
          status: 503,
          json: { error: { code: "unavailable", i18n_key: "errors.generic" } }
        });
      return route.fulfill({
        status: 401,
        json: { error: { code: "unauthorized", i18n_key: "errors.unauthorized" } }
      });
    }
    if (url.pathname === "/api/v1/me/preferences")
      return route.fulfill({ json: { locale: "ru", themePreference: "system" } });
    return route.fulfill({ json: {} });
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Покупатель", exact: true }).waitFor();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "welcome");
  assert.equal(await page.locator(".fuel-product").count(), 4);
  assert.equal(await page.locator(".fuel-direction").count(), 8);
  assert.equal(await page.locator(".fuel-discover-card").count(), 0);
  assert.equal(await page.locator(".fuel-oily-actor").count(), 1);
  assert.equal(await page.locator(".fuel-oily-actor").getAttribute("data-visible"), "true");
  assert.equal(await page.locator(".fuel-audience-sketch").count(), 1);
  await page.screenshot({ path: path.join(out, "home-desktop.png"), fullPage: true });
  await page.getByRole("tab", { name: "Автор", exact: true }).click();
  await page
    .getByRole("heading", { name: "Ты делаешь мир интереснее.", exact: true })
    .first()
    .waitFor();
  assert.equal(await page.locator(".fuel-oily-actor").count(), 1);
  assert.equal(await page.locator('[data-oily-anchor="role"]').count(), 1);
  await page.waitForTimeout(460);
  await page.screenshot({ path: path.join(out, "creator-desktop.png"), fullPage: true });
  await page.locator(".fuel-step-buttons button").nth(1).click();
  await page.waitForTimeout(460);
  assert.equal(await page.locator(".fuel-oily-actor").count(), 1);
  assert.equal(await page.locator(".fuel-oily-actor").getAttribute("data-visible"), "true");
  await page.getByRole("tab", { name: "Продавец", exact: true }).click();
  assert.equal(await page.locator(".fuel-oily-actor").count(), 1);
  await page.waitForTimeout(460);
  await page.screenshot({ path: path.join(out, "seller-desktop.png"), fullPage: true });
  await page.getByRole("tab", { name: "Покупатель", exact: true }).click();
  await page.getByRole("tab", { name: "Покупатель", exact: true }).press("ArrowRight");
  assert.equal(
    await page.getByRole("tab", { name: "Автор", exact: true }).getAttribute("aria-selected"),
    "true"
  );
  await page.getByRole("tab", { name: "Автор", exact: true }).press("Home");
  await page
    .getByRole("button", { name: "В избранное: " + products[0].title, exact: true })
    .click();
  await page.getByRole("button", { name: "Избранное", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: products[0].title, exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("data-motion"), "quiet");
  await page
    .getByRole("button", { name: "В избранном: " + products[0].title, exact: true })
    .waitFor();
  await page.getByRole("button", { name: "В корзину: " + products[0].title, exact: true }).click();
  await page.getByRole("button", { name: "Корзина", exact: true }).click();
  const checkout = page.getByRole("dialog").getByRole("link", { name: /К покупке/ });
  await checkout.waitFor();
  assert.equal(await checkout.getAttribute("href"), "/checkout/product-0");
  await page.keyboard.press("Escape");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "Overflow at " + width
    );
    if (width === 390)
      await page.waitForTimeout(450);
    if (width === 390) {
      assert.equal(await page.locator(".fuel-oily-actor").getAttribute("data-visible"), "true");
      assert.equal(await page.locator(".fuel-oily-actor").evaluate((el) => el.getBoundingClientRect().right <= innerWidth), true);
      await page.screenshot({ path: path.join(out, "home-mobile-viewport.png") });
      await page.screenshot({ path: path.join(out, "home-mobile.png"), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.screenshot({ path: path.join(out, "home-dark.png"), fullPage: true });
  assert.equal(
    await page
      .locator(".fuel-add")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s"
  );
  await page.goto(base + "/for-sellers", { waitUntil: "networkidle" });
  assert.match(await page.title(), /FanFuel/);
  await page.getByRole("button", { name: /Добавь товар/ }).click();
  await page
    .locator("#role-detail-seller")
    .getByRole("heading", { name: "Добавь товар", exact: true })
    .waitFor();
  await page.goto(base + "/marketplace/catalog?query=" + encodeURIComponent("дизайн"), {
    waitUntil: "networkidle"
  });
  assert.equal(await page.locator(".fuel-product").count(), 3);
  assert.equal(await page.getByRole("tab").count(), 0);
  await page.goto(base + "/marketplace/catalog", { waitUntil: "networkidle" });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Показать ещё/ }).click();
  await page.waitForFunction(() => document.querySelectorAll(".fuel-product").length === 16);
  assert(
    apiCalls.some((query) => query.includes("offset=12")),
    "Server pagination must be reachable"
  );
  await page.setViewportSize({ width: 390, height: 900 });
  for (const rolePath of ["/for-streamers", "/for-sellers"]) {
    await page.goto(base + rolePath, { waitUntil: "networkidle" });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "Role mobile overflow"
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.setItem("fanfuel_access_token", "qa-not-a-real-token"));
  auth = "member";
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.getByRole("tab").count(), 0);
  assert.equal(
    await page.locator("header a[href='/for-streamers'],header a[href='/for-sellers']").count(),
    0
  );
  assert.equal(await page.locator(".fuel-wrap > div a[href='/for-streamers']").count(), 0);
  await page.screenshot({ path: path.join(out, "home-member.png"), fullPage: true });
  auth = "error";
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Вход пока не удалось проверить.", { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("fanfuel_access_token")),
    "qa-not-a-real-token"
  );
  assert.equal(await page.getByRole("tab").count(), 0);
  auth = "guest";
  await page.evaluate(() => localStorage.removeItem("fanfuel_access_token"));
  mode = "slow";
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator(".fuel-product-skeleton").first().waitFor();
  const before = await page.locator(".fuel-feed-content").boundingBox();
  await page.locator(".fuel-product-skeleton").first().waitFor({ state: "detached" });
  const after = await page.locator(".fuel-feed-content").boundingBox();
  assert(
    Math.abs(before.height - after.height) < 2,
    "Skeleton must reserve product geometry: " + JSON.stringify({ before, after })
  );
  mode = "empty";
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Первая находка ещё впереди" }).waitFor();
  assert(
    Math.abs((await page.locator(".fuel-feed-content").boundingBox()).height - after.height) < 2,
    "Empty geometry"
  );
  mode = "error";
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Не получилось загрузить товары" }).waitFor();
  mode = "normal";
  await page.getByRole("button", { name: /Попробовать снова/ }).click();
  await page.locator(".fuel-product").first().waitFor();
  await page.evaluate(() => localStorage.setItem("fanfuel_locale_preference", "en"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Find your next thing.", exact: true }).waitFor();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "English overflow " + width
    );
  }
  await page.screenshot({ path: path.join(out, "home-en.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true
    });
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "fanfuel_lists_v1") throw new Error("Storage disabled for QA");
      return read.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "fanfuel_lists_v1") throw new Error("Storage disabled for QA");
      return write.call(this, key, value);
    };
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("data-low-data"), "true");
  assert.equal(
    await page
      .locator(".fuel-add")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s"
  );
  await page.getByRole("button", { name: "Save item: " + products[0].title, exact: true }).click();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await page
    .getByText("Browser storage is unavailable: your list will last until this page closes.", {
      exact: true
    })
    .waitFor();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: products[0].title, exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  for (const route of ["/for-streamers", "/for-sellers"]) {
    await staticPage.goto(base + route);
    assert.equal(
      await staticPage.locator("h1").isVisible(),
      true,
      "Role content must be server-rendered"
    );
    assert.match(await staticPage.locator('meta[name="robots"]').getAttribute("content"), /index/);
  }
  await staticContext.close();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        screenshots: out,
        checks:
          "guest/member/error session, tabs+keyboard, saved/cart persistence, checkout URL, ru/en responsive, reduced motion, reload, role steps, search+pagination, loading/empty/error geometry, Save-Data, 4x CPU throttle, blocked storage fallback, runtime errors"
      },
      null,
      2
    )
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  await browser?.close();
  process.exitCode = 1;
});
