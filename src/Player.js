import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Elevation,
  ProgressBar
} from "@blueprintjs/core";

import "./player.css";

// none:      0
// loading:   1
// playing:   2
// paused:    3
// stopped:   4
// ended:     5
// seeking:   6
// waiting:   8
// stalled:   9
// completed: 10
const PS = window.MusicKit.PlaybackStates;

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playbackState: null
    };
  }

  componentDidMount = () => {
    let self = this;
    this.interval = setInterval(this.tick, 300);
    this.props.music.addEventListener("playbackStateDidChange", event => {
      self.setState({ playbackState: event.state });
      console.log(event);
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.interval);
    this.props.music.removeEventListener("playbackStateDidChange");
  };

  tick = () => {
    if (this.state.playbackState !== PS.playing) return;
    let current = this.props.music.player.currentPlaybackTime;
    let total = this.props.music.player.currentPlaybackDuration;
    this.setState({
      progress: current / total,
      start: this.tickLabel(current),
      end: this.tickLabel(total)
    });
  };

  tickLabel = num => {
    return Math.floor(num / 60) + ":" + (num % 60 < 10 ? "0" : "") + (num % 60);
  };

  toggle = () => {
    if (this.state.playbackState === PS.playing) {
      this.props.music.player.pause();
    } else {
      this.props.music.player.play();
    }
  };

  render() {
    let content = <div>Nothing is playing.</div>;
    let currentItem = this.props.music.player.nowPlayingItem;
    if (!currentItem) {
      currentItem = { title: "", artistName: "", albumName: "" };
    }
    let currentState = this.state.playbackState;
    if (
      currentState === PS.loading ||
      currentState === PS.playing ||
      currentState === PS.paused ||
      currentState === PS.stopped ||
      currentState === PS.waiting
    ) {
      let button = "play";
      if (currentState === PS.playing) {
        button = "pause";
      }
      content = (
        <div>
          <div className="duration">
            <span className="start">{this.state.start || "-"}</span>
            <span className="end">{this.state.end || "-"}</span>
          </div>
          <ProgressBar
            animate={false}
            stripes={false}
            value={this.state.progress}
          />
          <h4>{currentItem.title}</h4>
          <h5>
            {currentItem.artistName} &mdash; {currentItem.albumName}
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
