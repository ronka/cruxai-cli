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
 * The simulated team. "You" is the real employee (no `summary` — it is computed
 * from the Analyzer at load time); everyone else is a hand-written teammate.
 */
export const SYNTHETIC_EMPLOYEES: Employee[] = [
  { id: REAL_EMPLOYEE_ID, name: 'You', role: 'Developers', real: true },
  {
    id: 'a-cohen',
    name: 'Avi Cohen',
    role: 'Developers',
    real: false,
    summary: {
      sessions: 96,
      requests: 1314,
      credits: 31.4,
      aiLoc: 12880,
      flowScore: 68,
      daily: [4, 6, 3, 7, 5, 8, 4, 6, 9, 5, 7, 6],
    },
  },
  {
    id: 'r-levi',
    name: 'Roni Levi',
    role: 'Developers',
    real: false,
    summary: {
      sessions: 142,
      requests: 2210,
      credits: 52.1,
      aiLoc: 20640,
      flowScore: 81,
      daily: [7, 9, 6, 10, 8, 11, 7, 9, 12, 8, 10, 11],
    },
  },
  {
    id: 'd-mizrahi',
    name: 'Dana Mizrahi',
    role: 'Developers',
    real: false,
    summary: {
      sessions: 74,
      requests: 902,
      credits: 22.7,
      aiLoc: 8410,
      flowScore: 59,
      daily: [3, 4, 2, 5, 4, 6, 3, 5, 4, 6, 5, 4],
    },
  },
  {
    id: 'm-adler',
    name: 'Maya Adler',
    role: 'Accounting',
    real: false,
    summary: {
      sessions: 18,
      requests: 146,
      credits: 4.1,
      aiLoc: 980,
      flowScore: 42,
      daily: [1, 0, 2, 1, 1, 0, 2, 1, 1, 2, 0, 1],
    },
  },
  {
    id: 'y-shapira',
    name: 'Yossi Shapira',
    role: 'IT',
    real: false,
    summary: {
      sessions: 33,
      requests: 287,
      credits: 7.6,
      aiLoc: 2140,
      flowScore: 51,
      daily: [2, 1, 3, 2, 1, 2, 3, 1, 2, 2, 1, 3],
    },
  },
  {
    id: 't-bar',
    name: 'Tamar Bar',
    role: 'IT',
    real: false,
    summary: {
      sessions: 27,
      requests: 219,
      credits: 5.9,
      aiLoc: 1620,
      flowScore: 47,
      daily: [1, 2, 1, 3, 2, 1, 2, 2, 3, 1, 2, 2],
    },
  },
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
