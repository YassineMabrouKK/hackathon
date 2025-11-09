import * as ort from "onnxruntime-node";
import path from "path";

const modelPath = path.resolve("C:/Users/MSI/Desktop/hackaa/hackathon/backend/injury_risk_rf_reg (1).onnx");

let session = null;

// Load model once
export async function loadModel() {
  try {
    session = await ort.InferenceSession.create(modelPath);
    console.log("✅ ONNX model loaded successfully");
  } catch (err) {
    console.error("❌ Error loading ONNX model:", err.message);
  }
}

export async function predict(inputData) {
  if (!session) {
    console.error("❌ Model session is not initialized");
    return [null];
  }

  try {
    const tensor = new ort.Tensor("float32", Float32Array.from(inputData), [1, inputData.length]);
    const feeds = { "float_input": tensor }; // Use exact input node name from model

    const results = await session.run(feeds);
    const outputName = Object.keys(results)[0];
    return results[outputName].data;
  } catch (err) {
    console.error("❌ Error running prediction:", err.message);
    return [null];
  }
}
