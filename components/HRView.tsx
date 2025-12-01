import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Download, Users, Clock, AlertCircle, FileText, UserX, Loader2 } from 'lucide-react';
import { getAllTimesheets } from '../services/storageService';
import { Timesheet } from '../types';

const COLORS = ['#4f46e5', '#94a3b8', '#fbbf24', '#ef4444'];

type Tab = 'DASHBOARD' | 'SUMMARY' | 'ABSENTEE';

export const HRView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllTimesheets();
        setTimesheets(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p>Loading HR Database...</p>
        </div>
    );
  }

  // --- Statistics Calculation ---
  const totalEmployees = 10; // Assuming a fixed team size for demo
  const submittedCount = timesheets.filter(t => t.status === 'SUBMITTED' || t.status === 'APPROVED').length;
  const pendingCount = Math.max(0, totalEmployees - submittedCount);

  const totalHoursLogged = timesheets.reduce((acc, sheet) => {
    return acc + sheet.entries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  }, 0);

  // Absentee Data
  const absenteeList = timesheets.flatMap(sheet => 
    sheet.entries
      .filter(e => e.status !== 'PRESENT')
      .map(e => ({
        employeeName: sheet.employeeName,
        date: e.date,
        status: e.status,
        remarks: e.remarks
      }))
  );

  // Summary Data
  const summaryData = timesheets.map(sheet => {
    const totalH = sheet.entries.reduce((s, e) => s + (e.hours || 0), 0);
    const manDays = new Set(sheet.entries.filter(e => e.status === 'PRESENT').map(e => e.date)).size;
    return {
      id: sheet.id,
      name: sheet.employeeName,
      month: sheet.month,
      manDays,
      totalHours: totalH,
      status: sheet.status
    };
  });

  // Data for Charts
  const submissionStatusData = [
    { name: 'Submitted', value: submittedCount },
    { name: 'Pending', value: pendingCount },
  ];

  // Group by Project
  const projectHours: Record<string, number> = {};
  timesheets.forEach(sheet => {
    sheet.entries.forEach(entry => {
      const proj = entry.project || 'Unassigned';
      if (entry.status === 'PRESENT') {
        projectHours[proj] = (projectHours[proj] || 0) + Number(entry.hours);
      }
    });
  });

  const projectData = Object.entries(projectHours)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5); // Top 5

  // --- Export Logic ---
  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Month', 'Date', 'Day', 'Status', 'Project', 'Task Comment', 'Hours', 'Remarks'];
    const rows: string[][] = [];
    
    timesheets.forEach(sheet => {
      sheet.entries.forEach(entry => {
        const dayName = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' });
        rows.push([
          `"${sheet.employeeName}"`,
          sheet.employeeId,
          sheet.month,
          entry.date,
          dayName,
          entry.status,
          `"${entry.project}"`,
          `"${entry.description}"`,
          entry.hours.toString(),
          `"${entry.remarks}"`
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet_full_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummary = () => {
    const headers = ['Employee Name', 'Month', 'Man-Days (Present)', 'Total Hours', 'Submission Status'];
    const rows = summaryData.map(d => [
      `"${d.name}"`, d.month, d.manDays.toString(), d.totalHours.toString(), d.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAbsentee = () => {
    const headers = ['Employee Name', 'Date', 'Day', 'Type', 'Remarks'];
    const rows = absenteeList.map(item => {
      const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      return [
        `"${item.employeeName}"`,
        item.date,
        dayName,
        item.status,
        `"${item.remarks || ''}"`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `absentee_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <PieChart className="w-4 h-4" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SUMMARY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Summary Sheet
        </button>
        <button 
          onClick={() => setActiveTab('ABSENTEE')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ABSENTEE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <UserX className="w-4 h-4" /> Absentee Report
        </button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Submission Rate</p>
                <p className="text-2xl font-bold text-slate-800">{submittedCount}/{totalEmployees}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Hours</p>
                <p className="text-2xl font-bold text-slate-800">{totalHoursLogged}h</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Absence Count</p>
                <p className="text-2xl font-bold text-slate-800">{absenteeList.length}</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Hours by Project</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={projectData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Submission Status</h3>
              <div className="flex justify-center items-center h-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={submissionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {submissionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
             <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" /> Download Full Report (CSV)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Overall Summary</h3>
            <button
              onClick={handleExportSummary}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> Export Summary
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Employee Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Man-Days (Present)</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Total Hours</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Month</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">{item.manDays} Days</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{item.totalHours}h</td>
                    <td className="px-6 py-4 text-slate-500">{item.month}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         item.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                       }`}>
                         {item.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ABSENTEE' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                   <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Absentee Details</h3>
                  <p className="text-slate-500 text-xs font-normal">List of leaves taken with dates and remarks.</p>
                </div>
             </div>
             <button
              onClick={handleExportAbsentee}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> Export Excel (CSV)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Employee Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absenteeList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.employeeName}</td>
                    <td className="px-6 py-4">{item.date} ({new Date(item.date).toLocaleDateString('en-US', {weekday: 'short'})})</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        item.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">"{item.remarks || 'No remarks provided'}"</td>
                  </tr>
                ))}
                {absenteeList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No absences recorded for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
