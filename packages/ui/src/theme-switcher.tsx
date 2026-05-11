import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { ThemePreference } from "./theme";

export interface ThemeSwitcherLabels {
  appearance: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  themeSystemDescription?: string;
}

export interface ThemeSwitcherProps {
  preference: ThemePreference;
  labels: ThemeSwitcherLabels;
  onChange: (preference: ThemePreference) => void;
  className?: string;
  compact?: boolean;
}

const options: Array<{ value: ThemePreference; icon: string; labelKey: keyof ThemeSwitcherLabels }> = [
  { value: "system", icon: "OS", labelKey: "themeSystem" },
  { value: "light", icon: "LT", labelKey: "themeLight" },
  { value: "dark", icon: "DK", labelKey: "themeDark" }
];

export function ThemeSwitcher({ preference, labels, onChange, className = "", compact = false }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.value === preference) ?? options[0];

  function selectPreference(nextPreference: ThemePreference) {
    onChange(nextPreference);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      className={`ff-theme-switcher ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <button
        className="ff-theme-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={labels.appearance}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="ff-theme-icon" aria-hidden="true">
          {current.icon}
        </span>
        <span className={compact ? "ff-sr-only" : "ff-theme-label"}>{labels.appearance}</span>
        <span className="ff-theme-value">{String(labels[current.labelKey])}</span>
      </button>

      {isOpen ? (
        <div className="ff-theme-menu" role="listbox" aria-label={labels.appearance} tabIndex={-1}>
          {options.map((option) => {
            const isSelected = option.value === preference;
            return (
              <button
                className="ff-theme-option"
                type="button"
                role="option"
                aria-selected={isSelected}
                key={option.value}
                onClick={() => selectPreference(option.value)}
              >
                <span className="ff-theme-option-mark" aria-hidden="true">
                  {isSelected ? "on" : ""}
                </span>
                <span className="ff-theme-option-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span>{String(labels[option.labelKey])}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
