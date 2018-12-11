import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const MusicKit = window.MusicKit;

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

  login = cb => {
    let provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope("public_profile");
    provider.addScope("email");
    provider.setCustomParameters({ display: "popup" });
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(result => {
        if (cb) cb(result, null);
        return false;
      })
      .catch(error => {
        if (cb) cb(null, error);
        return false;
      });
  };

  logout = cb => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        if (cb) cb();
      })
      .catch(error => {
        if (cb) cb(null, error);
      });
  };

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

  disconnectApple = cb => {
    let ref = Utils.userRef();
    if (ref) {
      ref
        .update({
          apple: firebase.firestore.FieldValue.delete()
        })
        .then(() => {
          if (cb) cb();
        });
    }
    if (cb) {
      process.nextTick(cb);
    }
  };

  userRef = () => {
    let user = firebase.auth().currentUser;
    if (!user) {
      return null;
    }
    return this.db.collection("users").doc(user.uid);
  };

  userName = () => {
    let user = firebase.auth().currentUser;
    if (!user) {
      return null;
    }
    return user.displayName.split(" ")[0];
  };

  addAuthObserver = cb => {
    return firebase.auth().onAuthStateChanged(cb);
  };

  // Verify token by trying to fetch one.
  isReallyLoggedIn = music => {
    return music.api
      .recentPlayed({ limit: 1 })
      .then(() => true)
      .catch(() => false);
  };
}

let Utils = new _Utils();
export default Utils;
