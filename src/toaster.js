import { Toaster } from "@blueprintjs/core";

// One shared toaster for the whole app (creating one per toast leaks DOM roots).
let instance = null;

export function toast(props) {
  if (!instance) {
    instance = Toaster.create();
  }
  return instance.show(props);
}
