import React, { Component } from "react";
import { Button, Callout, Icon, Divider, Text } from "@blueprintjs/core";
import { isChrome } from "react-device-detect";
import firebase from "firebase";

import "./App.css";
import Panel from "./Panel";
import Player from "./Player";

const MusicKit = window.MusicKit;

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    instance.player.prepareToPlay();
    this.state = {
      user: null,
      music: instance,
      currentTrack: null
    };
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
      this.setState({ user });
    });
  }

  componentWillUnmount() {
    this.authObserver();
  }

  render() {
    let logout = "";
    let callout = "";
    if (this.state.user) {
      logout = (
        <Button onClick={this.doLogout} minimal={true} icon="log-out">
          Logout
        </Button>
      );
    } else {
      callout = (
        <Callout style={{ marginBottom: "10px" }} intent="warning">
          You are using ThinMusic in anonymous mode, track playback will be
          limited to 30 seconds.
          <br />
          Sign in, or sign up and connect your Apple Music account for the full
          experience!
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
        <Panel music={this.state.music} user={this.state.user} />
        <Divider />
        <div className="footer">
          <Text>
            Made with <Icon icon="heart" /> by{" "}
            <a href="https://www.kix.in/">kix</a>. © 2018
          </Text>
          {logout}
        </div>
      </div>
    );
  }
}

export default App;
