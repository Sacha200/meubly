// Importation des modules

import express from 'express';
import cors from 'cors';
import v1Router from './routes/v1.js';
import helmet from 'helmet';

// Création de l'application Express
export const app = express();

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging pour déboguer les requêtes CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Configuration de Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "http://localhost:5000", "https://meubly-front.vercel.app", "https://*.vercel.app"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuration CORS pour permettre les requêtes depuis le front-end
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (applications mobiles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:5000',
      'https://meubly-front.vercel.app',
      'https://meubly.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin non autorisée:', origin);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Configuration du routeur
app.use('/api/v1', v1Router);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});