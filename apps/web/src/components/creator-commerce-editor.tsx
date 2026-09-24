"use client";
import { useEffect, useState } from "react";
import { AppTopBar } from "./app-chrome";
import { ApiError, getStoredToken } from "../lib/api";
import {
  getCreatorCommerce,
  saveCreatorCommerce,
  searchCommerce,
  type CreatorCommerce,
  type CommerceProduct,
  type StoreDesign
} from "../lib/commerce";
import { useCommerceCopy, ProductEconomics } from "./commerce-shared";
import { CreatorMediaUpload } from "./creator-media";
import { Storefront } from "./storefront";
export function CreatorCommerceEditor() {
  const { copy, t, money } = useCommerceCopy();
  const [data, setData] = useState<CreatorCommerce | null>(null);
  const [tab, setTab] = useState("appearance");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("");
  const [found, setFound] = useState<CommerceProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setLoaded(false);
    if (!getStoredToken()) {
      setLoaded(true);
      setError("needLogin");
      return;
    }
    void getCreatorCommerce(c.signal)
      .then((x) => {
        setData(x);
        setError("");
        setDirty(false);
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e instanceof ApiError && e.code === "not_found" ? "needCreator" : "error");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoaded(true);
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function update(patch: Partial<CreatorCommerce>) {
    setData((x) => (x ? { ...x, ...patch } : x));
    setDirty(true);
    setMessage("");
  }
  function design(patch: Partial<StoreDesign>) {
    if (data) update({ design: { ...data.design, ...patch } });
  }
  async function save() {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      setData(await saveCreatorCommerce(data));
      setDirty(false);
      setMessage("saved");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "conflict" ? "conflict" : "error");
    } finally {
      setSaving(false);
    }
  }
  async function find(next = 0) {
    setSearching(true);
    setSearched(false);
    try {
      const r = await searchCommerce({
        query,
        format,
        group_equivalent: "false",
        limit: "12",
        offset: String(next)
      });
      setFound(
        r.items.filter((p) => (p as CommerceProduct).commission_configured) as CommerceProduct[]
      );
      setHasNext(r.pagination.has_next);
      setOffset(next);
      setSearched(true);
    } catch {
      setError("error");
    } finally {
      setSearching(false);
    }
  }
  function toggle(p: CommerceProduct) {
    if (!data) return;
    const items = data.products.some((x) => x.id === p.id)
      ? data.products.filter((x) => x.id !== p.id)
      : [...data.products, p].slice(0, 100);
    update({ products: items, product_ids: items.map((x) => x.id) });
  }
  function move(index: number, step: number) {
    if (!data) return;
    const blocks = [...data.design.blocks];
    [blocks[index], blocks[index + step]] = [blocks[index + step], blocks[index]];
    design({ blocks });
  }
  return (
    <main className="ff-page">
      <AppTopBar />
      <div className="fuel-wrap commerce-workspace">
        <header className="commerce-heading">
          <div>
            <span className="fuel-hand">{copy.studioEyebrow}</span>
            <h1>{copy.studio}</h1>
            <p>{copy.studioLead}</p>
          </div>
          {data && (
            <button className="fuel-button" onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? copy.saving : copy.save}
            </button>
          )}
        </header>
        {!loaded ? (
          <div className="fuel-skeleton commerce-loading" />
        ) : !data ? (
          <section className="commerce-panel">
            <p>{t(error)}</p>
            <a className="fuel-button" href={error === "needLogin" ? "/auth" : "/create"}>
              {error === "needLogin" ? copy.login : copy.createCreator}
            </a>
            <button className="fuel-text-button" onClick={() => setAttempt((x) => x + 1)}>
              {copy.retry}
            </button>
          </section>
        ) : (
          <>
            <div className="commerce-toolbar">
              <nav aria-label={copy.studio}>
                {["appearance", "products", "promo", "analytics"].map((key) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={tab === key}
                    onClick={() => setTab(key)}
                  >
                    {t(key)}
                  </button>
                ))}
              </nav>
              <a href={"/creators/" + encodeURIComponent(data.slug)}>{copy.openStore}</a>
            </div>
            <div className="commerce-feedback" aria-live="polite">
              {error && <p role="alert">{t(error)}</p>}
              {message && <p>{t(message)}</p>}
              {dirty && <small>{copy.unsaved}</small>}
              {!data.published && <p>{copy.draft}</p>}
            </div>
            <div className="commerce-editor-grid">
              <section className="commerce-panel">
                {tab === "appearance" && (
                  <>
                    <label className="commerce-switch">
                      <input
                        type="checkbox"
                        checked={data.storefront_enabled}
                        onChange={(e) => update({ storefront_enabled: e.target.checked })}
                      />
                      {copy.storeEnabled}
                    </label>
                    <p>{copy.independent}</p>
                    <label>
                      {copy.headline}
                      <input
                        maxLength={120}
                        value={data.design.headline}
                        onChange={(e) => design({ headline: e.target.value })}
                      />
                    </label>
                    <label>
                      {copy.about}
                      <textarea
                        maxLength={1500}
                        value={data.design.about}
                        onChange={(e) => design({ about: e.target.value })}
                      />
                    </label>
                    {(["banner", "avatar", "accent", "layout", "donate_placement"] as const).map(
                      (key) => (
                        <fieldset key={key}>
                          <legend>
                            {key === "donate_placement" ? copy.donatePlacement : t(key)}
                          </legend>
                          <div className="commerce-presets">
                            {{
                              banner: ["lime", "ink", "grid"],
                              avatar: ["oily", "letter", "canister"],
                              accent: ["lime", "neutral"],
                              layout: ["grid", "list"],
                              donate_placement: ["button", "block", "hidden"]
                            }[key].map((value) => (
                              <button
                                className={"commerce-preset commerce-preset-" + value}
                                key={value}
                                type="button"
                                aria-pressed={data.design[key] === value}
                                onClick={() =>
                                  design({
                                    [key]: value,
                                    ...(key === "avatar"
                                      ? { avatar_media_id: "" }
                                      : key === "banner"
                                        ? { banner_media_id: "" }
                                        : {})
                                  })
                                }
                              >
                                {t(value)}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      )
                    )}
                    <CreatorMediaUpload
                      purpose="creator_avatar"
                      onUploaded={(id) => design({ avatar_media_id: id })}
                    />
                    <CreatorMediaUpload
                      purpose="creator_banner"
                      onUploaded={(id) => design({ banner_media_id: id })}
                    />
                    <h3>{copy.blocks}</h3>
                    {data.design.blocks.map((b, i) => (
                      <div className="commerce-block-row" key={b}>
                        <span>{t(b)}</span>
                        <button
                          aria-label={copy.up + " · " + t(b)}
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          {copy.up}
                        </button>
                        <button
                          aria-label={copy.down + " · " + t(b)}
                          disabled={i === data.design.blocks.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          {copy.down}
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {tab === "promo" && (
                  <>
                    <label className="commerce-switch">
                      <input
                        type="checkbox"
                        checked={data.promo_enabled}
                        onChange={(e) => update({ promo_enabled: e.target.checked })}
                      />
                      {copy.promoEnabled}
                    </label>
                    <p>{copy.promoHelp}</p>
                    <label>
                      {copy.promo}
                      <input
                        value={data.promo_code}
                        maxLength={24}
                        pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,23}"
                        onChange={(e) => update({ promo_code: e.target.value.toUpperCase() })}
                      />
                    </label>
                    <small>{copy.promoRules}</small>
                  </>
                )}
                {tab === "products" && (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void find();
                      }}
                    >
                      <label>
                        {copy.search}
                        <input
                          value={query}
                          placeholder={copy.searchHint}
                          maxLength={160}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <label>
                        {copy.format}
                        <select value={format} onChange={(e) => setFormat(e.target.value)}>
                          <option value="">{copy.allFormats}</option>
                          {[
                            "digital_file",
                            "service",
                            "license_key",
                            "gift",
                            "personal_account",
                            "shared_account"
                          ].map((f) => (
                            <option value={f} key={f}>
                              {t(f)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="fuel-button" disabled={searching}>
                        {searching ? copy.loading : copy.find}
                      </button>
                    </form>
                    {searched && !found.length && <p>{copy.noResults}</p>}
                    {found.map((p) => (
                      <article className="commerce-picker-product" key={p.id}>
                        <h3>{p.title}</h3>
                        <p>
                          {p.seller?.display_name} · {money(p.price_amount_minor, p.currency)}
                        </p>
                        <ProductEconomics product={p} />
                        <button
                          className="fuel-button fuel-button-outline"
                          onClick={() => toggle(p)}
                        >
                          {data.product_ids.includes(p.id) ? copy.remove : copy.add}
                        </button>
                      </article>
                    ))}
                    {hasNext && (
                      <button
                        className="fuel-text-button"
                        disabled={searching}
                        onClick={() => void find(offset + 12)}
                      >
                        {copy.more}
                      </button>
                    )}
                    <h3>{copy.selected}</h3>
                    {!data.products.length ? (
                      <p>{copy.empty}</p>
                    ) : (
                      data.products.map((p, i) => (
                        <div className="commerce-block-row" key={p.id}>
                          <span>
                            {i + 1}. {p.title}
                          </span>
                          <button
                            aria-label={copy.up + " · " + p.title}
                            disabled={i === 0}
                            onClick={() => {
                              const products = [...data.products];
                              [products[i - 1], products[i]] = [products[i], products[i - 1]];
                              update({ products, product_ids: products.map((x) => x.id) });
                            }}
                          >
                            {copy.up}
                          </button>
                          <button onClick={() => toggle(p)}>{copy.remove}</button>
                        </div>
                      ))
                    )}
                  </>
                )}
                {tab === "analytics" && (
                  <>
                    <h2>{copy.analytics}</h2>
                    <p>{copy.mock}</p>
                    {data.stats.length ? (
                      data.stats.map((s) => (
                        <dl className="commerce-stats" key={s.currency}>
                          <div>
                            <dt>{copy.orders}</dt>
                            <dd>{s.orders}</dd>
                          </div>
                          <div>
                            <dt>{copy.pending}</dt>
                            <dd>{money(s.pending_minor, s.currency)}</dd>
                          </div>
                          <div>
                            <dt>{copy.completed}</dt>
                            <dd>{money(s.completed_minor, s.currency)}</dd>
                          </div>
                        </dl>
                      ))
                    ) : (
                      <p>{copy.statsEmpty}</p>
                    )}
                    <h3>{copy.conversion}</h3>
                    <p>{copy.conversionEmpty}</p>
                    <h3>{copy.priceTitle}</h3>
                    <p>{copy.above_observed_price}</p>
                    <p>{copy.verify_terms_and_seller}</p>
                  </>
                )}
              </section>
              <aside className="commerce-preview">
                <Storefront store={data} preview />
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
