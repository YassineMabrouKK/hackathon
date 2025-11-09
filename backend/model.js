// backend/model.js
import * as ort from "onnxruntime-node";

let session;

export async function loadModel() {
  if (!session) {
    session = await ort.InferenceSession.create("./024e5fba-7cbd-4f52-95af-aeefc46f21a8.onnx");
    console.log("ONNX model loaded");
  }
  return session;
}

export async function predict(inputData) {
  const session = await loadModel();

  // Convert your input data to float32 tensor
  const tensor = new ort.Tensor("float32", Float32Array.from(inputData), [1, inputData.length]);

  // The input name must match your model's input
  const feeds = { input: tensor }; 
  const results = await session.run(feeds);

  // The output name must match your model's output
  return results.output.data;
}
