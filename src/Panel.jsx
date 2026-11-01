import React, { Component } from "react";
import {
  Spinner,
  Icon,
  InputGroup,
  Tabs,
  Tab,
  NonIdealState
} from "@blueprintjs/core";

import "./s/Panel.css";
import Browse from "./Browse";
import Playlist from "./Playlist";
import Results from "./Results";
import Settings from "./Settings";
import Collection from "./Collection";
import Utils from "./Utils";
import { toast } from "./toaster";

class Panel extends Component {
  constructor(props) {
    super(props);
    this.counter = 0;
    this.searchTimer = 0;
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
    this.props.music.addEventListener("nowPlayingItemDidChange", this.mediaChange);
  };

  componentWillUnmount = () => {
    clearTimeout(this.searchTimer);
    this.counter += 1;
    this.props.music.removeEventListener(
      "nowPlayingItemDidChange",
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
    // Every keystroke invalidates searches already in flight.
    let idx = (this.counter += 1);
    clearTimeout(this.searchTimer);
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
    this.setState({ query: term, selected: "search", searching: true });
    this.searchTimer = setTimeout(() => this.doSearch(term, idx), 250);
  };

  doSearch = async (value, idx) => {
    let api = this.props.music.api;
    let requests = [
      api.music("/v1/catalog/{{storefrontId}}/search", {
        term: value,
        limit: 25,
        types: ["songs", "albums", "playlists"]
      })
    ];
    if (this.props.user && this.props.user.apple) {
      requests.push(
        api.music("/v1/me/library/search", {
          term: value,
          limit: 25,
          types: ["library-songs", "library-albums", "library-playlists"]
        })
      );
    }
    // Either search may fail on its own; show whatever came back.
    let res = await Promise.allSettled(requests);
    if (idx !== this.counter) {
      return;
    }
    let results = res.map(r =>
      r.status === "fulfilled" && r.value && r.value.data
        ? r.value.data.results || {}
        : {}
    );

    let songs = this.merge(results, "songs");
    let albums = this.merge(results, "albums");
    let playlists = this.merge(results, "playlists");
    let final =
      songs.length === 0 && albums.length === 0 && playlists.length === 0
        ? []
        : [songs, albums, playlists];

    this.setState({ results: final, searching: false });
  };

  // Library matches first, then the rest of the catalog, then library-only items.
  merge = ([catalog = {}, library = {}], type) => {
    let playable = obj => obj.attributes && obj.attributes.playParams;
    let all = ((catalog[type] && catalog[type].data) || []).filter(playable);
    let mine = ((library["library-" + type] && library["library-" + type].data) || []).filter(playable);

    let inLibrary = new Set(mine.map(obj => obj.attributes.playParams.catalogId));
    let final = [
      ...all.filter(obj => inLibrary.has(obj.id)),
      ...all.filter(obj => !inLibrary.has(obj.id))
    ];
    let inFinal = new Set(final.map(obj => obj.id));
    for (let obj of mine) {
      if (!inFinal.has(obj.attributes.playParams.catalogId)) {
        final.push(obj);
      }
    }
    return final;
  };

  playError = (e) => {
    console.error(e);
    toast({
      icon: "error",
      intent: "danger",
      message: "Sorry, there was a problem playing this item."
    });
  };

  playNow = async (item, event) => {
    let self = this;
    if (Utils.isSameTrack(item, this.props.music.nowPlayingItem)) {
      if (this.props.music.isPlaying) {
        this.props.music.pause();
      } else {
        this.props.music.play();
      }
      return;
    }

    if (this.props.music.queue.isEmpty) {
      this.props.music
        .setQueue(Utils.itemToQueue(item))
        .then(() => {
          self.props.music
            .play()
            .then(() => {
              self.setState(self.state);
            })
            .catch(self.playError);
        })
        .catch(self.playError);
    } else {
      let next = async () => {
        let idx = self.props.music.queue.indexForItem(item.id);
        if (idx === -1) {
          await self.props.music.playNext(Utils.itemToQueue(item));
          idx = self.props.music.nowPlayingItemIndex + 1;
        }
        self.props.music
          .changeToMediaAtIndex(idx)
          .then(() => {
            self.setState(self.state);
          })
          .catch(self.playError);
      };

      if (this.props.music.isPlaying) {
        this.props.music
          .stop()
          .then(next)
          .catch(self.playError);
      } else {
        await next();
      }
    }
  };

  playNext = async (item, event) => {
    if (this.props.music.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      let idx = this.props.music.queue.indexForItem(item.id);
      if (idx === -1) {
        await this.props.music.playNext(Utils.itemToQueue(item));
      } else {
        // Right after the current track. Moving an earlier item shifts the
        // current track down one, so its slot is the current index.
        let current = this.props.music.nowPlayingItemIndex;
        Utils.moveQueue(this.props.music, idx, idx < current ? current : current + 1);
      }
    }
  };

  playLast = async (item, event) => {
    if (this.props.music.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      let idx = this.props.music.queue.indexForItem(item.id);
      if (idx === -1) {
        await this.props.music.playLater(Utils.itemToQueue(item));
      } else {
        Utils.moveQueue(
          this.props.music,
          idx,
          this.props.music.queue.length - 1
        );
      }
    }
  };

  playCollectionNow = (item, event) => {
    let self = this;
    if (!item.attributes.url && !item.attributes.playParams) {
      self.playError();
      return;
    }

    this.props.music
      .setQueue(Utils.itemToQueue(item))
      .then(() => {
        // Queue may contain things without playParams, remove.
        // TODO: Figure out better way to handle grayed out tracks as displayed.
        let queue = self.props.music.queue;
        queue._queueItems = queue._queueItems.filter(e => e.item.attributes.playParams);
        if (queue._queueItems.length === 0) {
          self.playError();
          self.props.music.setQueue({});
          return;
        }

        queue._reindex();
        queue._dispatcher.publish("queueItemsDidChange", queue._queueItems);
        self.props.music
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
            title="Queue"
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
