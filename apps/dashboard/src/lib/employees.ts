/**
 * Simulated multi-employee roster.
 *
 * The end-state (see `apps/dashboard/CONTEXT.md`) lists every Employee grouped by
 * Role, fed from a shared bucket. That data source does not exist yet, so this
 * module fakes it: one real Employee ("You") is backed by the local `data.json`
 * via the Analyzer, and the rest are synthetic teammates with plausible mock
 * summaries so the grouped-by-role roster looks alive.
 */

export interface EmployeeSummary {
  sessions: number;
  requests: number;
  /** USD. */
  credits: number;
  aiLoc: number;
  /** 0–100. */
  flowScore: number;
  /** Sparkline series, oldest → newest. */
  daily: number[];
}

export interface Employee {
  /** URL slug, e.g. "you", "a-cohen". */
  id: string;
  name: string;
  /** Group key / job classification, e.g. "Developers". */
  role: string;
  /** True only for the `data.json`-backed employee. */
  real: boolean;
  /** Present for synthetic teammates; the real one is computed at load time. */
  summary?: EmployeeSummary;
}

/** Stable id of the single real, data.json-backed employee. */
export const REAL_EMPLOYEE_ID = 'you';

/**
 * The team roster. Only the real employee ("You", backed by the local
 * `data.json`) is listed; their `summary` is computed from the Analyzer at load
 * time. Synthetic teammates can be added back here to simulate the multi-employee
 * end-state.
 */
export const SYNTHETIC_EMPLOYEES: Employee[] = [
  { id: REAL_EMPLOYEE_ID, name: 'You', role: 'Developers', real: true },
];

export function getEmployee(id: string): Employee | undefined {
  return SYNTHETIC_EMPLOYEES.find((e) => e.id === id);
}

/** Group employees by role, preserving first-seen role order. */
export function getRoles(employees: Employee[]): Record<string, Employee[]> {
  const groups: Record<string, Employee[]> = {};
  for (const emp of employees) {
    (groups[emp.role] ??= []).push(emp);
  }
  return groups;
}
