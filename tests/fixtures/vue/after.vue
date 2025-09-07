<template>
  <div>{{ import.meta.TPL_IGNORED }}</div>
</template>

<script lang="js"">
const a = "script";
const b = "x:1";
const e = import.meta["SCRIPT_VALUE"]; // only transform dot-notation
</script>

<script setup lang="ts">
const c = "setup";
const d = "y:2";
</script>
