<template>
    <div class="flex my-10 columns-2" style="display: flex;gap: 81px;">

        <div class="w-1/3">
            <img :src="product.cover_url" :alt="product.name" class="w-full h-auto object-cover"
                style="height: 358px;width: 380px;" />
        </div>

        <!-- Colonne de droite pour les données du meuble -->
        <div class="ml-10 ">
            <div class="flex items-center">
                <h2 class="title-product mr-2">{{ product.name }}</h2>
                <!-- Icône en forme de cœur -->
                <svg class="ml-auto favoris" width="25" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M6.875 1.75C3.76888 1.75 1.25 4.07988 1.25 6.95438C1.25 9.2748 2.23437 14.782 11.924 20.3491C12.0976 20.4478 12.2968 20.5 12.5 20.5C12.7032 20.5 12.9024 20.4478 13.076 20.3491C22.7656 14.782 23.75 9.2748 23.75 6.95438C23.75 4.07988 21.2311 1.75 18.125 1.75C15.0189 1.75 12.5 4.90417 12.5 4.90417C12.5 4.90417 9.98112 1.75 6.875 1.75Z"
                        stroke="#B88E2F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
            <p class="mt-6 price-product">{{ product.price }} €</p>
            <p class="text-description">{{ product.description }}</p>
        </div>
    </div>
</template>

<script>

export default {
    name: 'ProductDetail',
    props: {
        product: Object,
    },
};
</script>
<style>
.title-product {
    font-size: 24px;
    font-family: 'Poppins-Bold';
    color: #3A3A3A;
}

.price-product {
    font-size: 20px;
    font-family: 'Poppins-SemiBold';
    color: #3A3A3A;
}

.text-description {
    font-size: 16px;
    font-family: 'Poppins-Medium';
    color: #767676;
}
.favoris {
    cursor: pointer;
    color: #B88E2F;
}
</style>
