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
