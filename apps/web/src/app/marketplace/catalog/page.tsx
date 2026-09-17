import { MarketplaceRouteShell } from "../../../components/marketplace-route-shell";

export default function MarketplaceCatalogPage() {
  return (
    <MarketplaceRouteShell
      config={{
        titleKey: "marketplaceCatalogPageTitle",
        leadKey: "marketplaceCatalogPageLead",
        primaryActionKey: "marketplaceHeroCategoriesAction",
        primaryHref: "/marketplace/categories",
        secondaryActionKey: "marketplaceHeroFindCreatorAction",
        secondaryHref: "/creators",
        cards: [
          {
            titleKey: "marketplaceQuickObs",
            textKey: "marketplaceRouteObsText",
            href: "/marketplace/category/obs-packs"
          },
          {
            titleKey: "marketplaceQuickAlerts",
            textKey: "marketplaceRouteAlertsText",
            href: "/marketplace/category/alerts"
          },
          {
            titleKey: "marketplaceQuickServices",
            textKey: "marketplaceRouteGameServicesText",
            href: "/marketplace/category/game-services"
          }
        ]
      }}
    />
  );
}
