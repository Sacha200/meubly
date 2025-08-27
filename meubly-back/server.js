// import { app } from "./app.js";
// import furnituresRouter from './routes/v1/furnitures.js';
// import authRouter from './routes/v1/auth.js';
// import { furnitureService } from './services/furnitureService.js';

// // server.js
// const port = 3000;

// // Initialiser la base de données avec des données de test
// furnitureService.initializeDatabase()
//     .then(() => console.log('Base de données initialisée avec succès'))
//     .catch(error => console.error('Erreur lors de l\'initialisation:', error));

// // Routes
// app.use('/api/v1', furnituresRouter);
// app.use('/api/v1/auth', authRouter);

// // run the server
// app.listen(port, () => {
//     console.log(`App listening on port ${port}`);
// });