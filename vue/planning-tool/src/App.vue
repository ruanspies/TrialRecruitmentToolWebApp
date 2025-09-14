<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>Clinical Trial Recruitment Planning Tool</v-toolbar-title>
      <v-spacer></v-spacer>
      <img src="/logo.png" height="40" />
    </v-app-bar>
    <v-main>
      <v-tabs v-model="tab" grow>
        <v-tab value="single">Single-Site Planning</v-tab>
        <v-tab value="multi">Multiple-Sites Planning</v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item value="single"><SingleSitePlanner /></v-window-item>
        <v-window-item value="multi"><MultiSitePlanner /></v-window-item>
      </v-window>
    </v-main>
  </v-app>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import SingleSitePlanner from './components/SingleSitePlanner.vue';
import MultiSitePlanner from './components/MultiSitePlanner.vue';
const tab = ref('single');
</script>
<style scoped>img { margin-right: 16px; }</style>
