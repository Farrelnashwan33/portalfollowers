<script lang="ts">
  export let width = '100%';
  export let height = '20px';
  export let rounded = 'var(--radius-md)';
  export let count = 1;
</script>

{#each Array(count) as _}
  <div
    class="skeleton-loader skeleton-shimmer"
    style="width: {width}; height: {height}; border-radius: {rounded}; margin-bottom: 0.5rem;"
  ></div>
{/each}

<style>
  .skeleton-loader {
    display: block;
    background: rgba(255, 255, 255, 0.04);
  }
</style>
