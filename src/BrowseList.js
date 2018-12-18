import React, { Component } from "react";
import { Card, Text } from "@blueprintjs/core";

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

    return (
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
