"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { apiFetch, getStoredToken } from "../lib/api";
import { useCommerceCopy } from "./commerce-shared";

export function CreatorMedia({
  id,
  preview = false,
  banner = false
}: {
  id: string;
  preview?: boolean;
  banner?: boolean;
}) {
  const { copy } = useCommerceCopy();
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    let objectURL = "";
    setSrc("");
    setFailed(false);
    const timeout = window.setTimeout(() => {
      setFailed(true);
      c.abort();
    }, 15000);
    const headers: Record<string, string> = {};
    if (preview) headers.Authorization = "Bearer " + getStoredToken();
    void fetch("/api/v1/media/" + encodeURIComponent(id), { headers, signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error("media");
        return r.blob();
      })
      .then((b) => {
        if (c.signal.aborted) return;
        objectURL = URL.createObjectURL(b);
        setSrc(objectURL);
      })
      .catch(() => {
        if (!c.signal.aborted) setFailed(true);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      c.abort();
      window.clearTimeout(timeout);
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [id, preview]);
  return src ? (
    <Image
      src={src}
      unoptimized
      width={banner ? 1600 : 256}
      height={banner ? 480 : 256}
      className={banner ? "commerce-banner-image" : "commerce-avatar-image"}
      alt=""
    />
  ) : failed ? (
    <span className="commerce-media-loading" role="img" aria-label={copy.error}>
      !
    </span>
  ) : (
    <span className="fuel-skeleton commerce-media-loading" />
  );
}
export function CreatorMediaUpload({
  purpose,
  onUploaded
}: {
  purpose: "creator_avatar" | "creator_banner";
  onUploaded: (id: string) => void;
}) {
  const { copy } = useCommerceCopy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    setError(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 10 * 1024 * 1024)
        throw new Error("input");
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 25000000) {
        bitmap.close();
        throw new Error("pixels");
      }
      const max = purpose === "creator_avatar" ? 512 : 1600;
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(16, Math.round(bitmap.width * scale));
      canvas.height = Math.max(16, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        throw new Error("canvas");
      }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85)
      );
      if (blob.size > 2 * 1024 * 1024) throw new Error("size");
      const ticket = await apiFetch<{ id: string; upload_url: string }>("/api/v1/media/uploads", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: "Bearer " + getStoredToken() },
        body: JSON.stringify({ purpose })
      });
      const response = await fetch(ticket.upload_url, {
        method: "PUT",
        signal: controller.signal,
        headers: { "Content-Type": "image/jpeg" },
        body: blob
      });
      if (!response.ok) throw new Error("upload");
      onUploaded(ticket.id);
    } catch {
      setError(true);
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }
  return (
    <div className="commerce-upload">
      <label>
        {purpose === "creator_avatar" ? copy.uploadAvatar : copy.uploadBanner}
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </label>
      <small>{busy ? copy.saving : copy.uploadHelp}</small>
      {error && <p role="alert">{copy.uploadError}</p>}
    </div>
  );
}
