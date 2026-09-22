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

const store: Record<string, FaultState> = {};

export function getFaultState(machineId: string): FaultState {
  return store[machineId] ?? { ...defaultState };
}

export function setFaultState(machineId: string, update: Partial<FaultState>): FaultState {
  const current = getFaultState(machineId);
  store[machineId] = { ...current, ...update };
  return store[machineId];
}
