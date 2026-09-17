import { MarketplaceRouteShell } from "../../../components/marketplace-route-shell";

export default function MarketplacePromocodesPage() {
  return (
    <MarketplaceRouteShell
      config={{
        titleKey: "marketplacePromocodesPageTitle",
        leadKey: "marketplacePromocodesPageLead",
        primaryActionKey: "marketplaceHeroBrowseAction",
        primaryHref: "/marketplace/catalog?promo=true",
        secondaryActionKey: "marketplaceHeroFindCreatorAction",
        secondaryHref: "/creators",
        cards: [
          {
            titleKey: "marketplaceQuickAuthors",
            textKey: "marketplaceRouteAuthorsText",
            href: "/creators"
          },
          {
            titleKey: "marketplaceQuickObs",
            textKey: "marketplaceRouteObsText",
            href: "/marketplace/category/obs-packs"
          }
        ]
      }}
    />
  );
}
