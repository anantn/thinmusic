import React, { Component } from "react";
import { Classes, Icon } from "@blueprintjs/core";

import "./s/BrowseIcon.css";
import Utils from "./Utils";
import Explicit from "./i/Explicit.svg";

class BrowseIcon extends Component {
  render() {
    if (!this.props.item) {
      return;
    }

    let icon = "";
    if (
      "contentRating" in this.props.item.attributes &&
      this.props.item.attributes.contentRating === "explicit"
    ) {
      icon = <img className="icon" alt="Explicit" src={Explicit} />;
    }

    return (
      <div className="browseIcon" onClick={this.props.click}>
        <img
          alt={
            this.props.name ? this.props.name : this.props.item.attributes.name
          }
          className={Classes.SKELETON}
          src={Utils.icon(this.props.item.attributes.artwork, 160, 160)}
        />
        {icon}
        <div className="overlay">
          <Icon icon="play" />
        </div>
      </div>
    );
  }
}

export default BrowseIcon;
