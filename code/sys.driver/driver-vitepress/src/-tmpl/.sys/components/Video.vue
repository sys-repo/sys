
<template>
  <div ref="root" class="root"></div>
</template>

<script setup lang="ts">
import { setup, ref } from './React.setup';
import { Video } from './Video';

type VideoProps = { title?: string; src?: string };
const root = ref();
const props = defineProps<VideoProps>();
setup(root, Video, props);
</script>

<style scoped>
.root {
  padding-bottom: 10px;
}
</style>
