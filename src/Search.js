import async from "async";
import React, { Component } from "react";
import {
  Spinner,
  NonIdealState,
  HTMLTable,
  InputGroup,
  Classes
} from "@blueprintjs/core";

import "./Search.css";
import * as Utils from "./Utils";

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
          // TODO: fix merging logic.
          let tracked = librarySongs.map(
            obj => obj.attributes.playParams.catalogId
          );
          let final = librarySongs.map(obj => obj.attributes);
          allSongs.forEach(obj => {
            if (!(obj.id in tracked)) {
              final.push(obj.attributes);
            }
          });
          this.setState({ results: final, searching: false });
        }
      }
    );
  };

  render() {
    let resultBox;
    if (!this.state.searching && this.state.results.length === 0) {
      resultBox = <NonIdealState icon="search" title="Search for a song!" />;
    } else if (this.state.searching) {
      resultBox = <Spinner />;
    } else {
      resultBox = (
        <HTMLTable>
          <thead>
            <tr>
              <th className="col-0" />
              <th className="col-1">Song</th>
              <th className="col-2">Artist</th>
              <th className="col-2">Album</th>
            </tr>
          </thead>
          <tbody>
            {this.state.results.map(result => (
              <tr key={result.playParams.id}>
                <td
                  onClick={this.props.playNow.bind(this, result.playParams.id)}
                >
                  <img
                    src={Utils.icon(result.artwork)}
                    alt={result.name}
                    width={Utils.ICON_SIZE}
                    height={Utils.ICON_SIZE}
                    className={Classes.SKELETON}
                  />
                </td>
                <td
                  onClick={this.props.playNow.bind(this, result.playParams.id)}
                >
                  {result.name}
                </td>
                <td>{result.artistName}</td>
                <td>{result.albumName}</td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
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
