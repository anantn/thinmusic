import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const MusicKit = window.MusicKit;
const Fetch = window.fetch;
const EUC = window.encodeURIComponent;

class _Utils {
  constructor() {
    this.ICON_SIZE = 40;
    this.MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
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

  durationListFormat(count, total) {
    return count + " songs • " + Math.round(total / 60000) + " minutes long";
  }

  formatDate(iso) {
    let d = new Date(iso);
    return (
      this.MONTHS[d.getMonth()].slice(0, 3) +
      " " +
      d.getDate() +
      ", " +
      d.getFullYear()
    );
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

  scrobble = (key, now, item, start) => {
    if (!key || !item || !item.attributes) {
      return;
    }

    let path = "scrobble";
    if (now) {
      path = "now";
    }
    let url =
      "https://us-central1-thin-music.cloudfunctions.net/tmlfm/" +
      path +
      "?sk=" +
      EUC(key) +
      "&track=" +
      EUC(item.attributes.name) +
      "&artist=" +
      EUC(item.attributes.artistName) +
      "&album=" +
      EUC(item.attributes.albumName);
    if (item.attributes.durationInMillis) {
      url +=
        "&duration=" + EUC(Math.floor(item.attributes.durationInMillis / 1000));
    }
    if (start) {
      url += "&timestamp=" + EUC(start);
    }
    Fetch(url);
  };

  connectLastFMToken = cb => {
    // Open popup now so it is on main thread.
    let win = window.open(
      "https://auth.thinmusic.com/blank.html",
      "window",
      "toolbar=no, menubar=no, resizable=yes, width=600, height=600"
    );
    Fetch("https://us-central1-thin-music.cloudfunctions.net/tmlfm/token")
      .then(resp => {
        if (!resp.ok || resp.status !== 200) {
          throw resp;
        }
        return resp.json();
      })
      .then(json => {
        win.location = json.url;
        if (cb) {
          cb(json.token, null);
        }
      })
      .catch(err => {
        if (cb) {
          cb(null, err);
        }
      });
  };

  connectLastFMSession = (token, cb) => {
    let self = this;
    Fetch(
      "https://us-central1-thin-music.cloudfunctions.net/tmlfm/session?token=" +
        token
    )
      .then(resp => {
        if (!resp.ok || resp.status !== 200) {
          throw resp;
        }
        return resp.json();
      })
      .then(json => {
        self
          .setOrUpdate({ lastfm: json.session })
          .then(() => {
            if (cb) {
              cb(json, null);
            }
          })
          .catch(err => {
            if (cb) {
              cb(null, err);
            }
          });
      })
      .catch(err => {
        if (cb) {
          cb(null, err);
        }
      });
  };

  connectApple = (music, cb) => {
    let self = this;
    music
      .authorize()
      .then(token => {
        if (!token) {
          if (cb) cb(null, "Could not authorize Apple Music!");
        } else {
          self
            .setOrUpdate({
              apple: token
            })
            .then(() => {
              if (cb) {
                cb(token, null);
              }
            })
            .catch(err => {
              if (cb) {
                cb(null, err);
              }
            });
        }
      })
      .catch(error => {
        if (cb) cb(null, error);
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

  setOrUpdate = obj => {
    let self = this;
    return this.userRef()
      .get()
      .then(doc => {
        if (doc.exists) {
          return self.userRef().update(obj);
        } else {
          return self.userRef().set(obj);
        }
      });
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
