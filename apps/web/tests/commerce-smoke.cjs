/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, process, console, URL, localStorage, document, innerWidth */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.FANFUEL_TEST_URL || "http://localhost:3000";
const out =
  process.env.FANFUEL_SCREENSHOTS || path.join(require("node:os").tmpdir(), "fanfuel-commerce-qa");
fs.mkdirSync(out, { recursive: true });
const product = {
  id: "test-product",
  slug: "test-asset",
  title: "Графика для твоего проекта",
  description: "Тестовые данные интерфейса",
  terms: "Условия тестового товара",
  price_amount_minor: 99900,
  currency: "RUB",
  kind: "design_asset",
  status: "published",
  delivery_type: "digital_file",
  affiliate_percent_bps: 1000,
  commission_configured: true,
  promo_bps: 200,
  storefront_bps: 1000,
  identity: {
    source: "seller",
    external_id: "",
    work_title: "Графика",
    format: "digital_file",
    platform: "pc",
    edition: "standard",
    region: "global",
    language: "ru",
    license: "personal",
    bundle: "none",
    duration_days: 0
  },
  seller: { display_name: "Тестовая мастерская", status: "active", rating_avg: 0 }
};
let store = {
  creator_id: "author-a",
  slug: "test-author",
  title: "Тестовый автор",
  published: true,
  donations_enabled: true,
  storefront_enabled: true,
  promo_enabled: true,
  promo_code: "ALPHA",
  revision: 1,
  design: {
    banner: "lime",
    avatar: "oily",
    accent: "lime",
    layout: "grid",
    blocks: ["products", "about", "donation"],
    headline: "Штуки, которые мне нравятся.",
    about: "Тестовая витрина. Эти данные существуют только в проверке.",
    donate_placement: "button"
  },
  product_ids: [product.id],
  products: [product],
  stats: []
};
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
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addInitScript(() =>
    localStorage.setItem("fanfuel_access_token", "test-only-token")
  );
  let conflict = false;
  let lastOrder = null;
  let firstOrderKey = "";
  let staleQuote = true;
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    let body;
    if (u.pathname === "/api/v1/auth/me")
      body = {
        user: { id: "test-user" },
        profile: { display_name: "Тестовый автор" },
        roles: ["buyer", "streamer", "seller"]
      };
    else if (u.pathname === "/api/v1/me/preferences")
      body = { themePreference: "light", locale: "ru" };
    else if (u.pathname === "/api/v1/studio/commerce") {
      if (req.method() === "PUT") {
        if (conflict) return route.fulfill({ status: 409, json: { error: { code: "conflict" } } });
        store = { ...req.postDataJSON(), revision: store.revision + 1 };
      }
      body = store;
    } else if (u.pathname === "/api/v1/commerce/search")
      body = { items: [product], pagination: { total: 1, has_next: false } };
    else if (
      u.pathname.startsWith("/api/v1/commerce/products/") ||
      u.pathname.endsWith("/insights")
    )
      body = {
        product,
        offers: [],
        reference: { status: "insufficient", median_minor: 0, sellers: 1 },
        signals: [],
        conversion: { status: "insufficient" }
      };
    else if (
      u.pathname === "/api/v1/products/test-asset" ||
      u.pathname === "/api/v1/products/test-product"
    )
      body = product;
    else if (u.pathname === "/api/v1/seller/products/test-product")
      body = { ...product, status: "draft" };
    else if (u.pathname === "/api/v1/seller/products/test-product/commerce")
      body = { ...product, ...req.postDataJSON(), status: "draft" };
    else if (u.pathname === "/api/v1/commerce/quote") {
      const promo = u.searchParams.get("promo_code");
      if (promo === "INVALID")
        return route.fulfill({ status: 400, json: { error: { code: "validation_failed" } } });
      const a = u.searchParams.get("storefront")
        ? { creator_id: "author-a", creator_name: "Автор Альфа", channel: "storefront", bps: 1000 }
        : null;
      const b = promo
        ? { creator_id: "author-b", creator_name: "Автор Бета", channel: "promo", bps: 200 }
        : null;
      const choice = u.searchParams.get("attribution_choice");
      const unresolved = Boolean(a && b && !choice);
      const selected =
        choice === "none"
          ? null
          : choice === "promo"
            ? b
            : choice === "storefront"
              ? a
              : unresolved
                ? null
                : a || b;
      const amount = selected ? Math.floor((99900 * selected.bps) / 10000) : 0;
      body = {
        product_id: product.id,
        currency: "RUB",
        quantity: 1,
        storefront: a,
        promo: b,
        selected,
        choice_required: unresolved,
        allocation: {
          buyer_amount_minor: 99900,
          creator_amount_minor: amount,
          seller_amount_minor: 99900 - amount
        },
        promo_code: promo || ""
      };
    } else if (u.pathname === "/api/v1/orders") {
      lastOrder = req.postDataJSON();
      if (staleQuote) {
        staleQuote = false;
        return route.fulfill({
          status: 409,
          json: { error: { code: "conflict", i18n_key: "errors.conflict" } }
        });
      }
      if (!firstOrderKey) {
        firstOrderKey = req.headers()["idempotency-key"];
        return route.abort("failed");
      }
      assert.equal(
        req.headers()["idempotency-key"],
        firstOrderKey,
        "retry keeps the same order key"
      );
      body = {
        order: { id: "test-order", status: "awaiting_payment" },
        deal: { status: "awaiting_payment" },
        payment: { id: "test-payment", status: "pending" },
        product
      };
    } else return route.fulfill({ status: 404, json: { error: { code: "not_found" } } });
    return route.fulfill({ json: body });
  });
  await page.goto(base + "/studio");
  await page.getByRole("heading", { name: "Твоя витрина. Твои правила." }).waitFor();
  await page.getByLabel("Заголовок", { exact: true }).fill("Моя тестовая полка");
  await page.getByRole("button", { name: "Графит", exact: true }).click();
  assert.equal(await page.locator(".commerce-banner-ink").count(), 1);
  await page.getByRole("button", { name: "Выше · О тебе", exact: true }).click();
  assert.equal(
    (await page.locator(".commerce-preview .commerce-store>section h3").allTextContents())[0],
    "О тебе"
  );
  await page.getByRole("button", { name: /Сохранить изменения/ }).click();
  await page.getByText("Изменения сохранены", { exact: true }).waitFor();
  assert.equal(store.design.headline, "Моя тестовая полка");
  await page.getByRole("button", { name: "Промокод", exact: true }).click();
  await page.getByLabel("Промокод включён", { exact: true }).uncheck();
  await page.getByRole("button", { name: /Сохранить изменения/ }).click();
  await page.getByText("Изменения сохранены", { exact: true }).waitFor();
  assert.equal(store.promo_enabled, false);
  assert.equal(store.storefront_enabled, true);
  await page.getByRole("button", { name: "Товары", exact: true }).click();
  await page.getByLabel("Найти товар для витрины", { exact: true }).fill("графика");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await page.locator(".commerce-picker-product").waitFor();
  await page.getByText("Ориентир по предложениям FanFuel", { exact: true }).click();
  await page.getByText("Пока мало независимых продавцов для ориентира цены.").waitFor();
  await page.screenshot({ path: path.join(out, "studio-desktop.png"), fullPage: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "studio overflow " + width
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(out, "studio-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Оформление", exact: true }).click();
  conflict = true;
  await page.getByLabel("Заголовок", { exact: true }).fill("Не потерять этот черновик");
  await page.getByRole("button", { name: /Сохранить изменения/ }).click();
  await page.locator("p[role='alert']").filter({ hasText: "Настройки изменились" }).waitFor();
  assert.equal(
    await page.getByLabel("Заголовок", { exact: true }).getAttribute("value"),
    "Не потерять этот черновик"
  );
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "/marketplace/products/test-asset?storefront=test-author&promo_code=BETA");
  await page.getByRole("button", { name: "В корзину: " + product.title, exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Корзина", exact: true }).click();
  const cartLink = page.getByRole("dialog").locator('a[href^="/checkout/"]');
  await cartLink.waitFor();
  assert.ok((await cartLink.getAttribute("href")).includes("storefront=test-author"));
  assert.ok((await cartLink.getAttribute("href")).includes("promo_code=BETA"));
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.goto(base + "/checkout/test-product?storefront=test-author&promo_code=BETA");
  await page.getByText("Витрина и промокод принадлежат разным авторам. Выбери одного.").waitFor();
  const buy = page.getByRole("button", { name: "Создать заказ", exact: true });
  assert.equal(await buy.isEnabled(), false);
  await page.getByRole("radio").nth(1).check();
  await page.getByText(/Автор получит/).waitFor();
  await page.locator(".ff-check input").check();
  assert.equal(await buy.isEnabled(), true);
  await buy.click();
  await page
    .getByText(
      "Цена или условия поддержки изменились. Проверь обновлённый расчёт и подтверди условия ещё раз."
    )
    .waitFor();
  assert.equal(await page.locator(".ff-check input").isChecked(), false);
  await page.locator(".ff-check input").check();
  await buy.click();
  await page
    .getByRole("alert")
    .filter({ hasText: /ошиб|позже|Не удалось/i })
    .waitFor();
  await buy.click();
  await page.getByText("Заказ создан", { exact: false }).first().waitFor();
  assert.equal(lastOrder.attribution_choice, "promo");
  assert.equal(lastOrder.promo_code, "BETA");
  await page.goto(base + "/seller/products/test-product");
  await page.getByRole("heading", { name: "Вариант и отчисления", exact: true }).waitFor();
  const rates = page.locator(".commerce-two").nth(1).locator("input");
  await rates.nth(0).fill("2");
  await rates.nth(1).fill("2");
  assert.equal(
    await page.getByRole("button", { name: "Сохранить изменения", exact: true }).isEnabled(),
    false
  );
  await rates.nth(0).fill("10");
  assert.equal(
    await page.getByRole("button", { name: "Сохранить изменения", exact: true }).isEnabled(),
    true
  );
  await page.getByRole("button", { name: "Сохранить изменения", exact: true }).click();
  await page.getByText("Изменения сохранены", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(out, "seller-desktop.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      ok: true,
      out,
      checks:
        "store design, reorder, persistence, channel independence, economics cold start, mobile layout, conflict draft retention, checkout attribution, seller rate validation, runtime errors"
    })
  );
  await browser.close();
})().catch(async (e) => {
  console.error(e);
  if (browser) await browser.close();
  process.exit(1);
});
