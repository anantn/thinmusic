# ThinMusic

https://www.thinmusic.com

A web player for Apple Music with last.fm support

<img alt="ThinMusic Preview" src="https://raw.githubusercontent.com/anantn/thinmusic/master/src/i/Preview.png" width="380" height="380"/>

## Credits

Modern web development stands on the shoulders of giants.

- [React](https://reactjs.org) and [create-react-app](https://github.com/facebook/create-react-app)
- [async-es](https://www.npmjs.com/package/async-es) and [normalize.css](https://necolas.github.io/normalize.css/)
- UI by [Blueprint JS](https://blueprintjs.com)
- Backend in [Firebase](https://firebase.google.com)
- Hosted by [Netlify](https://www.netlify.com)
- Drag and Drop by [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)
- Device detection by [react-device-detect](https://github.com/duskload/react-device-detect)
- Visualizer from [Webamp](https://github.com/captbaritone/webamp)
- Last.FM [library](https://github.com/jammus/lastfm-node) in Node

## Development

Obtain a [MusicKit JS](https://developer.apple.com/documentation/musickitjs) developer token.

`$ REACT_APP_MUSICKIT_TOKEN=<token> REACT_APP_FIREBASE_TOKEN=<token> npm start`

## Deployment

`$ REACT_APP_MUSICKIT_TOKEN=<token> REACT_APP_FIREBASE_TOKEN=<token> GENERATE_SOURCEMAP=false PUBLIC_URL=https://www.thinmusic.com npm run build`

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)
