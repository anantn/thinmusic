import React from "react";
import { createRoot } from "react-dom/client";
import { isMobile, isAndroid, isIOS } from "./device";
import { FocusStyleManager } from "@blueprintjs/core";

import "normalize.css/normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import "./s/index.css";
import Preview from "./i/Preview.png";
import { loadVolume, applyVolume } from "./volume";

// MusicKit comes from Apple's CDN. Wait for it (with a timeout) before loading
// the app, since several modules read window.MusicKit when they load.
function musicKitReady(timeoutMs = 20000) {
  if (window.MusicKit) return Promise.resolve(window.MusicKit);
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject(new Error("MusicKit did not load")), timeoutMs);
    document.addEventListener("musickitloaded", () => {
      clearTimeout(timer);
      resolve(window.MusicKit);
    }, { once: true });
  });
}

function showLoadError() {
  let el = document.getElementById("loader");
  if (el) {
    el.querySelector("p:last-child").textContent =
      "Apple Music couldn't be reached. Check your connection or ad blocker and reload.";
  }
}

const root = createRoot(document.getElementById("root"));

async function main(rm) {
  FocusStyleManager.onlyShowFocusOnTabs();
  let MusicKit;
  try {
    MusicKit = await musicKitReady();
  } catch (e) {
    console.error(e);
    showLoadError();
    return;
  }
  await MusicKit.configure({
    developerToken: import.meta.env.VITE_MUSICKIT_TOKEN,
    app: {
      name: "ThinMusic",
      build: "0.1"
    }
  });
  // Set the saved volume before anything can play, so tracks never start loud.
  applyVolume(MusicKit.getInstance(), loadVolume());
  const { default: App } = await import("./App");
  root.render(<App />);
  if (rm) {
    remove();
  }
}

function remove() {
  let el = document.getElementById("loader");
  el.parentElement.removeChild(el);
}

if (isMobile) {
  let badge = "";
  if (isAndroid) {
    badge = (
      <a href="https://play.google.com/store/apps/details?id=com.apple.android.music&hl=en_US&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1">
        <img
          style={{ padding: "10px", height: "100px" }}
          alt="Get it on Google Play"
          src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
        />
      </a>
    );
  }
  if (isIOS) {
    badge = (
      <a href="https://itunes.apple.com/us/app/apple-music/id1108187390?mt=8">
        <img
          style={{ padding: "10px", height: "80px" }}
          alt="Download on the App Store"
          src="https://linkmaker.itunes.apple.com/en-us/badge-lrg.svg?releaseDate=2016-05-23&kind=iossoftware&bubble=ios_apps"
        />
      </a>
    );
  }
  root.render(
    <div>
      <img
        alt="ThinMusic Preview"
        style={{
          width: "300px",
          marginTop: "20px",
          marginBottom: "20px"
        }}
        src={Preview}
      />
      <p style={{ paddingTop: "25px" }}>
        ThinMusic is optimized for desktop web browsers.
      </p>
      <p>We recommend you use the native Apple Music apps on mobile devices.</p>
      <div>{badge}</div>
      <div>
        <p>
          <span onClick={() => main(false)} className="continue">
            Continue Anyway
          </span>
        </p>
        <p>
          Beware the layout is suboptimal on mobile, hold your phone in
          landscape mode for better results.
        </p>
        <p>Some features may not work as intended.</p>
      </div>
    </div>
  );
  remove();
} else {
  main(true);
}
