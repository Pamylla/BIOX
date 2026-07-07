import type { ReactNode, SVGAttributes } from "react";

/**
 * Icon registry — every distinct icon extracted from the design prototype
 * (docs/03-design/prototype-source.html), deduplicated and named by role.
 * Stroke icons inherit `currentColor`; `filled` entries paint instead of
 * stroking; `google` carries its own brand fills.
 */
interface IconDef {
  viewBox: string;
  node: ReactNode;
  filled?: boolean;
  strokeWidth?: number;
}

const ICONS = {
  /** BIOX logo mark — rising line with end dot. */
  logo: {
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    node: (
      <>
        <path d="M3 15.5 L9 10 L13 13 L21 4.5" />
        <circle cx="21" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
  /** Trend line over a baseline (login: track biomarkers). */
  chart: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M1.5 12 5 8l3 2 6.5-7" />
        <path d="M1.5 14.5h13" />
      </>
    ),
  },
  /** Dial (login: deterministic scores; scores nav). */
  gauge: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 8l3-2.4" />
      </>
    ),
  },
  /** Four-point star — the AI marker, always paired with the ai color. */
  sparkle: {
    viewBox: "0 0 16 16",
    filled: true,
    node: <path d="M8 1l1.5 4.2L14 7l-4.5 1.8L8 13l-1.5-4.2L2 7l4.5-1.8z" />,
  },
  /** Google brand logo (login button). Fixed brand colors. */
  google: {
    viewBox: "0 0 18 18",
    filled: true,
    node: (
      <>
        <path
          fill="#4285F4"
          d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"
        />
        <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
        <path
          fill="#EA4335"
          d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.1 6.6 3.6 9 3.6z"
        />
      </>
    ),
  },
  /** Four tiles (sidebar: Dashboard). */
  dashboard: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      </>
    ),
  },
  /** Line with three dots (sidebar: Timeline). */
  timeline: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M1.5 8h13" />
        <circle cx="4" cy="8" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="8.5" cy="8" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="13" cy="8" r="1.8" fill="currentColor" stroke="none" />
      </>
    ),
  },
  /** Droplet (sidebar: Biomarkers). */
  droplet: {
    viewBox: "0 0 16 16",
    node: <path d="M8 1.5s5 5.5 5 8.5a5 5 0 0 1-10 0c0-3 5-8.5 5-8.5z" />,
  },
  /** Arrow out of a tray (sidebar: Upload). */
  upload: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M8 10.5V2.5" />
        <path d="M5 5.5 8 2.5l3 3" />
        <path d="M2.5 10v3.5h11V10" />
      </>
    ),
  },
  /** Slider knobs (sidebar: Settings). */
  sliders: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M2 5h6M12 5h2M2 11h2M8 11h6" />
        <circle cx="10" cy="5" r="1.9" />
        <circle cx="6" cy="11" r="1.9" />
      </>
    ),
  },
  chevronRight: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.6,
    node: <path d="M6 4l4 4-4 4" />,
  },
  chevronDown: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.6,
    node: <path d="M4 6l4 4 4-4" />,
  },
  chevronLeft: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.8,
    node: <path d="M10 4L6 8l4 4" />,
  },
  search: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <circle cx="7" cy="7" r="5" />
        <path d="M11 11l3.5 3.5" />
      </>
    ),
  },
  plus: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.8,
    node: <path d="M2 8h12M8 2v12" />,
  },
  plusSmall: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.8,
    node: <path d="M8 3v10M3 8h10" />,
  },
  /** Tiny rising line (activity feed). */
  trendSmall: {
    viewBox: "0 0 12 12",
    strokeWidth: 1.6,
    node: <path d="M2 8l3-3 2 2 3-4" />,
  },
  /** Rising line without baseline. */
  trendBare: {
    viewBox: "0 0 16 16",
    node: <path d="M1.5 12 5 8l3 2 6.5-7" />,
  },
  check: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.8,
    node: <path d="M3 8.5l3.5 3.5L13 4" />,
  },
  /** Bare exclamation mark (attention rows). */
  exclaim: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.8,
    node: <path d="M8 3v6M8 12h.01" />,
  },
  infoCircle: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 7.5v3.5M8 5h.01" />
      </>
    ),
  },
  /** Large upload arrow into a tray (dropzone). */
  uploadTray: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.7,
    node: (
      <>
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      </>
    ),
  },
  /** Document with folded corner. */
  file: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M4 1.5h5l3 3v10H4z" />
        <path d="M9 1.5V5h3" />
      </>
    ),
  },
  /** Document outline without the fold detail. */
  fileBlank: {
    viewBox: "0 0 16 16",
    node: <path d="M4 1.5h5l3 3v10H4z" />,
  },
  /** Square document with text lines (export). */
  fileText: {
    viewBox: "0 0 16 16",
    node: (
      <>
        <path d="M2.5 2.5h11v11h-11z" />
        <path d="M5 6h6M5 9h4" />
      </>
    ),
  },
  pencil: {
    viewBox: "0 0 16 16",
    node: <path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z" />,
  },
  /** Angle brackets — the "Computed in code" tag. */
  code: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.6,
    node: <path d="M6 5L2 8l4 3M10 5l4 3-4 3" />,
  },
  signOut: {
    viewBox: "0 0 16 16",
    strokeWidth: 1.6,
    node: <path d="M6 2H3v12h3M10 11l3-3-3-3M13 8H6" />,
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** All registered icon names — the playground renders the full set from this. */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

interface IconProps extends SVGAttributes<SVGSVGElement> {
  name: IconName;
  /** Rendered width/height in px. */
  size?: number;
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
  const def: IconDef = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox={def.viewBox}
      fill={def.filled ? "currentColor" : "none"}
      stroke={def.filled ? undefined : "currentColor"}
      strokeWidth={def.filled ? undefined : (def.strokeWidth ?? 1.5)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {def.node}
    </svg>
  );
}
