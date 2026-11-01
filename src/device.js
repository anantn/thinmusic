// Minimal device checks (replaces react-device-detect).
const ua = navigator.userAgent || "";

export const isAndroid = /Android/i.test(ua);
export const isIOS =
  /iPhone|iPad|iPod/i.test(ua) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isMobile =
  (navigator.userAgentData && navigator.userAgentData.mobile) ||
  isAndroid ||
  isIOS ||
  /Mobi/i.test(ua);
// Chromium-based browsers (Chrome, Edge, Brave, ...). Web Audio routing of
// MusicKit's media element is only known to work there; elsewhere it can
// silence playback.
export const isChrome =
  !!(navigator.userAgentData &&
    navigator.userAgentData.brands.some(b => /Chromium/.test(b.brand))) ||
  /Chrome\//.test(ua);
