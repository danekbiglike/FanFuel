import { PublicLanding, type PublicLandingConfig } from "../../components/public-landing";

const config: PublicLandingConfig = {
  eyebrowKey: "forSellersEyebrow",
  titleKey: "forSellersTitle",
  leadKey: "forSellersLead",
  primaryActionKey: "forSellersPrimaryAction",
  primaryHref: "/auth",
  secondaryActionKey: "openMarketplace",
  secondaryHref: "/marketplace",
  previewLabelKey: "forSellersPreviewLabel",
  previewTitleKey: "forSellersPreviewTitle",
  previewLeadKey: "forSellersPreviewLead",
  cards: [
    {
      titleKey: "forSellersCardProductsTitle",
      textKey: "forSellersCardProductsText"
    },
    {
      titleKey: "forSellersCardModerationTitle",
      textKey: "forSellersCardModerationText"
    },
    {
      titleKey: "forSellersCardCreatorsTitle",
      textKey: "forSellersCardCreatorsText"
    }
  ],
  flow: [
    {
      labelKey: "forSellersFlowProduct",
      valueKey: "statusDraft",
      tone: "neutral"
    },
    {
      labelKey: "forSellersFlowModeration",
      valueKey: "statusModerationPending",
      tone: "warning"
    },
    {
      labelKey: "forSellersFlowOrder",
      valueKey: "statusPaid",
      tone: "success"
    }
  ]
};

export default function ForSellersPage() {
  return <PublicLanding config={config} />;
}
