<template>
  <div>
    <button @click="logout">Se déconnecter</button>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue';

export default {
  async setup() {
    let { error } = await supabase.auth.signOut();
    if(!error){
      this.$router.push('/');
    }


  }



};
</script>
