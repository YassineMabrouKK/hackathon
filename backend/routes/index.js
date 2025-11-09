import express from "express";
import connectDB from "./db/connect.js";
import playerRoutes from "./routes/playerRoutes.js";

const app = express();
app.use(express.json());

const PORT = 5000;

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  // Then start Express server
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
};

startServer();

// Routes
app.use("/players", playerRoutes);
