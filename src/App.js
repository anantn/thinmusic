import React, { Component } from "react";
import { Button } from "@blueprintjs/core";

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
      music: instance,
      loggedIn: instance.isAuthorized,
      currentTrack: null
    };
  }

  doLogin = () => {
    this.state.music.authorize().then(token => {
      this.setState({ loggedIn: true });
    });
  };

  doLogout = () => {
    this.setState({ loggedIn: false });
  };

  playNow = (id, event) => {
    let self = this;
    this.state.music.setQueue({ song: id }).then(queue => {
      self.state.music.player.play();
    });
  };

  render() {
    if (this.state.loggedIn) {
      return (
        <div className="app">
          <Player music={this.state.music} />
          <Panel music={this.state.music} playNow={this.playNow} />
        </div>
      );
    }
    return (
      <div className="login">
        <Button icon="log-in" onClick={this.doLogin}>
          Login
        </Button>
      </div>
    );
  }
}

export default App;
