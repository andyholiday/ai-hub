// Empty stub for onnxruntime-node.
// @xenova/transformers v2.x lists onnxruntime-node as optionalDependency and tries
// to require it unconditionally in src/backends/onnx.js. In the browser we use
// onnxruntime-web (WASM/WebGPU) instead — this stub satisfies the require() so the
// browser bundle doesn't fail with webpackMissingModule at runtime.
//
// See: src/lib/moderation/browser-classifier.ts (Pattern P1.3, ADR-TBD)
module.exports = {};
