import React, { Component } from "react";
import { Card, Text, Tooltip } from "@blueprintjs/core";

import "./s/BrowseList.css";
import BrowseIcon from "./BrowseIcon";

class BrowseList extends Component {
  renderCard(item) {
    let title = "";
    let name = item.attributes.name;
    if (name.length > 32) {
      title = name;
      name = item.attributes.name.slice(0, 32) + "...";
    }

    let card = (
      <Card className="item">
        <BrowseIcon
          name={name}
          item={item}
          click={this.props.playCollectionNow.bind(this, item)}
        />
        <Text className="title">
          <span
            title={title}
            onClick={this.props.showCollection.bind(this, item)}
          >
            {name}
          </span>
        </Text>
      </Card>
    );

    if (
      (item.type.startsWith("album") ||
        item.type.startsWith("library-album")) &&
      (item.attributes && item.attributes.artistName)
    ) {
      return (
        <Tooltip
          position="bottom"
          hoverOpenDelay={500}
          content={"by " + item.attributes.artistName}
        >
          {card}
        </Tooltip>
      );
    } else if (
      (item.type.startsWith("playlist") ||
        item.type.startsWith("library-playlist")) &&
      (item.attributes && item.attributes.curatorName)
    ) {
      return (
        <Tooltip
          position="bottom"
          hoverOpenDelay={500}
          content={"by " + item.attributes.curatorName}
        >
          {card}
        </Tooltip>
      );
    } else {
      return card;
    }
  }

  render() {
    return (
      <ol className="browseList">
        {this.props.items
          .filter(
            o => o.attributes && o.attributes.name && o.attributes.playParams
          )
          .map((o, i) => (
            <li key={"key-" + i}>{this.renderCard(o)}</li>
          ))}
      </ol>
    );
  }
}

export default BrowseList;
