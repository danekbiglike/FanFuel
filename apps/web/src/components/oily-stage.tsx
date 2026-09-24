"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { OilyArt } from "./brand-art";
import { useExperience } from "./experience-provider";

type OilyAnchor = "welcome" | "role" | "role-step";
type StageContext = { visit: (anchor: OilyAnchor) => void };
const Context = createContext<StageContext>({ visit: () => {} });

// Один экземпляр персонажа перемещается к якорям; новые реакции могут вызывать visit.
// eslint-disable-next-line react-refresh/only-export-components
export function useOilyStage() { return useContext(Context); }

export function OilyStage({ children, activeAnchor, sceneKey }: { children: ReactNode; activeAnchor: OilyAnchor; sceneKey: string }) {
  const { copy } = useExperience();
  const [anchor, setAnchor] = useState<OilyAnchor>(activeAnchor);
  const [position, setPosition] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [joke, setJoke] = useState(-1);
  const [hidden, setHidden] = useState(false);
  const frame = useRef(0);
  useEffect(() => { setAnchor(activeAnchor); }, [activeAnchor, sceneKey]);
  useEffect(() => {
    try { setHidden(sessionStorage.getItem("fanfuel_oily_hidden") === "1"); } catch { /* Необязательная настройка. */ }
  }, []);
  const measure = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-oily-anchor="${anchor}"]`);
      if (!target || !target.getClientRects().length) {
        setPosition((current) => ({ ...current, visible: false }));
        return;
      }
      const rect = target.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < innerHeight;
      setPosition({
        x: Math.min(Math.max(8, rect.left + rect.width / 2 - 44), innerWidth - 96),
        y: Math.min(Math.max(88, rect.top + rect.height / 2 - 44), innerHeight - 104),
        visible
      });
    });
  }, [anchor]);
  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    const target = document.querySelector<HTMLElement>(`[data-oily-anchor="${anchor}"]`);
    if (target) observer.observe(target);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      cancelAnimationFrame(frame.current);
    };
  }, [anchor, measure, sceneKey]);
  function hide(value: boolean) {
    setHidden(value);
    try { sessionStorage.setItem("fanfuel_oily_hidden", value ? "1" : "0"); } catch { /* Состояния страницы достаточно. */ }
  }
  return (
    <Context.Provider value={{ visit: setAnchor }}>
      {children}
      <aside className="fuel-oily-actor" aria-label={copy.oily.name} data-visible={position.visible} data-hidden={hidden} data-speaking={joke >= 0} style={{ left: position.x, top: position.y }}>
        {hidden ? (
          <button type="button" className="fuel-oily-return" onClick={() => hide(false)}>{copy.oily.show}</button>
        ) : (
          <>
            <button type="button" className="fuel-oily-figure" aria-label={copy.oily.action} onClick={() => setJoke((value) => (value + 1) % copy.oily.messages.length)}>
              <OilyArt pose={joke + 1} />
            </button>
            <div className="fuel-oily-speech" aria-live="polite">
              <p>{joke < 0 ? copy.oily.hello : copy.oily.messages[joke]}</p>
              <button type="button" className="fuel-text-button" onClick={() => hide(true)}>{copy.oily.hide}</button>
            </div>
          </>
        )}
      </aside>
    </Context.Provider>
  );
}
