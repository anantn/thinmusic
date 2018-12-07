import React, { Component } from "react";
import { Button, Colors, Divider, Text } from "@blueprintjs/core";
import { isChrome } from "react-device-detect";

import "./App.css";
import Logo from "./Logo";
import Panel from "./Panel";
import Player from "./Player";
import Login from "./Login.svg";

const MusicKit = window.MusicKit;

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    instance.player.prepareToPlay();
    this.state = {
      music: instance,
      loggedIn: instance.isAuthorized,
      currentTrack: null
    };
    this.audioElement = null;
    this.audioContext = null;
    this.audioSource = null;
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
  }

  doLogin = () => {
    this.state.music.authorize().then(token => {
      this.setState({ loggedIn: true });
    });
  };

  doLogout = () => {
    this.state.music.unauthorize().then(() => {
      this.setState({ loggedIn: false });
    });
  };

  render() {
    if (this.state.loggedIn) {
      return (
        <div className="app">
          <Player
            music={this.state.music}
            audioElement={this.audioElement}
            audioContext={this.audioContext}
            audioSource={this.audioSource}
          />
          <Panel music={this.state.music} />
          <Divider />
          <div className="footer">
            <Text>Dreambard © 2018</Text>
            <Button onClick={this.doLogout} minimal={true} icon="log-out">
              Logout
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="login">
        <div>
          <Logo
            className="logo"
            thin={Colors.BLUE5}
            music={Colors.BLUE5}
            bar={Colors.BLUE1}
          />
        </div>
        <img onClick={this.doLogin} alt="Listen on Apple Music" src={Login} />
        <Text>
          Sign in using your Apple ID to listen to over 45 million songs, right
          here in your web browser!
        </Text>
      </div>
    );
  }
}

export default App;
