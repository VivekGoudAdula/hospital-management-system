import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Stethoscope,
  Filter,
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  Calendar,
  Mail,
  Phone,
  ArrowUpRight,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHospitalStore } from '@/store/hospitalStore';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Doctors = () => {
  const { 
    doctors, 
    departments, 
    fetchDoctors, 
    fetchDepartments, 
    addDoctor, 
    deleteDoctor,
    fetchAvailability,
    addAvailability,
    deleteAvailability
  } = useHospitalStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState<any>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    sub_specialization: '',
    qualifications: '',
    experience_years: 0,
    registration_number: '',
    consultation_fee: 0,
    followup_fee: 0,
    primary_department_id: '',
    secondary_department_ids: [] as string[]
  });

  // Availability Form State
  const [availForm, setAvailForm] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '13:00',
    consultation_duration: 15,
    is_leave: false
  });

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (viewingDoctor && viewingDoctor.activeTab === 'schedule') {
      loadAvailability(viewingDoctor.id);
    }
  }, [viewingDoctor]);

  const loadAvailability = async (doctorId: string) => {
    const slots = await fetchAvailability(doctorId);
    setAvailabilitySlots(slots);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
        experience_years: Number(formData.experience_years),
        consultation_fee: Number(formData.consultation_fee),
        followup_fee: Number(formData.followup_fee)
      };
      
      await addDoctor(payload);
      toast.success('Medical professional added to the registry');
      setIsDialogOpen(false);
      // Reset form
      setFormData({
        name: '', email: '', password: '', specialization: '', sub_specialization: '',
        qualifications: '', experience_years: 0, registration_number: '',
        consultation_fee: 0, followup_fee: 0, primary_department_id: '',
        secondary_department_ids: []
      });
    } catch (error: any) {
      toast.error(error.message || 'Verification sequence failed.');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (confirm('Are you sure you want to decommission this professional account?')) {
      await deleteDoctor(id);
      toast.success('Professional account decommissioned.');
    }
  };

  const handleAddAvailability = async () => {
    try {
      await addAvailability(viewingDoctor.id, availForm);
      toast.success('Availability matrix updated.');
      loadAvailability(viewingDoctor.id);
    } catch (error: any) {
      toast.error(error.message || 'Sync failed.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteAvailability(slotId);
      toast.success('Slot removed from matrix.');
      loadAvailability(viewingDoctor.id);
    } catch (error: any) {
      toast.error(error.message || 'Deletion failed.');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || doctor.departments.some(d => d.id === deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50 w-fit">
            <Stethoscope className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Medical Faculty Registry</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">Medical Professionals</h1>
          <p className="text-slate-500 font-medium">Verified registry of all practicing specialists at ApexCare Hospital.</p>
        </div>

        <div className="flex items-center gap-4">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 gap-3 h-12 px-6 group">
                  <Plus className="h-5 w-5 bg-white/20 rounded-lg p-1" />
                  <span className="font-bold text-xs uppercase tracking-widest">Register Professional</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative shrink-0">
                  <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                     <Stethoscope className="h-40 w-40" />
                  </div>
                  <DialogTitle className="text-3xl font-bold tracking-tight">Onboard Professional</DialogTitle>
                  <DialogDescription className="text-indigo-100 font-medium text-base">
                    Initialize a new faculty account in the ApexCare medical registry.
                  </DialogDescription>
                </DialogHeader>
                <form id="add-doctor-form" onSubmit={handleAddDoctor} className="px-10 pb-10 pt-8 space-y-8 overflow-y-auto flex-1 bg-white scrollbar-hide">
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 mb-10 bg-slate-50 border border-slate-100">
                      <TabsTrigger value="profile" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-3">Profile Meta</TabsTrigger>
                      <TabsTrigger value="account" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-3">Account Protocol</TabsTrigger>
                      <TabsTrigger value="logistics" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-3">Logistics</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Entity Full Name</Label>
                          <Input 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="Dr. John Doe" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Primary Department</Label>
                          <Select 
                            value={formData.primary_department_id}
                            onValueChange={v => setFormData({...formData, primary_department_id: v})}
                          >
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium">
                              <SelectValue placeholder="Specify Unit" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                              {departments.map(d => <SelectItem key={d.id} value={d.id} className="rounded-xl">{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Specialization</Label>
                          <Input 
                            value={formData.specialization}
                            onChange={e => setFormData({...formData, specialization: e.target.value})}
                            placeholder="Cardiology" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">License UID</Label>
                          <Input 
                            value={formData.registration_number}
                            onChange={e => setFormData({...formData, registration_number: e.target.value})}
                            placeholder="MED-12345" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Qualifications (Comma separated)</Label>
                        <Input 
                          value={formData.qualifications}
                          onChange={e => setFormData({...formData, qualifications: e.target.value})}
                          placeholder="MBBS, MD, PhD" 
                          className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="account" className="space-y-6">
                      <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 mb-4 flex gap-4">
                        <Mail className="h-6 w-6 text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-600 font-medium leading-relaxed italic">
                          Synchronizing these credentials will link the professional to the ApexCare Cloud Infrastructure.
                        </p>
                      </div>
                      <div className="grid gap-6">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Institutional Email Relay</Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              type="email" 
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              placeholder="faculty.member@apexcare.com" 
                              className="h-12 rounded-2xl pl-11 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                              required 
                            />
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Initial Security Access Key</Label>
                          <Input 
                            type="password" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            placeholder="••••••••" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                            required 
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="logistics" className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Years Exp.</Label>
                          <Input 
                            type="number" 
                            value={formData.experience_years}
                            onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Consult Fee ($)</Label>
                          <Input 
                            type="number" 
                            value={formData.consultation_fee}
                            onChange={e => setFormData({...formData, consultation_fee: parseFloat(e.target.value)})}
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                          />
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Secondary Departments</Label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl">
                          {departments.filter(d => d.id !== formData.primary_department_id).map(d => (
                            <Badge 
                              key={d.id} 
                              variant={formData.secondary_department_ids.includes(d.id) ? "default" : "outline"}
                              className="cursor-pointer rounded-lg px-3 py-1.5"
                              onClick={() => {
                                const ids = formData.secondary_department_ids.includes(d.id)
                                  ? formData.secondary_department_ids.filter(id => id !== d.id)
                                  : [...formData.secondary_department_ids, d.id];
                                setFormData({...formData, secondary_department_ids: ids});
                              }}
                            >
                              {d.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
                <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="ghost" className="rounded-2xl h-14 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setIsDialogOpen(false)}>Cancel Registry</Button>
                  <Button form="add-doctor-form" type="submit" className="rounded-2xl h-14 px-12 bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 group">
                    Deploy Professional Account <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search by faculty name, specialization..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all text-sm font-medium shadow-sm placeholder:text-slate-400"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full lg:w-[300px] h-14 rounded-2xl bg-white border-slate-200 shadow-sm text-sm font-bold uppercase tracking-widest text-slate-600">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-indigo-500" />
              <SelectValue placeholder="Filter by Department" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
            <SelectItem value="all" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">All Facilities</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredDoctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="premium-card p-0 overflow-hidden flex flex-col h-full bg-white transition-all group-hover:-translate-y-1">
                <div className="p-6 pb-0 relative">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-20 w-20 rounded-3xl border-4 border-slate-50 shadow-md bg-slate-50 transition-all group-hover:shadow-indigo-100 group-hover:scale-105 duration-500">
                      <AvatarImage src={`https://images.unsplash.com/photo-${1580281116636 + index}?w=160&h=160&fit=crop`} className="object-cover" />
                      <AvatarFallback className="rounded-3xl bg-indigo-50 text-indigo-600 font-bold text-xl">
                        {doctor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Badge className={cn("rounded-full border-none px-3 py-1 text-[8px] font-bold uppercase shadow-sm", 
                        doctor.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                        doctor.status === 'Busy' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-500'
                      )}>
                        {doctor.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteDoctor(doctor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="pt-6 space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">{doctor.name}</h3>
                    <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      {doctor.specialization}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-indigo-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Exp.</p>
                      <p className="text-sm font-bold text-slate-800 leading-none tracking-tight">{doctor.experience_years}+ Years</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-indigo-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Consult Fee</p>
                      <p className="text-sm font-bold text-slate-800 leading-none tracking-tight">${doctor.consultation_fee}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-50 flex-1">
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                      <Mail className="h-4 w-4 text-slate-300 group-hover:text-indigo-400" />
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                      <Phone className="h-4 w-4 text-slate-300 group-hover:text-indigo-400" />
                      <span>{doctor.registration_number}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 shadow-none transition-all"
                      onClick={() => setViewingDoctor({...doctor, activeTab: 'profile'})}
                    >
                       View Data Sheet <ArrowUpRight className="h-3 w-3 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-11 w-11 rounded-xl p-0 flex items-center justify-center border-slate-200 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                      onClick={() => setViewingDoctor({...doctor, activeTab: 'schedule'})}
                    >
                       <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDoctors.length === 0 && (
        <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
           <div className="relative inline-block mb-8">
              <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-slate-100">
                <Users className="h-10 w-10 text-indigo-200" />
              </div>
            </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Professional Not Found</h2>
          <p className="text-slate-400 max-w-sm mx-auto mt-3 font-medium">Verification sequence failed to isolate a medical professional matching your active search filters.</p>
          <Button variant="ghost" className="mt-8 rounded-2xl px-10 h-14 font-bold uppercase tracking-widest text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => { setSearchTerm(''); setDeptFilter('all'); }}>Reset Registry Query</Button>
        </div>
      )}

      {/* Doctor Detail Viewer */}
      <Dialog open={!!viewingDoctor} onOpenChange={() => setViewingDoctor(null)}>
        <DialogContent className="sm:max-w-4xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl max-h-[90vh] flex flex-col bg-white">
          <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100 shrink-0">
             <div className="flex items-center gap-8">
                <div className="relative group">
                  <Avatar className="h-24 w-24 rounded-[2rem] border-4 border-white shadow-xl bg-white transform -rotate-3 transition-transform group-hover:rotate-0 duration-500">
                    <AvatarImage src={`https://images.unsplash.com/photo-1580281116636?w=160&h=160&fit=crop`} />
                    <AvatarFallback className="rounded-[2rem] bg-indigo-50 text-indigo-600 font-bold text-2xl uppercase">
                      {viewingDoctor?.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-slate-50 shadow-lg">
                     <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3">
                      <DialogTitle className="text-3xl font-bold text-slate-900 tracking-tight">{viewingDoctor?.name}</DialogTitle>
                      <Badge className="bg-indigo-600 text-white border-none text-[8px] font-bold uppercase px-3 py-1 rounded-full shadow-lg shadow-indigo-100 tracking-widest">Master Faculty</Badge>
                   </div>
                   <DialogDescription className="text-indigo-600 font-bold flex items-center gap-2 text-sm uppercase tracking-widest opacity-80 italic">
                      <Stethoscope className="h-4 w-4" />
                      {viewingDoctor?.specialization} Specialist • {viewingDoctor?.sub_specialization || 'Clinical Lead'}
                   </DialogDescription>
                </div>
             </div>
          </DialogHeader>

          <div className="p-10 overflow-y-auto flex-1 bg-white scrollbar-hide">
             <Tabs 
                value={viewingDoctor?.activeTab || "profile"} 
                onValueChange={(val) => setViewingDoctor((prev: any) => ({ ...prev, activeTab: val }))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 mb-10 bg-slate-50 border border-slate-100">
                  <TabsTrigger value="profile" className="rounded-xl flex items-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest uppercase">Clinical Data Sheet</TabsTrigger>
                  <TabsTrigger value="schedule" className="rounded-xl flex items-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest uppercase">Shift Matrix</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-1 items-center justify-center group hover:bg-white hover:border-indigo-100 transition-all">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Clinic Tenure</p>
                         <p className="text-3xl font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{viewingDoctor?.experience_years}+ <span className="text-xs uppercase tracking-tighter opacity-50">Yrs</span></p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-1 items-center justify-center group hover:bg-white hover:border-indigo-100 transition-all">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Base Consultation</p>
                         <p className="text-3xl font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors"><span className="text-xs opacity-50">$</span>{viewingDoctor?.consultation_fee}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-1 items-center justify-center group hover:bg-white hover:border-indigo-100 transition-all">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Followup Fee</p>
                         <p className="text-3xl font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors"><span className="text-xs opacity-50">$</span>{viewingDoctor?.followup_fee}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-slate-100 flex-1" />
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Qualifications</h4>
                        <div className="h-px bg-slate-100 flex-1" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                         {viewingDoctor?.qualifications.map((q: string, i: number) => (
                            <div key={i} className="px-5 py-2.5 bg-white border border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-2xl shadow-sm hover:border-indigo-100 hover:text-indigo-600 cursor-default transition-all">{q}</div>
                         ))}
                      </div>
                   </div>

                   <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100 relative group overflow-hidden">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                         Allocated Departments
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingDoctor?.departments.map((d: any) => (
                          <Badge key={d.id} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest", d.is_primary ? "bg-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600")}>
                            {d.name} {d.is_primary && "(Primary)"}
                          </Badge>
                        ))}
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="schedule" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center">Update Availability Matrix</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Day</Label>
                          <Select value={availForm.day_of_week} onValueChange={v => setAvailForm({...availForm, day_of_week: v})}>
                            <SelectTrigger className="h-11 rounded-xl bg-white border-transparent shadow-sm font-bold text-[10px] uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl p-2">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <SelectItem key={d} value={d} className="rounded-lg">{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Start Phase</Label>
                          <Input type="time" value={availForm.start_time} onChange={e => setAvailForm({...availForm, start_time: e.target.value})} className="h-11 rounded-xl border-transparent bg-white shadow-sm font-bold text-xs" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">End Phase</Label>
                          <Input type="time" value={availForm.end_time} onChange={e => setAvailForm({...availForm, end_time: e.target.value})} className="h-11 rounded-xl border-transparent bg-white shadow-sm font-bold text-xs" />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAddAvailability} className="w-full h-11 rounded-xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100">Inject Slot</Button>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-1">Active Availability Slots</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {availabilitySlots.map((slot) => (
                         <div key={slot.id} className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                           <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                               <Clock className="h-5 w-5 text-indigo-500" />
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{slot.day_of_week}</p>
                               <p className="text-sm font-bold text-slate-800 tracking-tight">{slot.start_time} — {slot.end_time}</p>
                             </div>
                           </div>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteSlot(slot.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                       {availabilitySlots.length === 0 && (
                         <div className="col-span-full py-10 text-center text-slate-400 italic text-sm">No active shift slots detected.</div>
                       )}
                     </div>
                   </div>
                </TabsContent>
             </Tabs>
          </div>
          
          <DialogFooter className="p-10 bg-slate-50 border-t border-slate-100 mt-auto flex flex-row items-center justify-between gap-6">
             <Button variant="ghost" className="rounded-2xl h-14 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setViewingDoctor(null)}>Close Data Interface</Button>
             <div className="flex gap-4">
                <Button variant="outline" className="h-14 px-8 rounded-2xl text-slate-600 font-bold uppercase tracking-widest text-xs border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Sync Audit Trails</Button>
                <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Initialize Consultation</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Doctors;
