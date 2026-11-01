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
    this.props.music.shuffleMode = window.MusicKit.PlayerShuffleMode.off;
    this.props.music.shuffleMode = window.MusicKit.PlayerShuffleMode.songs;
    if (item) {
      let idx = this.props.music.queue.indexForItem(item);
      if (idx !== -1) {
        this.props.music.queue.position = idx;
      }
    }
  };

  clear = async () => {
    let music = this.props.music;
    try {
      await music.stop();
    } catch (e) {}
    try {
      await music.setQueue({});
    } catch (e) {
      console.error("could not clear queue", e);
    }
    this.change();
  };

  click = (isActive, idx) => {
    if (isActive) {
      let p = this.props.music.isPlaying
        ? this.props.music.pause()
        : this.props.music.play();
      Promise.resolve(p).then(this.change).catch(e => console.error(e));
    } else {
      let self = this;
      let next = () => self.props.music.changeToMediaAtIndex(idx);
      let p = this.props.music.isPlaying
        ? this.props.music.stop().then(next)
        : Promise.resolve(next());
      p.catch(e => console.error("could not change track", e));
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

  // Stable keys for drag and drop: the song id plus which copy of it this is.
  itemKeys = () => {
    let seen = {};
    return this.state.items.map(item => {
      seen[item.id] = (seen[item.id] || 0) + 1;
      return `q-${item.id}-${seen[item.id]}`;
    });
  };

  renderItem = (item, idx) => {
    // The active row is the current queue position, so a song queued twice
    // only highlights once.
    let isActive = idx === this.props.music.nowPlayingItemIndex;
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
            onClick={() => this.props.music.queue.remove(idx)}
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
          {provided => (
            <ol
              className="playlist"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {this.itemKeys().map((key, idx) => (
                <Draggable key={key} draggableId={key} index={idx}>
                  {provided => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {this.renderItem(this.state.items[idx], idx)}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ol>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

export default Playlist;
