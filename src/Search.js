import async from "async";
import React, { Component } from "react";
import { Spinner, NonIdealState, InputGroup } from "@blueprintjs/core";

import "./Search.css";
import Track from "./Track";

class Search extends Component {
  constructor(props) {
    super(props);
    this.counter = 0;
    this.state = {
      results: [],
      searching: false
    };
  }

  search = event => {
    if (event.target.value.trim() === "") {
      this.setState({ results: [] });
      return;
    }
    this.setState({ searching: true });
    let idx = (this.counter += 1);
    setTimeout(this.doSearch.bind(this, event.target.value, idx), 200);
  };

  doSearch = (value, idx) => {
    if (idx < this.counter) {
      return;
    }

    let self = this;
    let all = this.props.music.api;
    let library = this.props.music.api.library;
    async.parallel(
      [
        async.asyncify(
          all.search.bind(all, value, {
            limit: 10,
            types: "songs"
          })
        ),
        async.asyncify(
          library.search.bind(library, value, {
            limit: 10,
            types: "library-songs"
          })
        )
      ],
      (err, res) => {
        console.log(res);
        if (idx >= self.counter && err === null) {
          let allSongs = [];
          let librarySongs = [];
          if ("songs" in res[0]) {
            allSongs = res[0]["songs"].data;
          }
          if ("library-songs" in res[1]) {
            librarySongs = res[1]["library-songs"].data;
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
        }
      }
    );
  };
  q;
  render() {
    let resultBox;
    if (!this.state.searching && this.state.results.length === 0) {
      resultBox = (
        <NonIdealState
          icon="search"
          title="Search for songs, artists, albums, playlists..."
        />
      );
    } else if (this.state.searching) {
      resultBox = <Spinner />;
    } else {
      resultBox = (
        <ol>
          {this.state.results.map(result => (
            <li key={result.id}>
              <Track
                item={result.attributes}
                onClick={this.props.playNow.bind(this, result.id)}
              />
            </li>
          ))}
        </ol>
      );
    }

    return (
      <div className="search">
        <InputGroup
          type="search"
          large="true"
          leftIcon="search"
          placeholder="Search"
          onChange={this.search}
        />
        <div className="searchResults">{resultBox}</div>
      </div>
    );
  }
}

export default Search;
