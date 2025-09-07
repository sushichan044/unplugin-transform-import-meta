<template>
  <div>{{ import.meta.TPL_IGNORED }}</div>
</template>

<script lang="ts">
const a = import.meta.SCRIPT_VALUE;
const b = import.meta.fn("x", 1);
</script>

<script setup lang="ts">
const c = import.meta.SETUP_VALUE;
const d = import.meta.fn('y', 2);
</script>
