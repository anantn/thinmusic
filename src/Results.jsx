import React, { Component } from "react";
import { Tab, Tabs, NonIdealState } from "@blueprintjs/core";

import "./s/Results.css";
import Track from "./Track";
import BrowseList from "./BrowseList";

class Results extends Component {
  render() {
    let empty = (
      <NonIdealState
        className="browseNull"
        icon="zoom-out"
        title="Sorry, no results found!"
      />
    );
    return (
      <Tabs>
        <Tabs.Expander />
        <Tab
          id="songs"
          title="Songs"
          panel={
            this.props.items &&
            this.props.items[0] &&
            this.props.items[0].length > 0 ? (
              <div className="songResults">
                <ol>
                  {this.props.items[0].map((item, idx) => (
                    <li key={idx}>
                      <Track
                        rhs={true}
                        item={item}
                        music={this.props.music}
                        click={this.props.playNow.bind(this, item)}
                        playNext={this.props.playNext.bind(this, item)}
                        playLast={this.props.playLast.bind(this, item)}
                        showCollection={this.props.showCollection}
                        nowPlaying={this.props.nowPlaying}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              empty
            )
          }
        />
        <Tab
          id="albums"
          title="Albums"
          panel={
            this.props.items &&
            this.props.items[1] &&
            this.props.items[1].length > 0 ? (
              <BrowseList
                items={this.props.items[1]}
                playCollectionNow={this.props.playCollectionNow}
                showCollection={this.props.showCollection}
              />
            ) : (
              empty
            )
          }
        />
        <Tab
          id="playlists"
          title="Playlists"
          panel={
            this.props.items &&
            this.props.items[2] &&
            this.props.items[2].length > 0 ? (
              <BrowseList
                items={this.props.items[2]}
                playCollectionNow={this.props.playCollectionNow}
                showCollection={this.props.showCollection}
              />
            ) : (
              empty
            )
          }
        />
      </Tabs>
    );
  }
}

export default Results;
