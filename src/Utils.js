const MusicKit = window.MusicKit;

export const ICON_SIZE = 40;

export function icon(artwork, width, height) {
  if (!artwork || !artwork.url) {
    artwork = {
      url:
        "https://is4-ssl.mzstatic.com/image/thumb/Features19/v4/50/f0/d1/50f0d1ac-cf2d-de77-c5c2-73a3170c098e/source/{w}x{h}bb.jpeg"
    };
  }
  return MusicKit.formatArtworkURL(
    artwork,
    width ? width : ICON_SIZE,
    height ? height : ICON_SIZE
  ).replace("{c}", "");
}

export function durationSeconds(num) {
  if (typeof num !== "number") return "";
  return (
    Math.floor(num / 60) +
    ":" +
    (num % 60 < 10 ? "0" : "") +
    Math.floor(num % 60)
  );
}

export function durationMilliseconds(num) {
  return durationSeconds(num / 1000);
}
