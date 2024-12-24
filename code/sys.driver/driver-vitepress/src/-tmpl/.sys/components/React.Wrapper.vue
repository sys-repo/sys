
<template>
  <div ref="root"></div>
</template>

<script setup lang="ts">
import { setup, ref } from './React.setup';
import { MyComponent } from './React.Wrapper.Sample';

const root = ref();
setup(root, MyComponent, { count: 1234 });
</script>

<style scoped></style>
