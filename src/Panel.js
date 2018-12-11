import async from "async";
import React, { Component } from "react";
import { Spinner, Icon, InputGroup, Tabs, Tab, Text } from "@blueprintjs/core";

import "./s/Panel.css";
import Browse from "./Browse";
import Playlist from "./Playlist";
import Results from "./Results";
import Settings from "./Settings";

class Panel extends Component {
  constructor(props) {
    super(props);
    this.counter = 0;
    this.state = {
      query: "",
      results: [],
      selected:
        this.props.user && this.props.user.apple ? "browse" : "settings",
      searching: false
    };
  }

  componentDidUpdate = prevProps => {
    let now =
      this.props.user && this.props.user.apple ? this.props.user.apple : "";
    let prev =
      prevProps.user && prevProps.user.apple ? prevProps.user.apple : "";
    if (now === prev) {
      return;
    }
    if (now !== "") {
      this.setState({ selected: "browse" });
    } else if (prev !== "") {
      this.setState({ selected: "settings" });
    }
  };

  tab = event => {
    this.setState({ selected: event });
  };

  search = event => {
    let term = event.target.value.trim();
    if (term === "") {
      this.setState({
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
            limit: 10,
            types: "songs"
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
                limit: 10,
                types: "library-songs"
              }
            )
          )
        )
      );
    }
    async.parallel(methods, (err, res) => {
      // TODO: Remove log and handle errors.
      if (idx < self.counter) {
        return;
      }
      if (err !== null) {
        self.setState({ searching: false });
        return;
      }

      let allSongs = [];
      let librarySongs = [];
      if (res[0] && res[0].value && "songs" in res[0].value) {
        allSongs = res[0].value["songs"].data;
      }
      if (res[1] && res[1].value && "library-songs" in res[1].value) {
        librarySongs = res[1].value["library-songs"].data;
      }
      allSongs = allSongs.filter(
        obj => obj.attributes && obj.attributes.playParams
      );
      librarySongs = librarySongs.filter(
        obj => obj.attributes && obj.attributes.playParams
      );

      // Merge global and library results.
      let final = [];

      // 1. If a song appears in both library and global, show first.
      let inLibrary = librarySongs.map(
        obj => obj.attributes.playParams && obj.attributes.playParams.catalogId
      );
      for (let obj of allSongs) {
        if (inLibrary.includes(obj.id)) {
          final.push(obj);
        }
      }

      // 2. Show top 6 (upto 12 depending on library result set)
      // global results not in library.
      let added = 0;
      let limit = librarySongs.length >= 6 ? 6 : 12 - librarySongs.length;
      for (let obj of allSongs) {
        if (added >= limit) break;
        if (!inLibrary.includes(obj.id)) {
          final.push(obj);
          added += 1;
        }
      }

      // 3. Show remaining library results not already in list.
      added = 0;
      let inFinal = final.map(obj => obj.id);
      for (let obj of librarySongs) {
        if (added >= 6) break;
        if (!inFinal.includes(obj.attributes.playParams.catalogId)) {
          final.push(obj);
          added += 1;
        }
      }

      // 4. Cap to 10 total results.
      self.setState({
        results: final.length < 12 ? final : final.slice(0, 12),
        searching: false
      });
    });
  };

  playNow = (item, event) => {
    let self = this;
    if (this.props.music.player.queue.isEmpty) {
      this.props.music.setQueue(item).then(() => {
        self.props.music.player.play().then(() => {
          self.setState(self.state);
        });
      });
    } else {
      let next = () => {
        self.props.music.player.queue.prepend(item);
        self.props.music.player
          .changeToMediaAtIndex(self.props.music.player.nowPlayingItemIndex + 1)
          .then(() => {
            self.setState(self.state);
          });
      };
      if (this.props.music.player.isPlaying) {
        this.props.music.player.stop().then(next);
      } else {
        next();
      }
    }
  };

  playNext = (item, event) => {
    if (this.props.music.player.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      this.props.music.player.queue.prepend(item);
    }
  };

  playLast = (item, event) => {
    if (this.props.music.player.queue.isEmpty) {
      this.playNow(item, event);
    } else {
      this.props.music.player.queue.append(item);
    }
  };

  playCollectionNow = (item, event) => {
    let self = this;
    this.props.music.setQueue({ url: item.attributes.url }).then(() => {
      // Queue may contain things without playParams, remove.
      // TODO: Figure out better way to handle grayed out tracks as displayed.
      let queue = self.props.music.player.queue;
      queue._items = queue._items.filter(e => e.attributes.playParams);
      queue._reindex();
      queue.dispatchEvent("queueItemsDidChange", queue._items);
      self.props.music.player.play().then(() => {
        self.setState(self.state);
      });
    });
  };

  render() {
    let resultBox = <Spinner className="spinner" />;
    if (!this.state.searching) {
      if (this.state.results.length === 0) {
        resultBox = <Text>Sorry, no results found.</Text>;
      } else {
        resultBox = (
          <Results
            items={this.state.results}
            playNow={this.playNow}
            playNext={this.playNext}
            playLast={this.playLast}
          />
        );
      }
    }

    let search = "";
    if (this.state.searching || this.state.results.length !== 0) {
      search = <Tab id="search" title="Search" panel={resultBox} />;
    }

    return (
      <div className="panel">
        <Tabs
          className="tabs"
          large={true}
          onChange={this.tab}
          selectedTabId={this.state.selected}
        >
          <Tab
            id="browse"
            title="Browse"
            disabled={this.props.user ? false : true}
            panel={
              <Browse
                user={this.props.user}
                music={this.props.music}
                playCollectionNow={this.playCollectionNow}
              />
            }
          />
          <Tab
            id="playing"
            title="Playing"
            panel={<Playlist music={this.props.music} />}
          />
          {search}
          <Tabs.Expander />
          <InputGroup
            className="searchBar"
            type="search"
            large={true}
            leftIcon="search"
            placeholder="Find songs by name..."
            onChange={this.search}
          />
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
        </Tabs>
      </div>
    );
  }
}

export default Panel;
