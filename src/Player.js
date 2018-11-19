import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Elevation,
  ProgressBar
} from "@blueprintjs/core";

import "./player.css";
const MusicKit = window.MusicKit;

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false
    };
  }

  componentDidMount = () => {
    this.interval = setInterval(this.tick, 300);
    this.props.music.addEventListener("playbackStateDidChange", function(
      event
    ) {
      console.log(event);
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.interval);
    this.props.music.removeEventListener("playbackStateDidChange");
  };

  componentDidUpdate = prevProps => {
    if (prevProps.track !== this.props.track) {
      this.play();
    }
  };

  tick = () => {
    if (!this.state.isPlaying) return;
    let current = this.props.music.player.currentPlaybackTime;
    let total = this.props.music.player.currentPlaybackDuration;
    this.setState({
      progress: current / total,
      durationStart: MusicKit.formatMediaTime(current, ":"),
      durationEnd: MusicKit.formatMediaTime(total, ":")
    });
  };

  play = () => {
    let self = this;
    this.props.music.setQueue({ song: this.props.track }).then(queue => {
      self.props.music.player.play().then(() => {
        let track = queue.item(0);
        self.setState({
          name: track.attributes.name,
          artist: track.attributes.artistName,
          album: track.attributes.albumName,
          isPlaying: true
        });
      });
    });
  };

  toggle = () => {
    if (this.state.isPlaying) {
      this.props.music.player.pause();
    } else {
      this.props.music.player.play();
    }
    this.setState(state => ({ isPlaying: !state.isPlaying }));
  };

  render() {
    let content = <div>Nothing is playing.</div>;

    if (this.props.track) {
      let button = "play";
      if (this.state.isPlaying) {
        button = "pause";
      }
      content = (
        <div>
          <div className="duration">
            <span className="start">{this.state.durationStart}</span>
            <span className="end">{this.state.durationEnd}</span>
          </div>
          <ProgressBar
            animate={false}
            stripes={false}
            value={this.state.progress}
          />
          <h4>{this.state.name}</h4>
          <h5>
            {this.state.artist} &mdash; {this.state.album}
          </h5>
          <ButtonGroup large={true}>
            <Button icon="step-backward" />
            <Button icon={button} onClick={this.toggle} />
            <Button icon="step-forward" />
          </ButtonGroup>
        </div>
      );
    }

    return (
      <Card className="player" elevation={Elevation.TWO}>
        {content}
      </Card>
    );
  }
}

export default Player;
