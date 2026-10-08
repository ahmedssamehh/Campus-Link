import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Staggered entrance for list/grid items. Pass the item's index; the delay is capped so
 * long lists never feel slow. Pure CSS (see .reveal in index.css), so it costs nothing at rest.
 */
export const Reveal = ({ index = 0, as: Tag = 'div', className = '', style, children, ...rest }) => (
  <Tag className={`reveal ${className}`} style={{ '--reveal-delay': `${Math.min(index, 10) * 45}ms`, ...style }} {...rest}>
    {children}
  </Tag>
);

/** Animates a number from its previous value to the new one (ease-out, ~700ms). */
export const useCountUp = (value, duration = 700) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(prefersReducedMotion() ? target : 0);
  const fromRef = useRef(display);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      fromRef.current = target;
      return undefined;
    }
    const from = fromRef.current;
    if (from === target) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      setDisplay(next);
      fromRef.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
};

export const CountUp = ({ value, className }) => {
  const n = useCountUp(value);
  return <span className={`tabular-nums ${className || ''}`}>{n.toLocaleString()}</span>;
};

/**
 * Segmented control with a sliding selection pill. Options: [{ value, label, count? }].
 * The pill animates transform/width only, from wherever it currently is.
 */
export const SegmentedControl = ({ options, value, onChange, className = '', size = 'md', ariaLabel }) => {
  const trackRef = useRef(null);
  const itemRefs = useRef({});
  const [pill, setPill] = useState(null);

  const measure = useCallback(() => {
    const el = itemRefs.current[value];
    if (!el || !trackRef.current) return;
    setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, options]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const pad = size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3.5 py-1.5 text-[13px]';

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex max-w-full overflow-x-auto rounded-[10px] bg-black/[0.05] p-0.5 no-scrollbar ${className}`}
    >
      {pill && (
        <span
          aria-hidden
          className="segmented-pill absolute bottom-0.5 left-0 top-0.5 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              itemRefs.current[o.value] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative z-[1] flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-200 ${pad} ${
              active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && (
              <span className={`tabular-nums ${active ? 'text-gray-500' : 'text-gray-400'}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Modal sheet: dims and blurs the page, panel scales up from 96%. Exits faster than it enters.
 * Escape and backdrop click dismiss (unless `busy`).
 */
export const Modal = ({ open, onClose, title, description, children, footer, size = 'md', busy = false }) => {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setLeaving(true);
    const t = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, prefersReducedMotion() ? 0 : 160);
    return () => clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !busy && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!mounted) return null;

  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }[size] || 'max-w-md';

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4 ${leaving ? 'modal-scrim-out' : 'modal-scrim-in'}`}
      onMouseDown={() => !busy && onClose?.()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative w-full ${width} max-h-[90dvh] overflow-y-auto rounded-t-[22px] bg-white shadow-2xl outline-none sm:rounded-[22px] ${
          leaving ? 'modal-panel-out' : 'modal-panel-in'
        }`}
      >
        {(title || description) && (
          <div className="px-6 pb-2 pt-6">
            {title && <h2 className="text-[19px] font-semibold text-gray-900">{title}</h2>}
            {description && <p className="mt-1 text-[15px] text-gray-500">{description}</p>}
          </div>
        )}
        {children ? <div className="px-6 py-4">{children}</div> : <div className="h-2" />}
        {footer && <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/** Consistent buttons for modals and toolbars. */
export const Button = ({ variant = 'secondary', className = '', children, ...rest }) => {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    tinted: 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/15',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    'danger-tinted': 'bg-red-500/10 text-red-600 hover:bg-red-500/15',
    ghost: 'text-gray-600 hover:bg-black/[0.05] hover:text-gray-900',
  }[variant];
  return (
    <button
      type="button"
      className={`press inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

/** Shimmering placeholder block. */
export const Shimmer = ({ className = '', ...rest }) => <div className={`skeleton rounded-md ${className}`} aria-hidden {...rest} />;
