"use client";
import { useEffect, useState } from "react";
import { dictionary } from "./i18n";
import {
  readDraftMedia,
  validateDraftImage,
  writeDraftMedia,
  type DraftMediaKind
} from "./creator-draft-media";
const copy = (key: string) => (dictionary.common as Record<string, string>)[`onboard.${key}`];

export function useCreatorDraftMedia() {
  const [files, setFiles] = useState<{ avatar: Blob | null; banner: Blob | null }>({
    avatar: null,
    banner: null
  });
  const [urls, setUrls] = useState({ avatar: "", banner: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([readDraftMedia("avatar"), readDraftMedia("banner")])
      .then(([avatar, banner]) => {
        if (active) setFiles({ avatar, banner });
      })
      .catch(() => {
        if (active) setError(copy("mediaStorageError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const next = {
      avatar: files.avatar ? URL.createObjectURL(files.avatar) : "",
      banner: files.banner ? URL.createObjectURL(files.banner) : ""
    };
    setUrls(next);
    return () => {
      Object.values(next).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  async function change(kind: DraftMediaKind, file: File | null) {
    if (busy || loading) return;
    setBusy(true);
    setError("");
    try {
      if (file) {
        try {
          await validateDraftImage(file);
        } catch {
          setError(copy("imageInvalid"));
          return;
        }
      }
      await writeDraftMedia(kind, file);
      setFiles((value) => ({ ...value, [kind]: file }));
    } catch {
      setError(copy("mediaStorageError"));
    } finally {
      setBusy(false);
    }
  }
  return { urls, busy: busy || loading, error, change };
}
