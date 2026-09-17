"use client";

import { useEffect, useRef, useState } from "react";

export function TypingActionLabel({ label, alternate }: { label: string; alternate: string }) {
  const [text, setText] = useState(label);
  const [animating, setAnimating] = useState(false);
  const current = useRef(label);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;

    function display(value: string) {
      current.current = value;
      setText(value);
    }

    function finish() {
      clearTimeout(timer);
      display(label);
      setAnimating(false);
    }

    function type() {
      const letters = Array.from(label);
      const length = Array.from(current.current).length;
      display(letters.slice(0, length + 1).join(""));
      if (length + 1 < letters.length) timer = setTimeout(type, 38);
      else setAnimating(false);
    }

    function erase() {
      const letters = Array.from(current.current);
      display(letters.slice(0, -1).join(""));
      timer = setTimeout(letters.length > 1 ? erase : type, letters.length > 1 ? 22 : 100);
    }

    if (motion.matches || current.current === label) finish();
    else {
      setAnimating(true);
      timer = setTimeout(erase, 70);
    }
    motion.addEventListener("change", finish);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener("change", finish);
    };
  }, [label]);

  return (
    <span className="ff-typing-action-label" aria-hidden="true" data-animating={animating}>
      <span className="ff-typing-action-size">{label}</span>
      <span className="ff-typing-action-size">{alternate}</span>
      <span className="ff-typing-action-text">{text}</span>
    </span>
  );
}
