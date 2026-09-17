// Файлы остаются локальными: модуль не выполняет сетевых запросов.
export type DraftMediaKind = "avatar" | "banner";
const databaseName = "fanfuel-creator-draft-media";

function draftId(): string {
  const key = "fanfuel.creator-draft-media-id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("media");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("storage_blocked"));
  });
}

export async function readDraftMedia(kind: DraftMediaKind): Promise<Blob | null> {
  const key = `${draftId()}:${kind}`;
  const db = await openDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = db.transaction("media", "readonly");
      const request = transaction.objectStore("media").get(key);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function writeDraftMedia(kind: DraftMediaKind, file: Blob | null): Promise<void> {
  const key = `${draftId()}:${kind}`;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("media", "readwrite");
      if (file) transaction.objectStore("media").put(file, key);
      else transaction.objectStore("media").delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function validateDraftImage(file: File): Promise<void> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error("image_invalid");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 8192 || bitmap.height > 8192 || bitmap.width * bitmap.height > 24000000)
      throw new Error("image_invalid");
  } finally {
    bitmap.close();
  }
}
