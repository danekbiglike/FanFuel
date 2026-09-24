"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { CreatorMediaStep, CreatorProductsStep } from "../../components/creator-onboarding-extras";
import { useCreatorDraftMedia } from "../../lib/use-creator-draft-media";
import type { CurrentUser } from "@fanfuel/types";
import { AppTopBar } from "../../components/app-chrome";
import { TypingActionLabel } from "../../components/typing-action-label";
import { DiscoveryArt } from "../../components/home-audience";
import { ApiError, createCreatorDraft, getMe, getStoredToken } from "../../lib/api";
import { creatorDraftKey, readCreatorDraft, type DraftProduct } from "../../lib/creator-draft";
import { dictionary } from "../../lib/i18n";

const copy = (key: string) => (dictionary.common as Record<string, string>)[`onboard.${key}`];

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const media = useCreatorDraftMedia();
  const stepKeys = ["name", "about", "media", "products", "finish"];
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const hasStepContent =
    step === 0 ||
    (step === 1 && description.trim().length > 0) ||
    (step === 2 && Boolean(media.urls.avatar || media.urls.banner)) ||
    (step === 3 && products.length > 0);
  const actionLabel = copy(hasStepContent ? "next" : "skip");

  useEffect(() => {
    const draft = readCreatorDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setProducts(draft.products);
      if (
        draft.title.trim().length >= 2 &&
        new URLSearchParams(location.search).get("step") === "finish"
      )
        setStep(4);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || saved) return;
    try {
      sessionStorage.setItem(creatorDraftKey, JSON.stringify({ title, description, products }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [title, description, products, ready, saved]);

  useEffect(() => {
    if (step !== 4) return;
    let active = true;
    const token = getStoredToken();
    if (token) {
      setBusy(true);
      getMe(token)
        .then((result) => {
          if (active) setUser(result);
        })
        .catch(() => {
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }
    return () => {
      active = false;
    };
  }, [step]);

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 2) return;
    setStep((value) => Math.min(4, value + 1));
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await createCreatorDraft(getStoredToken(), {
        title: title.trim(),
        description: description.trim()
      });
      setUser(result);
      setSaved(true);
      try {
        if (products.length === 0 && !media.urls.avatar && !media.urls.banner)
          sessionStorage.removeItem(creatorDraftKey);
      } catch {
        /* Черновик уже сохранён сервером. */
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? ((dictionary.errors as Record<string, string>)[err.i18nKey] ??
              dictionary.common.apiError)
          : dictionary.common.apiError
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ff-page">
      <AppTopBar />
      <section className="ff-onboard ff-page-with-topbar" aria-labelledby="onboard-title">
        <div className="ff-onboard-intro">
          <p className="ff-role-kicker">{copy("eyebrow")}</p>
          <h1 id="onboard-title">{copy("title")}</h1>
          <p>{copy("lead")}</p>
        </div>
        <div className="ff-onboard-layout">
          <div className="ff-onboard-card">
            <ol className="ff-onboard-progress" aria-label={copy("steps")}>
              {stepKeys.map((key, index) => (
                <li key={key} data-complete={step > index}>
                  <button
                    className="ff-onboard-step-button"
                    aria-label={copy(key)}
                    type="button"
                    aria-current={step === index ? "step" : undefined}
                    disabled={
                      !ready ||
                      media.busy ||
                      busy ||
                      saved ||
                      (index > 0 && title.trim().length < 2)
                    }
                    onClick={() => {
                      setStep(index);
                      setError("");
                      requestAnimationFrame(() => heading.current?.focus());
                    }}
                  >
                    <span className="ff-onboard-step-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span
                      className="ff-onboard-step-label ff-onboard-step-label-full"
                      aria-hidden="true"
                    >
                      {copy(key)}
                    </span>
                    <span
                      className="ff-onboard-step-label ff-onboard-step-label-short"
                      aria-hidden="true"
                    >
                      {copy(`stepShort.${key}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <h2 ref={heading} tabIndex={-1}>
              {copy(saved ? "savedTitle" : `${stepKeys[step]}Title`)}
            </h2>
            <p className="ff-onboard-help">{copy(saved ? "savedText" : `${stepKeys[step]}Help`)}</p>
            {step > 0 && step < 4 ? (
              <p className="ff-onboard-optional">{copy("optional")}</p>
            ) : null}
            {step < 4 ? (
              <form className="ff-form" onSubmit={advance}>
                {step === 0 ? (
                  <label className="ff-field">
                    <span>{copy("nameLabel")}</span>
                    <input
                      autoComplete="nickname"
                      required
                      minLength={2}
                      maxLength={80}
                      value={title}
                      placeholder={copy("namePlaceholder")}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                ) : step === 1 ? (
                  <label className="ff-field">
                    <span>{copy("aboutLabel")}</span>
                    <textarea
                      rows={5}
                      maxLength={1000}
                      value={description}
                      placeholder={copy("aboutPlaceholder")}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                    <small aria-hidden="true">{description.length} / 1000</small>
                  </label>
                ) : step === 2 ? (
                  <CreatorMediaStep media={media} />
                ) : (
                  <CreatorProductsStep selected={products} onChange={setProducts} />
                )}
                <div className="ff-onboard-actions">
                  {step > 0 ? (
                    <button
                      className="ff-button ff-button-secondary"
                      type="button"
                      onClick={() => setStep(step - 1)}
                    >
                      {copy("back")}
                    </button>
                  ) : null}
                  <button
                    className="ff-button ff-button-primary"
                    disabled={!ready || title.trim().length < 2 || media.busy}
                    type="submit"
                    aria-label={actionLabel}
                  >
                    <TypingActionLabel
                      key={step}
                      label={actionLabel}
                      alternate={copy(hasStepContent ? "skip" : "next")}
                    />
                  </button>
                </div>
                <small className="ff-onboard-local-note">{copy("localNote")}</small>
              </form>
            ) : (
              <div className="ff-onboard-finish">
                {saved ? (
                  <>
                    {products.length > 0 || media.urls.avatar || media.urls.banner ? (
                      <p>{copy("localExtrasNote")}</p>
                    ) : null}
                    <a className="ff-button ff-button-primary" href="/me/profile">
                      {copy("openProfile")}
                    </a>
                  </>
                ) : busy ? (
                  <p role="status">{dictionary.common.loading}</p>
                ) : user?.creator_profile ? (
                  <>
                    <p>{copy("existing")}</p>
                    <a className="ff-button ff-button-primary" href="/me/profile">
                      {copy("openProfile")}
                    </a>
                  </>
                ) : user ? (
                  <>
                    <p>
                      {copy("account")} <strong>{user.user.email}</strong>
                    </p>
                    <button className="ff-button ff-button-primary" onClick={save}>
                      {copy("save")}
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      className="ff-button ff-button-primary"
                      href="/auth?flow=creator"
                      aria-disabled={storageError}
                      onClick={(event) => {
                        if (storageError) event.preventDefault();
                      }}
                    >
                      {dictionary.common.createAccount}
                    </a>
                    <p>
                      {copy("hasAccount")}{" "}
                      <a
                        href="/auth?flow=creator"
                        aria-disabled={storageError}
                        onClick={(event) => {
                          if (storageError) event.preventDefault();
                        }}
                      >
                        {dictionary.common.navLogin}
                      </a>
                    </p>
                  </>
                )}
                {!saved ? (
                  <button className="ff-role-text-link" type="button" onClick={() => setStep(0)}>
                    {copy("edit")}
                  </button>
                ) : null}
              </div>
            )}
            {storageError ? (
              <p className="ff-message ff-error" role="alert">
                {copy("storageError")}
              </p>
            ) : null}
            {error ? (
              <p className="ff-message ff-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <aside
            className="ff-onboard-preview"
            aria-label={copy("preview")}
            data-open={previewOpen}
          >
            <button
              className="ff-onboard-preview-toggle"
              type="button"
              aria-expanded={previewOpen}
              aria-controls="onboard-preview-content"
              onClick={() => setPreviewOpen((value) => !value)}
            >
              <span>{copy("preview")}</span>
              <span aria-hidden="true">{previewOpen ? "−" : "+"}</span>
            </button>
            <div className="ff-onboard-preview-label">
              <span />
              {copy("preview")}
            </div>
            <div id="onboard-preview-content" className="ff-onboard-preview-content">
              <div className="ff-onboard-cover">
                {media.urls.banner ? (
                  <Image
                    src={media.urls.banner}
                    alt={copy("banner")}
                    fill
                    unoptimized
                    sizes="500px"
                  />
                ) : (
                  <DiscoveryArt kind="market" />
                )}
              </div>
              <div className="ff-onboard-preview-body">
                <div className="ff-onboard-avatar" aria-hidden="true">
                  {media.urls.avatar ? (
                    <Image src={media.urls.avatar} alt="" fill unoptimized sizes="64px" />
                  ) : (
                    title.trim().slice(0, 1).toUpperCase() || "F"
                  )}
                </div>
                <h2>{title.trim() || copy("previewName")}</h2>
                <p>{description.trim() || copy("previewAbout")}</p>
                {products.length > 0 ? (
                  <div className="ff-onboard-preview-products">
                    <h3>{copy("products")}</h3>
                    {products.map((item) => (
                      <div key={item.id}>{item.title}</div>
                    ))}
                  </div>
                ) : null}
                <div className="ff-onboard-preview-note">{copy("previewNote")}</div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
