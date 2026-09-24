import type { Metadata } from "next";
import { AppTopBar } from "../../components/app-chrome";
import { ExperienceFooter } from "../../components/experience-footer";
import { RolePresentation } from "../../components/role-presentation";
import { dictionary } from "../../lib/i18n";
// Next.js требует экспорт metadata из серверного модуля страницы.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: dictionary.experience.roles.creator.title + " — FanFuel",
  description: dictionary.experience.roles.creator.lead,
  robots: { index: true, follow: true }
};
export default function RolePage() {
  return (
    <main className="ff-page fuel-page">
      <AppTopBar />
      <div className="fuel-wrap fuel-standalone">
        <RolePresentation audience="creator" />
        <ExperienceFooter />
      </div>
    </main>
  );
}
