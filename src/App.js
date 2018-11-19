import React, { Component } from "react";
import { Button } from "@blueprintjs/core";

import "./App.css";
import Search from "./Search";
import Player from "./Player";

const MusicKit = window.MusicKit;

class App extends Component {
  constructor(props) {
    super(props);
    let instance = MusicKit.getInstance();
    this.state = {
      music: instance,
      loggedIn: instance.isAuthorized,
      currentTrack: null
    };
  }

  doLogin = () => {
    this.state.music.authorize().then(token => {
      console.log("user token");
      console.log(token);
      this.setState({ loggedIn: true });
    });
  };

  doLogout = () => {
    this.setState({ loggedIn: false });
  };

  add = (id, event) => {
    this.setState({ currentTrack: id });
  };

  render() {
    if (this.state.loggedIn) {
      return (
        <div className="app">
          <Player music={this.state.music} track={this.state.currentTrack} />
          <Search music={this.state.music} add={this.add} />
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
