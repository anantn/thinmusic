import React, { Component } from "react";
import { Card } from "@blueprintjs/core";
import firebase from "firebase";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import "./Settings.css";

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
        signInSuccessWithAuthResult: () => false
      }
    };
  }
  render() {
    if (this.props.user) {
      return (
        <div>Hi, {firebase.auth().currentUser.displayName.split(" ")[0]}!</div>
      );
    }
    return (
      <Card className="settings">
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
              We request only your name and email address from Facebook, Google
              or Twitter. We use this to authenticate you, and occasionally send
              important account related email. No spam, no wall posts, no
              tweets, promise.
            </li>
          </ul>
        </div>
      </Card>
    );
  }
}

export default Settings;
