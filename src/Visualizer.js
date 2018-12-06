import React, { Component } from "react";
import { Colors } from "@blueprintjs/core";

import Logo from "./Logo";

class Visualizer extends Component {
  constructor(props) {
    super(props);

    this.analyzer = this.props.context.createAnalyser();
    this.analyzer.fftSize = 256;
    this.analyzer.smoothingTimeConstant = 0.0;
    this.bufferSize = this.analyzer.frequencyBinCount;
    this.buffer = new Uint8Array(this.bufferSize);

    this.props.source.connect(this.analyzer);
    this.canvas = React.createRef();

    this.state = {
      logo: true
    };
  }

  componentWillUnmount() {
    this.props.source.disconnect();
  }

  toggle = () => {
    this.setState({ logo: !this.state.logo });
  };

  draw = () => {
    if (this.state.logo) {
      return;
    } else {
      window.requestAnimationFrame(this.draw);
    }

    let canvas = this.canvas.current;
    if (!canvas) {
      return;
    }

    let ctx = canvas.getContext("2d");
    //ctx.fillStyle = "rgb(0, 0, 0)";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.analyzer.getByteTimeDomainData(this.buffer);
    this.drawBars(canvas, ctx);
  };

  drawBars = (canvas, ctx) => {
    var barWidth = (canvas.width / this.bufferSize) * 2.5;
    var barHeight;
    var x = 0;
    for (var i = 0; i < this.bufferSize; i++) {
      barHeight = this.buffer[i] / 2;
      ctx.fillStyle = "rgb(" + (barHeight + 100) + ",189,189)";
      ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  render() {
    let content = (
      <Logo thin={Colors.BLUE5} music={Colors.BLUE5} bar={Colors.BLUE1} />
    );
    if (!this.state.logo) {
      this.draw();
      content = <canvas ref={this.canvas} />;
    }
    return <div onClick={this.toggle}>{content}</div>;
  }
}

export default Visualizer;
