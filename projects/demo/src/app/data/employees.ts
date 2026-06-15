import type { ConfigColumns } from 'ngx-datatables-net';

/** A single employee row used throughout the demo examples. */
export interface Employee {
  id: number;
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: string; // ISO date
  salary: number;
  status: 'Active' | 'On Leave' | 'Terminated';
  email: string;
}

const FIRST = [
  'Aisha',
  'Liam',
  'Sofia',
  'Noah',
  'Mei',
  'Lucas',
  'Priya',
  'Mateo',
  'Hana',
  'Omar',
  'Ava',
  'Ethan',
  'Yuki',
  'Diego',
  'Zara',
  'Felix',
  'Nadia',
  'Kai',
  'Lena',
  'Tariq',
];
const LAST = [
  'Khan',
  'Smith',
  'Garcia',
  'Müller',
  'Chen',
  'Rossi',
  'Patel',
  'Silva',
  'Tanaka',
  'Hassan',
  'Johnson',
  'Novak',
  'Kim',
  'Costa',
  'Ahmed',
  'Berg',
  'Petrov',
  'Wong',
  'Larsen',
  'Aziz',
];
const POSITIONS = [
  'Software Engineer',
  'Product Manager',
  'UX Designer',
  'Data Analyst',
  'DevOps Engineer',
  'QA Engineer',
  'Engineering Manager',
  'Technical Writer',
  'Support Lead',
  'Solutions Architect',
];
const OFFICES = ['London', 'San Francisco', 'Tokyo', 'Berlin', 'Singapore', 'Toronto', 'Sydney'];
const STATUSES: Employee['status'][] = ['Active', 'On Leave', 'Terminated'];

/** Deterministic pseudo-random generator so the dataset is stable across reloads/tests. */
export function makeEmployees(count: number): Employee[] {
  const rows: Employee[] = [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const year = 2014 + Math.floor(rand() * 11);
    const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0');
    rows.push({
      id: i + 1,
      name: `${first} ${last}`,
      position: POSITIONS[Math.floor(rand() * POSITIONS.length)],
      office: OFFICES[Math.floor(rand() * OFFICES.length)],
      age: 22 + Math.floor(rand() * 40),
      startDate: `${year}-${month}-${day}`,
      salary: 45000 + Math.floor(rand() * 120000),
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
      email: `${first}.${last}@example.com`.toLowerCase(),
    });
  }
  return rows;
}

/** 57 employees — enough rows to exercise paging, sorting, filtering and virtual scroll. */
export const EMPLOYEES: readonly Employee[] = Object.freeze(makeEmployees(57));

/** Standard column definition for the employee dataset (object data source). */
export const EMPLOYEE_COLUMNS: ConfigColumns[] = [
  { title: 'ID', data: 'id' },
  { title: 'Name', data: 'name' },
  { title: 'Position', data: 'position' },
  { title: 'Office', data: 'office' },
  { title: 'Age', data: 'age' },
  { title: 'Start date', data: 'startDate' },
  {
    title: 'Salary',
    data: 'salary',
    render: (data: unknown, type: string) =>
      type === 'display'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(Number(data))
        : (data as number),
  },
  { title: 'Status', data: 'status' },
];
