import { PublicLanding, type PublicLandingConfig } from "../../components/public-landing";

const config: PublicLandingConfig = {
  eyebrowKey: "forBuyersEyebrow",
  titleKey: "forBuyersTitle",
  leadKey: "forBuyersLead",
  primaryActionKey: "openMarketplace",
  primaryHref: "/marketplace",
  secondaryActionKey: "navRegister",
  secondaryHref: "/auth",
  previewLabelKey: "forBuyersPreviewLabel",
  previewTitleKey: "forBuyersPreviewTitle",
  previewLeadKey: "forBuyersPreviewLead",
  cards: [
    {
      titleKey: "forBuyersCardTrustTitle",
      textKey: "forBuyersCardTrustText"
    },
    {
      titleKey: "forBuyersCardCreatorTitle",
      textKey: "forBuyersCardCreatorText"
    },
    {
      titleKey: "forBuyersCardHistoryTitle",
      textKey: "forBuyersCardHistoryText"
    }
  ],
  flow: [
    {
      labelKey: "forBuyersFlowProduct",
      valueKey: "statusReady",
      tone: "info"
    },
    {
      labelKey: "forBuyersFlowPayment",
      valueKey: "safeDealMockBadge",
      tone: "held"
    },
    {
      labelKey: "forBuyersFlowOrder",
      valueKey: "statusCompleted",
      tone: "success"
    }
  ]
};

export default function ForBuyersPage() {
  return <PublicLanding config={config} />;
}
