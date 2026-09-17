"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type SelectHTMLAttributes,
  type ReactElement
} from "react";
import { createPortal } from "react-dom";

export function Select({
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState("");
  const [uncontrolled, setUncontrolled] = useState(String(props.defaultValue ?? ""));
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 280,
    transform: "none"
  });
  const search = useRef({ text: "", time: 0 });
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const option = child as ReactElement<{
        value?: string | number;
        children?: string | number;
        disabled?: boolean;
      }>;
      return {
        value: String(option.props.value ?? option.props.children ?? ""),
        text: String(option.props.children ?? ""),
        disabled: Boolean(option.props.disabled)
      };
    });
  const value = String(props.value ?? uncontrolled);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  useEffect(() => {
    setLabel(native.current?.closest("label")?.querySelector("span")?.textContent ?? "");
  }, [children]);

  useEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(280, Math.max(96, below >= 160 || below >= above ? below : above));
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
        top: below >= 160 || below >= above ? rect.bottom + 6 : rect.top - 6,
        transform: below >= 160 || below >= above ? "none" : "translateY(-100%)",
        width: Math.min(rect.width, window.innerWidth - 16),
        maxHeight: height
      });
    }
    function outside(event: PointerEvent) {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !list.current?.contains(event.target as Node)
      )
        setOpen(false);
    }
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  useEffect(() => {
    if (open)
      list.current
        ?.querySelector(`#${CSS.escape(id)}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled || !native.current) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    setter?.call(native.current, option.value);
    setUncontrolled(option.value);
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    trigger.current?.focus();
  }

  if (props.multiple || (props.size ?? 0) > 1)
    return (
      <select {...props} className={`ff-select ${className}`}>
        {children}
      </select>
    );

  return (
    <span className="ff-select-shell">
      <button
        ref={trigger}
        type="button"
        role="combobox"
        className={`ff-select-trigger ${className}`}
        disabled={props.disabled}
        aria-label={props["aria-label"] ?? label}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => {
          setActive(selected);
          setOpen(!open);
        }}
        onBlur={(event) => {
          if (!list.current?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" || event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else {
              setActive(selected);
              setOpen(true);
            }
            return;
          }
          const enabled = options
            .map((option, index) => (option.disabled ? -1 : index))
            .filter((index) => index >= 0);
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const cursor = enabled.indexOf(open ? active : selected);
            const next =
              event.key === "Home"
                ? enabled[0]
                : event.key === "End"
                  ? enabled.at(-1)
                  : enabled[
                      (cursor + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) %
                        enabled.length
                    ];
            if (next !== undefined) {
              setActive(next);
              setOpen(true);
            }
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const now = Date.now();
            search.current = {
              text:
                (now - search.current.time < 600 ? search.current.text : "") +
                event.key.toLocaleLowerCase(),
              time: now
            };
            const next = options.findIndex(
              (option) =>
                !option.disabled && option.text.toLocaleLowerCase().startsWith(search.current.text)
            );
            if (next >= 0) {
              setActive(next);
              setOpen(true);
            }
          }
        }}
      >
        <span>{options[selected]?.text ?? ""}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <select
        {...props}
        ref={native}
        hidden
        className="ff-select-native"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          setUncontrolled(event.target.value);
          props.onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          trigger.current?.focus();
          props.onInvalid?.(event);
        }}
      >
        {children}
      </select>
      {open &&
        createPortal(
          <div
            ref={list}
            id={`${id}-list`}
            className="ff-select-list"
            role="listbox"
            aria-label={props["aria-label"] ?? label}
            style={position}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === selected}
                aria-disabled={option.disabled}
                data-active={index === active}
                className="ff-select-option"
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => {
                  if (!option.disabled) setActive(index);
                }}
                onClick={() => choose(index)}
              >
                <span>{option.text}</span>
                <span aria-hidden="true">{index === selected ? "✓" : ""}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </span>
  );
}
