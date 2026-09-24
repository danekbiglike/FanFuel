import { PencilRenderer } from "./renderer.js";
import type { PencilScene } from "./model.js";

export type PencilPlayer = { render(seconds: number): void; play(): void; pause(): void; destroy(): void };

/** Canvas lifecycle with DPR, visibility, reduced motion and Save-Data controls. */
export function createPencilPlayer(canvas: HTMLCanvasElement, scene: PencilScene): PencilPlayer {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  const renderer = new PencilRenderer(scene);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const reduced = () => motion.matches || Boolean(connection?.saveData);
  let playing = false, visible = true, raf = 0, started = 0, elapsed = 0, last = -1;

  const render = (seconds: number) => {
    const width = canvas.clientWidth || scene.width;
    const height = canvas.clientHeight || scene.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    renderer.draw(ctx, seconds, { width, height, dpr, reducedMotion: reduced() });
  };
  const tick = (now: number) => {
    if (!playing) return;
    if (visible && document.visibilityState !== "hidden" && !reduced()) {
      elapsed = (now - started) / 1000;
      // Rig interpolation uses 30 Hz; boiling itself remains at the scene's lower rate.
      const bucket = Math.floor(elapsed * 30);
      if (bucket !== last) { render(elapsed); last = bucket; }
    }
    if (visible && document.visibilityState !== "hidden") raf = requestAnimationFrame(tick);
  };
  const play = () => {
    if (playing || reduced()) { render(elapsed); return; }
    playing = true;
    started = performance.now() - elapsed * 1000;
    if (visible && document.visibilityState !== "hidden") raf = requestAnimationFrame(tick);
  };
  const pause = () => { playing = false; cancelAnimationFrame(raf); };
  const onMotion = () => { if (reduced()) { pause(); render(0); } else render(elapsed); };
  const observer = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) {
      cancelAnimationFrame(raf);
      started = performance.now() - elapsed * 1000;
      render(elapsed);
      if (playing) raf = requestAnimationFrame(tick);
    } else cancelAnimationFrame(raf);
  });
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (playing && visible && document.visibilityState !== "hidden") {
      started = performance.now() - elapsed * 1000;
      raf = requestAnimationFrame(tick);
    }
  };
  const resize = new ResizeObserver(() => render(elapsed));
  observer.observe(canvas);
  resize.observe(canvas);
  motion.addEventListener("change", onMotion);
  document.addEventListener("visibilitychange", onVisibility);
  render(0);
  return {
    render,
    play,
    pause,
    destroy() { pause(); observer.disconnect(); resize.disconnect(); motion.removeEventListener("change", onMotion); document.removeEventListener("visibilitychange", onVisibility); }
  };
}
