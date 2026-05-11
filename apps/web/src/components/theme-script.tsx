const themeCookieName = "fanfuel_theme_preference";
const themeStorageKey = "fanfuel_theme_preference";

const themeScript = `
(function () {
  try {
    var storageKey = "${themeStorageKey}";
    var cookieName = "${themeCookieName}";
    var preference = window.localStorage.getItem(storageKey);
    if (!/^(system|light|dark)$/.test(preference || "")) {
      var match = document.cookie.split(";").map(function (item) { return item.trim(); }).find(function (item) {
        return item.indexOf(cookieName + "=") === 0;
      });
      preference = match ? decodeURIComponent(match.slice(cookieName.length + 1)) : "system";
    }
    if (!/^(system|light|dark)$/.test(preference || "")) {
      preference = "system";
    }
    var resolved = preference === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themePreference = "system";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
