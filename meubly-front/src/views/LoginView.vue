<template>
    <div class="register-page flex">
        <div class="welcome-section flex flex-col items-center justify-center p-10">
            <h1 class="text-center">Bienvenue sur <br/>
              <span class="text-gold items-center">Meubly !</span></h1>
            <button class="connect-button mt-6">Se connecter</button>
        </div>
        <div class="form-section flex flex-col justify-center p-10 items-center">
            <h2 class=" text-gold mb-6">Création de compte</h2>
            <form class="flex flex-col space-y-4 form-input">
                <input type="text" placeholder="Name" class="input-field" />
                <input type="email" placeholder="Email" class="input-field" />
                <input type="password" placeholder="Password" class="input-field" />
            </form> 
            <button type="submit" class="submit-button" @click="goToHome">S'inscrire</button>
  
        </div>
    </div>
</template>

<script>
export default {
    name: 'RegisterView',
    methods: {
        goToHome() {
            this.$router.push('/');
        }
    }
}
</script>

<style scoped>

h1 {
    font-family: 'Poppins-Bold';
    font-size: 32px;
    color: #3A3A3A;
}


.register-page {
    height: 100vh;
}

.welcome-section {
    background-color: #f8f1e7;
    width: 35%;
}

.form-section {
    width: 65%;
}

.form-input {
   max-width: 100%;
   width: 75%;
}

.text-gold {
    color: #B88E2F;
    font-family: 'Poppins-SemiBold';
    font-size: 32px;
}

.connect-button {
    padding: 10px 20px;
    width: 40%;
    border: 2px solid #B88E2F;
    border-radius: 30px;
    background-color: transparent;
    color: #3A3A3A;
    cursor: pointer;
    transition: background-color 0.3s;
}

.connect-button:hover {
    background-color: #B88E2F;
    color: white;
}

.input-field {
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.submit-button {
    padding: 10px 20px;
    width:20%;
    background-color: #B88E2F;
    color: white;
    border-radius: 30px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 20px;
    font-family: 'Poppins-Medium';
    font-size: 16px;
}

.submit-button:hover {
    background-color: #9c7a2a;
}
</style>
