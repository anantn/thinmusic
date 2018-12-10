import firebase from "firebase";
const MusicKit = window.MusicKit;

const PROVIDERS = {
  "facebook.com": "Facebook",
  "google.com": "Google",
  "twitter.com": "Twitter"
};

class _Utils {
  constructor() {
    this.ICON_SIZE = 40;
    firebase.initializeApp({
      apiKey: "AIzaSyC7nu8-o3v1calJe35PtMUBmlMohchf5lE",
      authDomain: "auth.thinmusic.com",
      databaseURL: "https://thin-music.firebaseio.com",
      projectId: "thin-music",
      storageBucket: "thin-music.appspot.com",
      messagingSenderId: "1074915904459"
    });
    this.db = firebase.firestore();
    this.db.settings({ timestampsInSnapshots: true });
  }

  icon(artwork, width, height) {
    if (!artwork || !artwork.url) {
      artwork = {
        url:
          "https://is4-ssl.mzstatic.com/image/thumb/Features19/v4/50/f0/d1/50f0d1ac-cf2d-de77-c5c2-73a3170c098e/source/{w}x{h}bb.jpeg"
      };
    }
    return MusicKit.formatArtworkURL(
      artwork,
      width ? width : this.ICON_SIZE,
      height ? height : this.ICON_SIZE
    ).replace("{c}", "");
  }

  durationSeconds(num) {
    if (typeof num !== "number") return "";
    return (
      Math.floor(num / 60) +
      ":" +
      (num % 60 < 10 ? "0" : "") +
      Math.floor(num % 60)
    );
  }

  durationMilliseconds(num) {
    return this.durationSeconds(num / 1000);
  }

  providerName(user) {
    return user.providerData &&
      user.providerData[0] &&
      user.providerData[0].providerId in PROVIDERS
      ? PROVIDERS[user.providerData[0].providerId]
      : "Login Provider";
  }

  connectApple = (music, cb) => {
    let self = this;
    music.authorize().then(token => {
      if (token) {
        self
          .userRef()
          .get()
          .then(doc => {
            if (doc.exists) {
              self
                .userRef()
                .update({
                  apple: token
                })
                .then(() => {
                  if (cb) cb();
                });
            } else {
              self
                .userRef()
                .set({
                  apple: token
                })
                .then(() => {
                  if (cb) cb();
                });
            }
          });
      }
    });
  };

  userRef = () => {
    let user = firebase.auth().currentUser;
    if (!user) {
      return null;
    }
    return this.db.collection("users").doc(user.uid);
  };
}

let Utils = new _Utils();
export default Utils;
