import { createPencilPlayer, type PencilPlayer } from "../src/index.js";
import { mascotScene, writingScene } from "./scene.js";
import { messages } from "./locales.js";
import "./style.css";

const locale = navigator.language.startsWith("ru") ? "ru" : "en";
const copy = messages[locale];
for (const key of ["eyebrow", "title", "subtitle", "mascot", "writing", "play", "pause", "reset", "note"] as const) {
  document.getElementById(key)!.textContent = copy[key];
}
document.title = copy.title;
document.getElementById("study-link")!.textContent = copy.studyLink;
document.getElementById("scale-label")!.textContent = copy.scale;
const canvas = document.getElementById("stage") as HTMLCanvasElement;
canvas.setAttribute("aria-label", copy.preview);
const themeButton = document.getElementById("theme") as HTMLButtonElement;
let theme: "light" | "dark" = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === "light" ? copy.themeDark : copy.themeLight;
  themeButton.setAttribute("aria-pressed", String(theme === "dark"));
}
themeButton.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; applyTheme(); });
applyTheme();
const slider = document.getElementById("scale") as HTMLInputElement;
let player: PencilPlayer;
let mode: "mascot" | "writing" = "mascot";

function select(next: "mascot" | "writing") {
  player?.destroy();
  mode = next;
  for (const id of ["mascot", "writing"] as const) {
    document.getElementById(id)!.setAttribute("aria-pressed", String(id === mode));
  }
  player = createPencilPlayer(canvas, mode === "mascot" ? mascotScene : writingScene);
  player.play();
}

document.getElementById("mascot")!.addEventListener("click", () => select("mascot"));
document.getElementById("writing")!.addEventListener("click", () => select("writing"));
document.getElementById("play")!.addEventListener("click", () => player.play());
document.getElementById("pause")!.addEventListener("click", () => player.pause());
document.getElementById("reset")!.addEventListener("click", () => select(mode));
slider.addEventListener("input", () => {
  canvas.style.width = `${slider.value}px`;
  document.getElementById("scale-value")!.textContent = `${slider.value} px`;
});
canvas.style.width = `${slider.value}px`;
select("mascot");
