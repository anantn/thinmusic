import React, { Component } from "react";

const PIXEL_DENSITY = 2;
const NUM_BARS = 20;
const BAR_PEAK_DROP_RATE = 0.01;
const GRADIENT_COLOR_COUNT = 16;
const PEAK_COLOR_INDEX = 23;
const COLORS = [
  "rgb(0,0,0)",
  "rgb(24,33,41)",
  "rgb(239,49,16)",
  "rgb(206,41,16)",
  "rgb(214,90,0)",
  "rgb(214,102,0)",
  "rgb(214,115,0)",
  "rgb(198,123,8)",
  "rgb(222,165,24)",
  "rgb(214,181,33)",
  "rgb(189,222,41)",
  "rgb(148,222,33)",
  "rgb(41,206,16)",
  "rgb(50,190,16)",
  "rgb(57,181,16)",
  "rgb(49,156,8)",
  "rgb(41,148,0)",
  "rgb(24,132,8)",
  "rgb(255,255,255)",
  "rgb(214,214,222)",
  "rgb(181,189,189)",
  "rgb(160,170,175)",
  "rgb(148,156,165)",
  "rgb(150,150,150)"
];

class Visualizer extends Component {
  constructor(props) {
    super(props);

    this.analyzer = this.props.context.createAnalyser();
    this.analyzer.fftSize = 2048;
    this.bufferSize = this.analyzer.frequencyBinCount;
    this.buffer = new Uint8Array(this.bufferSize);
    this.octaveBuckets = this.createOctaveBuckets(this.bufferSize);
    this.barPeaks = new Array(NUM_BARS).fill(0);
    this.barPeakFrames = new Array(NUM_BARS).fill(0);

    this.props.source.connect(this.analyzer);
    this.canvas = React.createRef();
  }

  componentWillMount() {
    this.barCanvas = this.preRenderBar(
      this._barWidth(),
      this._height(),
      COLORS,
      this._renderHeight()
    );
  }

  componentDidMount() {
    this.drawing = true;
    this.draw();
  }

  componentWillUnmount() {
    this.drawing = false;
    this.props.source.disconnect(this.analyzer);
  }

  toggle = () => {
    this.setState({ logo: !this.state.logo });
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
    ctx.imageSmoothingEnabled = false;
    this.drawBars(canvas, ctx);
  };

  drawBars = (canvas, ctx) => {
    this.analyzer.getByteFrequencyData(this.buffer);
    const heightMultiplier = this._renderHeight() / 256;
    const barWidth = this._barWidth();
    const xOffset = barWidth + PIXEL_DENSITY; // Bar width, plus a pixel of spacing to the right.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let j = 0; j < NUM_BARS - 1; j++) {
      const start = this.octaveBuckets[j];
      const end = this.octaveBuckets[j + 1];
      let amplitude = 0;
      for (let k = start; k < end; k++) {
        amplitude += this.buffer[k];
      }
      amplitude /= end - start;

      // The drop rate should probably be normalized to the rendering FPS, for now assume 60 FPS
      let barPeak =
        this.barPeaks[j] -
        BAR_PEAK_DROP_RATE * Math.pow(this.barPeakFrames[j], 2);
      if (barPeak < amplitude) {
        barPeak = amplitude;
        this.barPeakFrames[j] = 0;
      } else {
        this.barPeakFrames[j] += 1;
      }
      this.barPeaks[j] = barPeak;

      this._printBar(
        ctx,
        j * xOffset,
        amplitude * heightMultiplier,
        barPeak * heightMultiplier
      );
    }
  };

  _barWidth() {
    const barWidth = Math.floor(this._width() / NUM_BARS);
    if (barWidth % 2 === 0) {
      return barWidth;
    }

    return barWidth - 1;
  }

  _renderWidth() {
    return this.props.width;
  }

  _renderHeight() {
    return this.props.height;
  }

  _height() {
    return this.props.height * PIXEL_DENSITY;
  }

  _width() {
    return this.props.width * PIXEL_DENSITY;
  }

  _printBar(ctx, x, height, peakHeight) {
    height = Math.ceil(height) * PIXEL_DENSITY;
    peakHeight = Math.ceil(peakHeight) * PIXEL_DENSITY;
    if (height > 0 || peakHeight > 0) {
      const y = this._height() - height;
      // Draw the gradient
      const b = this._barWidth();
      if (height > 0) {
        ctx.drawImage(this.barCanvas, 0, y, b, height, x, y, b, height);
      }

      // Draw the gray peak line
      const peakY = this._height() - peakHeight;
      ctx.fillStyle = COLORS[PEAK_COLOR_INDEX];
      ctx.fillRect(x, peakY, b, PIXEL_DENSITY);
    }
  }

  preRenderBar(barWidth, height, colors, renderHeight) {
    /**
     * The order of the colours is commented in the file: the fist two colours
     * define the background and dots (check it to see what are the dots), the
     * next 16 colours are the analyzer's colours from top to bottom, the next
     * 5 colours are the oscilloscope's ones, from center to top/bottom, the
     * last colour is for the analyzer's peak markers.
     */

    // Off-screen canvas for pre-rendering a single bar gradient
    const barCanvas = document.createElement("canvas");
    barCanvas.width = barWidth;
    barCanvas.height = height;

    const offset = 2; // The first two colors are for the background;
    const gradientColors = colors.slice(offset, offset + GRADIENT_COLOR_COUNT);

    const barCanvasCtx = barCanvas.getContext("2d");
    const multiplier = GRADIENT_COLOR_COUNT / renderHeight;
    // In shade mode, the five colors are, from top to bottom:
    // 214, 102, 0 -- 3
    // 222, 165, 24 -- 6
    // 148, 222, 33 -- 9
    // 57, 181, 16 -- 12
    // 24, 132, 8 -- 15
    // TODO: This could probably be improved by iterating backwards
    for (let i = 0; i < renderHeight; i++) {
      const colorIndex = GRADIENT_COLOR_COUNT - 1 - Math.floor(i * multiplier);
      barCanvasCtx.fillStyle = gradientColors[colorIndex];
      const y = height - i * PIXEL_DENSITY;
      barCanvasCtx.fillRect(0, y, barWidth, PIXEL_DENSITY);
    }
    return barCanvas;
  }

  createOctaveBuckets(bufferSize) {
    const octaveBuckets = new Array(NUM_BARS).fill(0);
    const minHz = 200;
    const maxHz = 22050;
    const octaveStep = Math.pow(maxHz / minHz, 1 / NUM_BARS);

    octaveBuckets[0] = 0;
    octaveBuckets[1] = minHz;
    for (let i = 2; i < NUM_BARS - 1; i++) {
      octaveBuckets[i] = octaveBuckets[i - 1] * octaveStep;
    }
    octaveBuckets[NUM_BARS - 1] = maxHz;

    for (let i = 0; i < NUM_BARS; i++) {
      const octaveIdx = Math.floor((octaveBuckets[i] / maxHz) * bufferSize);
      octaveBuckets[i] = octaveIdx;
    }

    return octaveBuckets;
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        ref={this.canvas}
        style={{ width, height }}
        width={width * PIXEL_DENSITY}
        height={height * PIXEL_DENSITY}
      />
    );
  }
}

export default Visualizer;
