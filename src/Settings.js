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
  Toaster,
  ButtonGroup
} from "@blueprintjs/core";

import "./s/Settings.css";
import Utils from "./Utils";
import Apple from "./i/Apple.png";
import AppleSmall from "./i/AppleSmall.svg";
import Google from "./i/Google.svg";
import Facebook from "./i/Facebook.svg";
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

  componentDidUpdate(prevProps) { }

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
      timeout: 15000,
      message:
        "Sorry, there was a problem connecting with your " +
        provider +
        " account. Please try again!"
    });
  };

  connectSocial = provider => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.login(provider, (user, err) => {
      if (err) {
        if (
          err.code &&
          err.code === "auth/account-exists-with-different-credential"
        ) {
          Utils.loginMethods(err.email)
            .then(methods => {
              if (!methods || methods.length < 0) {
                self.errorToast(provider);
                self.setState({ loginInProgress: false });
                return;
              }
              Toaster.create().show({
                icon: "error",
                intent: "danger",
                timeout: 15000,
                message: (
                  <span>
                    You've previously signed in using{" "}
                    {Utils.domainToProvider(methods[0])}!<br />
                    Please log in again using the same provider.
                  </span>
                )
              });
              self.setState({ loginInProgress: false });
            })
            .catch(() => {
              self.errorToast(provider);
              self.setState({ loginInProgress: false });
            });
        } else {
          self.errorToast(provider);
          self.setState({ loginInProgress: false });
        }
      } else {
        try {
          window.gtag("event", "login", { method: provider });
        } catch (e) { }
      }
    });
  };

  connectApple = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    Utils.connectApple(self.props.music, (token, err) => {
      if (err) {
        self.errorToast("Apple Music");
      } else {
        try {
          window.gtag("event", "login", { method: "Apple" });
        } catch (e) { }
        self.props.userUpdate();
      }
      self.setState({ loginInProgress: false });
    });
  };

  connectAppleAnonymous = () => {
    let self = this;
    self.setState({ loginInProgress: true });
    self.props.music
      .authorize()
      .then(token => {
        Utils.loginAnonymously()
          .then(self.connectApple)
          .catch(e => {
            self.errorToast("Apple Music");
          });
      })
      .catch(e => {
        self.errorToast("Apple Music");
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
          try {
            window.gtag("event", "login", { method: "LastFM" });
          } catch (e) { }
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

  renderSocialLogin = () => {
    return (
      <ButtonGroup
        large={true}
        vertical={true}
        className="login"
        alignText="left"
      >
        <Button
          className="google"
          onClick={this.connectSocial.bind(this, "Google")}
        >
          <img src={Google} alt="Log in with Google" />
          <span>Log in with Google</span>
        </Button>
        <Button
          className="facebook"
          onClick={this.connectSocial.bind(this, "Facebook")}
        >
          <img src={Facebook} alt="Log in with Facebook" />
          <span>Log in with Facebook</span>
        </Button>
      </ButtonGroup>
    );
  };

  renderSocialLoginExplanation = () => {
    return (
      <div>
        <h2>Use ThinMusic on multiple devices?</h2>
        <div>
          Log in with any social account and seamlessly synchronize access to
          your music
          <Popover isOpen={this.state.explain}>
            <div style={{ marginBottom: "10px" }}>
              &nbsp;(
              <Icon className="help" icon="help" onClick={this.toggleExplain} />
              )
            </div>
            <div>
              <Card style={{ maxWidth: "400px" }}>
                <p>
                  <b>Why should I log in to ThinMusic?</b>
                  <br />
                  Logging into ThinMusic lets us securely store your Apple Music
                  and last.fm account information in the cloud. You won't need
                  to re-connect these services if you log in to ThinMusic on any
                  new device.
                </p>
                <p>
                  <b>What data do you receive?</b>
                  <br />
                  We only request your name and email address from the login
                  provider. We use this to authenticate you, and occasionally
                  send important account related email.
                  <br />
                  <b>
                    No spam, no sharing, and definitely no wall posts or tweets,
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
        </div>
      </div>
    );
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
    let connected = click => {
      return (
        <td>
          <Icon icon="tick-circle" intent="success" />
          &nbsp; Connected &nbsp;
          <Button
            onClick={() => {
              click(() => {
                window.location.reload();
              });
            }}
            minimal={true}
            icon="cross"
            intent="danger"
            title="Disconnect"
          />
        </td>
      );
    };

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
              {Utils.userProvider() ? (
                <tr>
                  <td className="right">{Utils.userProvider()}</td>
                  {connected(
                    Utils.disconnectSocial.bind(Utils, Utils.userProvider())
                  )}
                </tr>
              ) : null}
              <tr>
                <td className="right">
                  {this.props.user.apple ? "" : "Connect "}Apple Music
                </td>
                {this.props.user.apple ? (
                  connected(Utils.disconnectApple)
                ) : (
                  <td>
                    <img
                      onClick={this.connectApple}
                      alt="Listen on Apple Music"
                      src={AppleSmall}
                    />
                  </td>
                )}
              </tr>
              <tr>
                <td className="right">
                  {this.props.user.lastfm ? "" : "Connect "}Last.FM
                </td>
                {this.props.user.lastfm ? (
                  connected(Utils.disconnectLastFM)
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
          {Utils.userProvider() ? null : this.renderSocialLoginExplanation()}
          {Utils.userProvider() ? null : this.renderSocialLogin()}
          {Utils.userProvider() ? null : <Divider />}
          <h2>Known Issues</h2>
          <ul>
            <li>
              If you logged in with a Facebook account prior to Dec 25, 2022 -
              you will have to reconnect your Apple Music and Last.FM accounts.
              This does not affect Google or Twitter logins.
            </li>
            <li>
              Music playback is interrupted after 10 or so minutes. This appears
              to be an issue with MusicKit being unable to
              <a href="https://github.com/TTFM-Labs/public/issues/7">
                refresh a DRM token consistently
              </a>. The fix for this will be rolled out with MusicKit v3.
            </li>
            <li>
              The queue cannot be saved as a playlist, and is cleared when the
              page is refreshed. We are exploring persisting playback and queue
              state - in the meantime - we don't recommend closing or refreshing
              the page until you are done with your session.
            </li>
          </ul>
          <h2>Need help or have feedback?</h2>
          <p style={{ marginBottom: "20px" }}>
            Send us an email:&nbsp;
            <a href="mailto:support@thinmusic.com">support@thinmusic.com</a>,
            we're eager to hear from you.
          </p>
        </div>
      );
    } else {
      content = (
        <div>
          <h2>
            ThinMusic is a web player for{" "}
            <a href="https://apple.co/2AA0rdx">Apple Music</a>
          </h2>
          <Card className="nux">
            <div className="box">
              <h3>New user?</h3>
              <p>Sign in with your Apple ID to get started:</p>
              <Button
                large={true}
                className="apple"
                onClick={this.connectAppleAnonymous}
              >
                <img src={Apple} alt="Log in with Apple" />
                <span>Connect with Apple Music</span>
              </Button>
              <p>
                No Apple Music account? Sign up for a{" "}
                <a href="https://apple.co/2AA0rdx">free trial</a>!
              </p>
            </div>
            <Divider />
            <div className="box">
              <h3>Returning user?</h3>
              {this.renderSocialLogin()}
            </div>
          </Card>
          <div>
            <img
              alt="ThinMusic Preview"
              style={{
                height: "380px",
                width: "380px",
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
