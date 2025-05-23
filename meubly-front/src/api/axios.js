import axios from 'axios';

// Création d'une instance Axios avec une configuration par défaut
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


// Intercepteur pour les réponses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Gestion globale des erreurs
        if (error.response) {
            // Erreur avec réponse du serveur
            console.error('Erreur de réponse:', error.response.data);
            
            // Gestion des erreurs d'authentification
            if (error.response.status === 401) {
                // Rediriger vers la page de connexion ou rafraîchir le token
                localStorage.removeItem('token');
                // window.location.href = '/login';
            }
        } else if (error.request) {
            // Erreur sans réponse du serveur
            console.error('Erreur de requête:', error.request);
        } else {
            // Autres erreurs
            console.error('Erreur:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export default api; 