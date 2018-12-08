import React, { Component } from "react";
import firebase from "firebase";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import "./Settings.css";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.uiConfig = {
      signInFlow: "popup",
      signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
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
