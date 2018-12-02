import React, { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Text, Card, Classes, Icon } from "@blueprintjs/core";

import * as Utils from "./Utils";
import "./Playlist.css";

class Playlist extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: this.props.music.player.queue.items
    };
  }

  componentDidMount = () => {
    this.props.music.addEventListener("queueItemsDidChange", this.change);
    this.props.music.addEventListener("queuePositionDidChange", this.change);
  };

  componentWillUnmount = () => {
    this.props.music.removeEventListener("queueItemsDidChange");
    this.props.music.removeEventListener("queuePositionDidChange");
  };

  change = () => {
    this.setState({ items: this.props.music.player.queue.items });
  };

  click = (isActive, idx) => {
    if (isActive) {
      if (this.props.music.player.isPlaying) {
        this.props.music.player.pause().then(this.change);
      } else {
        this.props.music.player.play().then(this.change);
      }
    } else {
      // TODO: Some kind of bug in pause icon state update?
      this.props.music.player.changeToMediaAtIndex(idx);
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

    let queue = this.props.music.player.queue;
    let items = Array.from(queue.items);
    let [moved] = items.splice(event.source.index, 1);
    items.splice(event.destination.index, 0, moved);
    // TODO: Using private API, might break.
    queue._items = items;
    queue._reindex(); // Sets queue._itemIDs
    queue.dispatchEvent("queueItemsDidChange", queue._items);
    queue.position = queue.indexForItem(this.props.music.player.nowPlayingItem);
  };

  renderItem = (item, idx) => {
    let isActive = idx === this.props.music.player.nowPlayingItemIndex;
    return (
      <Card className={`item ${isActive ? "active" : ""}`}>
        <div className="image">
          <img
            alt={item.name}
            src={Utils.icon(item.artwork, 30, 30)}
            className={Classes.SKELETON}
          />
          <div
            className="overlay"
            onClick={this.click.bind(this, isActive, idx)}
          >
            {isActive && this.props.music.player.isPlaying ? (
              <Icon icon="pause" />
            ) : (
              <Icon icon="play" />
            )}
          </div>
        </div>
        <Text ellipsize={true}>{item.title}</Text>
        <Text ellipsize={true}>{item.artistName}</Text>
        <Text ellipsize={true}>{item.albumName}</Text>
        <Text ellipsize={true}>
          {Utils.durationMilliseconds(item.playbackDuration)}
        </Text>
      </Card>
    );
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.dragEnd}>
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
