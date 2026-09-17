import { PublicLanding, type PublicLandingConfig } from "../../components/public-landing";

const config: PublicLandingConfig = {
  eyebrowKey: "forStreamersEyebrow",
  titleKey: "forStreamersTitle",
  leadKey: "forStreamersLead",
  primaryActionKey: "forStreamersPrimaryAction",
  primaryHref: "/auth",
  secondaryActionKey: "openMarketplace",
  secondaryHref: "/marketplace",
  previewLabelKey: "forStreamersPreviewLabel",
  previewTitleKey: "forStreamersPreviewTitle",
  previewLeadKey: "forStreamersPreviewLead",
  cards: [
    {
      titleKey: "forStreamersCardDonationsTitle",
      textKey: "forStreamersCardDonationsText"
    },
    {
      titleKey: "forStreamersCardObsTitle",
      textKey: "forStreamersCardObsText"
    },
    {
      titleKey: "forStreamersCardCommerceTitle",
      textKey: "forStreamersCardCommerceText"
    }
  ],
  flow: [
    {
      labelKey: "forStreamersFlowPage",
      valueKey: "statusPublished",
      tone: "success"
    },
    {
      labelKey: "forStreamersFlowGoal",
      valueKey: "goalProgress",
      tone: "info"
    },
    {
      labelKey: "forStreamersFlowWidget",
      valueKey: "widgetConnected",
      tone: "held"
    }
  ]
};

export default function ForStreamersPage() {
  return <PublicLanding config={config} />;
}
