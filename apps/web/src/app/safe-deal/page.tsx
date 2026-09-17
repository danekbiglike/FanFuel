import { MarketplaceRouteShell } from "../../components/marketplace-route-shell";

export default function SafeDealPage() {
  return (
    <MarketplaceRouteShell
      config={{
        titleKey: "safeDealPageTitle",
        leadKey: "safeDealPageLead",
        primaryActionKey: "marketplaceHeroBrowseAction",
        primaryHref: "/marketplace/catalog",
        secondaryActionKey: "marketplaceHeroCategoriesAction",
        secondaryHref: "/marketplace/categories",
        cards: [
          {
            titleKey: "safeDealPageConditionsTitle",
            textKey: "safeDealPageConditionsText",
            href: "/marketplace/catalog"
          },
          {
            titleKey: "safeDealPageStatusTitle",
            textKey: "safeDealPageStatusText",
            href: "/marketplace/catalog"
          },
          {
            titleKey: "safeDealPageDisputeTitle",
            textKey: "safeDealPageDisputeText",
            href: "/for-buyers"
          }
        ]
      }}
    />
  );
}
