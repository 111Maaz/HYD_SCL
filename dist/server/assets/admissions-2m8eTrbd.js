import { lazyRouteComponent } from "@tanstack/react-router";
const SplitComponent = lazyRouteComponent(() => import("./AdmissionsAdmin-DOWupdUa.js"), "AdmissionsAdmin");
export {
  SplitComponent as component
};
