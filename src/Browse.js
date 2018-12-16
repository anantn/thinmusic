import async from "async";
import React, { Component } from "react";
import { Card, NonIdealState, Spinner, Text } from "@blueprintjs/core";

import "./s/Browse.css";
import BrowseIcon from "./BrowseIcon";

class Browse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      results: [],
      loading: true
    };
  }

  componentDidMount() {
    if (!this.props.user || !this.props.user.apple) {
      this.setState({ loading: false });
      return;
    }
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
    if (now !== "") {
      this.setState({ loading: true });
      this.load();
    } else if (prev !== "") {
      this.setState({ loading: false, results: [] });
    }
  };

  load = () => {
    let self = this;
    let api = self.props.music.api;
    let order = ["heavyRotation", "recentPlayed", "recommendations"];
    async.parallel(
      [
        async.reflect(async.asyncify(api.historyHeavyRotation.bind(api))),
        async.reflect(async.asyncify(api.recentPlayed.bind(api))),
        async.reflect(async.asyncify(api.recommendations.bind(api)))
      ],
      (err, res) => {
        // TODO: Remove log and handle errors.
        let counts = {};
        let merged = [];
        let addToMerged = (source, obj) => {
          if (obj.id in counts) {
            counts[obj.id] += 1;
          } else {
            counts[obj.id] = 1;
            obj.source = source;
            merged.push(obj);
          }
        };

        // Heavy rotation.
        if (res[0] && res[0].value && Array.isArray(res[0].value)) {
          res[0].value.map(addToMerged.bind(this, order[0]));
        }

        // Recently played.
        if (res[1] && res[1].value && Array.isArray(res[1].value)) {
          res[1].value.map(addToMerged.bind(this, order[1]));
        }

        // Personal recommendations.
        if (res[2] && res[2].value && Array.isArray(res[2].value)) {
          res[2].value.map(e => {
            if (e.relationships && e.relationships.contents) {
              return e.relationships.contents.data.map(
                addToMerged.bind(this, order[2])
              );
            }
            return e;
          });
        }

        // Sort by count. I count is same:
        // prefer heavy rotation -> recently played -> recommendations.
        merged.sort((a, b) => {
          let score = counts[b.id] - counts[a.id];
          if (score !== 0) return score;
          if (a.source === b.source) return 0;
          return order.indexOf(a.source) - order.indexOf(b.source);
        });
        self.setState({
          results: merged.length < 28 ? merged : merged.slice(0, 28),
          loading: false
        });
      }
    );
  };

  renderCard(item) {
    let title = "";
    let name = item.attributes.name;
    if (name.length > 32) {
      title = name;
      name = item.attributes.name.slice(0, 32) + "...";
    }

    return (
      <Card className="item">
        <BrowseIcon
          name={name}
          item={item}
          click={this.props.playCollectionNow.bind(this, item)}
        />
        <Text className="title">
          <span
            title={title}
            onClick={this.props.showCollection.bind(this, item)}
          >
            {name}
          </span>
        </Text>
      </Card>
    );
  }

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
      <ol className="browse">
        {this.state.results.map((o, i) => (
          <li key={"key-" + i}>{this.renderCard(o)}</li>
        ))}
      </ol>
    );
  }
}

export default Browse;
