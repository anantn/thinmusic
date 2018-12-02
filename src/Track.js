import React, { Component } from "react";
import {
  Card,
  Classes,
  Text,
  ButtonGroup,
  Button,
  Icon
} from "@blueprintjs/core";

import * as Utils from "./Utils";
import "./Track.css";

class Track extends Component {
  render() {
    let rhs = "";
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
    }

    return (
      <Card className="track">
        <div className="trackImage" onClick={this.props.playNow}>
          <div className="image">
            <img
              alt={this.props.item.name}
              src={Utils.icon(this.props.item.artwork, 60, 60)}
              className={Classes.SKELETON}
            />
          </div>
          <div className="overlay">
            <Icon icon="play" />
          </div>
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
