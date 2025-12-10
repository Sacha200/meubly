// Importation des modules

import express from 'express';
import cors from 'cors';
import v1Router from './routes/v1.js';
import helmet from 'helmet';

import { requestLogger } from './middlewares/loggerMiddleware.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

// Création de l'application Express
export const app = express();

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use(requestLogger);

// Configuration de Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173", "http://localhost:5000", "https://meubly-front.vercel.app"]
    }
  },


  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuration CORS pour permettre les requêtes depuis le front-end
app.use(cors());

// Configuration du routeur
app.use('/api/v1', v1Router);

// Global Error Handler
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;