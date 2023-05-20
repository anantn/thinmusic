import React, { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button, Text, Card, Classes, Icon } from "@blueprintjs/core";

import "./s/Playlist.css";
import Utils from "./Utils";

class Playlist extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: this.props.music.queue.items
    };
  }

  componentDidMount = () => {
    this.props.music.addEventListener("playbackStateDidChange", this.change);
    this.props.music.addEventListener("queueItemsDidChange", this.change);
    this.props.music.addEventListener("queuePositionDidChange", this.change);
  };

  componentWillUnmount = () => {
    this.props.music.removeEventListener("playbackStateDidChange", this.change);
    this.props.music.removeEventListener("queueItemsDidChange", this.change);
    this.props.music.removeEventListener("queuePositionDidChange", this.change);
  };

  change = () => {
    this.setState({ items: this.props.music.queue.items });
  };

  shuffle = () => {
    let item = this.props.music.nowPlayingItem;
    this.props.music.queue.shuffle();
    if (item) {
      let idx = this.props.music.queue.indexForItem(item);
      if (idx !== -1) {
        this.props.music.queue.position = idx;
      }
    }
  };

  clear = () => {
    let self = this;
    let next = () => {
      self.props.music.stop().catch(e => {});
      self.props.music.setQueue({}).then(() => {
        self.setState(self.state);
      });
    };

    // TOOD: Move to common constants, too much hardcoding.
    if (
      self.props.music.nowPlayingItem &&
      self.props.music.playbackState === 3
    ) {
      // LUL.
      self.props.music.play().then(next);
    } else {
      next();
    }
  };

  click = (isActive, idx) => {
    if (isActive) {
      if (this.props.music.isPlaying) {
        this.props.music.pause().then(this.change);
      } else {
        this.props.music.play().then(this.change);
      }
    } else {
      let self = this;
      let next = () => {
        self.props.music.changeToMediaAtIndex(idx);
      };
      if (this.props.music.isPlaying) {
        this.props.music.stop().then(next);
      } else {
        next();
      }
    }
  };

  dragEnd = event => {
    // Redo queue for event.source.index -> event.destination.index
    if (!event.source || !event.destination) {
      return;
    }
    if (event.source.index === event.destination.index) {
      return;
    }
    Utils.moveQueue(
      this.props.music,
      event.source.index,
      event.destination.index
    );
  };

  renderItem = (item, idx) => {
    let isActive = Utils.isSameTrack(this.props.nowPlaying, item);
    return (
      <Card className={`item ${isActive ? "active" : ""}`}>
        <div className="image">
          <img
            alt={item.name}
            src={Utils.icon(item.artwork, 30, 30)}
            className={Classes.SKELETON}
          />
          {isActive ? (
            <div className="overlayActive">
              <Icon icon="music" color="#BFCCD6" />
            </div>
          ) : (
            ""
          )}
          <div
            className="overlay"
            onClick={this.click.bind(this, isActive, idx)}
          >
            {isActive && this.props.music.isPlaying ? (
              <Icon icon="pause" />
            ) : (
              <Icon icon="play" />
            )}
          </div>
        </div>
        <Text ellipsize={true}>{item.title}</Text>
        <Text ellipsize={true}>
          <span
            className="clickable"
            onClick={Utils.showArtist.bind(
              Utils,
              item,
              this.props.showCollection
            )}
          >
            {item.artistName}
          </span>
        </Text>
        <Text ellipsize={true}>
          <span
            className="clickable"
            onClick={Utils.showAlbum.bind(
              Utils,
              item,
              this.props.showCollection
            )}
          >
            {item.albumName}
          </span>
        </Text>
        <Text ellipsize={true}>
          {Utils.durationMilliseconds(item.playbackDuration)}
        </Text>
        {isActive ? (
          ""
        ) : (
          <Button
            onClick={this.props.music.queue.remove.bind(
              this.props.music.queue,
              idx
            )}
            minimal={true}
            icon="cross"
          />
        )}
      </Card>
    );
  };

  render() {
    let buttons = (
      <div>
        <Button icon="trash" onClick={this.clear}>
          Clear
        </Button>
        <Button icon="random" onClick={this.shuffle}>
          Shuffle
        </Button>
      </div>
    );

    let total = this.state.items.reduce((s, o) => s + o.playbackDuration, 0);
    return (
      <DragDropContext onDragEnd={this.dragEnd}>
        <Card className="metadata">
          <Text>
            {Utils.durationListFormat(this.state.items.length, total)}
          </Text>
          {this.state.items.length > 0 ? buttons : null}
        </Card>
        <Droppable droppableId="playlist">
          {(provided, snapshot) => (
            <ol className="playlist" ref={provided.innerRef}>
              {this.state.items.map((item, idx) => (
                <Draggable
                  key={"key-" + idx}
                  draggableId={"item-" + idx}
                  index={idx}
                >
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {this.renderItem(item, idx)}
                    </li>
                  )}
                </Draggable>
              ))}
            </ol>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

export default Playlist;
