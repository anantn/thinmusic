import React, { Component } from "react";
import {
  Button,
  Card,
  Divider,
  HTMLTable,
  Icon,
  Spinner
} from "@blueprintjs/core";
import firebase from "firebase";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import "./Settings.css";
import Login from "./Login.svg";
import Utils from "./Utils";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.uiConfig = {
      signInFlow: "popup",
      signInOptions: [
        {
          provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          scopes: ["public_profile", "email"]
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          scopes: ["profile", "email"]
        },
        firebase.auth.TwitterAuthProvider.PROVIDER_ID
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => false,
        signInFailure: err => {}
      },
      tosUrl: "https://www.thinmusic.com/tos.html",
      privacyPolicyUrl: "https://www.thinmusic.com/privacy.html"
    };
    this.state = {
      loginInProgress: false
    };
  }

  cancel = () => {
    this.setState({ loginInProgress: false });
  };

  connectApple = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.connectApple(self.props.music, () => {
      self.props.userUpdate();
      self.setState({ loginInProgress: false });
    });
  };

  render() {
    if (this.state.loginInProgress) {
      return (
        <div className="settings">
          <Spinner />
          <Button onClick={this.cancel}>Cancel</Button>
        </div>
      );
    }

    let content = "";
    if (this.props.user) {
      let currentUser = firebase.auth().currentUser;
      let apple = "";
      if (!this.props.user.apple) {
        apple = (
          <p style={{ marginTop: "15px" }}>
            Looks like you haven't connected your account to Apple Music yet.
            <br />
            Click the button to authenticate with your Apple ID to get started.
          </p>
        );
      }
      content = (
        <div>
          <h2>Hi, {currentUser.displayName.split(" ")[0]}!</h2>
          <Divider />
          {apple}
          <HTMLTable>
            <tbody>
              <tr>
                <td className="right">{Utils.providerName(currentUser)}</td>
                <td>
                  <Icon icon="tick-circle" intent="success" />
                  &nbsp; Connected
                </td>
              </tr>
              <tr>
                <td className="right">Apple Music</td>
                {this.props.user.apple ? (
                  <td>
                    <Icon icon="tick-circle" intent="success" />
                    &nbsp; Connected
                  </td>
                ) : (
                  <td>
                    <img
                      onClick={this.connectApple}
                      alt="Listen on Apple Music"
                      src={Login}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </HTMLTable>
        </div>
      );
    } else {
      content = (
        <div>
          <h2>ThinMusic is a web player for Apple Music.</h2>
          <p>
            You can search for tracks and play them with a 30 second limit in
            anonymous mode.
          </p>
          <p>
            Sign in with Facebook, Google or Twitter to begin connecting your
            Apple Music account.
          </p>
          <StyledFirebaseAuth
            uiConfig={this.uiConfig}
            firebaseAuth={firebase.auth()}
          />
          <div className="bp3-running-text">
            <ul>
              <li>
                <b>Why do I need to sign in to ThinMusic?</b>
                <br />
                Signing into ThinMusic lets us securely store Apple Music and
                last.fm account information. You won't need to re-connect these
                services if you sign in to ThinMusic on a new computer.
              </li>
              <li>
                <b>What data do you receive?</b>
                <br />
                We request only your name and email address from Facebook,
                Google or Twitter. We use this to authenticate you, and
                occasionally send important account related email. No spam, no
                wall posts, no tweets, promise.
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return <Card className="settings">{content}</Card>;
  }
}

export default Settings;
