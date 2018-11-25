import React, { Component } from "react";

class Visualizer extends Component {
  constructor(props) {
    super(props);

    this.bars = true;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.player = window.document.getElementById("apple-music-player");
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;
    //this.analyzer.smoothingTimeConstant = 0.0;
    this.bufferSize = this.analyzer.frequencyBinCount;
    this.buffer = new Uint8Array(this.bufferSize);

    this.source = this.context.createMediaElementSource(this.player);
    this.source.connect(this.analyzer);
    this.source.connect(this.context.destination);

    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.drawing = true;
    this.draw();
  }

  componentWillUnmount() {
    this.drawing = false;
    this.source.disconnect();
  }

  toggle = () => {
    this.bars = !this.bars;
  };

  draw = () => {
    if (this.drawing) {
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
    if (this.bars) {
      this.drawBars(canvas, ctx);
    } else {
      this.drawOscilloscope(canvas, ctx);
    }
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

  drawOscilloscope = (canvas, ctx) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(19, 124, 189)";

    ctx.beginPath();
    let sliceWidth = (canvas.width * 1.0) / this.bufferSize;
    let x = 0;

    for (var i = 0; i < this.bufferSize; i++) {
      var v = this.buffer[i] / 128.0;
      var y = (v * canvas.height) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  render() {
    return <canvas onClick={this.toggle} ref={this.canvas} />;
  }
}

export default Visualizer;
