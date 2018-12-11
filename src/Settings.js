import React, { Component } from "react";
import {
  Button,
  Card,
  Divider,
  HTMLTable,
  Icon,
  Popover,
  Spinner
} from "@blueprintjs/core";

import "./Settings.css";
import Utils from "./Utils";
import Login from "./Login.svg";
import Facebook from "./Facebook.png";
import Preview from "./Preview.png";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      explain: false,
      loginInProgress: false
    };
    this.authObserver = null;
  }

  componentWillMount() {
    this.authObserver = Utils.addAuthObserver(() => {
      this.setState({ loginInProgress: false });
    });
  }

  componentWillUnmount() {
    if (this.authObserver) this.authObserver();
  }

  componentDidUpdate(prevProps) {}

  cancel = () => {
    this.setState({ loginInProgress: false });
  };

  connectFacebook = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.login();
  };

  connectApple = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.connectApple(self.props.music, () => {
      self.props.userUpdate();
      self.setState({ loginInProgress: false });
    });
  };

  toggleExplain = () => {
    this.setState({ explain: !this.state.explain });
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
      let apple = "";
      if (!this.props.user.apple) {
        apple = (
          <p style={{ marginTop: "15px" }}>
            Looks like you haven't connected your account to Apple Music yet.
            <br />
            Click the button to log in with your Apple ID and get started.
          </p>
        );
      }
      content = (
        <div>
          <h2>Hi, {Utils.userName()}!</h2>
          <Divider />
          {apple}
          <HTMLTable>
            <tbody>
              <tr>
                <td className="right">Facebook</td>
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
          <img
            style={{ height: "300px", marginBottom: "20px" }}
            src={Preview}
          />
          <p>
            Log in with Facebook to begin connecting your Apple Music account
            and play full songs.
          </p>
          <img
            alt="Log in with Facebook"
            style={{ cursor: "pointer" }}
            onClick={this.connectFacebook}
            src={Facebook}
          />
          <div style={{ marginTop: "20px" }}>
            <Popover isOpen={this.state.explain}>
              <Button onClick={this.toggleExplain}>Why should I log in?</Button>
              <div>
                <Card style={{ maxWidth: "400px" }}>
                  <p>
                    <b>Why do I need to log in to ThinMusic?</b>
                    <br />
                    Logging into ThinMusic lets us securely store your Apple
                    Music and last.fm account information. You won't need to
                    re-connect these services if you log in to ThinMusic on a
                    new computer.
                  </p>
                  <p>
                    <b>What data do you receive?</b>
                    <br />
                    We request only your name and email address from Facebook.
                    We use this to authenticate you, and occasionally send
                    important account related email.
                    <br />
                    <b>
                      No spam, no sharing, and definitely no wall posts,
                      promise.
                    </b>
                  </p>
                </Card>
              </div>
            </Popover>
          </div>
        </div>
      );
    }

    return <Card className="settings">{content}</Card>;
  }
}

export default Settings;
