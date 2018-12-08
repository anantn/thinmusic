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
import firebase from "firebase";

import "./App.css";
import Panel from "./Panel";
import Player from "./Player";

const MusicKit = window.MusicKit;

const AUTH_UNKNOWN = 0;
const AUTH_LOGGED_OUT = 1;
const AUTH_LOGGED_IN = 2;

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    instance.player.prepareToPlay();
    this.state = {
      authState: AUTH_UNKNOWN,
      user: null,
      music: instance,
      currentTrack: null
    };
    this.panel = React.createRef();
    this.audioElement = null;
    this.audioContext = null;
    this.audioSource = null;
    this.authObserver = null;
  }

  componentWillMount() {
    this.audioElement = window.document.getElementById("apple-music-player");
    // TODO: Maybe support Safari?
    if (isChrome) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.audioSource = this.audioContext.createMediaElementSource(
        this.audioElement
      );
      this.audioSource.connect(this.audioContext.destination);
    }
    this.authObserver = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ authState: AUTH_LOGGED_IN, user });
      } else {
        this.setState({ authState: AUTH_LOGGED_OUT });
      }
    });
  }

  componentWillUnmount() {
    this.authObserver();
  }

  open = path => {
    window.open(path, "window", "toolbar=no, menubar=no, resizable=yes");
  };

  signIn = () => {
    this.panel.current.tab("settings");
  };

  signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(window.localStorage.clear);
  };

  render() {
    if (this.state.authState === AUTH_UNKNOWN || this.state.tab === "") {
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
    } else {
      callout = (
        <Callout style={{ marginBottom: "10px" }} intent="warning">
          You are using ThinMusic in anonymous mode, track playback will be
          limited to 30 seconds.
          <br />
          <span className="link" onClick={this.signIn}>
            Sign in
          </span>
          &nbsp;and connect your Apple Music account for the full experience!
        </Callout>
      );
    }

    return (
      <div className="app">
        {callout}
        <Player
          music={this.state.music}
          audioElement={this.audioElement}
          audioContext={this.audioContext}
          audioSource={this.audioSource}
        />
        <Panel
          ref={this.panel}
          music={this.state.music}
          user={this.state.user}
          active={this.state.tab}
        />
        <Divider />
        <div className="footer">
          <Text>
            Made with <Icon icon="heart" /> by{" "}
            <a href="https://www.kix.in/">kix</a>. © 2018
          </Text>
          <div className="right">
            <span
              className="link"
              onClick={this.open.bind(this, "/privacy.html")}
            >
              Privacy Policy
            </span>
            &nbsp;|&nbsp;
            <span className="link" onClick={this.open.bind(this, "/tos.html")}>
              Terms of Service
            </span>
            {logout}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
