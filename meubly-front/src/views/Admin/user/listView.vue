<template>
  <div>
    <h1>Liste des utilisateurs</h1>
  </div>
</template>

<script>
import { getUsers } from '@/clientapi';

export default {
  data() {  
    return {
      users: []
    }
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {    
    async fetchUsers() {
      try {
        const users = await getUsers();
        this.users = users;
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);   
      }
    }
  }
}
</script>


