import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField
} from "firebase/firestore";

const MusicKit = window.MusicKit;
const Fetch = window.fetch;
const EUC = window.encodeURIComponent;

class _Utils {
  constructor() {
    this.ICON_SIZE = 40;
    const app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_KEY,
      authDomain: "apple-thinmusic.firebaseapp.com",
      projectId: "apple-thinmusic",
      storageBucket: "apple-thinmusic.appspot.com",
      messagingSenderId: "694059640396",
      appId: "1:694059640396:web:075505cc9e17a3a43f76e9"
    });
    this.auth = getAuth(app);
    this.db = getFirestore(app);
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
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  loginMethods = email => {
    return fetchSignInMethodsForEmail(this.auth, email);
  };

  login = (provider, cb) => {
    if (provider !== "Google") {
      cb(null, "Invalid provider");
      return;
    }
    let providerObj = new GoogleAuthProvider();
    providerObj.addScope("profile");
    providerObj.addScope("email");
    providerObj.setCustomParameters({ display: "popup" });

    let user = this.auth.currentUser;
    if (user && user.isAnonymous) {
      linkWithPopup(user, providerObj)
        .then(() => window.location.reload())
        .catch(error => {
          // This Google account already has a ThinMusic user: sign in to it.
          let credential = GoogleAuthProvider.credentialFromError(error);
          if (error.code === "auth/credential-already-in-use" && credential) {
            return signInWithCredential(this.auth, credential).then(result => {
              if (cb) cb(result, null);
            });
          }
          throw error;
        })
        .catch(error => {
          if (cb) cb(null, error);
        });
    } else {
      signInWithPopup(this.auth, providerObj)
        .then(result => {
          if (cb) cb(result, null);
        })
        .catch(error => {
          if (cb) cb(null, error);
        });
    }
  };

  loginAnonymously = () => {
    return signInAnonymously(this.auth);
  };

  logout = cb => {
    signOut(this.auth)
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
    return Fetch(url)
      .then(resp => {
        if (!resp.ok) throw new Error("Last.fm " + path + " failed: " + resp.status);
      })
      .catch(e => console.error(e));
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
      updateDoc(ref, { lastfm: deleteField() })
        .then(() => {
          if (cb) cb();
        })
        .catch(e => {
          console.error("could not remove Last.fm session", e);
          if (cb) cb();
        });
    } else if (cb) {
      queueMicrotask(cb);
    }
  };

  disconnectApple = cb => {
    if (cb && typeof cb !== "function") {
      cb = null;
    }
    // Also sign MusicKit out on this device, not just forget the saved token.
    Promise.resolve(MusicKit.getInstance().unauthorize()).catch(e =>
      console.error("unauthorize failed", e)
    );

    let ref = Utils.userRef();
    if (ref) {
      updateDoc(ref, { apple: deleteField() })
        .then(() => {
          if (cb) cb();
        })
        .catch(e => {
          console.error("could not remove Apple Music token", e);
          if (cb) cb();
        });
    } else if (cb) {
      queueMicrotask(cb);
    }
  };

  userRef = () => {
    let user = this.auth.currentUser;
    if (!user) {
      return null;
    }
    return doc(this.db, "users", user.uid);
  };

  // The signed-in user's saved settings ({} if none yet).
  loadUser = async () => {
    let snap = await getDoc(this.userRef());
    return snap.exists() ? snap.data() || {} : {};
  };

  userName = () => {
    let user = this.auth.currentUser;
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
    let user = this.auth.currentUser;
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
    return onAuthStateChanged(this.auth, cb);
  };

  // Merge fields into the signed-in user's document (creates it if needed).
  setOrUpdate = obj => {
    let ref = this.userRef();
    if (!ref) {
      return Promise.reject(new Error("Not signed in"));
    }
    return setDoc(ref, obj, { merge: true });
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

  // Turn item into URL or library ID for queue.
  itemToQueue = item => {
    let options = {};
    if (item.attributes.playParams && item.attributes.playParams.id) {
      options[item.attributes.playParams.kind] = item.attributes.playParams.id;
    } else if (item.attributes.url) {
      options.url = item.attributes.url;
    } else {
      throw new Error("Could not get any ID for item!");
    }
    return options;
  };

  // Check the Apple Music user token with a cheap request.
  // Resolves true (valid), false (Apple rejected it) or null (couldn't tell:
  // offline, rate limited, server error), so transient errors don't log people out.
  isReallyLoggedIn = music => {
    return music.api
      .music("/v1/me/storefront")
      .then(() => true)
      .catch(e => {
        let status = e && (e.status || (e.response && e.response.status));
        let code = String((e && (e.errorCode || e.name || e.message)) || "");
        if (status === 401 || status === 403 || /unauthori[sz]ed|forbidden|token/i.test(code)) {
          return false;
        }
        return null;
      });
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
    if (!music || from === undefined || to === undefined) {
      return;
    }

    let queue = music.queue;
    if (from === to || to >= queue.length) {
      return;
    }

    let items = Array.from(queue._queueItems);
    let [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    // TODO: Using private API, might break.
    queue._queueItems = items;
    queue._reindex(); // Sets queue._itemIDs
    queue.position = queue.indexForItem(music.nowPlayingItem);
    queue._dispatcher.publish("queueItemsDidChange", queue._queueItems);
  };
}

let Utils = new _Utils();
export default Utils;
