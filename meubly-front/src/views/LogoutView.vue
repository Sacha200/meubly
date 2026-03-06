<template>
  <div></div>
</template>

<script>
import { supabase } from '../supabase';
import { useAuthStore } from '../stores/authStore';

export default {
  name: 'LogoutView',
  async mounted() {
    const authStore = useAuthStore();
    authStore.clearRole();
    await supabase.auth.signOut();
    this.$router.push('/');
  }
};
</script>
