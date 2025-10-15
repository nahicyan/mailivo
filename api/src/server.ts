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
import { campaignSchedulerService } from "./services/campaignScheduler.service";
import { mailcowSyncJob } from "./jobs/mailcowSync.job";
import { emailStatusManager } from "./services/tracking/EmailStatusManager";
import { trackingSyncService } from "./services/tracking/TrackingSyncService";
import { timeBasedAutomationJob } from "./jobs/timeBasedAutomation.job";
import { closingDateJob } from "./jobs/closingDate.job";

const logger = console;

const app = express();

// Fix trust proxy issue
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(cookieParser());

// Configure CORS properly for images
app.use(
  cors({
    origin: ["https://mailivo.landivo.com", "https://landivo.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Content-Length"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

//File Upload
app.use("/api", routes);
app.use(
  "/uploads",
  (_req, res, next) => {
    // Set CORS headers specifically for uploads
    res.header("Access-Control-Allow-Origin", "https://mailivo.landivo.com");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");

    // Set cache headers
    res.header("Cache-Control", "public, max-age=31536000");

    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

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

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", error);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🚀 Starting Mailivo API Server...");

    // Connect to MongoDB first
    await connectDatabase();

    // Connect to Redis - CRITICAL: App crashes if Redis unavailable
    await connectRedis();

    // 🔔 Setup event listeners for status changes
    emailStatusManager.on("statusChanged", async (data) => {
      logger.info("Email status changed:", data);
      // You can add additional handlers here (e.g., notifications)
    });

    // Start the server only after both connections succeed
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("🎯 All services connected and ready!");

      // Start the campaign scheduler
      campaignSchedulerService.start();

      // Start time-based automation scheduler
      console.log("✅ Time-based automation scheduler initialized");

      // Start closing date automation scheduler
      console.log("✅ Closing date automation scheduler initialized");
      // The job auto-starts and survives server restarts via Redis persistence

      if (process.env.MAILCOW_SYNC_ENABLED === "true") {
        console.log("✅ Mailcow sync job initialized");
        void mailcowSyncJob;
      }
    });

    if (process.env.MAILCOW_SYNC_ENABLED === "true") {
      console.log("✅ Mailcow sync job initialized");
      // The job auto-starts based on the cron schedule
      void mailcowSyncJob; // This line prevents the unused warning
    }

    // 🛑 Graceful shutdown (you had SIGTERM already; SIGINT added too)
    const graceful = async (signal: string) => {
      try {
        console.log(`\n${signal} received. Cleaning up...`);
        await emailStatusManager.cleanup();
        await trackingSyncService.cleanup();
        campaignSchedulerService.stop();
        await timeBasedAutomationJob.stop();
        await closingDateJob.stop();
        process.exit(0);
      } catch (err) {
        console.error("Cleanup error:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => void graceful("SIGTERM"));
    process.on("SIGINT", () => void graceful("SIGINT"));
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
