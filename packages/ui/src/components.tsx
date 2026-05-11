import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "held" | "payout" | "refunded" | "disputed";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button className={cx("ff-icon-button", className)} aria-label={label} type={props.type ?? "button"} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("ff-input", className)} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ff-textarea", className)} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx("ff-select", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("ff-check-control", className)}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("ff-check-control", className)}>
      <input type="radio" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("ff-switch", className)}>
      <input type="checkbox" role="switch" {...props} />
      <span className="ff-switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Tabs({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-tabs", className)} role="tablist" {...props}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", className = "", children }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cx("ff-badge", `ff-badge-${tone}`, className)}>{children}</span>;
}

export function Tag({ className = "", children }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("ff-tag", className)}>{children}</span>;
}

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cx("ff-card", className)} {...props}>
      {children}
    </article>
  );
}

export function Panel({ className = "", children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cx("ff-panel", className)} {...props}>
      {children}
    </section>
  );
}

export function Modal({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="ff-modal-backdrop">
      <div className={cx("ff-modal", className)} role="dialog" aria-modal="true" {...props}>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <aside className={cx("ff-drawer", className)} {...props}>
      {children}
    </aside>
  );
}

export function Dropdown({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-dropdown", className)} {...props}>
      {children}
    </div>
  );
}

export function Tooltip({ children, content, className = "" }: HTMLAttributes<HTMLSpanElement> & { content: ReactNode }) {
  return (
    <span className={cx("ff-tooltip", className)}>
      {children}
      <span role="tooltip">{content}</span>
    </span>
  );
}

export function Alert({ tone = "info", className = "", children }: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div className={cx("ff-alert", `ff-alert-${tone}`, className)} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Toast({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-toast", className)} role="status" {...props}>
      {children}
    </div>
  );
}

export function Table({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-table", className)} role="table" {...props}>
      {children}
    </div>
  );
}

export function EmptyState({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-empty-state", className)} {...props}>
      {children}
    </div>
  );
}

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ff-skeleton", className)} aria-hidden="true" {...props} />;
}

export function Pagination({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cx("ff-pagination", className)} {...props}>
      {children}
    </nav>
  );
}

export function Breadcrumbs({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cx("ff-breadcrumbs", className)} {...props}>
      {children}
    </nav>
  );
}

export function StatCard({ label, value, meta }: { label: ReactNode; value: ReactNode; meta?: ReactNode }) {
  return (
    <article className="ff-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </article>
  );
}

export function ProductCard({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cx("ff-product-card", className)} {...props}>
      {children}
    </article>
  );
}

export function DonationCard({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cx("ff-donation-card", className)} {...props}>
      {children}
    </article>
  );
}

export function GoalCard({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cx("ff-goal-card", className)} {...props}>
      {children}
    </article>
  );
}

export function OrderStatusCard({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={cx("ff-order-status-card", className)} {...props}>
      {children}
    </article>
  );
}

export function DealTimeline({ children, className = "", ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={cx("ff-deal-timeline", className)} {...props}>
      {children}
    </ol>
  );
}

export function WidgetPreviewContainer({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-widget-preview", className)} {...props}>
      {children}
    </div>
  );
}

export function DashboardPanel({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cx("ff-dashboard-panel", className)} {...props}>
      {children}
    </section>
  );
}

export function UserMenu({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ff-user-menu", className)} {...props}>
      {children}
    </div>
  );
}

export function TopBar({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header className={cx("ff-topbar", className)} {...props}>
      {children}
    </header>
  );
}

export function Sidebar({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <aside className={cx("ff-sidebar", className)} {...props}>
      {children}
    </aside>
  );
}

export function MobileNav({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cx("ff-mobile-nav", className)} {...props}>
      {children}
    </nav>
  );
}
