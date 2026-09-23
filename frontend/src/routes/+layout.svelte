<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { auth } from '$stores/authStore';
  import Navbar from '$components/Navbar.svelte';
  import Footer from '$components/Footer.svelte';
  import Toast from '$components/Toast.svelte';

  onMount(() => {
    auth.init();
  });
</script>

<div class="app-layout">
  <Navbar />
  <main class="main-content">
    <slot />
  </main>
  <Footer />
  <Toast />
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
  }
</style>
