"use client";
import { useEffect, useState } from "react";
import { OilyArt } from "./brand-art";
import { useExperience } from "./experience-provider";
export function Oily() {
  const { copy } = useExperience();
  const [joke, setJoke] = useState(-1);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem("fanfuel_oily_hidden") === "1");
    } catch {
      /* Необязательная настройка. */
    }
  }, []);
  function hide(value: boolean) {
    setHidden(value);
    try {
      sessionStorage.setItem("fanfuel_oily_hidden", value ? "1" : "0");
    } catch {
      /* Достаточно состояния страницы. */
    }
  }
  return (
    <aside className="fuel-oily" aria-label={copy.oily.name}>
      {hidden ? (
        <button type="button" className="fuel-text-button" onClick={() => hide(false)}>
          {copy.oily.show}
        </button>
      ) : (
        <>
          <button
            className="fuel-oily-character"
            type="button"
            aria-label={copy.oily.action}
            onClick={() => setJoke((value) => (value + 1) % copy.oily.messages.length)}
          >
            <OilyArt pose={joke + 1} />
          </button>
          <div>
            <span className="fuel-hand">{copy.oily.caption}</span>
            <p aria-live="polite">{joke < 0 ? copy.oily.hello : copy.oily.messages[joke]}</p>
            <button type="button" className="fuel-text-button" onClick={() => hide(true)}>
              {copy.oily.hide}
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
