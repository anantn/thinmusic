import React, { Component } from "react";
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
      return <div>Hi, {firebase.auth().currentUser.displayName}!</div>;
    }
    return (
      <StyledFirebaseAuth
        uiConfig={this.uiConfig}
        firebaseAuth={firebase.auth()}
      />
    );
  }
}

export default Settings;
