import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-idea-market",
  description: "A peer-to-peer idea market where every participant invests a shared budget.",
  accentHex: "#0f766e",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
