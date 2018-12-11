import React, { Component } from "react";
import {
  Button,
  Callout,
  Icon,
  Divider,
  Text,
  Spinner
} from "@blueprintjs/core";
import { isChrome } from "react-device-detect";

import "./App.css";
import Panel from "./Panel";
import Player from "./Player";
import Utils from "./Utils";

const MusicKit = window.MusicKit;
const LS = window.localStorage;
const AUTH_UNKNOWN = 0;
const AUTH_LOGGED_OUT = 1;
const AUTH_LOGGED_IN = 2;

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    this.state = {
      authState: AUTH_UNKNOWN,
      user: null,
      music: instance,
      currentTrack: null,
      audioElement: null,
      audioContext: null,
      audioSource: null
    };
    this.panel = React.createRef();
    this.authObserver = null;
  }

  componentWillMount() {
    let self = this;
    self.state.music.addEventListener("mediaCanPlay", () => {
      if (self.state.audioElement) {
        return;
      }

      let element = window.document.getElementById("apple-music-player");
      let context = null;
      let source = null;
      // TODO: Support Safari?
      if (isChrome) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        source = context.createMediaElementSource(element);
        source.connect(context.destination);
      }
      self.setState({
        audioElement: element,
        audioContext: context,
        audioSource: source
      });
    });

    self.state.music.addEventListener(
      "authorizationStatusDidChange",
      status => {
        if (status.authorizationStatus === 0 && Utils.userRef()) {
          Utils.disconnectApple(self.userUpdate);
        }
      }
    );

    self.authObserver = Utils.addAuthObserver(user => {
      if (user) {
        self.userUpdate();
      } else {
        self.setState({ authState: AUTH_LOGGED_OUT, user: null });
      }
    });
  }

  componentWillUnmount() {
    if (this.authObserver) this.authObserver();
    this.state.music.removeEventListener("mediaCanPlay");
    this.state.music.removeEventListener("authorizationStatusDidChange");
  }

  userUpdate = () => {
    let self = this;
    Utils.userRef()
      .get()
      .then(doc => {
        let data = {};
        if (doc.exists) {
          data = doc.data();
        }
        // If data.apple is set, ensure local instance is authorized.
        if (data && data.apple && !self.state.music.isAuthorized) {
          let count = LS.getItem("sync-count") || "0";
          LS.setItem("sync-count", Number(count) + 1);
          LS.setItem(data.apple + ".r", "");
          LS.setItem(data.apple + ".s", "");
          LS.setItem("music.6fl6vvxxeh.u", data.apple);
          if (Number(count) > 3) {
            // TODO: Log exception, this is really bad.
            Utils.disconnectApple(self.userUpdate);
          } else {
            self.state.music.authorize().then(() => {
              window.location.reload();
            });
          }
        } else {
          self.setState({ authState: AUTH_LOGGED_IN, user: data });
        }
      });
  };

  open = path => {
    window.open(path, "window", "toolbar=no, menubar=no, resizable=yes");
  };

  signIn = () => {
    this.panel.current.tab("settings");
  };

  signOut = () => {
    let self = this;
    if (self.state.music.player.isPlaying) {
      self.state.music.player.stop();
    }
    self.state.music.setQueue({});
    Utils.logout(() => {
      LS.clear();
      self.setState({ authState: AUTH_LOGGED_OUT, user: null });
      self.signIn();
    });
  };

  render() {
    if (this.state.authState === AUTH_UNKNOWN) {
      return <Spinner className="mainSpinner" size="200" />;
    }

    let logout = "";
    let callout = "";
    if (this.state.user) {
      logout = (
        <Button onClick={this.signOut} minimal={true} icon="log-out">
          Logout
        </Button>
      );
      if (!this.state.user.apple) {
        callout = (
          <Callout style={{ marginBottom: "10px" }} intent="warning">
            You haven't connected your Apple Music account yet, track playback
            will be limited to 30 seconds.
            <br />
            <span className="link" onClick={this.signIn}>
              Click here
            </span>
            &nbsp;to connect your Apple Music account.
          </Callout>
        );
      }
    } else {
      callout = (
        <Callout style={{ marginBottom: "10px" }} intent="warning">
          You are using ThinMusic in anonymous mode, track playback will be
          limited to 30 seconds.
          <br />
          <span className="link" onClick={this.signIn}>
            Log in
          </span>
          &nbsp;to unlock the the full experience!
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
            <a href="https://www.kix.in/">kix</a>. © 2018
          </Text>
          <div className="right">{logout}</div>
        </div>
      </div>
    );
  }
}

export default App;
