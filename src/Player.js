import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Elevation,
  Slider,
  Tooltip
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
      self.setState({ playbackState: event.state });
      switch (event.state) {
        case PS.playing:
          this.interval = setInterval(this.tick, 300);
          break;
        default:
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

  tickLabel = num => {
    if (typeof num !== "number") return "-";
    return Math.floor(num / 60) + ":" + (num % 60 < 10 ? "0" : "") + (num % 60);
  };

  hoverTime = event => {
    var rect = this.slider.current.getBoundingClientRect();
    return Math.floor(
      ((event.clientX - rect.left) / (rect.right - rect.left)) *
        this.props.music.player.currentPlaybackDuration
    );
  };

  sliderHoverEnter = event => {
    this.setState({
      sliderHover: true,
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

  render() {
    let content = <div>Nothing is playing.</div>;
    let title = this.props.music.player.nowPlayingItem
      ? this.props.music.player.nowPlayingItem.title
      : "";
    let subtitle = this.props.music.player.nowPlayingItem
      ? this.props.music.player.nowPlayingItem.artistName +
        " — " +
        this.props.music.player.nowPlayingItem.albumName
      : "";

    let currentState = this.state.playbackState;
    if (currentState >= PS.loading && currentState <= PS.waiting) {
      let button = "play";
      if (currentState === PS.playing) {
        button = "pause";
      }
      content = (
        <div>
          <div className="duration">
            <span className="start">
              {this.tickLabel(this.state.currentTime)}
            </span>
            <span className="end">{this.tickLabel(this.state.totalTime)}</span>
          </div>
          <div
            ref={this.slider}
            onPointerEnter={this.sliderHoverEnter}
            onPointerLeave={this.sliderHoverLeave}
            onPointerMove={this.sliderHoverMove}
          >
            <Tooltip
              disabled={!this.state.sliderHover}
              position={"top"}
              content={this.tickLabel(this.state.hoverTime)}
              wrapperTagName={"div"}
            >
              <Slider
                min={0}
                max={this.state.totalTime}
                onChange={this.sliderChange}
                onRelease={this.sliderRelease}
                labelRenderer={() => ""}
                labelStepSize={this.state.totalTime || Infinity}
                value={this.state.currentTime}
              />
            </Tooltip>
          </div>
          <h4>{title}</h4>
          <h5>{subtitle}</h5>
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
