import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeScript } from "../components/theme-script";
import { appLocale, dictionary } from "../lib/i18n";
import "./globals.css";
import "./experience.css";
import "./editorial.css";
import "./commerce.css";
import { ExperienceProvider } from "../components/experience-provider";

export const metadata: Metadata = {
  title: dictionary.common.projectName,
  description: dictionary.common.webHomeDescription
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={appLocale}
      data-theme="light"
      data-theme-preference="system"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/fonts/golos.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <ExperienceProvider>{children}</ExperienceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
