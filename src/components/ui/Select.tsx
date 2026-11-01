import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Extra classes for the wrapper, e.g. "flex-1 min-w-0" inside a flex row. */
  wrapperClassName?: string;
};

/**
 * Native <select> with the browser chrome removed, so keyboard, mobile and
 * typeahead still work but it matches the dark inputs.
 */
export function Select({ className = "", wrapperClassName = "", children, ...props }: Props) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...props}
        className={`h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-line bg-bg pr-9 pl-3 text-[13.5px] text-ink transition-colors duration-150 hover:border-white/20 focus:border-accent/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted"
      >
        <path
          d="M4 6.5L8 10.5L12 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
