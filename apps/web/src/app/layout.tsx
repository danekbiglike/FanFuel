import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeScript } from "../components/theme-script";
import { appLocale, dictionary } from "../lib/i18n";
import "./globals.css";

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
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
