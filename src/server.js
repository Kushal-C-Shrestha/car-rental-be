import "dotenv/config";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { authRoutes } from "./routes/authRoutes.js";
import { vehicleRoutes } from "./routes/vehicleRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3001";

app.use(
  cors({
    origin: frontendOrigin,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "car-rental-backend",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`Car rental backend running on http://localhost:${port}`);
});
