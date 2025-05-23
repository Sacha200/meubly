import express from 'express';
import cors from 'cors';
import v1Router from './routes/v1.js';
import helmet from 'helmet';

export const app = express();

// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000"] // Ajustez selon votre front-end
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());

app.use('/api/v1', v1Router);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

