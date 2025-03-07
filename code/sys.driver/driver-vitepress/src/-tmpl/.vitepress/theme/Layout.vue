<template>
  <Layout>
    <template #aside-outline-after>
      <React kind="Panel" />
    </template>
  </Layout>
</template>

<script setup>
/**
 * Docs: https://vitepress.dev/guide/extending-default-theme#layout-slots
 */
import DefaultTheme from 'vitepress/theme';
const { Layout } = DefaultTheme;
</script>
