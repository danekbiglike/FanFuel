import type { Metadata } from "next";
import { dictionary } from "../../lib/i18n";
import { FuelMatch } from "./fuel-match";

// Route metadata is intentionally colocated with the Next.js page.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: `${dictionary.common["gaming.title"]} · ${dictionary.common.projectName}`,
  description: dictionary.common["gaming.subtitle"]
};

export default function GamingPage() {
  return <FuelMatch />;
}
