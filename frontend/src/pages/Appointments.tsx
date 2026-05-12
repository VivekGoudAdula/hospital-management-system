import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Search, 
  Plus, 
  MoreVertical, 
  CalendarDays, 
  History, 
  UserCheck, 
  XCircle, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Files,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useHospitalStore } from '@/store/hospitalStore';
import { useAuthStore, useEHRStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';

const Appointments = () => {
  const { 
    appointments, 
    fetchAppointments, 
    patients, 
    fetchPatients, 
    doctors, 
    fetchDoctors, 
    departments,
    fetchDepartments,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointmentStatus,
    isLoading 
  } = useHospitalStore();
  
  const { checkInPatient } = useEHRStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    doctorId: '',
    departmentId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    type: 'Consultation',
    reason: ''
  });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');

  // Reschedule State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ id: '', date: format(new Date(), 'yyyy-MM-dd'), time: '' });
  
  // Date Picker Navigation
  const [bookingMonth, setBookingMonth] = useState(new Date());
  const [rescheduleMonth, setRescheduleMonth] = useState(new Date());
  
  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
  }, [fetchAppointments, fetchPatients, fetchDoctors, fetchDepartments]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.doctorId || !bookingForm.departmentId || !bookingForm.time) {
      import('sonner').then(({ toast }) => toast.error('Please fill in all required fields (Patient, Department, Doctor, Time Slot).'));
      return;
    }
    try {
      await bookAppointment(bookingForm);
      setIsBookModalOpen(false);
      setPatientSearch('');
      // Reset form
      setBookingForm({
        patientId: '',
        doctorId: '',
        departmentId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        type: 'Consultation',
        reason: ''
      });
    } catch (error) {
      // Error handled by store/toast
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleData.date || !rescheduleData.time) {
      import('sonner').then(({ toast }) => toast.error('Please select a valid date and time.'));
      return;
    }
    try {
      await rescheduleAppointment(rescheduleData.id, rescheduleData.date, rescheduleData.time);
      setIsRescheduleModalOpen(false);
    } catch (error) {
      // Error handled by store/toast
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'rescheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredAppointments = appointments.filter(app => 
    app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingApps = filteredAppointments.filter(app => app.status === 'Upcoming' || app.status === 'Rescheduled' || app.status === 'Arrived');
  const historyApps = filteredAppointments.filter(app => app.status === 'Completed' || app.status === 'Cancelled');

  // Calendar View Logic
  let days: Date[] = [];
  if (calendarView === 'month') {
    const monthStart = startOfWeek(startOfMonth(currentDate));
    const monthEnd = endOfWeek(endOfMonth(currentDate));
    days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  } else if (calendarView === 'week') {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else {
    days = [currentDate];
  }

  const exportToExcel = () => {
    const headers = ['Date', 'Time', 'Patient', 'Doctor', 'Department', 'Type', 'Status', 'Token'];
    const rows = filteredAppointments.map(app => [
      app.date,
      app.time,
      `"${app.patientName}"`,
      `"${app.doctorName}"`,
      `"${app.departmentName}"`,
      app.type,
      app.status,
      app.token
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    import('sonner').then(({ toast }) => toast.success('Excel report generated successfully'));
  };

  const exportToWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Appointments Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; color: #1e293b; font-weight: bold; }
        h1 { color: #4f46e5; }
      </style>
      </head>
      <body>
        <h1 style="text-align: center;">ApexCare Appointment Report</h1>
        <p style="text-align: center; color: #64748b;">Generated on: ${format(new Date(), 'PPP')}</p>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient Name</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Type</th>
              <th>Status</th>
              <th>Token</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAppointments.map(app => `
              <tr>
                <td>${app.date} ${app.time}</td>
                <td>${app.patientName}</td>
                <td>${app.doctorName}</td>
                <td>${app.departmentName}</td>
                <td>${app.type}</td>
                <td>${app.status}</td>
                <td>${app.token}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments_report_${format(new Date(), 'yyyy-MM-dd')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    import('sonner').then(({ toast }) => toast.success('Word document generated successfully'));
  };

  const downloadAppointmentReport = (app: any) => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Appointment Summary - ${app.patientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 60px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
            .title { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
            .section { margin-bottom: 30px; }
            .label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .value { font-size: 16px; font-weight: 500; color: #1e293b; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; background: #f1f5f9; color: #475569; text-transform: uppercase; }
            .footer { margin-top: 100px; border-top: 1px solid #e2e8f0; padding-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: #f1f5f9; z-index: -1; font-weight: 900; pointer-events: none; }
          </style>
        </head>
        <body>
          <div class="watermark">APEXCARE</div>
          <div class="header">
            <div class="logo">ApexCare Health</div>
            <div class="title">Clinical Summary</div>
          </div>
          
          <div class="section">
            <div class="label">Patient Name</div>
            <div class="value" style="font-size: 24px; font-weight: 800; color: #0f172a;">${app.patientName}</div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="label">Appointment Date</div>
              <div class="value">${format(new Date(app.date), 'EEEE, MMMM dd, yyyy')}</div>
            </div>
            <div class="section">
              <div class="label">Time Slot</div>
              <div class="value">${app.time}</div>
            </div>
            <div class="section">
              <div class="label">Consulting Physician</div>
              <div class="value">${app.doctorName}</div>
            </div>
            <div class="section">
              <div class="label">Medical Department</div>
              <div class="value">${app.departmentName}</div>
            </div>
            <div class="section">
              <div class="label">Visit Status</div>
              <div class="value"><span class="badge">${app.status}</span></div>
            </div>
            <div class="section">
              <div class="label">Booking Token</div>
              <div class="value" style="font-family: monospace; font-weight: 700; color: #4f46e5;">${app.token}</div>
            </div>
          </div>

          <div class="section" style="margin-top: 20px; padding: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div class="label">Notes / Clinical Reason</div>
            <div class="value">${app.reason || 'Routine follow-up / General consultation.'}</div>
          </div>

          <div class="footer">
            This document is a computer-generated summary of the patient's visit recorded in the ApexCare Hospital Management System.<br>
            Generated on: ${format(new Date(), 'PPP')} at ${format(new Date(), 'pp')} | Ref: ${Math.random().toString(36).substring(7).toUpperCase()}
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage patient bookings and doctor schedules</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden sm:flex group transition-all hover:border-indigo-200">
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <Files className="w-4 h-4 mr-2 text-emerald-600" />
                Export to Excel (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToWord} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Export to Word (.doc)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
                <DialogDescription>
                  Enter patient details and select a doctor to schedule a visit.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleBookSubmit} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="patient">Select Patient</Label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input 
                      placeholder="Search patient name or MRN..." 
                      className="pl-10 h-10 rounded-xl"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (bookingForm.patientId) {
                          setBookingForm({...bookingForm, patientId: ''});
                        }
                      }}
                    />
                    {patientSearch && !bookingForm.patientId && patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(patientSearch.toLowerCase())).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                        {patients
                          .filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(patientSearch.toLowerCase()))
                          .map(p => (
                            <div 
                              key={p.id} 
                              className={`px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex items-center justify-between ${bookingForm.patientId === p.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'}`}
                              onClick={() => {
                                setBookingForm({...bookingForm, patientId: p.id});
                                setPatientSearch(p.name);
                              }}
                            >
                              <span>{p.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{p.mrn}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dept">Department</Label>
                    <Select 
                      value={bookingForm.departmentId} 
                      onValueChange={(val) => setBookingForm({...bookingForm, departmentId: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dept" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select 
                      value={bookingForm.doctorId} 
                      onValueChange={(val) => setBookingForm({...bookingForm, doctorId: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors
                          .filter(d => !bookingForm.departmentId || d.departments.some(dep => dep.id === bookingForm.departmentId))
                          .map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label>Select Date</Label>
                    <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-slate-50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        type="button"
                        onClick={() => setBookingMonth(addDays(bookingMonth, -30))}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <span className="text-[10px] font-bold text-slate-600 px-1 w-20 text-center">
                        {format(bookingMonth, 'MMMM yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        type="button"
                        onClick={() => setBookingMonth(addDays(bookingMonth, 30))}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <div className="grid grid-cols-7 mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {eachDayOfInterval({
                        start: startOfWeek(startOfMonth(bookingMonth)),
                        end: endOfWeek(endOfMonth(bookingMonth))
                      }).map((d, i) => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const isSelected = bookingForm.date === dateStr;
                        const isPast = d < startOfDay(new Date());
                        const isCurrentMonth = isSameMonth(d, bookingMonth);
                        const bookedCount = bookingForm.doctorId ? appointments.filter(a => a.date === dateStr && a.doctorId === bookingForm.doctorId && a.status !== 'Cancelled').length : 0;
                        const hasFree = bookedCount < 8 && !isPast; // 8 slots per day
                        const isFullyBooked = bookedCount >= 8 && !isPast;
                        
                        return (
                          <div 
                            key={`book-${dateStr}`}
                            onClick={() => !isPast && !isFullyBooked && setBookingForm({...bookingForm, date: dateStr})}
                            className={`h-7 w-full flex items-center justify-center text-[11px] font-medium rounded transition-all 
                              ${isPast || !isCurrentMonth ? 'opacity-30 cursor-not-allowed text-slate-400' : isFullyBooked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                              ${isSelected ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200' : hasFree ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200/50' : isFullyBooked ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50' : isPast ? '' : 'bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200/50'}
                            `}
                          >
                            {format(d, 'd')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="time">Time Slot</Label>
                  <Select 
                    value={bookingForm.time} 
                    onValueChange={(val) => setBookingForm({...bookingForm, time: val})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select available time" />
                    </SelectTrigger>
                    <SelectContent>
                      {['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'].map(t => {
                        const isPastTime = isSameDay(new Date(bookingForm.date), new Date()) && t < format(new Date(), 'HH:mm');
                        const isBookedSlot = bookingForm.doctorId ? appointments.some(a => a.date === bookingForm.date && a.doctorId === bookingForm.doctorId && a.time === t && a.status !== 'Cancelled') : false;
                        const isUnavailable = isBookedSlot || isPastTime;

                        return (
                          <SelectItem 
                            key={t} 
                            value={t} 
                            disabled={isUnavailable}
                            className={isUnavailable ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}
                          >
                            {t} {isUnavailable ? '(Booked)' : '(Free)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Input 
                    placeholder="Brief description of symptoms" 
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Confirm Booking</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
            <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Reschedule Appointment</DialogTitle>
                <DialogDescription>
                  Select a new date and time for the appointment.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleRescheduleSubmit} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label>Select New Date</Label>
                    <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-slate-50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        type="button"
                        onClick={() => setRescheduleMonth(addDays(rescheduleMonth, -30))}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <span className="text-[10px] font-bold text-slate-600 px-1 w-20 text-center">
                        {format(rescheduleMonth, 'MMMM yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        type="button"
                        onClick={() => setRescheduleMonth(addDays(rescheduleMonth, 30))}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <div className="grid grid-cols-7 mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {eachDayOfInterval({
                        start: startOfWeek(startOfMonth(rescheduleMonth)),
                        end: endOfWeek(endOfMonth(rescheduleMonth))
                      }).map((d, i) => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const isSelected = rescheduleData.date === dateStr;
                        const isPast = d < startOfDay(new Date());
                        const isCurrentMonth = isSameMonth(d, rescheduleMonth);
                        
                        const targetApp = appointments.find(a => a.id === rescheduleData.id);
                        const doctorId = targetApp?.doctorId;
                        
                        const bookedCount = doctorId ? appointments.filter(a => a.date === dateStr && a.doctorId === doctorId && a.id !== rescheduleData.id && a.status !== 'Cancelled').length : 0;
                        const hasFree = bookedCount < 8 && !isPast; // 8 slots per day
                        const isFullyBooked = bookedCount >= 8 && !isPast;
                        
                        return (
                          <div 
                            key={`res-${dateStr}`}
                            onClick={() => !isPast && !isFullyBooked && setRescheduleData({...rescheduleData, date: dateStr})}
                            className={`h-7 w-full flex items-center justify-center text-[11px] font-medium rounded transition-all 
                              ${isPast || !isCurrentMonth ? 'opacity-30 cursor-not-allowed text-slate-400' : isFullyBooked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                              ${isSelected ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200' : hasFree ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200/50' : isFullyBooked ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50' : isPast ? '' : 'bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200/50'}
                            `}
                          >
                            {format(d, 'd')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>New Time Slot</Label>
                  <Select 
                    value={rescheduleData.time} 
                    onValueChange={(val) => setRescheduleData({...rescheduleData, time: val})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select available time" />
                    </SelectTrigger>
                    <SelectContent>
                      {['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'].map(t => {
                        const targetApp = appointments.find(a => a.id === rescheduleData.id);
                        const doctorId = targetApp?.doctorId;
                        const isPastTime = isSameDay(new Date(rescheduleData.date), new Date()) && t < format(new Date(), 'HH:mm');
                        const isBookedSlot = doctorId ? appointments.some(a => a.date === rescheduleData.date && a.doctorId === doctorId && a.id !== rescheduleData.id && a.time === t && a.status !== 'Cancelled') : false;
                        const isUnavailable = isBookedSlot || isPastTime;
                        
                        return (
                          <SelectItem 
                            key={t} 
                            value={t} 
                            disabled={isUnavailable}
                            className={isUnavailable ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}
                          >
                            {t} {isUnavailable ? '(Booked)' : '(Free)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Confirm Reschedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Today', val: appointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length, icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Upcoming', val: upcomingApps.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', val: appointments.filter(a => a.status === 'Completed').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Cancelled', val: appointments.filter(a => a.status === 'Cancelled').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.val}</h3>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar View
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search appointments..." 
              className="pl-10 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "upcoming" && (
            <TabsContent key="upcoming-tab" value="upcoming" className="m-0 focus-visible:outline-none" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Token & Date</TableHead>
                        <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                        <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                        <TableHead className="font-semibold text-slate-700">Type</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingApps.length > 0 ? (
                        upcomingApps.map((app, idx) => (
                          <TableRow key={`app-up-${app.id || idx}`} className="hover:bg-slate-50/50 transition-colors group">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{app.token}</span>
                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {format(new Date(app.date), 'MMM dd, yyyy')}
                                  <Clock className="w-3 h-3 ml-2 mr-1" />
                                  {app.time}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                                  {app.patientName?.charAt(0)}
                                </div>
                                <span className="font-medium text-slate-700">{app.patientName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-slate-700">{app.doctorName}</span>
                                <span className="text-xs text-slate-400">{app.departmentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal border-slate-200 bg-white">
                                {app.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(app.status)} border shadow-none`}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="cursor-pointer font-bold text-indigo-600"
                                    onClick={async () => {
                                      try {
                                        await checkInPatient(app.id);
                                        import('sonner').then(({ toast }) => toast.success('Patient checked in and visit session created!'));
                                        fetchAppointments(); // refresh
                                      } catch (error) {
                                        import('sonner').then(({ toast }) => toast.error('Failed to check in patient.'));
                                      }
                                    }}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Check In (Start Visit)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setRescheduleData({ id: app.id, date: app.date, time: app.time });
                                      setIsRescheduleModalOpen(true);
                                    }}
                                  >
                                    <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" />
                                    Reschedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => updateAppointmentStatus(app.id, 'Completed')}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-rose-600 cursor-pointer"
                                    onClick={() => cancelAppointment(app.id, 'Patient requested cancellation')}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                            {isLoading ? "Loading appointments..." : "No upcoming appointments found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "history" && (
            <TabsContent key="history-tab" value="history" className="m-0 focus-visible:outline-none" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Date</TableHead>
                        <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                        <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Token</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyApps.length > 0 ? (
                        historyApps.map((app, idx) => (
                          <TableRow key={`app-hist-${app.id || idx}`}>
                            <TableCell className="text-slate-600">
                              {format(new Date(app.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium text-slate-700">{app.patientName}</TableCell>
                            <TableCell className="text-slate-600">{app.doctorName}</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(app.status)} border shadow-none`}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500">{app.token}</TableCell>
                            <TableCell className="text-right">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="text-slate-400 hover:text-indigo-600 transition-colors"
                                 onClick={() => downloadAppointmentReport(app)}
                                 title="Download PDF Summary"
                               >
                                 <FileText className="w-4 h-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                            No historical records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "calendar" && (
            <TabsContent key="calendar-tab" value="calendar" className="m-0 focus-visible:outline-none" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-slate-900 w-48">
                        {format(currentDate, calendarView === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
                      </h3>
                      <div className="flex items-center border rounded-lg bg-slate-50">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => {
                            if (calendarView === 'month') setCurrentDate(addDays(currentDate, -30));
                            else if (calendarView === 'week') setCurrentDate(addDays(currentDate, -7));
                            else setCurrentDate(addDays(currentDate, -1));
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="px-3 h-8 text-xs font-medium"
                          onClick={() => setCurrentDate(new Date())}
                        >
                          Today
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (calendarView === 'month') setCurrentDate(addDays(currentDate, 30));
                            else if (calendarView === 'week') setCurrentDate(addDays(currentDate, 7));
                            else setCurrentDate(addDays(currentDate, 1));
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <Button 
                          variant={calendarView === 'day' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className={`h-8 px-4 ${calendarView === 'day' ? 'bg-white shadow-sm' : ''}`}
                          onClick={() => setCalendarView('day')}
                        >
                          Day
                        </Button>
                        <Button 
                          variant={calendarView === 'week' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className={`h-8 px-4 ${calendarView === 'week' ? 'bg-white shadow-sm' : ''}`}
                          onClick={() => setCalendarView('week')}
                        >
                          Week
                        </Button>
                        <Button 
                          variant={calendarView === 'month' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className={`h-8 px-4 ${calendarView === 'month' ? 'bg-white shadow-sm' : ''}`}
                          onClick={() => setCalendarView('month')}
                        >
                          Month
                        </Button>
                      </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue placeholder="All Doctors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Doctors</SelectItem>
                          {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  </div>

                  <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                    {days.map((day, i) => {
                      const dayApps = appointments.filter(a => isSameDay(new Date(a.date), day));
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div 
                          key={`cal-day-${i}`} 
                          className={`min-h-[140px] bg-white p-2 flex flex-col gap-1 ${!isSameDay(day, currentDate) && 'bg-slate-50/30'}`}
                        >
                          <div className={`text-right mb-1`}>
                            <span className={`inline-block w-7 h-7 leading-7 text-center rounded-full text-sm font-medium ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                              {format(day, 'd')}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                            {dayApps.map((app, idx) => (
                              <div 
                                key={`cal-app-${app.id || idx}`} 
                                className={`text-[10px] p-1.5 rounded-md border truncate cursor-pointer hover:brightness-95 transition-all
                                  ${app.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}
                                `}
                              >
                                <span className="font-bold">{app.time}</span> {app.patientName}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default Appointments;
