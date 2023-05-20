import async from "async";
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

  loadPersonal = () => {
    let self = this;
    let api = self.props.music.api;
    let order = ["heavyRotation", "recentPlayed", "recommendations"];
    async.parallel(
      [
        async.reflect(async.asyncify(api.music.bind(api, "/v1/me/history/heavy-rotation"))),
        async.reflect(async.asyncify(api.music.bind(api, "/v1/me/recent/played"))),
        async.reflect(async.asyncify(api.music.bind(api, "/v1/me/recommendations")))
      ],
      (err, res) => {
        // TODO: Remove log and handle errors.
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

        // Heavy rotation.
        if (res[0] && res[0].value && Array.isArray(res[0].value.data.data)) {
          res[0].value.data.data.map(addToMerged.bind(this, order[0]));
        }

        // Recently played.
        if (res[1] && res[1].value && Array.isArray(res[1].value.data.data)) {
          res[1].value.data.data.map(addToMerged.bind(this, order[1]));
        }

        // Personal recommendations.
        if (res[2] && res[2].value && Array.isArray(res[2].value.data.data)) {
          res[2].value.data.data.map(e => {
            if (e.relationships && e.relationships.contents) {
              return e.relationships.contents.data.map(
                addToMerged.bind(this, order[2])
              );
            }
            return e;
          });
        }

        // Sort by count. If count is same:
        // prefer heavy rotation -> recently played -> recommendations.
        merged.sort((a, b) => {
          let score = counts[b.id] - counts[a.id];
          if (score !== 0) return score;
          if (a.source === b.source) return 0;
          return order.indexOf(a.source) - order.indexOf(b.source);
        });
        self.setState({
          results: merged,
          loading: false
        });
      }
    );
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
