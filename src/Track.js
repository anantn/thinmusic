import React, { Component } from "react";
import { Card, Classes, Text } from "@blueprintjs/core";

import * as Utils from "./Utils";
import "./Track.css";

class Track extends Component {
  render() {
    return (
      <Card className="track">
        <img
          alt={this.props.item.title}
          src={Utils.icon(this.props.item.artwork, 60, 60)}
          className={Classes.SKELETON}
        />
        <Text ellipsize={true}>
          <b>{this.props.item.title}</b>
        </Text>
        <Text ellipsize={true}>{this.props.item.artistName}</Text>
        <Text ellipsize={true}>{this.props.item.albumName}</Text>
      </Card>
    );
  }
}

export default Track;
