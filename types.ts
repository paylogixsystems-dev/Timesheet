export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR'
}

export type EntryStatus = 'PRESENT' | 'ABSENT' | 'SICK_LEAVE' | 'CASUAL_LEAVE' | 'HOLIDAY';

export interface TimesheetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  project: string;
  hours: number;
  description: string; // Task comment
  status: EntryStatus;
  remarks: string;
}

export interface Timesheet {
  id: string;
  employeeName: string;
  employeeId: string;
  month: string; // YYYY-MM
  entries: TimesheetEntry[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  submittedAt?: string;
}

export interface AIParseResult {
  entries: {
    date: string; // YYYY-MM-DD (ISO)
    hours: number;
    project: string;
    description: string;
    status: EntryStatus;
    remarks: string;
  }[];
}