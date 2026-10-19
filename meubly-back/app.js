import express from "express";
import cors from "cors";
import helmet from "helmet";
import v1Router from "./routes/v1.js";
import { requestLogger } from "./middlewares/loggerMiddleware.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:5173",
          "http://localhost:5000",
          "https://meubly-front.vercel.app",
        ],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://meubly-front.vercel.app",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
    },
    credentials: true,
  })
);

app.use("/api/v1", v1Router);
app.use("/api/v1", (req, res) => res.status(404).json({ error: "Route introuvable" }));
app.use(errorHandler);

export default app;
