export type FaultScenario = "nominal" | "cable_cut" | "misalignment" | "bearing_bpfi" | "voltage_unbalance";

export interface FaultState {
  scenario: FaultScenario;
  vibrationThreshold: number;
  tempThreshold: number;
}

const defaultState: FaultState = {
  scenario: "nominal",
  vibrationThreshold: 4.5,
  tempThreshold: 70.0,
};

declare global {
  var __pdm_fault_store__: Record<string, FaultState> | undefined;
}

function getStore(): Record<string, FaultState> {
  if (!globalThis.__pdm_fault_store__) {
    globalThis.__pdm_fault_store__ = {};
  }
  return globalThis.__pdm_fault_store__;
}

export function getFaultState(machineId: string): FaultState {
  const store = getStore();
  return store[machineId] ?? { ...defaultState };
}

export function setFaultState(machineId: string, update: Partial<FaultState>): FaultState {
  const store = getStore();
  const current = getFaultState(machineId);
  store[machineId] = { ...current, ...update };
  return store[machineId];
}
