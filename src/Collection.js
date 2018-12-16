import React, { Component } from "react";
import {
  Dialog,
  Card,
  Classes,
  Icon,
  Button,
  ButtonGroup,
  Spinner,
  Text,
  Callout
} from "@blueprintjs/core";

import "./s/Collection.css";
import Utils from "./Utils";
import BrowseIcon from "./BrowseIcon";

class Collection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: null,
      error: false
    };
    this.parser = new window.DOMParser();
  }

  componentDidMount = () => {
    if (this.props.item) {
      this.fetch();
    }
  };

  componentDidUpdate = prevProps => {
    if (
      this.props.item &&
      (!prevProps.item || this.props.item.id !== prevProps.item.id)
    ) {
      this.setState({ item: null, error: false });
      this.fetch();
    }
  };

  fetch = () => {
    if (
      this.props.item.type !== "albums" &&
      this.props.item.type !== "playlists"
    ) {
      this.setState({
        error: true
      });
      return;
    }

    let self = this;
    this.props.music.api[this.props.item.type.slice(0, -1)](this.props.item.id)
      .then(res => {
        console.log(res);
        if (
          res.relationships &&
          res.relationships.tracks &&
          res.relationships.tracks.data
        ) {
          res.relationships.tracks.data = res.relationships.tracks.data.filter(
            item => {
              return item.attributes && item.attributes.playParams;
            }
          );
        }
        self.setState({ item: res, error: false });
      })
      .catch(() => {
        self.setState({ item: null, error: true });
      });
  };

  renderLength = (count, total) => {
    return count > 0 ? (
      <div className="subtitle">{Utils.durationListFormat(count, total)}</div>
    ) : (
      ""
    );
  };

  renderDescription = desc => {
    return desc && desc.trim() !== "" ? (
      <div className="description">
        {this.parser.parseFromString(desc, "text/html").body.textContent || ""}
      </div>
    ) : (
      ""
    );
  };

  renderCollectionPlaylist = (item, count, total) => {
    let subtitles = [];
    if (item.attributes.curatorName) {
      subtitles.push(item.attributes.curatorName);
    }
    if (item.attributes.lastModifiedDate) {
      subtitles.push(
        "(updated " + Utils.formatDate(item.attributes.lastModifiedDate) + ")"
      );
    }
    return (
      <div className="metadata">
        {subtitles.length > 0 ? (
          <div className="subtitle">{subtitles.join(" ")}</div>
        ) : (
          ""
        )}
        {this.renderLength(count, total)}
        {item.attributes.description && item.attributes.description.short ? (
          <Text>{item.attributes.description.short}</Text>
        ) : (
          ""
        )}
        {item.attributes.description && item.attributes.description.standard
          ? this.renderDescription(item.attributes.description.standard)
          : ""}
      </div>
    );
  };

  renderCollectionAlbum = (item, count, total) => {
    let extra = [];
    if (item.attributes.genreNames) {
      extra.push(item.attributes.genreNames[0]);
    }
    if (item.attributes.releaseDate) {
      extra.push(item.attributes.releaseDate.slice(0, 4));
    }
    if (item.attributes.recordLabel) {
      extra.push(item.attributes.recordLabel);
    }

    return (
      <div className="metadata">
        {item.attributes.artistName ? (
          <div className="subtitle">{item.attributes.artistName}</div>
        ) : (
          ""
        )}
        {extra.length > 0 ? (
          <div className="subtitle">{extra.join(" • ")}</div>
        ) : (
          ""
        )}
        {this.renderLength(count, total)}
        {item.attributes.editorialNotes
          ? this.renderDescription(item.attributes.editorialNotes.standard)
          : ""}
      </div>
    );
  };

  renderCollection = item => {
    let list = "";
    let count = 0;
    let total = 0;
    if (
      item.relationships &&
      item.relationships.tracks &&
      item.relationships.tracks.data
    ) {
      list = this.renderList(
        item.relationships.tracks.data,
        item.type === "albums"
      );
      count = item.relationships.tracks.data.length;
      total = item.relationships.tracks.data.reduce(
        (s, o) => s + o.attributes.durationInMillis,
        0
      );
    }

    let method = this.renderCollectionAlbum;
    if (item.type === "playlists") {
      method = this.renderCollectionPlaylist;
    }
    return (
      <div>
        <div className="header">
          <BrowseIcon
            item={item}
            click={this.props.playCollectionNow.bind(this, item)}
          />
          {method(item, count, total)}
        </div>
        {list}
      </div>
    );
  };

  renderList = (items, isAlbum) => {
    let self = this;
    return (
      <ol className={`playlist ${isAlbum ? "album" : ""}`}>
        {items.map((item, idx) => {
          let albumInfo = "";
          if (!isAlbum) {
            albumInfo = (
              <Text ellipsize={true}>{item.attributes.albumName}</Text>
            );
          }
          return (
            <li key={"item-" + idx}>
              <Card className="item">
                <div className="image">
                  <img
                    alt={item.attributes.name}
                    src={Utils.icon(item.attributes.artwork, 30, 30)}
                    className={Classes.SKELETON}
                  />
                  <div
                    className="overlay"
                    onClick={self.props.playNow.bind(self, item)}
                  >
                    <Icon icon="play" />
                  </div>
                </div>
                <Text ellipsize={true}>{item.attributes.name}</Text>
                <Text ellipsize={true}>{item.attributes.artistName}</Text>
                {albumInfo}
                <Text ellipsize={true}>
                  {Utils.durationMilliseconds(item.attributes.durationInMillis)}
                </Text>
                <ButtonGroup minimal={true}>
                  <Button
                    onClick={self.props.playNext.bind(self, item)}
                    icon="circle-arrow-right"
                    title="Play Next"
                  />
                  <Button
                    onClick={self.props.playLast.bind(self, item)}
                    icon="sort"
                    title="Play Last"
                  />
                </ButtonGroup>
              </Card>
            </li>
          );
        })}
      </ol>
    );
  };

  render() {
    let body = <Spinner />;
    if (this.state.error === true || (this.state.item && !this.state.item.id)) {
      body = (
        <Callout
          intent="danger"
          title="Sorry, we could not display the content you requested."
        />
      );
    }

    if (this.state.item !== null) {
      body = this.renderCollection(this.state.item);
    }

    return (
      <Dialog
        {...this.props}
        title={this.props.item ? this.props.item.attributes.name : " "}
        className="collection bp3-dark"
      >
        <div className={Classes.DIALOG_BODY}>{body}</div>
      </Dialog>
    );
  }
}

export default Collection;
