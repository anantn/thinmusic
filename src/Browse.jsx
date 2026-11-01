import React, { Component } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";

import "./s/Browse.css";
import BrowseList from "./BrowseList";

class Browse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      results: [],
      loading: true
    };
  }

  componentDidMount() {
    this.load();
  }

  componentDidUpdate = prevProps => {
    let now =
      this.props.user && this.props.user.apple ? this.props.user.apple : "";
    let prev =
      prevProps.user && prevProps.user.apple ? prevProps.user.apple : "";
    if (now === prev) {
      return;
    }
    this.load();
  };

  load = () => {
    let self = this;
    if (!self.props.user || !self.props.user.apple) {
      self.props.music.api
        .music("/v1/catalog/{{storefrontId}}/charts", {
          types: ["albums", "playlists"], limit: 14
        })
        .then(obj => {
          if (!obj || !obj.data || !obj.data.results) {
            throw new Error("Invalid response.");
          }
          let res = obj.data.results;
          let merged = [];
          if (res.playlists && res.playlists[0] && res.playlists[0].data) {
            merged = merged.concat(res.playlists[0].data);
          }
          if (res.albums && res.albums[0] && res.albums[0].data) {
            merged = merged.concat(res.albums[0].data);
          }
          self.setState({ results: merged, loading: false });
        })
        .catch(e => {
          self.setState({ loading: false, results: [] });
        });
    } else {
      self.loadPersonal();
    }
  };

  loadPersonal = async () => {
    let api = this.props.music.api;
    let order = ["heavyRotation", "recentPlayed", "recommendations"];
    let res = await Promise.allSettled([
      api.music("/v1/me/history/heavy-rotation"),
      api.music("/v1/me/recent/played"),
      api.music("/v1/me/recommendations")
    ]);
    // Each source can fail on its own; use whatever loaded.
    let data = res.map(r =>
      r.status === "fulfilled" && r.value && r.value.data && Array.isArray(r.value.data.data)
        ? r.value.data.data
        : []
    );

    let counts = {};
    let merged = [];
    let addToMerged = (source, obj) => {
      if (
        !obj.type ||
        (!obj.type.startsWith("album") &&
          !obj.type.startsWith("playlist") &&
          !obj.type.startsWith("song"))
      ) {
        return;
      }
      if (obj.id in counts) {
        counts[obj.id] += 1;
      } else {
        counts[obj.id] = 1;
        obj.source = source;
        merged.push(obj);
      }
    };

    data[0].forEach(obj => addToMerged(order[0], obj));
    data[1].forEach(obj => addToMerged(order[1], obj));
    data[2].forEach(e => {
      if (e.relationships && e.relationships.contents && e.relationships.contents.data) {
        e.relationships.contents.data.forEach(obj => addToMerged(order[2], obj));
      }
    });

    // Sort by count. If count is same:
    // prefer heavy rotation -> recently played -> recommendations.
    merged.sort((a, b) => {
      let score = counts[b.id] - counts[a.id];
      if (score !== 0) return score;
      if (a.source === b.source) return 0;
      return order.indexOf(a.source) - order.indexOf(b.source);
    });
    this.setState({ results: merged, loading: false });
  };

  render() {
    if (this.state.loading) {
      return <Spinner className="spinner" />;
    }
    if (this.state.results.length === 0) {
      return (
        <NonIdealState
          className="browseNull"
          icon="zoom-out"
          title="No favorites loaded"
        >
          Try finding a song using the search box!
        </NonIdealState>
      );
    }

    return (
      <BrowseList
        items={this.state.results}
        playCollectionNow={this.props.playCollectionNow}
        showCollection={this.props.showCollection}
      />
    );
  }
}

export default Browse;
