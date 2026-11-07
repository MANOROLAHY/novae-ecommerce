import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const configUrl = new URL("../config.js", import.meta.url).href;

test("config.js : refuser une configuration sans ADMIN_PASSWORD", () => {
  const { ADMIN_PASSWORD, ...childEnv } = process.env;

  const script = `
    import(${JSON.stringify(configUrl)})
      .then(() => {
        console.error("La configuration aurait dû échouer.");
        process.exitCode = 1;
      })
      .catch((error) => {
        if (error.message.includes("ADMIN_PASSWORD doit être définie")) {
          console.log(error.message);
        } else {
          console.error(error);
          process.exitCode = 1;
        }
      });
  `;

  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    {
      env: childEnv,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ADMIN_PASSWORD doit être définie/);
});
