// Volume preference. The slider position p is stored, not the gain, and mapped
// to gain with a cubic curve so the slider feels even (perceptual) instead of
// doing all its work in the top fifth.
const LS = window.localStorage;
const POS_KEY = "volume-pos";
const MUTED_KEY = "volume-muted";
const LEGACY_GAIN_KEY = "volume"; // linear gain written by older versions

export const toGain = p => (p <= 0 ? 0 : Math.pow(p, 3));
export const toPos = g => (g <= 0 ? 0 : Math.cbrt(g));

const clamp = v => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

function read(key) {
  try {
    return LS.getItem(key);
  } catch (e) {
    return null;
  }
}

function write(key, value) {
  try {
    LS.setItem(key, String(value));
  } catch (e) {}
}

export function loadVolume() {
  let pos = clamp(parseFloat(read(POS_KEY)));
  if (pos === null) {
    // Migrate the old linear gain so existing users keep their loudness.
    let legacy = clamp(parseFloat(read(LEGACY_GAIN_KEY)));
    pos = legacy === null ? 0.8 : toPos(legacy);
    write(POS_KEY, pos);
  }
  return { pos, muted: read(MUTED_KEY) === "1" };
}

export function saveVolume({ pos, muted }) {
  write(POS_KEY, pos);
  write(MUTED_KEY, muted ? "1" : "0");
}

// Apply the saved volume to MusicKit. MusicKit owns the audio element and
// re-applies music.volume on every track, so this is the only place volume is set.
export function applyVolume(music, { pos, muted }) {
  music.volume = muted ? 0 : toGain(pos);
}
