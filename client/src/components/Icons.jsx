// Small inline-SVG icon set — keeps the app self-contained (no icon-font CDN).
// Each icon accepts standard SVG props (size via `size`, color inherits currentColor).

function base(children, { size = 18, ...props } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconStethoscope = (p) => base(
  <>
    <path d="M4 4v6a4 4 0 0 0 8 0V4" />
    <path d="M8 14v2a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
    <circle cx="4" cy="4" r="0" />
  </>, p);

export const IconPharmacy = (p) => base(
  <>
    <path d="M3 9l1-5h16l1 5" />
    <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M9 21v-6h6v6" />
  </>, p);

export const IconAdmin = (p) => base(
  <>
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
    <path d="M9 12l2 2 4-4" />
  </>, p);

export const IconMail = (p) => base(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </>, p);

export const IconLock = (p) => base(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>, p);

export const IconEye = (p) => base(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>, p);

export const IconGoogle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.07-1.48-.22-2.13H12v3.86h6.62c-.13 1.1-.86 2.76-2.47 3.87l-.02.15 3.6 2.79.25.02c2.29-2.11 3.54-5.22 3.54-8.56z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.78-2.94c-1.02.71-2.4 1.2-4.16 1.2-3.18 0-5.88-2.1-6.84-5l-.14.01-3.75 2.9-.05.14C3.24 21.3 7.28 24 12 24z" />
    <path fill="#FBBC05" d="M5.16 14.36A7.4 7.4 0 0 1 4.75 12c0-.82.14-1.62.4-2.36l-.01-.16-3.8-2.95-.13.06A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.36z" />
    <path fill="#EA4335" d="M12 4.75c2.25 0 3.77.97 4.64 1.78l3.39-3.31C17.94 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.21 6.64l3.94 3.06c.98-2.9 3.68-4.95 6.85-4.95z" />
  </svg>
);

export const IconBell = (p) => base(
  <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </>, p);

export const IconGear = (p) => base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.5.6.9.6H21a2 2 0 0 1 0 4h-.09c-.4 0-.76.24-.9.6z" />
  </>, p);

export const IconSearch = (p) => base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>, p);

export const IconPlus = (p) => base(<path d="M12 5v14M5 12h14" />, p);

export const IconTrash = (p) => base(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </>, p);

export const IconCheck = (p) => base(<path d="M20 6L9 17l-5-5" />, p);

export const IconCheckCircle = (p) => base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l2.5 2.5L16 9" />
  </>, p);

export const IconClipboard = (p) => base(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M9 12l2 2 4-4" />
  </>, p);

export const IconShield = (p) => base(
  <>
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
  </>, p);

export const IconArrowRight = (p) => base(<path d="M5 12h14M13 6l6 6-6 6" />, p);

export const IconDashboard = (p) => base(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>, p);

export const IconFile = (p) => base(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </>, p);

export const IconList = (p) => base(
  <>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </>, p);

export const IconChart = (p) => base(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 5-6" />
  </>, p);

export const IconHistory = (p) => base(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l4 2" />
  </>, p);

export const IconLogout = (p) => base(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>, p);

export const IconUser = (p) => base(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </>, p);

export const IconExport = (p) => base(
  <>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 21h14" />
  </>, p);
