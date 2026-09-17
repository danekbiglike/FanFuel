"use client";

import { useParams } from "next/navigation";
import { MarketplaceRouteShell } from "../../../../components/marketplace-route-shell";

const categoryCopy: Record<string, { titleKey: string; leadKey: string }> = {
  "obs-packs": {
    titleKey: "marketplaceCategoryObsPageTitle",
    leadKey: "marketplaceCategoryObsPageLead"
  },
  alerts: {
    titleKey: "marketplaceCategoryAlertsPageTitle",
    leadKey: "marketplaceCategoryAlertsPageLead"
  },
  "game-services": {
    titleKey: "marketplaceCategoryGameServicesPageTitle",
    leadKey: "marketplaceCategoryGameServicesPageLead"
  },
  "design-assets": {
    titleKey: "marketplaceCategoryDesignPageTitle",
    leadKey: "marketplaceCategoryDesignPageLead"
  }
};

export default function MarketplaceCategoryPage() {
  const params = useParams<{ slug: string }>();
  const copy = categoryCopy[params.slug] ?? {
    titleKey: "marketplaceCategoryDefaultPageTitle",
    leadKey: "marketplaceCategoryDefaultPageLead"
  };

  return (
    <MarketplaceRouteShell
      config={{
        titleKey: copy.titleKey,
        leadKey: copy.leadKey,
        primaryActionKey: "marketplaceHeroBrowseAction",
        primaryHref: "/marketplace/catalog",
        secondaryActionKey: "marketplaceHeroCategoriesAction",
        secondaryHref: "/marketplace/categories"
      }}
    />
  );
}
