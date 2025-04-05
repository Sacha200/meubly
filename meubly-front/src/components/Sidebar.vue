<template>
  <div class="w-64 py-5  container  my-5">
    <div class="flex items-center justify-between mb-4 ml-9">
      <span class="text-[20px] ">Filtrer par</span>
      <button class="border border-[#DBDBDB] text-[#767676] pr-11 py-2 pl-3 rounded-sm filter">Default</button>
    </div>
    
    <div class="sidebar">
        <div class="relative mb-4">
      <input
        type="text"
        placeholder="Rechercher"
        class="w-full p-2 border border-gray-300 rounded"
      />
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
      </svg>
    </div>
    <div class="category mt-2" style="padding-inline: 10px;">
    <h3 class="text-[24px] title mb-2">Categories</h3>
    <ul class="space-y-4 mt-5">
      <li class="flex justify-between">
        <span>Crafts</span>
        <span>2</span>
      </li>
      <li class="flex justify-between">
        <span>Design</span>
        <span>8</span>
      </li>
      <li class="flex justify-between">
        <span>Handmade</span>
        <span>7</span>
      </li>
      <li class="flex justify-between">
        <span>Interior</span>
        <span>1</span>
      </li>
      <li class="flex justify-between">
        <span>Wood</span>
        <span>6</span>
      </li>
    </ul>
</div>
</div>
  </div>
</template>

<style scoped>
  .rounded-lg {
    border-radius: 10px;
  }

  .sidebar{
    border: solid 1px #DBDBDB ;
    padding: 3%;
  margin-left: 2rem;
  border-radius: 10px;
  width: 100%;
  height: 400px;

  }

  .filter{
    border-radius: 10px;
  }

  .title{
    font-family: 'Poppins-Medium';
    font-size: 24px;
    color: #3A3A3A;
  }

  li{
    font-family: 'Poppins-Regular';
    font-size: 16px;
    color: #767676;
  }
</style> 