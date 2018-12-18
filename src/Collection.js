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
      error: false,
      library: false
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

  clickAlbum = item => {
    item._subSelect = "album";
    this.props.showCollection(item);
  };

  clickArtist = item => {
    item._subSelect = "artist";
    this.props.showCollection(item);
  };

  fetch = () => {
    if (
      this.props.item.type.startsWith("song") ||
      this.props.item.type.startsWith("library-song")
    ) {
      // TODO: implement artist collection view.
      if (this.props.item._subSelect !== "album") {
        return this.setState({ error: true });
      }

      // Hmm, we can only really support library songs that are matched.
      // TODO: More elegant user experience here? (Change in Results component).
      let isLibrary = false;
      let id = this.props.item.id;
      if (this.props.item.type.startsWith("library-song")) {
        if (
          this.props.item.attributes.playParams &&
          this.props.item.attributes.playParams.catalogId
        ) {
          id = this.props.item.attributes.playParams.catalogId;
          isLibrary = true;
        } else {
          return this.setState({ item: null, error: true, library: isLibrary });
        }
      }

      let self = this;
      this.props.music.api
        .song(id)
        .then(res => {
          let select = self.props.item._subSelect + "s";
          if (
            res.relationships &&
            res.relationships[select] &&
            res.relationships[select].data &&
            res.relationships[select].data.length > 0
          ) {
            let item = res.relationships[select].data[0];
            self.fetchReal(item.id, item.type, isLibrary);
          } else {
            self.setState({ item: null, error: true, library: isLibrary });
          }
        })
        .catch(() => {
          self.setState({ item: null, error: true, library: isLibrary });
        });
    } else {
      if (
        this.props.item.type !== "albums" &&
        this.props.item.type !== "library-albums" &&
        this.props.item.type !== "playlists" &&
        this.props.item.type !== "library-playlists"
      ) {
        return this.setState({
          item: null,
          error: true,
          library: this.props.item.type.startsWith("library")
        });
      }
      this.fetchReal(
        this.props.item.id,
        this.props.item.type,
        this.props.item.type.startsWith("library")
      );
    }
  };

  fetchReal = (id, type, isLibrary) => {
    let self = this;
    let method = this.props.music.api;
    if (type.startsWith("library")) {
      method = this.props.music.api.library;
      type = type.slice("library-".length);
    }
    method[type.slice(0, -1)](id)
      .then(res => {
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
        self.setState({ item: res, error: false, library: isLibrary });
      })
      .catch(() => {
        self.setState({ item: null, error: true, library: isLibrary });
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
    let desc = null;
    if (item.attributes.description) {
      if (item.attributes.description.short) {
        desc = item.attributes.description.short;
      }
      if (item.attributes.description.standard) {
        desc = item.attributes.description.standard;
      }
    }

    return (
      <div className="metadata">
        {item.attributes.curatorName ? (
          <div className="subtitle">{item.attributes.curatorName}</div>
        ) : (
          " "
        )}
        {item.attributes.lastModifiedDate ? (
          <div className="subtitle">
            Updated {Utils.formatDate(item.attributes.lastModifiedDate)}
          </div>
        ) : (
          " "
        )}
        {this.renderLength(count, total)}
        {desc ? this.renderDescription(desc) : ""}
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
              <Text ellipsize={true}>
                <span
                  className="clickable"
                  onClick={this.clickAlbum.bind(this, item)}
                >
                  {item.attributes.albumName}
                </span>
              </Text>
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

    let name = this.props.item ? this.props.item.attributes.name : " ";
    if (this.props.item && this.props.item._subSelect) {
      name =
        this.props.item.attributes[this.props.item._subSelect + "Name"] || " ";
    }

    let warning = "";
    if (this.state.library) {
      warning = (
        <Callout intent="danger" style={{ marginBottom: "20px" }}>
          This content was matched from your library into the Apple Music
          catalog, and may be inaccurate.
        </Callout>
      );
    }

    return (
      <Dialog {...this.props} title={name} className="collection bp3-dark">
        <div className={Classes.DIALOG_BODY}>
          {warning}
          {body}
        </div>
      </Dialog>
    );
  }
}

export default Collection;
