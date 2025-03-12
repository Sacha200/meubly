<template>
  <header class="bg-white shadow">
    <div class="container mx-auto flex justify-between items-center p-4">
      <div class="text-lg font-bold title-font">
        <router-link to="/" class="text-lg font-bold title-font">Meubly</router-link>
      </div>
      <nav class="flex-1">
        <ul class="flex justify-center space-x-4">
          <li>Home</li>
          <li>Shop</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
  .title-font {
    font-family: 'Poppins', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #B88E2F;
  }
</style>
