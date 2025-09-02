<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Environment: {{ env }}</p>
    <p>URL: {{ url }}</p>
  </div>
</template>

<script setup>
const title = "Vue SFC Test";
const env = import.meta.env.NODE_ENV;
const url = import.meta.url;
</script>

<style scoped>
div {
  padding: 20px;
}
</style>