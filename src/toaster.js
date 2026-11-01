import { OverlayToaster, Position } from "@blueprintjs/core";

// One shared toaster for the whole app, created on first use.
let instance = null;

export function toast(props) {
  if (!instance) {
    instance = OverlayToaster.createAsync({ position: Position.TOP });
  }
  instance
    .then(t => t.show(props))
    .catch(e => console.error("toast failed", e));
}
