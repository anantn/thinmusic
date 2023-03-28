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
      apiKey: process.env.REACT_APP_FIREBASE_TOKEN,
      authDomain: "apple-thinmusic.firebaseapp.com",
      projectId: "apple-thinmusic",
      storageBucket: "apple-thinmusic.appspot.com",
      messagingSenderId: "694059640396",
      appId: "1:694059640396:web:075505cc9e17a3a43f76e9"
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
    let s = "songs";
    if (count === 1) {
      s = "song";
    }
    let m = "minutes";
    let v = Math.round(total / 60000);
    if (v === 1) {
      m = "minute";
    }
    return count + " " + s + " • " + v + " " + m + " long";
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

  loginMethods = email => {
    return firebase.auth().fetchSignInMethodsForEmail(email);
  };

  login = (provider, cb) => {
    let providerObj = null;
    switch (provider) {
      case "Google":
        providerObj = new firebase.auth.GoogleAuthProvider();
        providerObj.addScope("profile");
        providerObj.addScope("email");
        break;
      case "Twitter":
        providerObj = new firebase.auth.TwitterAuthProvider();
        break;
      case "Facebook":
        providerObj = new firebase.auth.FacebookAuthProvider();
        providerObj.addScope("public_profile");
        providerObj.addScope("email");
        break;
      default:
        break;
    }
    if (!providerObj) {
      cb(null, "Invalid provider");
      return;
    }

    providerObj.setCustomParameters({ display: "popup" });

    let user = firebase.auth().currentUser;
    if (user && user.isAnonymous) {
      user
        .linkWithPopup(providerObj)
        .then(result => {
          window.location.reload();
        })
        .catch(error => {
          if (cb) cb(null, error);
          return false;
        });
    } else {
      firebase
        .auth()
        .signInWithPopup(providerObj)
        .then(result => {
          if (cb) cb(result, null);
          return false;
        })
        .catch(error => {
          if (cb) cb(null, error);
          return false;
        });
    }
  };

  loginAnonymously = () => {
    return firebase.auth().signInAnonymously();
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
      "https://us-central1-apple-thinmusic.cloudfunctions.net/tmlfm/" +
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
    Fetch("https://us-central1-apple-thinmusic.cloudfunctions.net/tmlfm/token")
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
      "https://us-central1-apple-thinmusic.cloudfunctions.net/tmlfm/session?token=" +
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

  disconnectSocial = provider => {
    switch (provider) {
      case "Google":
        window.open("https://myaccount.google.com/permissions");
        break;
      case "Twitter":
        window.open("https://twitter.com/settings/sessions");
        break;
      case "Facebook":
        window.open("https://www.facebook.com/settings?tab=applications");
        break;
      default:
        break;
    }
  };

  disconnectLastFM = cb => {
    if (cb && typeof cb !== "function") {
      cb = null;
    }

    let ref = Utils.userRef();
    if (ref) {
      ref
        .update({
          lastfm: firebase.firestore.FieldValue.delete()
        })
        .then(() => {
          if (cb) cb();
        });
    } else if (cb) {
      process.nextTick(cb);
    }
  };

  disconnectApple = cb => {
    if (cb && typeof cb !== "function") {
      cb = null;
    }

    let ref = Utils.userRef();
    if (ref) {
      ref
        .update({
          apple: firebase.firestore.FieldValue.delete()
        })
        .then(() => {
          if (cb) cb();
        });
    } else if (cb) {
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
    if (!user.displayName) {
      return "Anonymous";
    }
    return user.displayName.split(" ")[0];
  };

  userProvider = () => {
    let self = this;
    let user = firebase.auth().currentUser;
    if (!user) {
      return null;
    }
    if (
      user.providerData &&
      user.providerData.length > 0 &&
      user.providerData[0].providerId
    ) {
      return self.domainToProvider(user.providerData[0].providerId);
    }
    return null;
  };

  domainToProvider = domain => {
    switch (domain) {
      case "google.com":
        return "Google";
      case "twitter.com":
        return "Twitter";
      case "facebook.com":
        return "Facebook";
      default:
        return "Login Provider";
    }
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

  isSameTrack = (a, b) => {
    if (!a || !b) {
      return false;
    }
    if (a.id === b.id) {
      return true;
    }
    let aid = a.id;
    let bid = b.id;
    if (
      a.attributes &&
      a.attributes.playParams &&
      a.attributes.playParams.catalogId
    ) {
      aid = a.attributes.playParams.catalogId;
    }
    if (
      b.attributes &&
      b.attributes.playParams &&
      b.attributes.playParams.catalogId
    ) {
      bid = b.attributes.playParams.catalogId;
    }
    return aid === bid;
  };

  // Verify token by trying to fetch one.
  isReallyLoggedIn = music => {
    return music.api
      .recommendations()
      .then(() => true)
      .catch(() => false);
  };

  showAlbum = (item, show) => {
    item._subSelect = "album";
    show(item);
  };

  showArtist = (item, show) => {
    item._subSelect = "artist";
    show(item);
  };

  moveQueue = (music, from, to) => {
    if (!music || !from || !to) {
      return;
    }

    let queue = music.player.queue;
    if (from === to || to >= queue.length) {
      return;
    }

    let items = Array.from(queue.items);
    let [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    // TODO: Using private API, might break.
    queue._items = items;
    queue._reindex(); // Sets queue._itemIDs
    queue.position = queue.indexForItem(music.player.nowPlayingItem);
    queue.dispatchEvent("queueItemsDidChange", queue._items);
  };
}

let Utils = new _Utils();
export default Utils;
