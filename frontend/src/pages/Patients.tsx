import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye,
  FileEdit,
  Trash2,
  Filter,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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

const Patients = () => {
  const { patients, fetchPatients, addPatient, deletePatient, doctors, fetchDoctors, stats, fetchStats } = useHospitalStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'male',
    blood_group: 'O+',
    phone: '',
    email: '',
    assigned_doctor_id: '',
    insurance_info: '',
    emergency_contact: '',
    address: ''
  });

  React.useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchStats();
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );
  
  const handleDeletePatient = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to decommission the record for ${name}? This action cannot be reversed.`)) {
      try {
        await deletePatient(id);
        toast.success(`Patient record ${name} has been purged from master registry.`);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await addPatient(formData);
      if (result.is_duplicate) {
        toast.warning(result.message);
      } else {
        toast.success('Patient registry created successfully');
      }
      setIsDialogOpen(false);
      // Reset form
      setFormData({
        full_name: '',
        dob: '',
        gender: 'male',
        blood_group: 'O+',
        phone: '',
        email: '',
        assigned_doctor_id: '',
        insurance_info: '',
        emergency_contact: '',
        address: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50 w-fit">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Registry Control</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 font-medium">Access and manage comprehensive patient records and clinical history.</p>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50">
              <Filter className="h-4 w-4 mr-2" /> Filter List
           </Button>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 gap-3 h-12 px-6 group">
                  <Plus className="h-5 w-5 bg-white/20 rounded-lg p-1" />
                  <span className="font-bold text-xs uppercase tracking-widest">New Admission</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                     <Users className="h-40 w-40" />
                  </div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Clinical Admission</DialogTitle>
                  <DialogDescription className="text-indigo-100 font-medium text-base">
                    Initialize a new enterprise health record for incoming clinical entities.
                  </DialogDescription>
                </DialogHeader>
                <form id="patient-form" onSubmit={handleCreatePatient} className="px-8 pb-8 pt-6 space-y-6 max-h-[60vh] overflow-y-auto bg-white scrollbar-hide">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                         <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                         <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Personal Identity</h3>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Entity Full Name</Label>
                        <Input 
                          placeholder="E.g. Michael Smith" 
                          className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Birth Protocol</Label>
                          <Input 
                            type="date" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Bio Gender</Label>
                          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium">
                              <SelectValue placeholder="Specify" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                              <SelectItem value="male" className="rounded-xl">Male</SelectItem>
                              <SelectItem value="female" className="rounded-xl">Female</SelectItem>
                              <SelectItem value="other" className="rounded-xl">Binary Neutral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Blood Archetype</Label>
                          <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                                <SelectItem key={b} value={b} className="rounded-xl">{b}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Relay Contact</Label>
                          <Input 
                            placeholder="+1 (555) 000-0000" 
                            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Protocol</Label>
                        <Input 
                          type="email"
                          placeholder="michael@example.com" 
                          className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                         <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                         <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Clinical Allocation</h3>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Lead Physician</Label>
                        <Select value={formData.assigned_doctor_id} onValueChange={(v) => setFormData({ ...formData, assigned_doctor_id: v })}>
                          <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium">
                            <SelectValue placeholder="Assign Master Doctor" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                            {doctors.map(doc => (
                              <SelectItem key={doc.id} value={doc.id} className="rounded-xl">{doc.name} ({doc.specialization})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Insurance Protocol</Label>
                        <Input 
                          placeholder="E.g. BlueCross Apex" 
                          className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                          value={formData.insurance_info}
                          onChange={(e) => setFormData({ ...formData, insurance_info: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Emergency Relay</Label>
                        <Input 
                          placeholder="Name and Frequency" 
                          className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                          value={formData.emergency_contact}
                          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Base Residence</Label>
                        <textarea 
                          className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none min-h-[105px]" 
                          placeholder="Localized Residential Meta" 
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </form>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="ghost" className="rounded-2xl h-12 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setIsDialogOpen(false)}>Abort Registry</Button>
                  <Button type="submit" form="patient-form" className="rounded-2xl h-12 px-12 bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 group" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Finalize Admission'} <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Enrolled', value: stats ? stats.total_patients.toLocaleString() : '...', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Users },
          { label: 'Admitted Now', value: stats ? stats.admitted_now.toLocaleString() : '...', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: UserCheck },
          { label: 'Out-Patient', value: stats ? stats.out_patient.toLocaleString() : '...', color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
          { label: 'Critical Care', value: stats ? stats.critical_care.toLocaleString() : '...', color: 'text-rose-600', bg: 'bg-rose-50', icon: Layers },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <stat.icon className="h-12 w-12" />
            </div>
            <div className="space-y-4 relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-bold text-slate-900 leading-none tracking-tighter">{stat.value}</h2>
                <Badge className={cn("rounded-full border-none px-3 py-1 text-[8px] font-bold uppercase transform transition-transform group-hover:scale-105", stat.bg, stat.color)}>Monitor</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-8 border-b border-slate-50 gap-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Active Master Registry</h3>
            <p className="text-slate-400 text-xs font-medium">Filtering through <span className="text-indigo-600 font-bold">{filteredPatients.length}</span> verified clinical entities</p>
          </div>
          <div className="relative w-full lg:w-[400px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Query by Master MRN or Entity Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-slate-50 border-transparent rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all text-sm font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6 pl-8">Clinical Profile</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Identity MRN</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Protocol Specs</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Current Status</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6 text-right pr-10">Interface</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredPatients.map((patient, index) => (
                  <motion.tr 
                    key={patient.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    className="group border-b border-slate-50/50 last:border-none hover:bg-slate-50/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-md bg-white transition-all group-hover:scale-105 group-hover:rotate-2 group-hover:shadow-indigo-100">
                             <AvatarFallback className="font-bold text-[11px] text-slate-500 bg-slate-50">{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm", 
                            patient.status === 'Stable' ? 'bg-emerald-500' :
                            patient.status === 'Critical' ? 'bg-rose-500 animate-pulse' :
                            'bg-amber-500'
                          )} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight text-base">{patient.name}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{patient.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 group-hover:bg-white transition-colors group-hover:text-indigo-500">
                        {patient.mrn}
                      </span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-700">
                          {new Date().getFullYear() - new Date(patient.dob).getFullYear()} Years • {patient.gender.charAt(0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Bio Sync</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={cn("rounded-full border-none px-3 py-1 text-[9px] font-bold uppercase shadow-sm", 
                        patient.status === 'Stable' ? 'bg-emerald-50 text-emerald-600' :
                        patient.status === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      )}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10 py-6">
                      <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatient(patient.id, patient.name);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" onClick={() => navigate(`/patients/${patient.id}`)}>
                          <Eye className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-lg" onClick={() => navigate(`/patients/${patient.id}`)}>
                           <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="py-32 text-center bg-slate-50/50">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative inline-block mb-8"
            >
              <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-slate-100">
                <Search className="h-10 w-10 text-indigo-200" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-600 shadow-lg shadow-indigo-100 rounded-2xl flex items-center justify-center text-white p-1">
                 <Plus className="h-6 w-6" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Entity Not Found</h2>
            <p className="text-slate-400 max-w-sm mx-auto mt-3 font-medium">
              Database verification sequence failed to isolate a record matching "{searchTerm}".
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button variant="outline" className="rounded-2xl px-10 h-14 font-bold uppercase tracking-widest text-xs border-slate-200" onClick={() => setSearchTerm('')}>Reset Query</Button>
              <Button className="rounded-2xl px-10 h-14 bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold uppercase tracking-widest text-xs" onClick={() => setIsDialogOpen(true)}>New Admission</Button>
            </div>
          </div>
        )}

        <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Syncing <span className="text-indigo-600">{filteredPatients.length}</span> of <span className="text-slate-900">{patients.length}</span> Master Entries
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100" disabled><ArrowRight className="h-5 w-5 rotate-180" /></Button>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold bg-indigo-600 text-white h-10 w-10 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-100">1</span>
               <span className="text-xs font-bold text-slate-400 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100 cursor-pointer transition-all">2</span>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100"><ArrowRight className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Patients;
