import { Timesheet, TimesheetEntry } from '../types';

const STORAGE_KEY = 'teamsync_data_v3_monthly';

// ==========================================
// DB CONFIGURATION ZONE
// ==========================================
/**
 * 1. To use a real database, uncomment the fetch/axios calls in the Async Methods below.
 * 2. This file currently uses LocalStorage simulation.
 * 
 * Recommended DBs for this structure:
 * - Firebase Realtime Database / Firestore
 * - Supabase (PostgreSQL)
 * - MongoDB Atlas
 */

// --- SEED DATA (For Demo Only) ---
const SEED_DATA: Timesheet[] = [
  {
    id: 'ts-1',
    employeeName: 'Alice Johnson',
    employeeId: 'EMP001',
    month: '2023-10',
    status: 'SUBMITTED',
    submittedAt: '2023-10-31T16:00:00Z',
    entries: [
      { id: '1', date: '2023-10-02', project: 'Website Redesign', hours: 8, description: 'Frontend layout', status: 'PRESENT', remarks: '' },
      { id: '2', date: '2023-10-03', project: 'Website Redesign', hours: 8, description: 'Component implementation', status: 'PRESENT', remarks: '' },
      { id: '3', date: '2023-10-04', project: 'Internal API', hours: 4, description: 'Meeting and planning', status: 'PRESENT', remarks: 'Left early for appointment' },
      { id: '3b', date: '2023-10-05', project: '', hours: 0, description: '', status: 'SICK_LEAVE', remarks: 'Flu' },
    ]
  },
  {
    id: 'ts-2',
    employeeName: 'Bob Smith',
    employeeId: 'EMP002',
    month: '2023-10',
    status: 'SUBMITTED',
    submittedAt: '2023-11-01T09:30:00Z',
    entries: [
      { id: '4', date: '2023-10-02', project: 'Mobile App', hours: 7, description: 'Bug fixes', status: 'PRESENT', remarks: '' },
      { id: '5', date: '2023-10-03', project: 'Mobile App', hours: 8, description: 'New feature dev', status: 'PRESENT', remarks: '' },
      { id: '6', date: '2023-10-15', project: '', hours: 0, description: '', status: 'ABSENT', remarks: 'Personal emergency' },
    ]
  },
];

// --- INTERNAL HELPERS ---
const getLocalData = (): Timesheet[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(data);
};

const setLocalData = (data: Timesheet[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 500)); 

// ==========================================
// ASYNC API METHODS
// ==========================================

export const getAllTimesheets = async (): Promise<Timesheet[]> => {
  await simulateDelay();
  
  // REAL DB IMPLEMENTATION EXAMPLE:
  // const response = await fetch('https://your-api.com/timesheets');
  // return await response.json();
  
  return getLocalData();
};

export const getTimesheetByMonth = async (employeeName: string, month: string): Promise<Timesheet | null> => {
  await simulateDelay();
  
  // REAL DB IMPLEMENTATION EXAMPLE:
  // const response = await fetch(`https://your-api.com/timesheets?name=${employeeName}&month=${month}`);
  // const data = await response.json();
  // return data.length > 0 ? data[0] : null;

  const all = getLocalData();
  const found = all.find(t => 
    t.employeeName.toLowerCase() === employeeName.toLowerCase() && 
    t.month === month
  );
  return found || null;
};

export const saveTimesheet = async (timesheet: Timesheet): Promise<Timesheet> => {
  await simulateDelay();

  // REAL DB IMPLEMENTATION EXAMPLE:
  // const response = await fetch('https://your-api.com/timesheets', {
  //   method: 'POST',
  //   body: JSON.stringify(timesheet)
  // });
  // return await response.json();

  const all = getLocalData();
  const index = all.findIndex(t => t.id === timesheet.id);
  
  if (index >= 0) {
    all[index] = timesheet;
  } else {
    all.push(timesheet);
  }
  
  setLocalData(all);
  return timesheet;
};

export const createNewTimesheet = (employeeName: string, month: string): Timesheet => {
  return {
    id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    employeeName,
    employeeId: `EMP-${Math.floor(Math.random() * 1000)}`,
    month: month,
    entries: [],
    status: 'DRAFT'
  };
};