import React, { Component } from "react";
import {
  Button,
  Card,
  Divider,
  HTMLTable,
  Icon,
  Popover,
  Spinner,
  Alert,
  Toaster
} from "@blueprintjs/core";

import "./s/Settings.css";
import Utils from "./Utils";
import Login from "./i/Login.svg";
import Facebook from "./i/Facebook.png";
import Preview from "./i/Preview.png";
import LastFM from "./i/LastFM.png";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      explain: false,
      lfmInProgress: false,
      loginInProgress: false
    };
    this.lfmToken = null;
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

  open = path => {
    window.open(path, "window", "toolbar=no, menubar=no, resizable=yes");
  };

  errorToast = provider => {
    Toaster.create().show({
      icon: "error",
      intent: "danger",
      message:
        "Sorry, there was a problem connecting with your " +
        provider +
        " account. Please try again!"
    });
  };

  connectFacebook = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.login((user, err) => {
      if (err) {
        self.errorToast("Facebook");
      }
      self.setState({ loginInProgress: false });
    });
  };

  connectApple = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.connectApple(self.props.music, (token, err) => {
      if (err) {
        self.errorToast("Apple Music");
      } else {
        self.props.userUpdate();
      }
      self.setState({ loginInProgress: false });
    });
  };

  connectLastFM = () => {
    let self = this;
    self.setState({ lfmInProgress: true });
    Utils.connectLastFMToken((token, err) => {
      if (err) {
        self.errorToast("Last.FM");
        self.setState({ lfmInProgress: false });
      } else {
        self.lfmToken = token;
      }
    });
  };

  connectLastFMConfirm = () => {
    let self = this;
    if (self.lfmToken) {
      self.setState({ lfmInProgress: false, loginInProgress: true });
      Utils.connectLastFMSession(self.lfmToken, (lfmUser, err) => {
        if (err) {
          self.errorToast("Last.FM");
        } else {
          self.props.userUpdate();
        }
        self.setState({ loginInProgress: false });
      });
    } else {
      self.errorToast("Last.FM");
    }
  };

  connectLastFMCancel = () => {
    this.lfmToken = null;
    this.setState({ lfmInProgress: false, loginInProgress: false });
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
    let connected = (
      <td>
        <Icon icon="tick-circle" intent="success" />
        &nbsp; Connected
      </td>
    );
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
          <Alert
            className="bp3-dark"
            cancelButtonText="Cancel"
            confirmButtonText="OK"
            intent="success"
            icon="link"
            isOpen={this.state.lfmInProgress}
            onConfirm={this.connectLastFMConfirm}
            onCancel={this.connectLastFMCancel}
          >
            <p>
              Linking to your Last.FM account...
              <br />
              <br />
              Click "OK" when you've completed authorizing ThinMusic in the
              popup.
            </p>
          </Alert>
          <h2>Hi, {Utils.userName()}!</h2>
          <Divider />
          {apple}
          <HTMLTable>
            <tbody>
              <tr>
                <td className="right">Facebook</td>
                {connected}
              </tr>
              <tr>
                <td className="right">Apple Music</td>
                {this.props.user.apple ? (
                  connected
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
              <tr>
                <td className="right">Last.FM</td>
                {this.props.user.lastfm ? (
                  connected
                ) : (
                  <td>
                    <img
                      className="rounded"
                      onClick={this.connectLastFM}
                      alt="Connect Last.FM"
                      src={LastFM}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </HTMLTable>
          <Divider />
          <h2>Need help or have feedback?</h2>
          <p>
            Send us an email:&nbsp;
            <a href="mailto:support@thinmusic.com">support@thinmusic.com</a>,
            we're eager to hear from you.
          </p>
        </div>
      );
    } else {
      content = (
        <div>
          <h2>ThinMusic is a web player for Apple Music.</h2>
          <p>
            Log in with Facebook&nbsp;
            <Popover isOpen={this.state.explain}>
              <Icon className="help" icon="help" onClick={this.toggleExplain} />
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
                    We only request your name and email address from Facebook.
                    We use this to authenticate you, and occasionally send
                    important account related email.
                    <br />
                    <b>
                      No spam, no sharing, and definitely no wall posts,
                      promise.
                    </b>
                  </p>
                  <Button
                    style={{ textAlign: "right" }}
                    icon="thumbs-up"
                    onClick={this.toggleExplain}
                  >
                    Ok
                  </Button>
                </Card>
              </div>
            </Popover>
            &nbsp; to begin connecting your Apple Music account and scrobble to
            last.fm:
          </p>
          <img
            alt="Log in with Facebook"
            style={{ cursor: "pointer" }}
            onClick={this.connectFacebook}
            src={Facebook}
          />
          <div>
            <img
              alt="ThinMusic Preview"
              style={{
                height: "380px",
                marginTop: "20px",
                marginBottom: "20px"
              }}
              src={Preview}
            />
          </div>
        </div>
      );
    }

    return (
      <Card className="settings">
        {content}
        <div className="footer">
          <span
            className="link"
            onClick={this.open.bind(this, "/privacy.html")}
          >
            Privacy Policy
          </span>
          &nbsp;|&nbsp;
          <span className="link" onClick={this.open.bind(this, "/tos.html")}>
            Terms of Service
          </span>
        </div>
      </Card>
    );
  }
}

export default Settings;
