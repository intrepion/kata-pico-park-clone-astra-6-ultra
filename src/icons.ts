const paths: Record<string, string> = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  sound:
    '<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l6 6m0-6-6 6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 1-2 3m0 3h.01"/>',
  key: '<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9m-5-5 3-3m0 6 3-3"/>',
  door: '<path d="M4 21V3h16v18M9 21V5l9-2v18zM14 12h.01M2 21h20"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m0-15a3 3 0 0 1 0 6m3 3a5 5 0 0 1 3 4v2"/>',
  leaf: '<path d="M20 3C7 2 2 8 5 15s17 5 15-12ZM4 21l11-11"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
};
export const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`;
export const cat = (color: string, cls = "") =>
  `<svg class="cat ${cls}" viewBox="0 0 36 40" aria-hidden="true"><path d="M4 4h8v5h12V4h8v29h-5v5h-7v-5h-5v5H8v-5H4Z" fill="${color}"/><path d="M10 16h4v6h-4zm13 0h4v6h-4z" fill="#263c35"/><path d="M16 25h6v3h-6z" fill="#263c35" opacity=".5"/></svg>`;
