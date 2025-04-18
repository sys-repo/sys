<template>
  <div ref="root"></div>
</template>

<script setup lang="ts">
import { Props } from '../u/u.Props';
import { lookup } from './React.components';
import { ref, setup } from './React.setup';

type Base64EncodedJsonString = string;
type InputProps = { kind: string; props?: Base64EncodedJsonString };

const root = ref();
const input = defineProps<InputProps>();
const props = Props.decode(input.props ?? '');
setup(root, props, async () => lookup(input.kind));
</script>

<style scoped></style>
