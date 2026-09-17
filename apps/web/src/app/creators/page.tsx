import { MarketplaceRouteShell } from "../../components/marketplace-route-shell";

export default function CreatorsDirectoryPage() {
  return (
    <MarketplaceRouteShell
      config={{
        titleKey: "creatorsDirectoryPageTitle",
        leadKey: "creatorsDirectoryPageLead",
        primaryActionKey: "creatorsDirectorySearchAction",
        primaryHref: "/creators?focus=search",
        secondaryActionKey: "marketplaceHeroBrowseAction",
        secondaryHref: "/marketplace/catalog",
        cards: [
          {
            titleKey: "marketplaceAuthorWaveshiftName",
            textKey: "marketplaceAuthorWaveshiftText",
            href: "/creators/w4veshift"
          },
          {
            titleKey: "marketplaceAuthorStarterObsName",
            textKey: "marketplaceAuthorStarterObsText",
            href: "/creators/starter-obs"
          },
          {
            titleKey: "marketplaceAuthorGameWeekName",
            textKey: "marketplaceAuthorGameWeekText",
            href: "/creators/game-week"
          }
        ]
      }}
    />
  );
}
