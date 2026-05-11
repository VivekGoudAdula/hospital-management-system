import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  Plus, 
  Search, 
  FilePieChart, 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  MoreVertical,
  Download,
  Printer,
  Timer,
  LayoutDashboard,
  ShieldAlert,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useHospitalStore } from '@/store/hospitalStore';
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
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const OTScheduling = () => {
  const { 
    otBookings, 
    fetchOTBookings, 
    otStats, 
    fetchOTStats,
    patients,
    fetchPatients,
    doctors,
    fetchDoctors,
    bookOT,
    updateOTStatus,
    isLoading 
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState('schedule');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [patientSearch, setPatientSearch] = useState('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  
  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    surgeonId: '',
    theatreId: 'OT-1',
    surgeryName: '',
    surgeryDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '10:00',
    type: 'Planned',
    notes: ''
  });

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchOTBookings({}); // Fetch all for calendar
    } else {
      fetchOTBookings({ date: selectedDate });
    }
    fetchOTStats(selectedDate);
    fetchPatients();
    fetchDoctors();
  }, [selectedDate, activeTab, fetchOTBookings, fetchOTStats, fetchPatients, fetchDoctors]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.surgeonId || !bookingForm.surgeryName) {
      import('sonner').then(({ toast }) => toast.error('Please fill in Patient, Surgeon, and Surgery Name.'));
      return;
    }
    try {
      await bookOT(bookingForm);
      setIsBookModalOpen(false);
      setPatientSearch('');
      setBookingForm({
        patientId: '',
        surgeonId: '',
        theatreId: 'OT-1',
        surgeryName: '',
        surgeryDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '10:00',
        type: 'Planned',
        notes: ''
      });
    } catch (error) { }
  };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Scissors className="w-8 h-8 text-indigo-600" />
            OT Scheduling
          </h1>
          <p className="text-slate-500 mt-1">Surgical theatre management and utilisation reports</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Surgery
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Surgery</DialogTitle>
                <DialogDescription>Assign a theatre and surgical team for a patient.</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleBookSubmit} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Patient</Label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input 
                      placeholder="Search patient name or MRN..." 
                      className="pl-10 h-10 rounded-xl"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                    {patientSearch && !patients.some(p => p.id === bookingForm.patientId && p.name === patientSearch) && (
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
                    <Label>Surgeon</Label>
                    <Select onValueChange={(val) => setBookingForm({...bookingForm, surgeonId: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lead Surgeon" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Operation Theatre</Label>
                    <Select defaultValue="OT-1" onValueChange={(val) => setBookingForm({...bookingForm, theatreId: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OT-1">Theatre 1 (Major)</SelectItem>
                        <SelectItem value="OT-2">Theatre 2 (Major)</SelectItem>
                        <SelectItem value="OT-3">Theatre 3 (Minor)</SelectItem>
                        <SelectItem value="OT-4">Cardiac OT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Surgery Name</Label>
                  <Input placeholder="e.g. Appendectomy, Angioplasty" value={bookingForm.surgeryName} onChange={e => setBookingForm({...bookingForm, surgeryName: e.target.value})} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" value={bookingForm.surgeryDate} onChange={e => setBookingForm({...bookingForm, surgeryDate: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Start</Label>
                    <Input type="time" value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>End (Est.)</Label>
                    <Input type="time" value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Label>Surgery Type:</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="type" value="Planned" checked={bookingForm.type === 'Planned'} onChange={() => setBookingForm({...bookingForm, type: 'Planned'})} />
                      Planned
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-rose-600">
                      <input type="radio" name="type" value="Emergency" checked={bookingForm.type === 'Emergency'} onChange={() => setBookingForm({...bookingForm, type: 'Emergency'})} />
                      Emergency
                    </label>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600">Confirm Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Surgeries</p>
                <h3 className="text-3xl font-bold mt-1">{otStats?.total_surgeries || 0}</h3>
              </div>
              <Activity className="w-10 h-10 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Usage Hours</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{otStats?.usage_hours || 0}h</h3>
              </div>
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">OT Occupancy</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{otStats?.occupancy_rate || 0}%</h3>
              </div>
              <LayoutDashboard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 border border-rose-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-600 text-sm font-medium">Emergencies</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-1">{otStats?.emergency_count || 0}</h3>
              </div>
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Schedule
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FilePieChart className="w-4 h-4 mr-2" />
              Utilisation Reports
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="w-40 bg-white"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <TabsContent key="schedule-tab" value="schedule" className="m-0 focus-visible:outline-none" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6"
              >
              {/* OT Status Summary */}
              <div className="lg:col-span-1 space-y-4 sticky top-6 self-start">
                {['OT-1', 'OT-2', 'OT-3', 'OT-4'].map(ot => {
                  const currentSurgery = otBookings.find(b => b.theatreId === ot && b.status === 'In Progress');
                  return (
                    <Card key={ot} className="border-slate-200 shadow-sm">
                      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold">{ot}</CardTitle>
                        <Badge variant="outline" className={currentSurgery ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}>
                          {currentSurgery ? 'Occupied' : 'Available'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {currentSurgery ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{currentSurgery.surgeryName}</p>
                            <div className="flex items-center text-[10px] text-slate-500">
                              <User className="w-3 h-3 mr-1" /> {currentSurgery.surgeonName}
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-amber-500 h-full w-2/3" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Ready for next case</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Main Schedule Table */}
              <div className="lg:col-span-3">
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Time & OT</TableHead>
                        <TableHead>Surgery & Patient</TableHead>
                        <TableHead>Surgical Team</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otBookings.length > 0 ? (
                        otBookings.map((b, idx) => (
                          <TableRow key={b.id || `ot-${idx}`} className="group">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{b.startTime} - {b.endTime}</span>
                                <span className="text-xs text-indigo-600 font-medium">{b.theatreId}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">{b.surgeryName}</span>
                                <span className="text-xs text-slate-500">{b.patientName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User className="w-3 h-3 text-slate-500" />
                                </div>
                                <span className="text-sm text-slate-700">{b.surgeonName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={b.type === 'Emergency' ? 'text-rose-600 border-rose-200 bg-rose-50' : 'bg-white'}>
                                {b.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(b.status)} border shadow-none`}>
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateOTStatus(b.id, 'In Progress')}>Start Surgery</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOTStatus(b.id, 'Completed')}>Mark Completed</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-rose-600" onClick={() => updateOTStatus(b.id, 'Cancelled')}>Cancel Surgery</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                            No surgeries scheduled for this date.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        )}

        {activeTab === 'reports' && (
          <TabsContent key="reports-tab" value="reports" className="m-0 focus-visible:outline-none" forceMount>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Utilisation Trend</CardTitle>
                  <CardDescription>Average OT hours used per day</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center bg-slate-50/50 rounded-b-xl border-t border-slate-100">
                   <div className="flex flex-col items-center text-slate-400">
                     <FilePieChart className="w-12 h-12 mb-2 opacity-20" />
                     <p className="text-sm font-medium">Visualizing data trend...</p>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Resource Report</CardTitle>
                    <CardDescription>Surgical team and theatre statistics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { label: 'Theatre 1 Utilisation', val: 78, color: 'bg-indigo-500' },
                      { label: 'Theatre 2 Utilisation', val: 64, color: 'bg-blue-500' },
                      { label: 'Theatre 3 Utilisation', val: 45, color: 'bg-green-500' },
                      { label: 'Cardiac OT Utilisation', val: 92, color: 'bg-rose-500' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.val}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`${item.color} h-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}
        {activeTab === 'calendar' && (
          <TabsContent key="calendar-tab" value="calendar" className="m-0 focus-visible:outline-none" forceMount>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-2xl border-none ring-1 ring-slate-100">
                <div className="bg-white border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {format(currentDate, 'MMMM')} <span className="text-slate-400 font-medium">{format(currentDate, 'yyyy')}</span>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Surgical Theatre Load</p>
                    </div>
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <Button 
                        variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm transition-all"
                        onClick={() => setCurrentDate(addDays(currentDate, calendarView === 'month' ? -30 : -7))}
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button 
                        variant="ghost" size="sm" className="px-4 h-8 text-xs font-bold text-slate-900 hover:bg-white hover:shadow-sm"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm transition-all"
                        onClick={() => setCurrentDate(addDays(currentDate, calendarView === 'month' ? 30 : 7))}
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {['day', 'week', 'month'].map((v) => (
                      <Button 
                        key={v}
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-8 px-4 text-xs font-bold capitalize transition-all",
                          calendarView === v ? "bg-white shadow-sm text-indigo-600 rounded-lg" : "text-slate-500"
                        )}
                        onClick={() => setCalendarView(v as any)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-100">
                  {days.map((day, i) => {
                    const dayBookings = otBookings.filter(b => isSameDay(new Date(b.surgeryDate), day));
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    
                    return (
                      <div 
                        key={`cal-ot-${i}`} 
                        className={cn(
                          "min-h-[140px] bg-white p-3 transition-colors group hover:bg-slate-50/50",
                          !isCurrentMonth && "bg-slate-50/40 opacity-40"
                        )}
                      >
                        <div className="flex justify-end mb-2">
                          <span className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all",
                            isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" : "text-slate-400 group-hover:text-slate-900"
                          )}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 overflow-y-auto max-h-[100px] pr-1 scrollbar-hide">
                          {dayBookings.slice(0, 4).map((b, idx) => (
                            <div 
                              key={`ev-${idx}`}
                              className={cn(
                                "text-[9px] p-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-transform hover:scale-[1.02]",
                                b.type === 'Emergency' 
                                  ? "bg-rose-50 text-rose-700 border-rose-100/50" 
                                  : "bg-indigo-50 text-indigo-700 border-indigo-100/50"
                              )}
                            >
                              <div className="flex items-center justify-between font-bold leading-none">
                                <span>{b.startTime}</span>
                                <span className="opacity-50 text-[7px] uppercase tracking-tighter">{b.theatreId}</span>
                              </div>
                              <span className="truncate font-semibold tracking-tight">{b.surgeryName}</span>
                            </div>
                          ))}
                          {dayBookings.length > 4 && (
                            <p className="text-[8px] font-bold text-slate-400 text-center py-1">+{dayBookings.length - 4} more cases</p>
                          )}
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

export default OTScheduling;
