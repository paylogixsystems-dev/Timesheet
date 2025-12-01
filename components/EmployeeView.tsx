import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calendar, Check, User, CalendarDays, Loader2, ScrollText, AlertCircle } from 'lucide-react';
import { Timesheet, TimesheetEntry, EntryStatus } from '../types';
import { SmartEntry } from './SmartEntry';
import { createNewTimesheet, getTimesheetByMonth, saveTimesheet } from '../services/storageService';

export const EmployeeView: React.FC = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load timesheet when Name or Month changes
  useEffect(() => {
    if (!employeeName.trim()) {
      setTimesheet(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Try to find existing, or create new draft locally
        const existing = await getTimesheetByMonth(employeeName, selectedMonth);
        if (existing) {
          setTimesheet(existing);
        } else {
          setTimesheet(createNewTimesheet(employeeName, selectedMonth));
        }
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadData, 500); // Debounce typing
    return () => clearTimeout(debounce);
  }, [employeeName, selectedMonth]);

  const handleSmartParsed = (result: { entries: any[] }) => {
    if (!timesheet) return;

    // Convert parsed entries to TimesheetEntry format
    const newEntries: TimesheetEntry[] = result.entries.map((e, index) => ({
      id: Date.now().toString() + index,
      date: e.date,
      project: e.project || '',
      hours: e.hours || 8,
      description: e.description || '',
      status: (e.status as EntryStatus) || 'PRESENT',
      remarks: e.remarks || ''
    }));

    // Merge: Remove old entries for the same dates, add new ones
    const updatedEntries = [
      ...timesheet.entries.filter(old => !newEntries.find( newE => newE.date === old.date)),
      ...newEntries
    ].sort((a, b) => a.date.localeCompare(b.date));

    setTimesheet({ ...timesheet, entries: updatedEntries, status: 'DRAFT' });
  };

  const handleAddRow = () => {
    if (!timesheet) return;
    const today = new Date().toISOString().split('T')[0];
    const newEntry: TimesheetEntry = {
      id: Date.now().toString(),
      date: selectedMonth + '-01', // Default to 1st of selected month
      project: '',
      hours: 8,
      description: '',
      status: 'PRESENT',
      remarks: ''
    };
    setTimesheet({
      ...timesheet,
      entries: [...timesheet.entries, newEntry].sort((a, b) => a.date.localeCompare(b.date))
    });
  };

  const handleRemoveRow = (id: string) => {
    if (!timesheet) return;
    setTimesheet({
      ...timesheet,
      entries: timesheet.entries.filter(e => e.id !== id)
    });
  };

  const handleUpdateRow = (id: string, field: keyof TimesheetEntry, value: any) => {
    if (!timesheet) return;
    setTimesheet({
      ...timesheet,
      entries: timesheet.entries.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const handleSave = async () => {
    if (!timesheet) return;
    setSaveStatus('saving');
    // Ensure status is submitted if user clicks save (or keep draft logic if you prefer separate submit)
    const toSave = { ...timesheet, status: 'SUBMITTED' as const, submittedAt: new Date().toISOString() };
    await saveTimesheet(toSave);
    setTimesheet(toSave);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleAutoFillMonth = () => {
    if (!timesheet) return;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const newEntries: TimesheetEntry[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = date.toISOString().split('T')[0];
        // Don't overwrite existing
        if (!timesheet.entries.find(e => e.date === dateStr)) {
          newEntries.push({
            id: `auto-${dateStr}`,
            date: dateStr,
            project: 'General',
            hours: 8,
            description: 'Regular work',
            status: 'PRESENT',
            remarks: ''
          });
        }
      }
    }

    const updatedEntries = [...timesheet.entries, ...newEntries].sort((a, b) => a.date.localeCompare(b.date));
    setTimesheet({ ...timesheet, entries: updatedEntries });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Employee Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              {!employeeName && (
                <div className="absolute right-3 top-3 text-amber-500 animate-pulse">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {!employeeName && <p className="text-xs text-amber-600">Please enter your name to start.</p>}
          </div>

          {/* Month Selector */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" /> Select Month
            </label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-end pb-0.5">
             <button
              onClick={handleAutoFillMonth}
              disabled={!timesheet}
              className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" /> Auto-fill {new Date(selectedMonth).toLocaleString('default', { month: 'long' })}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : timesheet ? (
        <>
          {/* AI Entry */}
          <SmartEntry 
            onParsed={handleSmartParsed} 
            referenceDate={`${selectedMonth}-01`} 
          />

          {/* Timesheet Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold text-slate-700">Entries for {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600 ml-2">
                  {timesheet.entries.length} records
                </span>
              </div>
              <button
                onClick={handleAddRow}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Remarks</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timesheet.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-6 py-3">
                         <input
                          type="date"
                          value={entry.date}
                          min={`${selectedMonth}-01`}
                          max={`${selectedMonth}-31`}
                          onChange={(e) => handleUpdateRow(entry.id, 'date', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm font-medium text-slate-700"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={entry.status}
                          onChange={(e) => handleUpdateRow(entry.id, 'status', e.target.value)}
                          className={`w-full text-xs font-semibold rounded px-2 py-1 outline-none border border-transparent focus:border-indigo-300 ${
                             entry.status === 'PRESENT' ? 'bg-green-50 text-green-700' :
                             entry.status === 'ABSENT' ? 'bg-red-50 text-red-700' :
                             'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="SICK_LEAVE">Sick Leave</option>
                          <option value="CASUAL_LEAVE">Casual Leave</option>
                          <option value="HOLIDAY">Holiday</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={entry.project}
                          onChange={(e) => handleUpdateRow(entry.id, 'project', e.target.value)}
                          placeholder="Project name"
                          disabled={entry.status !== 'PRESENT'}
                          className="w-full bg-transparent border border-transparent focus:border-indigo-300 rounded px-2 py-1 outline-none text-sm disabled:opacity-50 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={entry.description}
                          onChange={(e) => handleUpdateRow(entry.id, 'description', e.target.value)}
                          placeholder="What did you work on?"
                          disabled={entry.status !== 'PRESENT'}
                          className="w-full bg-transparent border border-transparent focus:border-indigo-300 rounded px-2 py-1 outline-none text-sm disabled:opacity-50 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={entry.hours}
                          onChange={(e) => handleUpdateRow(entry.id, 'hours', Number(e.target.value))}
                          disabled={entry.status !== 'PRESENT'}
                          className="w-16 bg-transparent border border-transparent focus:border-indigo-300 rounded px-2 py-1 outline-none text-sm font-medium disabled:opacity-50 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={entry.remarks}
                          onChange={(e) => handleUpdateRow(entry.id, 'remarks', e.target.value)}
                          placeholder={entry.status === 'PRESENT' ? 'Optional notes' : 'Reason for absence'}
                          className={`w-full bg-transparent border border-transparent focus:border-indigo-300 rounded px-2 py-1 outline-none text-sm ${entry.status !== 'PRESENT' && !entry.remarks ? 'border-red-300 bg-red-50' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleRemoveRow(entry.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timesheet.entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <p className="mb-2">No entries yet.</p>
                        <p className="text-sm">Use "Auto-fill Month", "AI Smart Fill" or "Add Row" to start.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-12">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Submitted!' : 'Submit Timesheet'}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Please enter your name above to view or create your timesheet.</p>
        </div>
      )}
    </div>
  );
};