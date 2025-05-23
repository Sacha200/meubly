<template>
    <div class="comparison-container mb-10">
    <h3 class="comparison-title">Comparaison des prix</h3>
    <div class="comparison-table">
        <div v-for="offer in offers" :key="offer.id" class="offer-card">
            <div class="offer-details">
                <img :src="offer.logo" alt="Logo de l'entreprise" class="company-logo" />
                <div>
                    <p class="company-name">{{ offer.company }}</p>
                    <p class="product-name">{{ offer.productName }}</p>
                </div>
            </div>
            <div class="offer-price">
                <p class="price">{{ offer.price }} €</p>
                <button class="view-site-button">Voir le site</button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>
export default {
    name: 'TableComparison',
    data() {
        return {
            offers: [
                {
                    id: 1,
                    company: 'Amazon',
                    productName: 'Habitat et Jardin - Canapé d\'angle Convertible et Réversible Axel 3 Places Blanc et Gris',
                    price: 349,
                    logo: '../../../public/assets/Amazon_icon.png',
                },
                {
                    id: 2,
                    company: 'Ikea',
                    productName: 'Canapé d\'angle convertible/réversible Axel - 3 places - Blanc/Gris',
                    price: 479,
                    logo: '../../../public/assets/ikea-logo.png',
                },
                {
                    id: 3,
                    company: 'ManoMano',
                    productName: 'Habitat et Jardin - Canapé d\'angle Convertible et Réversible Axel 3 Places Blanc et Gris',
                    price: 372,
                    logo: '../../../public/assets/manomano.png',
                },
            ],
        };
    },

    methods: {
        async getProvider(){
            try {
                const response = await axios.get('http://localhost:3000/api/v1/providers');
                console.log(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des fournisseurs:', error);
            }
            console.log(this.providers);
        }
    }
};
</script>

<style scoped>
.comparison-title {
    font-family: 'Poppins-Bold';
    color: #3A3A3A;
    margin-bottom: 20px;
}

.comparison-table {
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #D9D9D9;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
}

.offer-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #fff;
}

.offer-details {
    display: flex;
    align-items: center;
}

.company-logo {
    width: 25px;
    height: auto;
    margin-top: -25px;
    margin-right: 10px;
    display: flex;
    align-items: center;
}

.company-name {
    font-family: 'Poppins-Bold';
    font-size: 16px;
    color: #3A3A3A;
    display: flex;
    align-items: center;
}

.product-name {
    font-family: 'Poppins-Medium';
    color: #3A3A3A;
    font-size: 14px;
    margin-left: -26px;
    margin-top: 10px;
}

.offer-price {
    display: flex;
    align-items: center;
}

.price {
    font-family: 'Poppins-SemiBold';
    font-size: 20px;
    color: #3A3A3A;
    margin-right: 20px;
}

.view-site-button {
    padding: 10px 40px;
    background-color: #fff;
    border: 2px solid #B88E2F;
    border-radius: 5px;
    color: #B88E2F;
    cursor: pointer;
    transition: background-color 0.3s;
    font-family: 'Poppins-SemiBold';
    font-size: 16px;
}

.view-site-button:hover {
    background-color: #B88E2F;
    color: #fff;
}
</style>


