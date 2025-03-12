<template>
  <Layout>
    <template v-for="slot in slots" #[slot]>
      <React kind="Panel" />
    </template>
  </Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme';
const { Layout } = DefaultTheme;

/**
 * Docs: https://vitepress.dev/guide/extending-default-theme#layout-slots
 */
const slots = [
  'nav-bar-title-before',
  'nav-bar-title-after',
  'nav-bar-content-before',
  'nav-bar-content-after',
  'nav-screen-content-before',
  'nav-screen-content-after',
  'sidebar-nav-before',
  'sidebar-nav-after',
  'aside-top',
  'aside-outline-before',
  'aside-outline-after',
];
</script>
