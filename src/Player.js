import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Colors,
  Icon,
  Elevation,
  Slider,
  Spinner
} from "@blueprintjs/core";

import "./s/Player.css";
import Utils from "./Utils";
import Track from "./Track";
import Logo from "./Logo";

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
      sliderHover: false,
      visualize: false,
      volume: 1
    };
    this.slider = React.createRef();
  }

  componentDidMount = () => {
    let self = this;
    let defaultTitle = "ThinMusic: The Web Player for Apple Music";
    this.props.music.addEventListener("playbackStateDidChange", event => {
      switch (event.state) {
        case PS.loading:
        case PS.stopped:
          window.document.title = defaultTitle;
          this.setState({
            playbackState: event.state,
            currentTime: null,
            totalTime: null
          });
          break;
        case PS.playing:
          self.setState({ playbackState: event.state });
          this.interval = setInterval(this.tick, 300);
          if (
            self.props.music.player.nowPlayingItem &&
            self.props.music.player.nowPlayingItem.attributes
          ) {
            let attrs = self.props.music.player.nowPlayingItem.attributes;
            let title = attrs.name ? attrs.name : "";
            title += " by ";
            title += attrs.artistName ? attrs.artistName : "";
            title += ", on ThinMusic";
            window.document.title = title;
          }
          break;
        default:
          window.document.title = defaultTitle;
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

  volumeChange = num => {
    this.props.audioElement.volume = num;
    this.setState({ volume: this.props.audioElement.volume });
  };

  volumeToggle = num => {
    if (this.props.audioElement.volume === 0) {
      this.props.audioElement.volume = this.state.volume;
      this.setState({ volume: this.props.audioElement.volume });
    } else {
      this.props.audioElement.volume = 0;
      this.setState({});
    }
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

  toggleViz = () => {
    this.setState({ visualize: !this.state.visualize });
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
    let next = () => {
      // Bug in MusicKit, at index 1, back doesn't work?
      if (self.props.music.player.nowPlayingItemIndex === 1) {
        self.props.music.player.changeToMediaAtIndex(0);
      } else {
        self.props.music.player.skipToPreviousItem();
      }
    };

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    // Why do this? There's a state glitch we're trying to avoid which we
    // just eat if track happends to be paused.
    if (this.props.music.player.isPlaying) {
      this.props.music.player.stop().then(next);
    } else {
      next();
    }
  };

  forward = () => {
    let self = this;
    let next = () => {
      self.props.music.player.skipToNextItem();
    };

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    if (this.props.music.player.isPlaying) {
      this.props.music.player.stop().then(next);
    } else {
      next();
    }
  };

  render() {
    let track = "";
    let volume = "";
    let button = "play";
    let currentState = this.state.playbackState;
    if (
      currentState === PS.loading ||
      currentState === PS.waiting ||
      currentState === PS.stalled
    ) {
      track = <Spinner />;
    }
    if (this.props.music.player.nowPlayingItem) {
      track = (
        <Track
          item={this.props.music.player.nowPlayingItem.attributes}
          audioContext={this.props.audioContext}
          audioSource={this.props.audioSource}
          visualize={this.state.visualize}
          click={this.props.audioContext ? this.toggleViz.bind(this) : null}
        />
      );
    }

    if (currentState === PS.playing) {
      button = "pause";
    }

    let stime = this.tickLabel(this.state.currentTime);
    if (this.state.sliderHover) {
      stime = <b>{this.tickLabel(this.state.hoverTime)}</b>;
    }

    if (this.props.audioElement) {
      volume = (
        <div>
          <Icon
            size={10}
            color={Colors.GRAY1}
            className="contentVolumeIcon"
            onClick={this.volumeToggle}
            icon={
              this.props.audioElement.volume === 0
                ? "volume-off"
                : this.props.audioElement.volume >= 0.5
                ? "volume-up"
                : "volume-down"
            }
          />
          <Slider
            min={0}
            max={1}
            className="contentVolume"
            onChange={this.volumeChange}
            value={this.props.audioElement.volume}
            stepSize={0.05}
          />
        </div>
      );
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
          <div className="contentControls">
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
            {volume}
          </div>
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
