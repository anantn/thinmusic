import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Icon,
  Elevation,
  Slider,
  Spinner
} from "@blueprintjs/core";

import "./s/Player.css";
import Utils from "./Utils";
import Track from "./Track";
import Logo from "./Logo";
import { toast } from "./toaster";
import { loadVolume, saveVolume, applyVolume } from "./volume";

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

// none: 0
// one: 1
// all: 2
// The original Blueprint 3 palette (Blueprint 6 repainted its Colors).
const C = { GRAY1: "#5C7080", BLUE1: "#0E5A8A", BLUE5: "#48AFF0", RED1: "#A82A2A" };
const RM = [C.GRAY1, C.BLUE1, C.RED1];
const RM_TITLES = ["Repeat: None", "Repeat: One", "Repeat: All"];

class Player extends Component {
  constructor(props) {
    super(props);
    this.interval = 0;
    this.wasPlaying = false;
    let { pos, muted } = loadVolume();
    this.state = {
      playbackState: props.music.playbackState,
      sliderHover: false,
      visualize: false,
      volumePos: pos,
      muted: muted,
      disableControls: false,
      repeatMode: props.music.repeatMode || 0
    };
    this.slider = React.createRef();
  }

  componentDidMount = () => {
    this.props.music.addEventListener(
      "playbackStateDidChange",
      this.playbackChange
    );
    this.props.music.addEventListener(
      "nowPlayingItemDidChange",
      this.nowPlayingChange
    );
  };

  componentWillUnmount = () => {
    this.stopTick();
    this.props.music.removeEventListener(
      "playbackStateDidChange",
      this.playbackChange
    );
    this.props.music.removeEventListener(
      "nowPlayingItemDidChange",
      this.nowPlayingChange
    );
  };

  nowPlayingChange = event => {
    let item = event.item;
    if (
      item &&
      item.attributes
    ) {
      let attrs = item.attributes;
      let title = attrs.name ? attrs.name : "";
      title += " by ";
      title += attrs.artistName ? attrs.artistName : "";
      title += ", on ThinMusic";
      window.document.title = title;
    } else {
      let defaultTitle = "ThinMusic: The Web Player for Apple Music";
      window.document.title = defaultTitle;
    }
  };

  playbackChange = event => {
    switch (event.state) {
      case PS.loading:
      case PS.stopped:
        this.stopTick();
        this.setState({
          playbackState: event.state,
          currentTime: null,
          totalTime: null
        });
        break;
      case PS.playing:
        this.setState({ playbackState: event.state });
        this.startTick();
        break;
      default:
        this.stopTick();
        this.setState({ playbackState: event.state });
    }
  };

  // Exactly one progress timer at a time; playing fires on every track.
  startTick = () => {
    this.stopTick();
    this.interval = setInterval(this.tick, 300);
  };

  stopTick = () => {
    if (this.interval !== 0) {
      clearInterval(this.interval);
      this.interval = 0;
    }
  };

  tick = () => {
    if (this.state.playbackState !== PS.playing) return;
    this.setState({
      currentTime: this.props.music.currentPlaybackTime,
      totalTime: this.props.music.currentPlaybackDuration
    });
  };

  tickLabel = Utils.durationSeconds;

  hoverTime = event => {
    var rect = this.slider.current.getBoundingClientRect();
    return Math.floor(
      ((event.clientX - rect.left) / (rect.right - rect.left)) *
      this.props.music.currentPlaybackDuration
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

  setVolume = (pos, muted) => {
    let v = { pos, muted };
    applyVolume(this.props.music, v);
    saveVolume(v);
    this.setState({ volumePos: pos, muted });
  };

  volumeChange = pos => {
    // Dragging the slider unmutes; dragging to zero is its own kind of mute.
    this.setVolume(pos, false);
  };

  volumeToggle = () => {
    let { volumePos, muted } = this.state;
    if (muted || volumePos === 0) {
      let pos = volumePos === 0 ? 0.5 : volumePos;
      this.setVolume(pos, false);
      toast({
        icon: "volume-up",
        intent: "primary",
        message: "Volume set to " + Math.round(pos * 100) + "%"
      });
    } else {
      this.setVolume(volumePos, true);
      toast({ icon: "volume-off", intent: "primary", message: "Volume muted" });
    }
  };

  repeatChange = () => {
    let target = (this.state.repeatMode + 1) % 3;
    this.props.music.repeatMode = target;
    toast({
      icon: "repeat",
      intent: "primary",
      message: RM_TITLES[target]
    });
    this.setState({
      repeatMode: target
    });
  };

  sliderChange = num => {
    if (!this.state.disableControls) {
      // First move of a drag: remember whether to resume afterwards.
      this.wasPlaying = this.props.music.isPlaying;
      this.props.music.pause();
    }
    this.setState({ currentTime: num, disableControls: true });
  };

  sliderRelease = async num => {
    try {
      await this.props.music.seekToTime(num);
      if (this.wasPlaying) {
        await this.props.music.play();
      }
    } catch (e) {
      console.error("seek failed", e);
    } finally {
      this.setState({ disableControls: false });
    }
  };

  toggle = () => {
    let p = this.state.playbackState === PS.playing
      ? this.props.music.pause()
      : this.props.music.play();
    Promise.resolve(p).catch(e => console.error("play/pause failed", e));
  };

  toggleViz = () => {
    this.setState({ visualize: !this.state.visualize });
  };

  beginning = () => {
    let self = this;
    this.props.music.seekToTime(0).then(() => {
      if (self.state.playbackState === PS.paused) {
        self.props.music.play();
      }
    });
  };

  backward = () => {
    let self = this;
    let next = () => {
      // Bug in MusicKit, at index 1, back doesn't work?
      if (self.props.music.nowPlayingItemIndex === 1) {
        return self.props.music.changeToMediaAtIndex(0);
      }
      return self.props.music.skipToPreviousItem();
    };

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    // Why do this? There's a state glitch we're trying to avoid which we
    // just eat if track happends to be paused.
    let p = this.props.music.isPlaying
      ? this.props.music.stop().then(next)
      : Promise.resolve(next());
    p.catch(e => console.error("previous track failed", e));
  };

  forward = () => {
    let self = this;
    let next = () => self.props.music.skipToNextItem();

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    let p = this.props.music.isPlaying
      ? this.props.music.stop().then(next)
      : Promise.resolve(next());
    p.catch(e => console.error("next track failed", e));
  };

  render() {
    let track = "";
    let volume = "";
    let button = "play";
    let currentState = this.state.playbackState;

    let logo = (
      <Logo thin={C.BLUE5} music={C.BLUE5} bar={C.BLUE1} />
    );
    if (this.props.music.nowPlayingItem) {
      track = (
        <Track
          item={this.props.music.nowPlayingItem}
          audioContext={this.props.audioContext}
          audioSource={this.props.audioSource}
          visualize={this.state.visualize}
          showCollection={this.props.showCollection}
          click={this.props.audioContext ? this.toggleViz.bind(this) : null}
        />
      );
      if (
        currentState === PS.loading ||
        currentState === PS.waiting ||
        currentState === PS.stalled // FIXME: How to deal with stalled?
      ) {
        logo = <Spinner />;
      }
    }

    if (currentState === PS.playing) {
      button = "pause";
    }

    let stime = this.tickLabel(this.state.currentTime);
    if (this.state.sliderHover) {
      stime = <b>{this.tickLabel(this.state.hoverTime)}</b>;
    }

    {
      let pos = this.state.muted ? 0 : this.state.volumePos;
      volume = (
        <div>
          <Icon
            size={10}
            color={C.GRAY1}
            className="contentVolumeIcon"
            onClick={this.volumeToggle}
            title={this.state.muted ? "Unmute" : "Mute"}
            icon={
              pos === 0
                ? "volume-off"
                : pos >= 0.5
                  ? "volume-up"
                  : "volume-down"
            }
          />
          <Slider
            min={0}
            max={1}
            className="contentVolume"
            onChange={this.volumeChange}
            value={pos}
            stepSize={0.01}
            labelRenderer={false}
          />
          <Icon
            className="contentVolumeIconRight"
            size={10}
            icon="repeat"
            color={RM[this.state.repeatMode]}
            onClick={this.repeatChange}
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
            labelRenderer={false}
            labelStepSize={this.state.totalTime || 1}
            value={this.state.currentTime || 0}
          />
        </div>
        <div className="content">
          <div className="contentControls">
            <ButtonGroup className="contentButtons" size="large">
              <Button
                icon="fast-backward"
                title="Previous Track"
                disabled={
                  this.state.disableControls ||
                  this.props.music.nowPlayingItemIndex <= 0
                }
                onClick={this.backward}
              />
              <Button
                icon="step-backward"
                title="Seek to Beginning"
                disabled={
                  this.state.disableControls ||
                  (currentState !== PS.playing && currentState !== PS.paused)
                }
                onClick={this.beginning}
              />
              <Button
                icon={button}
                title={currentState === PS.playing ? "Pause" : "Play"}
                disabled={
                  this.state.disableControls ||
                  (currentState !== PS.playing && currentState !== PS.paused)
                }
                onClick={this.toggle}
              />
              <Button
                icon="fast-forward"
                title="Next Track"
                disabled={
                  this.state.disableControls ||
                  (this.props.music.nowPlayingItemIndex ===
                    this.props.music.queue.length - 1 &&
                    this.state.repeatMode !== 2)
                }
                onClick={this.forward}
              />
            </ButtonGroup>
            {volume}
          </div>
          <div className="contentTrack">{track}</div>
          <div className="contentLogo">{logo}</div>
        </div>
      </Card>
    );
  }
}

export default Player;
