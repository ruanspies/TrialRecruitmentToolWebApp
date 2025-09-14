import { jStat } from 'jstat';
export interface SimulationParams { recruitRate: number; RecruitGoal: number; }
export interface ConfidenceInterval { lower: number; upper: number; }
const NUM_SIMULATIONS = 1000;
const MAX_WEEKS = 10000;
const CI_SAMPLES = 10;
const NUM_CI_GROUPS = NUM_SIMULATIONS / CI_SAMPLES;
export function runSimulation(params: SimulationParams): number[] {
  const { recruitRate, RecruitGoal } = params;
  if (recruitRate <= 0 || RecruitGoal <= 0) return Array(NUM_SIMULATIONS).fill(0);
  const durationVector: number[] = [];
  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    let cumulativeRecruits = 0;
    let weeks = 0;
    while (cumulativeRecruits < RecruitGoal && weeks < MAX_WEEKS) {
      cumulativeRecruits += jStat.poisson.sample(recruitRate);
      weeks++;
    }
    durationVector.push(weeks);
  }
  return durationVector;
}
export function calc_CI(simVector: number[], probability: number): ConfidenceInterval {
  if (simVector.some(v => v === 0) || simVector.length === 0) return { lower: 0, upper: 0 };
  const groupMeans: number[] = [];
  for (let i = 0; i < NUM_CI_GROUPS; i++) {
    const group = simVector.slice(i * CI_SAMPLES, (i * CI_SAMPLES) + CI_SAMPLES);
    groupMeans.push(jStat.mean(group));
  }
  const meanOfMeans = jStat.mean(groupMeans);
  const stdDevOfMeans = jStat.stdev(groupMeans, true);
  const tCrit = jStat.studentt.inv((1 - probability) / 2, NUM_CI_GROUPS - 1);
  const marginOfError = (tCrit * stdDevOfMeans) / Math.sqrt(NUM_CI_GROUPS);
  return { lower: meanOfMeans + marginOfError, upper: meanOfMeans - marginOfError };
}
