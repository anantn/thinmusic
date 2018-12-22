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
          alt={this.props.item.attributes.name}
          src={Utils.icon(this.props.item.attributes.artwork, 80, 80)}
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
            <b>{this.props.item.attributes.name}</b>
          </Text>
          <Text ellipsize={true}>
            <span
              className="clickable"
              onClick={Utils.showArtist.bind(
                Utils,
                this.props.item,
                this.props.showCollection
              )}
            >
              {this.props.item.attributes.artistName}
            </span>
          </Text>
          <Text ellipsize={true}>
            <span
              className="clickable"
              onClick={Utils.showAlbum.bind(
                Utils,
                this.props.item,
                this.props.showCollection
              )}
            >
              {this.props.item.attributes.albumName}
            </span>
          </Text>
        </div>
        <div className="trackRhs">{rhs}</div>
      </Card>
    );
  }
}

export default Track;
