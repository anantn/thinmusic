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
import BrowseList from "./BrowseList";

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
    this.props.music.addEventListener("playbackStateDidChange", this.change);
  };

  componentDidUpdate = prevProps => {
    if (
      (this.props.item &&
        (!prevProps.item || prevProps.item.id !== this.props.item.id)) ||
      (this.props.item &&
        this.props.item._subSelect &&
        (!prevProps.item ||
          !prevProps.item._subSelect ||
          prevProps.item._subSelect !== this.props.item._subSelect))
    ) {
      this.setState({ item: null, error: false, library: false });
      this.fetch();
    }
  };

  componentWillUnmount = () => {
    this.props.music.removeEventListener("playbackStateDidChange", this.change);
  };

  change = event => {
    this.setState({});
  };

  fetch = () => {
    if (
      this.props.item.type.startsWith("song") ||
      this.props.item.type.startsWith("library-song")
    ) {
      if (
        this.props.item._subSelect !== "album" &&
        this.props.item._subSelect !== "artist"
      ) {
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
      if (this.props.item._subSelect) {
        let st = this.props.item._subSelect + "s";
        if (
          this.props.item.relationships &&
          this.props.item.relationships[st]
        ) {
          this.fetchReal(
            this.props.item.relationships[st].data[0].id,
            st,
            st.startsWith("library")
          );
        } else {
          return this.setState({ item: null, error: true, library: false });
        }
      } else {
        this.fetchReal(
          this.props.item.id,
          this.props.item.type,
          this.props.item.type.startsWith("library")
        );
      }
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
          self.setState({ item: res, error: false, library: isLibrary });
        } else if (
          res.relationships &&
          res.relationships.albums &&
          res.relationships.albums.data
        ) {
          self.props.music.api
            .albums(res.relationships.albums.data.map(a => a.id).slice(0, 24))
            .then(albums => {
              res.relationships.albums.data = albums;
              self.setState({ item: res, error: false, library: isLibrary });
            })
            .catch(e => {
              self.setState({ item: null, error: true, library: isLibrary });
            });
        } else {
          self.setState({ item: null, error: true, library: isLibrary });
        }
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
          <div className="subtitle">
            <span
              className="clickable"
              onClick={Utils.showArtist.bind(
                Utils,
                item,
                this.props.showCollection
              )}
            >
              {item.attributes.artistName}
            </span>
          </div>
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
    } else if (
      item.relationships &&
      item.relationships.albums &&
      item.relationships.albums.data
    ) {
      list = (
        <BrowseList
          items={item.relationships.albums.data}
          playCollectionNow={this.props.playCollectionNow}
          showCollection={this.props.showCollection}
        />
      );
    }

    let method = null;
    if (item.type === "albums") {
      method = this.renderCollectionAlbum;
    }
    if (item.type === "playlists") {
      method = this.renderCollectionPlaylist;
    }

    return (
      <div>
        {method ? (
          <div className="header">
            <BrowseIcon
              item={item}
              click={this.props.playCollectionNow.bind(this, item)}
            />
            {method(item, count, total)}
          </div>
        ) : (
          ""
        )}
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
                  onClick={Utils.showAlbum.bind(
                    Utils,
                    item,
                    this.props.showCollection
                  )}
                >
                  {item.attributes.albumName}
                </span>
              </Text>
            );
          }
          let isActive = Utils.isSameTrack(this.props.nowPlaying, item);
          return (
            <li key={"item-" + idx}>
              <Card className={`item ${isActive ? "itemActive" : ""}`}>
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
                    {isActive && this.props.music.player.isPlaying ? (
                      <Icon icon="pause" />
                    ) : (
                      <Icon icon="play" />
                    )}
                  </div>
                  {isActive ? (
                    <div className="overlayActive">
                      <Icon icon="music" color="#BFCCD6" />
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                <Text ellipsize={true}>{item.attributes.name}</Text>
                <Text ellipsize={true}>
                  <span
                    className="clickable"
                    onClick={Utils.showArtist.bind(
                      Utils,
                      item,
                      this.props.showCollection
                    )}
                  >
                    {item.attributes.artistName}
                  </span>
                </Text>
                {albumInfo}
                <Text ellipsize={true}>
                  {Utils.durationMilliseconds(item.attributes.durationInMillis)}
                </Text>
                <ButtonGroup minimal={true}>
                  {isActive ? (
                    ""
                  ) : (
                    <Button
                      onClick={self.props.playNext.bind(self, item)}
                      icon="circle-arrow-right"
                      title="Play Next"
                    />
                  )}
                  {isActive ? (
                    ""
                  ) : (
                    <Button
                      onClick={self.props.playLast.bind(self, item)}
                      icon="sort"
                      title="Play Last"
                    />
                  )}
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
