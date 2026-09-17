import { MarketplaceRouteShell } from "../../../components/marketplace-route-shell";

export default function MarketplaceCategoriesPage() {
  return (
    <MarketplaceRouteShell
      config={{
        titleKey: "marketplaceCategoriesPageTitle",
        leadKey: "marketplaceCategoriesPageLead",
        primaryActionKey: "marketplaceHeroBrowseAction",
        primaryHref: "/marketplace/catalog",
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
          },
          {
            titleKey: "marketplaceQuickDesign",
            textKey: "marketplaceRouteDesignText",
            href: "/marketplace/category/design-assets"
          },
          {
            titleKey: "marketplaceQuickAuthors",
            textKey: "marketplaceRouteAuthorsText",
            href: "/creators"
          },
          {
            titleKey: "marketplaceQuickPromos",
            textKey: "marketplaceRoutePromosText",
            href: "/marketplace/promocodes"
          }
        ]
      }}
    />
  );
}
