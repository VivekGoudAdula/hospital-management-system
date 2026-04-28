import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Bed, 
  Stethoscope,
  ChevronDown,
  ChevronUp,
  MapPin,
  Edit,
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
import { useHospitalStore } from '@/store/hospitalStore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const Departments = () => {
  const { departments, addDepartment } = useHospitalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredDepts = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Department created successfully');
    setIsDialogOpen(false);
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button size="lg" className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 gap-3 h-14 px-8 font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Add New Unit
            </Button>
          } />
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
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unit Full Name</Label>
                  <Input id="name" placeholder="e.g. Molecular Oncology" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold" required />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Reference Protocol Code</Label>
                  <Input id="code" placeholder="ONCO-GRID-01" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-mono font-bold uppercase" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="floor" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Facility Allocation</Label>
                  <Input id="floor" placeholder="5th Level, Sector B" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold" required />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="hod" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Department Custodian</Label>
                  <Select>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:ring-indigo-600 font-bold">
                      <SelectValue placeholder="Assign Lead Medical Officer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="d1" className="rounded-xl my-1 font-bold">Dr. Sarah Johnson</SelectItem>
                      <SelectItem value="d2" className="rounded-xl my-1 font-bold">Dr. Michael Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3 text-center">
                  <Label htmlFor="beds" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Bed Matrix</Label>
                  <Input id="beds" type="number" defaultValue="50" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold text-center" />
                </div>
                <div className="space-y-3 text-center">
                  <Label htmlFor="icu" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Critical Care Threshold</Label>
                  <Input id="icu" type="number" defaultValue="5" className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus-visible:ring-indigo-600 font-bold text-center" />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Operational Scope Statement</Label>
                <textarea 
                  id="desc" 
                  placeholder="Outline the specialized medical services and clinical standards for this unit..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 min-h-[140px] outline-none focus:ring-1 focus:ring-indigo-600 transition-all text-sm font-medium italic shadow-inner" 
                />
              </div>
            </form>
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
              <Button variant="ghost" className="rounded-2xl h-14 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setIsDialogOpen(false)}>Abort Setup</Button>
              <Button type="submit" className="h-14 px-12 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-transform" onClick={handleAddDept}>Initialize Unit Ecosystem</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Network Entities', value: departments.length, trend: 'Global Service', color: 'indigo' },
          { label: 'Bed Capacity Matrix', value: '1,240', trend: 'Optimal Flow', color: 'emerald' },
          { label: 'Operational Load', value: '78%', trend: 'Steady Flux', color: 'amber' }
        ].map((stat, i) => (
          <Card key={i} className="premium-card p-8 group hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-indigo-400 transition-colors">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tight">{stat.value}</h2>
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
                  <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black py-6 text-right pr-10">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                              <MapPin className="h-3 w-3 text-indigo-400" /> Sector {dept.floor.split(' ')[0]}
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
                              <AvatarFallback className="text-[11px] font-black text-indigo-600 bg-indigo-50">{dept.hodName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white" />
                          </div>
                          <span className="text-sm font-black text-slate-700 tracking-tight">{dept.hodName}</span>
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
                                (dept.availableBeds / dept.totalBeds) < 0.2 ? 'bg-rose-500' : 'bg-indigo-600'
                              )} 
                              style={{ width: `${(dept.availableBeds / dept.totalBeds) * 100}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                          {dept.icuSlots} CRITICAL SLOTS
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-10 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all">
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {filteredDepts.length === 0 && (
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
