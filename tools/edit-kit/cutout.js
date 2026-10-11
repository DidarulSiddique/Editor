// usage: node cutout.js <node_modules dir> <in.png:out.png>...
const path = require("path");
const fs = require("fs");
const req = require("module").createRequire(path.join(process.argv[2], "_entry.js"));
const { removeBackground } = req("@imgly/background-removal-node");
(async () => {
  for (const pair of process.argv.slice(3)) {
    const [input, output] = pair.split(":");
    const t0 = Date.now();
    const blob = await removeBackground(new Blob([fs.readFileSync(input)], { type: "image/png" }), {
      model: "medium",
      publicPath: "file://" + path.join(process.argv[2], "@imgly/background-removal-node/dist/"),
      output: { format: "image/png" },
    });
    fs.writeFileSync(output, Buffer.from(await blob.arrayBuffer()));
    console.log(output, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  }
})().catch((e) => { console.error(e); process.exit(1); });
