/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Global Error Catcher:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur Interne du Serveur";

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};
