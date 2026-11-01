import React, { Component } from "react";
import {
  Button,
  Callout,
  Icon,
  Divider,
  Text,
  Spinner
} from "@blueprintjs/core";

import "./s/App.css";
import Panel from "./Panel";
import Player from "./Player";
import Utils from "./Utils";
import { isChrome } from "./device";
import { toast } from "./toaster";

const MusicKit = window.MusicKit;
const LS = window.localStorage;
const AUTH_UNKNOWN = 0;
const AUTH_LOGGED_OUT = 1;
const AUTH_LOGGED_IN = 2;

// Clears this app's own keys (including v1-era token keys older versions wrote),
// keeping the volume preference and MusicKit v3's own storage.
function clearAppStorage() {
  try {
    for (let key of Object.keys(LS)) {
      if (key === "sync-count" || key.endsWith(".r") || key.endsWith(".s") ||
          key === "music.6fl6vvxxeh.u") {
        LS.removeItem(key);
      }
    }
  } catch (e) {}
}

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    this.state = {
      authState: AUTH_UNKNOWN,
      user: null,
      music: instance,
      audioElement: null,
      audioContext: null,
      audioSource: null
    };
    this.scrobble = null;
    this.scrobbleTimer = 0;
    this.panel = React.createRef();
    this.authObserver = null;
  }

  componentDidMount() {
    let music = this.state.music;
    music.addEventListener("mediaCanPlay", this.mediaCanPlay);
    music.addEventListener("authorizationStatusDidChange", this.authChange);
    music.addEventListener("nowPlayingItemDidChange", this.scrobbleItemChange);
    music.addEventListener("playbackStateDidChange", this.scrobbleStateChange);
    this.scrobbleTimer = setInterval(this.scrobbleTick, 1000);

    this.authObserver = Utils.addAuthObserver(user => {
      if (user) {
        this.userUpdate();
      } else {
        this.setState({ authState: AUTH_LOGGED_OUT, user: null });
      }
    });
  }

  componentWillUnmount() {
    if (this.authObserver) this.authObserver();
    clearInterval(this.scrobbleTimer);
    let music = this.state.music;
    music.removeEventListener("mediaCanPlay", this.mediaCanPlay);
    music.removeEventListener("authorizationStatusDidChange", this.authChange);
    music.removeEventListener("nowPlayingItemDidChange", this.scrobbleItemChange);
    music.removeEventListener("playbackStateDidChange", this.scrobbleStateChange);
  }

  mediaCanPlay = () => {
    if (this.state.audioElement) {
      return;
    }
    let element = window.document.getElementById("apple-music-player");
    if (!element) {
      return;
    }
    element.crossOrigin = "anonymous";

    // The visualizer taps the audio element through Web Audio (Chrome only,
    // and only for signed-in playback because of CORS). Volume is set on MusicKit (see
    // volume.js), never on the element.
    let context = null;
    let source = null;
    if (isChrome && this.state.music.isAuthorized) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
        source = context.createMediaElementSource(element);
        source.connect(context.destination);
      } catch (e) {
        console.error("visualizer unavailable", e);
        context = null;
        source = null;
      }
    }
    this.setState({
      audioElement: element,
      audioContext: context,
      audioSource: source
    });
  };

  // Apple Music was signed out from outside the app: forget the saved token.
  // Ignored while we're signing out or disconnecting ourselves.
  authChange = status => {
    if (
      status.authorizationStatus === 0 &&
      !Utils.busy &&
      this.state.user &&
      this.state.user.apple &&
      Utils.userRef()
    ) {
      Utils.disconnectApple(this.userUpdate);
    }
  };

  // Last.fm scrobbling, based on time actually listened (pauses, buffering
  // and seeks don't count). Rules: "now playing" after 5 s; scrobble tracks
  // longer than 30 s once 75% has been heard, or 4 minutes, whichever is first.
  scrobbleItemChange = event => {
    let item = event.item;
    this.scrobble = item
      ? {
          item,
          start: Math.floor(Date.now() / 1000),
          heardMs: 0,
          since: this.state.music.isPlaying ? Date.now() : null,
          nowSent: false,
          done: false
        }
      : null;
  };

  scrobbleStateChange = () => {
    let s = this.scrobble;
    if (!s) return;
    if (this.state.music.isPlaying) {
      if (s.since === null) s.since = Date.now();
    } else if (s.since !== null) {
      s.heardMs += Date.now() - s.since;
      s.since = null;
    }
  };

  scrobbleTick = () => {
    let s = this.scrobble;
    let user = this.state.user;
    if (!s || s.done || !user || !user.lastfm || !user.lastfm.key) return;
    let heard = (s.heardMs + (s.since !== null ? Date.now() - s.since : 0)) / 1000;
    let total = Math.floor((s.item.attributes.durationInMillis || 0) / 1000);
    if (!s.nowSent && heard >= 5) {
      s.nowSent = true;
      Utils.scrobble(user.lastfm.key, true, s.item);
    }
    if (total > 30 && heard >= Math.min(0.75 * total, 240)) {
      s.done = true;
      Utils.scrobble(user.lastfm.key, false, s.item, s.start);
    }
  };

  userUpdate = async () => {
    let music = this.state.music;
    let data = {};
    try {
      data = await Utils.loadUser();
      if (data === null) {
        return; // signed out meanwhile
      }
    } catch (e) {
      console.error("could not load user profile", e);
      toast({
        icon: "error",
        intent: "danger",
        message: "Couldn't load your ThinMusic settings. Try reloading the page."
      });
      this.setState({ authState: AUTH_LOGGED_IN, user: {} });
      return;
    }

    if (!data.apple) {
      this.setState({ authState: AUTH_LOGGED_IN, user: data });
      return;
    }

    // Saved as connected to Apple Music, but not signed in on this browser.
    // The user reconnects with a click (Apple's popup needs a user gesture).
    let notOnThisDevice = () => {
      let { apple, ...rest } = data;
      this.setState({
        authState: AUTH_LOGGED_IN,
        user: { ...rest, appleElsewhere: true }
      });
    };

    try {
      if (music.isAuthorized) {
        let status = await Utils.isReallyLoggedIn(music);
        if (status === false) {
          // Apple rejected the token: forget it. Transient errors (null) keep it.
          clearAppStorage();
          Utils.disconnectApple(() => window.location.reload());
          return;
        }
        let token = await music.authorize();
        if (token && token !== data.apple) {
          Utils.connectApple(music, (token, err) => {
            if (err) {
              notOnThisDevice();
            } else {
              window.location.reload();
            }
          });
        } else {
          this.setState({ authState: AUTH_LOGGED_IN, user: data });
        }
      } else {
        // Used to copy the token into MusicKit v1's storage keys and call
        // authorize() here, without a click. MusicKit v3 ignores those keys,
        // so that opened Apple's popup unprompted, and it ended up loading
        // the app inside the popup. Ask the user to reconnect instead.
        clearAppStorage();
        notOnThisDevice();
      }
    } catch (e) {
      // authorize() can reject (popup blocked, user cancelled). Don't hang on the spinner.
      console.error("Apple Music authorization failed", e);
      notOnThisDevice();
    }
  };

  signIn = () => {
    this.panel.current.tab("settings");
  };

  signOut = async () => {
    let music = this.state.music;
    Utils.busy = true; // logging out of this device keeps the saved Apple connection
    try {
      if (music.isPlaying) {
        await music.stop();
      }
      await music.setQueue({});
      await music.unauthorize();
    } catch (e) {
      console.error("error while signing out of Apple Music", e);
    }
    this.scrobble = null;
    Utils.logout(() => {
      Utils.busy = false;
      clearAppStorage();
      this.setState({ authState: AUTH_LOGGED_OUT, user: null });
      this.signIn();
    });
  };

  showCollection = (item, event) => {
    if (this.panel && this.panel.current) {
      this.panel.current.showCollection(item, event);
    }
  };

  render() {
    if (this.state.authState === AUTH_UNKNOWN) {
      return <Spinner className="mainSpinner" size={200} />;
    }

    let logout = "";
    let callout = "";
    if (this.state.user) {
      if (Utils.userProvider()) {
        logout = (
          <Button onClick={this.signOut} minimal={true} icon="log-out">
            Logout
          </Button>
        );
      }
      if (!this.state.user.apple) {
        callout = (
          <Callout style={{ marginBottom: "10px" }} intent="warning">
            {this.state.user.appleElsewhere
              ? "Your Apple Music account isn't connected in this browser yet, playback is limited to 30 seconds."
              : "You haven't connected your Apple Music account, playback is limited to 30 seconds."}
            <br />
            <span className="link" onClick={this.signIn}>
              Click here
            </span>
            &nbsp;to connect your Apple Music account, or{" "}
            <a href="https://apple.co/2AA0rdx">sign up for a free trial!</a>
          </Callout>
        );
      }
    } else {
      callout = (
        <Callout style={{ marginBottom: "10px" }} intent="warning">
          Song playback is limited to 30 seconds.&nbsp;
          <span className="link" onClick={this.signIn}>
            Log in
          </span>
          &nbsp;to unlock the full experience!
        </Callout>
      );
    }

    return (
      <div className="app">
        {callout}
        <Player
          music={this.state.music}
          audioElement={this.state.audioElement}
          audioContext={this.state.audioContext}
          audioSource={this.state.audioSource}
          showCollection={this.showCollection}
        />
        <Panel
          ref={this.panel}
          music={this.state.music}
          user={this.state.user}
          userUpdate={this.userUpdate}
        />
        <Divider />
        <div className="footer">
          <Text className="left">
            Made with <Icon icon="heart" /> by{" "}
            <a href="https://www.kix.in/">kix</a>.{" "}
            <a href="https://github.com/anantn/thinmusic">Source on Github</a>.
            © 2018-Present.
          </Text>
          <div className="right">{logout}</div>
        </div>
      </div>
    );
  }
}

export default App;
