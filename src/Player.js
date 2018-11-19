import React, { Component } from "react";
import { ButtonGroup, Button } from "@blueprintjs/core";

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false
    };
  }

  componentDidUpdate = prevProps => {
    if (prevProps.track !== this.props.track) {
      this.play();
    }
  };

  play = () => {
    let self = this;
    this.props.music.setQueue({ song: this.props.track }).then(() => {
      self.props.music.player.play();
      self.setState({ isPlaying: true });
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
    if (this.props.track === null) {
      return <div>Nothing is playing.</div>;
    }

    let button = "play";
    if (this.state.isPlaying) {
      button = "pause";
    }
    return (
      <div>
        <ButtonGroup large={true}>
          <Button icon="step-backward" />
          <Button icon={button} onClick={this.toggle} />
          <Button icon="step-forward" />
        </ButtonGroup>
      </div>
    );
  }
}

export default Player;
