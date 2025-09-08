// api/src/server.ts
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { routes } from "./routes";

const app = express();

// Fix trust proxy issue
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(cookieParser());

// Configure CORS properly for images
app.use(cors({
  origin: [
    'https://mailivo.landivo.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

//File Upload
app.use("/api", routes);
app.use('/uploads', (_req, res, next) => {
  // Set CORS headers specifically for uploads
  res.header('Access-Control-Allow-Origin', 'https://mailivo.landivo.com');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Set cache headers
  res.header('Cache-Control', 'public, max-age=31536000');
  
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// Routes - mounted directly without /api prefix
app.use("/", routes);

// Error handling
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🚀 Starting Mailivo API Server...");

    // Connect to MongoDB first
    await connectDatabase();

    // Connect to Redis - CRITICAL: App crashes if Redis unavailable
    await connectRedis();

    // Start the server only after both connections succeed
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("🎯 All services connected and ready!");
    });
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
