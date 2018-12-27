import async from "async";
import React, { Component } from "react";
import {
  Spinner,
  Icon,
  InputGroup,
  Tabs,
  Tab,
  Toaster,
  NonIdealState
} from "@blueprintjs/core";

import "./s/Panel.css";
import Browse from "./Browse";
import Playlist from "./Playlist";
import Results from "./Results";
import Settings from "./Settings";
import Collection from "./Collection";
import Utils from "./Utils";

class Panel extends Component {
  constructor(props) {
    super(props);
    this.counter = 0;
    this.state = {
      query: "",
      results: [],
      selected: "browse",
      searching: false,
      collection: null,
      nowPlaying: null
    };
  }

  componentDidMount = () => {
    this.props.music.addEventListener("mediaItemDidChange", this.mediaChange);
  };

  componentWillUnmount = () => {
    this.props.music.removeEventListener(
      "mediaItemDidChange",
      this.mediaChange
    );
  };

  mediaChange = event => {
    this.setState({ nowPlaying: event.item ? event.item : null });
  };

  tab = event => {
    this.setState({ selected: event });
  };

  search = event => {
    let term = event.target.value.trim();
    if (term === "") {
      this.setState({
        query: "",
        selected:
          this.state.selected !== "search"
            ? this.state.selected
            : this.props.user && this.props.user.apple
            ? "browse"
            : "settings",
        searching: false,
        results: []
      });
      return;
    }
    if (term === this.state.query && this.state.searching) {
      return;
    }
    this.setState({ query: term, selected: "search", searching: true });
    let idx = (this.counter += 1);
    setTimeout(this.doSearch.bind(this, term, idx), 250);
  };

  doSearch = (value, idx) => {
    if (idx < this.counter) {
      return;
    }

    let self = this;
    let methods = [
      async.reflect(
        async.asyncify(
          self.props.music.api.search.bind(self.props.music.api, value, {
            limit: 16,
            types: "songs,albums,playlists"
          })
        )
      )
    ];
    if (this.props.user && this.props.user.apple) {
      methods.push(
        async.reflect(
          async.asyncify(
            self.props.music.api.library.search.bind(
              self.props.music.api.library,
              value,
              {
                limit: 16,
                types: "library-songs,library-albums,library-playlists"
              }
            )
          )
        )
      );
    }
    async.parallel(methods, (err, res) => {
      if (idx < self.counter) {
        return;
      }
      if (err !== null) {
        self.setState({ searching: false });
        return;
      }

      let songs = self.merge(res, "songs");
      let albums = self.merge(res, "albums");
      let playlists = self.merge(res, "playlists");
      let final =
        songs.length === 0 && albums.length === 0 && playlists.length === 0
          ? []
          : [songs, albums, playlists];

      self.setState({
        results: final,
        searching: false
      });
    });
  };

  merge = (res, type) => {
    let all = [];
    let library = [];
    if (res[0] && res[0].value && type in res[0].value) {
      all = res[0].value[type].data;
    }
    if (res[1] && res[1].value && "library-" + type in res[1].value) {
      library = res[1].value["library-" + type].data;
    }
    all = all.filter(obj => obj.attributes && obj.attributes.playParams);
    library = library.filter(
      obj => obj.attributes && obj.attributes.playParams
    );

    // Merge global and library results.
    let final = [];

    // 1. If an item appears in both library and global, show first.
    let inLibrary = library.map(
      obj => obj.attributes.playParams && obj.attributes.playParams.catalogId
    );
    for (let obj of all) {
      if (inLibrary.includes(obj.id)) {
        final.push(obj);
      }
    }

    // 2. Show top 8 (upto 16 depending on library result set)
    // global results not in library.
    let added = 0;
    let limit = library.length >= 8 ? 8 : 16 - library.length;
    for (let obj of all) {
      if (added >= limit) break;
      if (!inLibrary.includes(obj.id)) {
        final.push(obj);
        added += 1;
      }
    }

    // 3. Show remaining library results not already in list.
    added = 0;
    let inFinal = final.map(obj => obj.id);
    for (let obj of library) {
      if (added >= 8) break;
      if (!inFinal.includes(obj.attributes.playParams.catalogId)) {
        final.push(obj);
        added += 1;
      }
    }

    // 4. Cap to 16 total results.
    return final.length < 16 ? final : final.slice(0, 16);
  };

  playError = () => {
    Toaster.create().show({
      icon: "error",
      intent: "danger",
      message: "Sorry, there was a problem playing this item."
    });
  };

  playNow = (item, event) => {
    let self = this;
    if (Utils.isSameTrack(item, this.props.music.player.nowPlayingItem)) {
      if (this.props.music.player.isPlaying) {
        this.props.music.player.pause();
      } else {
        this.props.music.player.play();
      }
      return;
    }

    if (this.props.music.player.queue.isEmpty) {
      this.props.music
        .setQueue(item)
        .then(() => {
          self.props.music.player
            .play()
            .then(() => {
              self.setState(self.state);
            })
            .catch(self.playError);
        })
        .catch(self.playError);
    } else {
      let next = () => {
        let idx = self.props.music.player.queue.indexForItem(item.id);
        if (idx === -1) {
          self.props.music.player.queue.prepend(item);
          idx = self.props.music.player.nowPlayingItemIndex + 1;
        }
        self.props.music.player
          .changeToMediaAtIndex(idx)
          .then(() => {
            self.setState(self.state);
          })
          .catch(self.playError);
      };

      if (this.props.music.player.isPlaying) {
        this.props.music.player
          .stop()
          .then(next)
          .catch(self.playError);
      } else {
        next();
      }
    }
  };

  playNext = (item, event) => {
    if (this.props.music.player.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      let idx = this.props.music.player.queue.indexForItem(item.id);
      if (idx === -1) {
        this.props.music.player.queue.prepend(item);
      } else {
        Utils.moveQueue(
          this.props.music,
          idx,
          this.props.music.player.nowPlayingItemIndex + 1
        );
      }
    }
  };

  playLast = (item, event) => {
    if (this.props.music.player.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      let idx = this.props.music.player.queue.indexForItem(item.id);
      if (idx === -1) {
        this.props.music.player.queue.append(item);
      } else {
        Utils.moveQueue(
          this.props.music,
          idx,
          this.props.music.player.queue.length - 1
        );
      }
    }
  };

  playCollectionNow = (item, event) => {
    let self = this;
    if (!item.attributes.url && !item.attributes.playParams) {
      self.playError();
    }

    let options = { url: item.attributes.url };
    if (!item.attributes.url) {
      options = {};
      options[item.attributes.playParams.kind] = item.attributes.playParams.id;
    }

    this.props.music
      .setQueue(options)
      .then(() => {
        // Queue may contain things without playParams, remove.
        // TODO: Figure out better way to handle grayed out tracks as displayed.
        let queue = self.props.music.player.queue;
        queue._items = queue._items.filter(e => e.attributes.playParams);
        if (queue._items.length === 0) {
          self.playError();
          self.props.music.setQueue({});
          return;
        }

        queue._reindex();
        queue.dispatchEvent("queueItemsDidChange", queue._items);
        self.props.music.player
          .play()
          .then(() => {
            self.setState(self.state);
          })
          .catch(self.playError);
      })
      .catch(self.playError);
  };

  showCollection = (item, event) => {
    this.setState({ collection: item });
  };

  render() {
    let resultBox = <Spinner className="spinner" />;
    if (!this.state.searching) {
      if (this.state.results.length === 0) {
        resultBox = (
          <NonIdealState
            className="browseNull"
            icon="zoom-out"
            title="Sorry, no results found!"
          />
        );
      } else {
        resultBox = (
          <Results
            items={this.state.results}
            music={this.props.music}
            nowPlaying={this.state.nowPlaying}
            playNow={this.playNow}
            playNext={this.playNext}
            playLast={this.playLast}
            playCollectionNow={this.playCollectionNow}
            showCollection={this.showCollection}
          />
        );
      }
    }

    let search = "";
    if (
      this.state.searching ||
      this.state.results.length !== 0 ||
      (!this.state.searching &&
        this.state.results.length === 0 &&
        this.state.query !== "")
    ) {
      search = <Tab id="search" title="Search" panel={resultBox} />;
    }

    return (
      <div className="panel">
        <Collection
          music={this.props.music}
          nowPlaying={this.state.nowPlaying}
          playNow={this.playNow}
          playNext={this.playNext}
          playLast={this.playLast}
          playCollectionNow={this.playCollectionNow}
          showCollection={this.showCollection}
          item={this.state.collection}
          isOpen={this.state.collection !== null}
          onClose={() => {
            this.setState({ collection: null });
          }}
        />
        <Tabs
          className="tabs"
          large={true}
          onChange={this.tab}
          selectedTabId={this.state.selected}
        >
          <Tab
            id="settings"
            panel={
              <Settings
                user={this.props.user}
                userUpdate={this.props.userUpdate}
                music={this.props.music}
              />
            }
          >
            <Icon icon="cog" title="Settings" />
          </Tab>
          <Tab
            id="browse"
            title="Browse"
            panel={
              <Browse
                user={this.props.user}
                music={this.props.music}
                showCollection={this.showCollection}
                playCollectionNow={this.playCollectionNow}
              />
            }
          />
          <Tab
            id="playing"
            title="Playing"
            panel={
              <Playlist
                music={this.props.music}
                nowPlaying={this.state.nowPlaying}
                showCollection={this.showCollection}
              />
            }
          />
          {search}
          <Tabs.Expander />
          <InputGroup
            className="searchBar"
            type="search"
            large={true}
            leftIcon="search"
            placeholder="Find songs, albums, playlists by name..."
            onChange={this.search}
          />
        </Tabs>
      </div>
    );
  }
}

export default Panel;
