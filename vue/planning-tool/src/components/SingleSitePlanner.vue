<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="3"><v-card><v-card-title>Specify Trial Parameters</v-card-title><v-card-text>
        <v-text-field v-model.number="recruitmentRate" label="Expected recruitment rate per week" type="number" min="0" step="0.01" variant="outlined" density="compact"></v-text-field>
        <v-text-field v-model.number="recruitmentGoal" label="Recruitment goal for the trial" type="number" min="0" step="1" variant="outlined" density="compact"></v-text-field>
        <v-slider v-model.number="confidenceLevel" label="Confidence Level" :min="1" :max="99" :step="1" thumb-label class="mt-4">
          <template v-slot:append><v-text-field v-model="confidenceLevel" density="compact" style="width: 70px" type="number" hide-details single-line></v-text-field><span class="ml-2">%</span></template>
        </v-slider>
      </v-card-text></v-card></v-col>
      <v-col cols="12" md="9"><v-card><v-card-title>Output</v-card-title><v-card-text><v-row>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="teal" icon="mdi-account-group"><template v-slot:title><div class="text-h6">{{ recruitmentGoal }} participants</div></template>Total specified recruitment goal</v-alert></v-col>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="light-blue" icon="mdi-chart-line"><template v-slot:title><div class="text-h6">{{ recruitmentRate }}</div></template>Expected number of weekly recruitments</v-alert></v-col>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="purple" icon="mdi-clock-outline"><template v-slot:title><div class="text-h6">{{ simulationResult.duration }}</div></template>Estimated recruitment duration</v-alert></v-col>
      </v-row></v-card-text></v-card></v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { runSimulation, calc_CI } from '../services/simulation';
const recruitmentRate = ref(1.12);
const recruitmentGoal = ref(60);
const confidenceLevel = ref(95);
const simulationResult = computed(() => {
  const params = { recruitRate: recruitmentRate.value, RecruitGoal: recruitmentGoal.value };
  if (params.recruitRate <= 0 || params.RecruitGoal <= 0) return { duration: 'Invalid input' };
  const simVector = runSimulation(params);
  const ci = calc_CI(simVector, confidenceLevel.value / 100);
  return { duration: `${ci.lower.toFixed(1)} - ${ci.upper.toFixed(1)} weeks` };
});
</script>
<style scoped>.v-alert { height: 100%; }</style>
