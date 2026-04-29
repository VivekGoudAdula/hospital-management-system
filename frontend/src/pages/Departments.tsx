import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  MapPin,
  Edit,
  Trash2,
  UserPlus
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
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
import { useAuthStore } from '@/store';
import { Department, Doctor } from '@/types';

const API_URL = 'http://localhost:8000/api';

const Departments = () => {
  const { token, role } = useAuthStore();
  const isAdmin = role?.toLowerCase() === 'admin';
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floor: '',
    total_beds: 50,
    icu_slots: 5,
    hod_id: ''
  });

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend snake_case to frontend camelCase if needed, or use as is
        setDepartments(data.map((d: any) => ({
          ...d,
          hodId: d.hod_id,
          hodName: d.hod_name,
          totalBeds: d.total_beds,
          availableBeds: d.available_beds,
          icuSlots: d.icu_slots
        })));
      }
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    if (isAdmin) fetchDoctors();
  }, [token, isAdmin]);

  const filteredDepts = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Department created successfully');
        setIsDialogOpen(false);
        setFormData({ name: '', code: '', floor: '', total_beds: 50, icu_slots: 5, hod_id: '' });
        fetchDepartments();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create department');
      }
    } catch (err) {
      toast.error('Network error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const res = await fetch(`${API_URL}/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Department deleted');
        fetchDepartments();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleAssignHOD = async (deptId: string, doctorId: string) => {
    try {
      const res = await fetch(`${API_URL}/departments/${deptId}/assign-hod`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ doctor_id: doctorId })
      });
      if (res.ok) {
        toast.success('HOD assigned successfully');
        fetchDepartments();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to assign HOD');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Departments</h1>
          <p className="text-slate-500 font-medium text-sm">Facility infrastructure and specialized clinical units management</p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 gap-3 h-14 px-8 font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" /> Add New Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl bg-white">
              <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100">
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">Configure New Unit</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-2">
                  Establish clinical parameters for a new specialized medical department within the facility infrastructure.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDept} className="px-10 pb-10 pt-8 space-y-8 max-h-[65vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unit Full Name</Label>
                    <Input 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Molecular Oncology" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold" required 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Reference Protocol Code</Label>
                    <Input 
                      value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} 
                      placeholder="ONCO-01" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-mono font-bold uppercase" required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Facility Allocation</Label>
                    <Input 
                      value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} 
                      placeholder="5th Level, Sector B" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold" required 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Clinical Lead (HOD)</Label>
                    <Select 
                      value={formData.hod_id} 
                      onValueChange={val => setFormData({...formData, hod_id: val})}
                    >
                      <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus:ring-indigo-600 font-bold">
                        <SelectValue placeholder="Select Clinical Lead" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                        {doctors.length === 0 ? (
                          <SelectItem value="none" disabled className="rounded-xl">No doctors available</SelectItem>
                        ) : (
                          doctors.map(doc => (
                            <SelectItem key={doc.id} value={doc.id} className="rounded-xl font-bold">
                              {doc.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3 text-center">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Bed Matrix</Label>
                    <Input 
                      type="number" value={formData.total_beds} onChange={e => setFormData({...formData, total_beds: parseInt(e.target.value) || 0})} 
                      className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold text-center" 
                    />
                  </div>
                  <div className="space-y-3 text-center">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Critical Care Threshold</Label>
                    <Input 
                      type="number" value={formData.icu_slots} onChange={e => setFormData({...formData, icu_slots: parseInt(e.target.value) || 0})} 
                      className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold text-center" 
                    />
                  </div>
                </div>


                <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6 -mx-10 -mb-10">
                  <Button type="button" variant="ghost" className="rounded-2xl h-14 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setIsDialogOpen(false)}>Abort Setup</Button>
                  <Button type="submit" className="h-14 px-12 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-transform">Initialize Unit Ecosystem</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Network Entities', value: departments.length, trend: 'Global Service', color: 'indigo' },
          { label: 'Bed Capacity Matrix', value: departments.reduce((acc, curr) => acc + curr.totalBeds, 0).toLocaleString(), trend: 'Optimal Flow', color: 'emerald' },
          { label: 'Available Beds', value: departments.reduce((acc, curr) => acc + curr.availableBeds, 0).toLocaleString(), trend: 'Steady Flux', color: 'amber' }
        ].map((stat, i) => (
          <Card key={i} className="premium-card p-8 group hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-indigo-400 transition-colors">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tight">
                  {isLoading ? <div className="h-10 w-20 bg-slate-100 animate-pulse rounded-xl" /> : stat.value}
                </h2>
                <Badge className={cn(
                  "rounded-xl px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                  stat.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                  "bg-amber-50 text-amber-500"
                )}>{stat.trend}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 p-8 space-y-0">
          <div className="space-y-1">
            <CardTitle className="font-black text-slate-900 text-xl tracking-tight">Institutional Directory</CardTitle>
            <CardDescription className="text-slate-400 font-medium text-sm">Systemized facility distribution mapping</CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input 
              placeholder="Query unit registry by identity..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-indigo-600 font-medium text-sm shadow-inner"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-50">
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6 pl-10">Facility Identity</TableHead>
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6">Protocol ID</TableHead>
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6">Clinical Lead</TableHead>
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6">Load Balance</TableHead>
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6">Critical Hubs</TableHead>
                  {isAdmin && <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6 text-right pr-10">Control</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-6">
                        <div className="h-12 w-full bg-slate-50 animate-pulse rounded-2xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <AnimatePresence>
                    {filteredDepts.map((dept, index) => (
                      <motion.tr 
                        key={dept.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group border-b border-slate-50 hover:bg-slate-50/30 transition-all cursor-pointer"
                      >
                        <TableCell className="py-6 pl-10">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-slate-900 text-base tracking-tight">{dept.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-indigo-400" /> Sector {dept.floor?.split(' ')[0] || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <span className="text-[11px] font-mono font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 shadow-sm uppercase tracking-wider">
                            {dept.code}
                          </span>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-9 w-9 border-2 border-white shadow-md bg-white">
                                <AvatarFallback className="text-[11px] font-black text-indigo-600 bg-indigo-50">
                                  {dept.hodName ? dept.hodName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              {dept.hodName && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white" />}
                            </div>
                            <span className="text-sm font-black text-slate-700 tracking-tight">
                              {dept.hodName || 'Unassigned'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex flex-col gap-2.5 w-32">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>{dept.availableBeds} <span className="text-[8px] opacity-60">AVAIL</span></span>
                              <span className="text-slate-300">/ {dept.totalBeds}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner p-0.5">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-1000 rounded-full shadow-sm", 
                                  dept.totalBeds === 0 ? "bg-slate-300" :
                                  (dept.availableBeds / dept.totalBeds) < 0.2 ? 'bg-rose-500' : 'bg-indigo-600'
                                )} 
                                style={{ width: `${dept.totalBeds === 0 ? 0 : (dept.availableBeds / dept.totalBeds) * 100}%` }} 
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {dept.icuSlots} CRITICAL SLOTS
                          </Badge>
                        </TableCell>
                        
                        {isAdmin && (
                          <TableCell className="text-right pr-10 py-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-xl p-2">
                                
                                {/* Sub-menu for HOD assignment */}
                                <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assign HOD</div>
                                <div className="max-h-[150px] overflow-y-auto scrollbar-hide space-y-1 mb-2">
                                  {doctors.length === 0 ? (
                                    <div className="px-2 py-1 text-xs text-slate-400">No doctors available</div>
                                  ) : (
                                    doctors.map(doc => (
                                      <DropdownMenuItem 
                                        key={doc.id} 
                                        onClick={() => handleAssignHOD(dept.id, doc.id)}
                                        className="rounded-xl text-sm font-medium cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <UserPlus className="h-3 w-3 text-indigo-500" />
                                          {doc.name}
                                        </div>
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                </div>
                                
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                
                                <DropdownMenuItem className="rounded-xl text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer" onClick={() => handleDelete(dept.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Unit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && filteredDepts.length === 0 && (
            <div className="py-32 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <Search className="h-14 w-14 text-slate-200" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Zero Correlation Detected</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">
                  No institutional units within the grid match your query parameters. Verify identifier or establish new unit protocol.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Departments;
