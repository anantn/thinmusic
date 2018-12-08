import React, { Component } from "react";
import { Card } from "@blueprintjs/core";
import firebase from "firebase";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.uiConfig = {
      signInFlow: "popup",
      signInOptions: [
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          scopes: ["profile", "email"]
        },
        {
          provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          scopes: ["public_profile", "email"]
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
      <Card>
        <h2>ThinMusic is a web player for Apple Music.</h2>
        <p>
          You can search for and play songs for upto 30 seconds in anonymous
          mode.
        </p>
        <p>
          Sign in with your Google, Facebook or Twitter account to unlock the
          full experience:
        </p>
        <StyledFirebaseAuth
          uiConfig={this.uiConfig}
          firebaseAuth={firebase.auth()}
        />
        <p>
          We only use social login to obtain your email and store your Apple
          Music or Last.FM account links securely. We won't post anything
          without your permission or spam you, promise.
        </p>
      </Card>
    );
  }
}

export default Settings;
