import React, { Component } from "react";
import {
  Card,
  Classes,
  Text,
  ButtonGroup,
  Button,
  Icon
} from "@blueprintjs/core";

import "./s/Track.css";
import Utils from "./Utils";
import Visualizer from "./Visualizer";

class Track extends Component {
  render() {
    let rhs = "";
    let overlay = "";
    if (this.props.rhs) {
      rhs = (
        <ButtonGroup minimal={true} vertical={true}>
          <Button
            onClick={this.props.playNext}
            icon="circle-arrow-right"
            title="Play Next"
          />
          <Button onClick={this.props.playLast} icon="sort" title="Play Last" />
        </ButtonGroup>
      );
      overlay = (
        <div className="overlay" title="Play Now">
          <Icon icon="play" />
        </div>
      );
    }

    let content = (
      <div className="image">
        <img
          alt={this.props.item.name}
          src={Utils.icon(this.props.item.artwork, 80, 80)}
          className={Classes.SKELETON}
        />
      </div>
    );
    if (this.props.visualize) {
      content = (
        <Visualizer
          width={80}
          height={80}
          audioContext={this.props.audioContext}
          audioSource={this.props.audioSource}
        />
      );
    }

    return (
      <Card className="track">
        <div
          className="trackImage"
          style={this.props.click ? { cursor: "pointer" } : {}}
          onClick={this.props.click}
        >
          {content}
          {overlay}
        </div>
        <div className={`trackInfo ${this.props.rhs ? "trackInfoSmall" : ""}`}>
          <Text ellipsize={true}>
            <b>{this.props.item.name}</b>
          </Text>
          <Text ellipsize={true}>{this.props.item.artistName}</Text>
          <Text ellipsize={true}>{this.props.item.albumName}</Text>
        </div>
        <div className="trackRhs">{rhs}</div>
      </Card>
    );
  }
}

export default Track;
