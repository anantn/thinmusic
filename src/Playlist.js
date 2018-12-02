import React, { Component } from "react";

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
    console.log(this.props.music.player.queue.items);
    this.setState({ items: this.props.music.player.queue.items });
  };

  render() {
    return (
      <ol>
        {this.state.items.map((item, idx) => (
          <li key={idx}>{item.title}</li>
        ))}
      </ol>
    );
  }
}

export default Playlist;
