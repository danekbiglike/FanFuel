export const creatorDraftKey = "fanfuel.creator-draft.v1";
export type DraftProduct = { id: string; title: string };
export type CreatorDraft = { title: string; description: string; products: DraftProduct[] };

export function readCreatorDraft(): CreatorDraft | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(creatorDraftKey) ?? "null");
    if (
      value &&
      typeof value === "object" &&
      "title" in value &&
      "description" in value &&
      typeof value.title === "string" &&
      typeof value.description === "string"
    ) {
      const products =
        "products" in value && Array.isArray(value.products)
          ? value.products
              .filter(
                (item): item is DraftProduct =>
                  item && typeof item.id === "string" && typeof item.title === "string"
              )
              .slice(0, 12)
          : [];
      return {
        title: value.title.slice(0, 80),
        description: value.description.slice(0, 1000),
        products
      };
    }
  } catch {
    /* Недоступное хранилище не должно ломать форму. */
  }
  return null;
}

export function isCreatorAuthFlow(): boolean {
  return new URLSearchParams(window.location.search).get("flow") === "creator";
}

export function authNameDestination(): string {
  return isCreatorAuthFlow() ? "/auth/name?flow=creator" : "/auth/name";
}

export function authDestination(): string {
  return isCreatorAuthFlow() ? "/create?step=finish" : "/marketplace";
}
