<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4"><v-card><v-card-title>Specify Trial Parameters</v-card-title><v-card-text>
        <v-text-field v-model.number="siteQty" label="Number of sites" type="number" :min="1" step="1" variant="outlined" density="compact"></v-text-field>
        <v-slider v-model.number="confidenceLevel" label="Confidence Level" :min="1" :max="99" :step="1" thumb-label class="mt-4">
          <template v-slot:append><v-text-field v-model="confidenceLevel" density="compact" style="width: 70px" type="number" hide-details single-line></v-text-field><span class="ml-2">%</span></template>
        </v-slider>
        <v-btn @click="runMultiSiteSimulation" color="primary" class="mt-4" block :loading="isLoading">Run Simulation</v-btn>
      </v-card-text></v-card></v-col>
      <v-col cols="12" md="8"><v-card><v-card-title>Output</v-card-title><v-card-text><v-row>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="teal" icon="mdi-account-group"><template v-slot:title><div class="text-h6">{{ totalRecruitmentGoal }} participants</div></template>Total specified recruitment goal</v-alert></v-col>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="light-blue" icon="mdi-map-marker-radius"><template v-slot:title><div class="text-h6">{{ determinativeSiteInfo }}</div></template>Determinative site</v-alert></v-col>
        <v-col cols="12" sm="4"><v-alert border="start" variant="tonal" color="purple" icon="mdi-clock-outline"><template v-slot:title><div class="text-h6">{{ overallDuration }}</div></template>Estimated recruitment duration</v-alert></v-col>
      </v-row></v-card-text></v-card></v-col>
    </v-row>
    <v-row><v-col cols="12"><v-card><v-card-title>Site Details</v-card-title><v-data-table :headers="headers" :items="sites" class="elevation-1" density="compact">
      <template v-slot:item.recruitRate="{ item }"><v-text-field v-model.number="item.recruitRate" type="number" hide-details density="compact"></v-text-field></template>
      <template v-slot:item.RecruitGoal="{ item }"><v-text-field v-model.number="item.RecruitGoal" type="number" hide-details density="compact"></v-text-field></template>
      <template v-slot:item.StartDelay="{ item }"><v-text-field v-model.number="item.StartDelay" type="number" hide-details density="compact"></v-text-field></template>
    </v-data-table></v-card></v-col></v-row>
    <v-row><v-col cols="12"><v-card><v-card-title>Gantt Chart</v-card-title><v-card-text><div id="gantt-chart"></div></v-card-text></v-card></v-col></v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { runSimulation, calc_CI, SimulationParams } from '../services/simulation';
import Plotly from 'plotly.js-dist-min';
interface Site extends SimulationParams { SiteNo: number; StartDelay: number; }
interface SiteResult extends Site { lowerCI: number; upperCI: number; }
const siteQty = ref(10);
const confidenceLevel = ref(95);
const sites = ref<Site[]>([]);
const isLoading = ref(false);
const overallDuration = ref('N/A');
const determinativeSiteInfo = ref('N/A');
const headers = [ { title: 'Site No.', key: 'SiteNo', sortable: false }, { title: 'Recruitment Rate (per week)', key: 'recruitRate', sortable: false }, { title: 'Recruitment Goal', key: 'RecruitGoal', sortable: false }, { title: 'Start Delay (weeks)', key: 'StartDelay', sortable: false }, ];
const totalRecruitmentGoal = computed(() => sites.value.reduce((sum, site) => sum + (site.RecruitGoal || 0), 0));
watch(siteQty, (newQty) => {
  const newSites: Site[] = [];
  for (let i = 1; i <= newQty; i++) {
    newSites.push(sites.value.find(s => s.SiteNo === i) || { SiteNo: i, recruitRate: 1, RecruitGoal: 10, StartDelay: 0 });
  }
  sites.value = newSites;
}, { immediate: true });
const drawGanttChart = (results: SiteResult[]) => {
  const traces: Partial<Plotly.Trace>[] = results.map(site => ({
    x: [site.lowerCI, site.upperCI], y: [`Site ${site.SiteNo}`, `Site ${site.SiteNo}`], base: site.StartDelay, type: 'bar', orientation: 'h', name: `Site ${site.SiteNo}`, text: `Duration: ${site.lowerCI.toFixed(1)} - ${site.upperCI.toFixed(1)} weeks`, hoverinfo: 'text',
  }));
  const layout: Partial<Plotly.Layout> = { title: 'Site Recruitment Timelines', xaxis: { title: 'Duration (Weeks)' }, yaxis: { title: 'Site Number', autorange: 'reversed' }, barmode: 'stack', showlegend: false, height: sites.value.length * 55 };
  Plotly.newPlot('gantt-chart', traces, layout);
};
const runMultiSiteSimulation = async () => {
  isLoading.value = true;
  const siteResults: SiteResult[] = await Promise.all(sites.value.map(async (site) => {
    const simVector = runSimulation(site);
    const ci = calc_CI(simVector, confidenceLevel.value / 100);
    return { ...site, lowerCI: ci.lower, upperCI: ci.upper };
  }));
  let determinativeSite: SiteResult | null = null;
  let maxUpperCI = -1;
  siteResults.forEach(result => {
    const delayedUpperCI = result.upperCI + result.StartDelay;
    if (delayedUpperCI > maxUpperCI) {
      maxUpperCI = delayedUpperCI;
      determinativeSite = result;
    }
  });
  if (determinativeSite) {
    const lower = (determinativeSite.lowerCI + determinativeSite.StartDelay).toFixed(1);
    const upper = (determinativeSite.upperCI + determinativeSite.StartDelay).toFixed(1);
    overallDuration.value = `${lower} - ${upper} weeks`;
    determinativeSiteInfo.value = `Site ${determinativeSite.SiteNo}`;
  } else {
    overallDuration.value = 'N/A';
    determinativeSiteInfo.value = 'N/A';
  }
  drawGanttChart(siteResults);
  isLoading.value = false;
};
</script>
<style scoped>.v-alert { height: 100%; }</style>
