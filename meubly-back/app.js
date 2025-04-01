import express from 'express';
import cors from 'cors';
import v1Router from './routes/v1.js';

export const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json());

app.use('/api/v1', v1Router);

