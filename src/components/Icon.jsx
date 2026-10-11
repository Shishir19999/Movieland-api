const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  heart: <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.700 3.700 4.500 7 4.500c2 0 3.400 1 5 3 1.600-2 3-3 5-3 3.300 0 5.400 3.200 4.200 6.700-1.700 4.700-9.200 9.300-9.200 9.300z" />,
  bookmark: <path d="M6 3.500h12v17l-6-4.500-6 4.500z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800" /></>,
  moon: <path d="M20 14.500A8 8 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z" />,
  gear: <><path d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle cx="16" cy="7" r="2.500" /><circle cx="8" cy="17" r="2.500" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.500 4.500 4.500L19 7.500" />,
  trash: <path d="M4 7h16M9 7V4.500h6V7M6.500 7l1 13h9l1-13M10 11v5M14 11v5" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m15 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  grip: <><circle cx="9" cy="6" r="1.200" /><circle cx="15" cy="6" r="1.200" /><circle cx="9" cy="12" r="1.200" /><circle cx="15" cy="12" r="1.200" /><circle cx="9" cy="18" r="1.200" /><circle cx="15" cy="18" r="1.200" /></>,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  share: <><circle cx="6" cy="12" r="2.500" /><circle cx="17.500" cy="6" r="2.500" /><circle cx="17.500" cy="18" r="2.500" /><path d="m8.200 10.800 7-3.600M8.200 13.200l7 3.600" /></>,
  keyboard: <><rect x="2.500" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />,
  dice: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.500 8.500h.01M15.500 8.500h.01M12 12h.01M8.500 15.500h.01M15.500 15.500h.01" /></>,
  play: <path d="M8 5.500v13l11-6.500z" />,
  star: <path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z" />,
  eye: <><path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M3 3l18 18M10.600 6a9 9 0 0 1 1.400-.1c6.400 0 10 6.100 10 6.100a17 17 0 0 1-3.200 3.800M6.300 7.500A17 17 0 0 0 2 12s3.600 6.500 10 6.500c1.700 0 3.200-.4 4.500-1" /></>,
}

export default function Icon({ name, size = 20, fill = false }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
