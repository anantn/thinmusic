import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Colors,
  Elevation,
  Slider,
  Spinner
} from "@blueprintjs/core";

import * as Utils from "./Utils";
import Logo from "./Logo";
import Track from "./Track";
import "./Player.css";

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
    this.interval = 0;
    this.state = {
      playbackState: null,
      sliderHover: false
    };
    this.slider = React.createRef();
  }

  componentDidMount = () => {
    let self = this;
    this.props.music.addEventListener("playbackStateDidChange", event => {
      // console.log(self.props.music.player.nowPlayingItem);
      // console.log(event.state);
      switch (event.state) {
        case PS.loading:
        case PS.stopped:
          this.setState({
            playbackState: event.state,
            currentTime: null,
            totalTime: null
          });
          break;
        case PS.playing:
          self.setState({ playbackState: event.state });
          this.interval = setInterval(this.tick, 300);
          break;
        default:
          self.setState({ playbackState: event.state });
          if (this.interval !== 0) {
            clearInterval(this.interval);
            this.interval = 0;
          }
      }
    });
  };

  componentWillUnmount = () => {
    if (this.interval !== 0) {
      clearInterval(this.interval);
    }
    this.props.music.removeEventListener("playbackStateDidChange");
  };

  tick = () => {
    if (this.state.playbackState !== PS.playing) return;
    this.setState({
      currentTime: this.props.music.player.currentPlaybackTime,
      totalTime: this.props.music.player.currentPlaybackDuration
    });
  };

  tickLabel = Utils.durationSeconds;

  hoverTime = event => {
    var rect = this.slider.current.getBoundingClientRect();
    return Math.floor(
      ((event.clientX - rect.left) / (rect.right - rect.left)) *
        this.props.music.player.currentPlaybackDuration
    );
  };

  sliderHoverEnter = event => {
    this.setState({
      sliderHover:
        this.state.playbackState === PS.playing ||
        this.state.playbackState === PS.paused
          ? true
          : false,
      hoverTime: this.hoverTime(event)
    });
  };

  sliderHoverMove = event => {
    this.setState({
      hoverTime: this.hoverTime(event)
    });
  };

  sliderHoverLeave = event => {
    this.setState({ sliderHover: false });
  };

  sliderChange = num => {
    this.props.music.player.pause();
    this.setState({ currentTime: num });
  };

  sliderRelease = num => {
    let self = this;
    this.props.music.player.seekToTime(num).then(() => {
      self.props.music.player.play();
    });
  };

  toggle = () => {
    if (this.state.playbackState === PS.playing) {
      this.props.music.player.pause();
    } else {
      this.props.music.player.play();
    }
  };

  beginning = () => {
    let self = this;
    this.props.music.player.seekToTime(0).then(() => {
      if (self.state.playbackState === PS.paused) {
        self.props.music.player.play();
      }
    });
  };

  backward = () => {
    let self = this;
    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });
    this.props.music.player.stop().then(() => {
      // Bug in MusicKit, at index 1, back doesn't work?
      if (self.props.music.player.nowPlayingItemIndex === 1) {
        self.props.music.player.changeToMediaAtIndex(0);
      } else {
        self.props.music.player.skipToPreviousItem();
      }
    });
  };

  forward = () => {
    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });
    let self = this;
    this.props.music.player.stop().then(() => {
      self.props.music.player.skipToNextItem();
    });
  };

  render() {
    let button = "play";
    let track = "";
    let currentState = this.state.playbackState;
    if (
      currentState === PS.loading ||
      currentState === PS.waiting ||
      currentState === PS.stalled
    ) {
      track = <Spinner />;
    } else if (this.props.music.player.nowPlayingItem) {
      track = (
        <Track item={this.props.music.player.nowPlayingItem.attributes} />
      );
    }

    if (currentState === PS.playing) {
      button = "pause";
    }

    let stime = this.tickLabel(this.state.currentTime);
    if (this.state.sliderHover) {
      stime = <b>{this.tickLabel(this.state.hoverTime)}</b>;
    }

    return (
      <Card className="player" elevation={Elevation.TWO}>
        <div className="duration">
          <span className="start">{stime}</span>
          <span className="end">{this.tickLabel(this.state.totalTime)}</span>
        </div>
        <div
          className="slider"
          ref={this.slider}
          onPointerEnter={this.sliderHoverEnter}
          onPointerLeave={this.sliderHoverLeave}
          onPointerMove={this.sliderHoverMove}
        >
          <Slider
            min={0}
            max={this.state.totalTime || 1}
            disabled={
              !(
                this.state.playbackState === PS.playing ||
                this.state.playbackState === PS.paused
              )
            }
            onChange={this.sliderChange}
            onRelease={this.sliderRelease}
            labelRenderer={() => ""}
            labelStepSize={this.state.totalTime || 1}
            value={this.state.currentTime || 0}
          />
        </div>
        <div className="content">
          <ButtonGroup className="contentButtons" large={true}>
            <Button
              icon="fast-backward"
              title="Previous Track"
              disabled={this.props.music.player.nowPlayingItemIndex <= 0}
              onClick={this.backward}
            />
            <Button
              icon="step-backward"
              title="Seek to Beginning"
              disabled={
                currentState !== PS.playing && currentState !== PS.paused
              }
              onClick={this.beginning}
            />
            <Button
              icon={button}
              title={currentState === PS.playing ? "Pause" : "Play"}
              disabled={
                currentState !== PS.playing && currentState !== PS.paused
              }
              onClick={this.toggle}
            />
            <Button
              icon="fast-forward"
              title="Next Track"
              disabled={
                this.props.music.player.nowPlayingItemIndex ===
                this.props.music.player.queue.length - 1
              }
              onClick={this.forward}
            />
          </ButtonGroup>
          <div className="contentTrack">{track}</div>
          <Logo
            className="contentLogo"
            thin={Colors.BLUE5}
            music={Colors.BLUE5}
            bar={Colors.BLUE1}
          />
        </div>
      </Card>
    );
  }
}

export default Player;
