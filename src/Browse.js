import async from "async";
import React, { Component } from "react";
import { Card, Classes, Icon, Spinner, Text } from "@blueprintjs/core";

import * as Utils from "./Utils";
import "./Browse.css";

class Browse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
  }

  componentDidMount() {
    let self = this;
    let api = self.props.music.api;
    let order = ["heavyRotation", "recentPlayed", "recommendations"];
    async.parallel(
      [
        async.asyncify(api.historyHeavyRotation.bind(api)),
        async.asyncify(api.recentPlayed.bind(api)),
        async.asyncify(api.recommendations.bind(api))
      ],
      (err, res) => {
        // TODO: Remove log and handle errors.
        console.log(res);
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
        if (res[0] && Array.isArray(res[0])) {
          res[0].map(addToMerged.bind(this, order[0]));
        }

        // Recently played.
        if (res[1] && Array.isArray(res[1])) {
          res[1].map(addToMerged.bind(this, order[1]));
        }

        // Personal recommendations.
        if (res[2] && Array.isArray(res[2])) {
          res[2].map(e => {
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
          results: merged.length < 28 ? merged : merged.slice(0, 28)
        });
      }
    );
  }

  render() {
    if (this.state.results.length === 0) {
      return <Spinner className="spinner" />;
    }
    return (
      <ol className="browse">
        {this.state.results.map((o, i) => (
          <li key={"key-" + i}>
            <Card className="item">
              <div
                className="image"
                onClick={this.props.playCollectionNow.bind(this, o)}
              >
                <img
                  className={Classes.SKELETON}
                  src={Utils.icon(o.attributes.artwork, 160, 160)}
                />
                <div className="overlay">
                  <Icon icon="play" />
                </div>
              </div>
              <Text className="title">
                <span>{o.attributes.name}</span>
              </Text>
            </Card>
          </li>
        ))}
      </ol>
    );
  }
}

export default Browse;
