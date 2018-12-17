import React, { Component } from "react";

import "./s/Results.css";
import Track from "./Track";

class Results extends Component {
  render() {
    return (
      <div className="results">
        <ol>
          {this.props.items.map((item, idx) => (
            <li key={idx}>
              <Track
                rhs={true}
                item={item}
                click={this.props.playNow.bind(this, item)}
                playNext={this.props.playNext.bind(this, item)}
                playLast={this.props.playLast.bind(this, item)}
                showCollection={this.props.showCollection}
              />
            </li>
          ))}
        </ol>
      </div>
    );
  }
}

export default Results;
