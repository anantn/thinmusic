import async from "async";
import React, { Component } from "react";
import { Spinner, InputGroup, Tabs, Tab, Text } from "@blueprintjs/core";

import "./Panel.css";
import Browse from "./Browse";
import Playlist from "./Playlist";
import Results from "./Results";

class Panel extends Component {
  constructor(props) {
    super(props);
    this.counter = 0;
    this.state = {
      results: [],
      selected: "browse",
      searching: false
    };
  }

  search = event => {
    if (event.target.value.trim() === "") {
      this.setState({ selected: "browse", searching: false, results: [] });
      return;
    }
    this.setState({ searching: true });
    let idx = (this.counter += 1);
    setTimeout(this.doSearch.bind(this, event.target.value, idx), 200);
  };

  tab = event => {
    this.setState({ selected: event });
  };

  doSearch = (value, idx) => {
    this.setState({ selected: "search" });
    if (idx < this.counter) {
      return;
    }

    let self = this;
    let all = self.props.music.api;
    let library = self.props.music.api.library;
    async.parallel(
      [
        async.reflect(
          async.asyncify(
            all.search.bind(all, value, {
              limit: 10,
              types: "songs"
            })
          )
        ),
        async.reflect(
          async.asyncify(
            library.search.bind(library, value, {
              limit: 10,
              types: "library-songs"
            })
          )
        )
      ],
      (err, res) => {
        // TODO: Remove log and handle errors.
        if (idx >= self.counter && err === null) {
          let allSongs = [];
          let librarySongs = [];
          if (res[0] && res[0].value && "songs" in res[0].value) {
            allSongs = res[0].value["songs"].data;
          }
          if (res[1] && res[1].value && "library-songs" in res[1].value) {
            librarySongs = res[1].value["library-songs"].data;
          }

          // Merge global and library results.
          let final = [];

          // 1. If a song appears in both library and global, show first.
          let inLibrary = librarySongs.map(
            obj => obj.attributes.playParams.catalogId
          );
          for (let obj of allSongs) {
            if (obj.id in inLibrary) {
              final.push(obj);
            }
          }

          // 2. Show top 5 (upto 10 depending on library result set)
          // global results not in library.
          let added = 0;
          let limit = librarySongs.length >= 5 ? 5 : 10 - librarySongs.length;
          for (let obj of allSongs) {
            if (added >= limit) break;
            if (!(obj.id in inLibrary)) {
              final.push(obj);
              added += 1;
            }
          }

          // 3. Show remaining library results not already in list.
          added = 0;
          let inFinal = final.map(obj => obj.id);
          for (let obj of librarySongs) {
            if (added >= 5) break;
            if (!(obj.attributes.playParams.catalogId in inFinal)) {
              final.push(obj);
              added += 1;
            }
          }

          // 4. Cap to 10 total results.
          this.setState({
            results: final.length < 10 ? final : final.slice(0, 10),
            searching: false
          });
        } else {
          this.setState({ searching: false });
        }
      }
    );
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
      this.props.music.player.queue.prepend(item);
      this.props.music.player
        .changeToMediaAtIndex(this.props.music.player.nowPlayingItemIndex + 1)
        .then(() => {
          self.setState(self.state);
        });
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
    let q = {};
    let self = this;
    q[item.attributes.playParams.kind] = item.id;
    this.props.music.setQueue(q).then(() => {
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
            panel={
              <Browse
                music={this.props.music}
                playCollectionNow={this.playCollectionNow}
              />
            }
          />
          <Tab
            id="playing"
            title="Playing"
            disabled={this.props.music.player.queue.length === 0}
            panel={<Playlist music={this.props.music} />}
          />
          <Tab
            id="search"
            title="Search"
            disabled={!this.state.searching && this.state.results.length === 0}
            panel={resultBox}
          />
          <Tabs.Expander />
          <InputGroup
            className="searchBar"
            type="search"
            large={true}
            leftIcon="search"
            placeholder="Find songs by name..."
            onChange={this.search}
          />
        </Tabs>
      </div>
    );
  }
}

export default Panel;
