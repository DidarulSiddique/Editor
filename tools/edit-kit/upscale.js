// usage: node upscale.js <node_modules dir> <out dir> <in:outname>...  (ESRGAN 2x)
const path = require("path");
const fs = require("fs");
const nm = process.argv[2];
const req = require("module").createRequire(path.join(nm, "_entry.js"));
const tf = req("@tensorflow/tfjs-node");
const Upscaler = req("upscaler/node");
const x2 = req("@upscalerjs/esrgan-medium/2x");
(async () => {
  const upscaler = new Upscaler({ model: x2 });
  for (const pair of process.argv.slice(4)) {
    const [input, name] = pair.split(":");
    const t0 = Date.now();
    const img = tf.node.decodeImage(fs.readFileSync(input), 3);
    const out = await upscaler.upscale(img, { output: "tensor", patchSize: 128, padding: 8 });
    const png = await tf.node.encodePng(tf.cast(tf.clipByValue(out, 0, 255), "int32"));
    fs.writeFileSync(path.join(process.argv[3], name), png);
    console.log(name, img.shape.join("x"), "->", out.shape.join("x"), ((Date.now() - t0) / 1000).toFixed(1) + "s");
    tf.dispose([img, out]);
  }
})();
