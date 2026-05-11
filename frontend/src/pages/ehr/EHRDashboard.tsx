import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  User,
  History,
  ExternalLink
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const EHRDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    activePatients: 0,
    pendingReviews: 0,
    criticalAlerts: 0
  });

  const fetchEHRPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ehr/dashboard/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      
      // Calculate basic stats for foundation
      setStats({
        activePatients: response.data.filter(p => p.status === 'active' || p.status === 'admitted').length,
        pendingReviews: Math.floor(Math.random() * 5), // Placeholder for foundation
        criticalAlerts: response.data.filter(p => p.status === 'Critical').length
      });
    } catch (error) {
      console.error("Error fetching EHR patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEHRPatients();
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50 w-fit">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Clinical Command</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Electronic Health Records</h1>
          <p className="text-slate-500 font-medium">Manage patient clinical lifecycles and visit sessions.</p>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50">
              <Filter className="h-4 w-4 mr-2" /> Clinical Filters
           </Button>
           <Button onClick={() => fetchEHRPatients()} className="rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 gap-3 h-12 px-6 group">
             <Activity className="h-4 w-4" />
             <span className="font-bold text-xs uppercase tracking-widest text-white">Refresh Stream</span>
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Today's Active Patients", value: stats.activePatients, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: "Pending Reviews", value: stats.pendingReviews, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: "Critical Alerts", value: stats.criticalAlerts, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</h2>
            </div>
            <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", stat.bg)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="premium-card overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Clinical Workspace List</h3>
            <p className="text-slate-400 text-xs font-medium">Ready to initialize clinical sessions for <span className="text-indigo-600 font-bold">{filteredPatients.length}</span> patients.</p>
          </div>
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Query by MRN or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-slate-50 border-transparent rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6 pl-8">Patient Entity</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Identity MRN</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Department</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Lead Doctor</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6">Session</TableHead>
                <TableHead className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold py-6 text-right pr-10">Command</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing Clinical Registry...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-bold">No Clinical Matches Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, index) => (
                  <motion.tr 
                    key={patient.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-slate-50/50 last:border-none hover:bg-slate-50/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/ehr/${patient.id}`)}
                  >
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100/50">
                          <AvatarFallback className="text-xs">{patient.full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{patient.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{patient.gender} • {format(new Date(), 'yyyy') - format(new Date(patient.dob), 'yyyy')}Y</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {patient.mrn}
                      </span>
                    </TableCell>
                    <TableCell className="py-6">
                      <p className="text-sm font-bold text-slate-600">General OPD</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Department</p>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">Dr. Assigned</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={cn("rounded-full border-none px-3 py-1 text-[9px] font-bold uppercase", 
                        patient.status === 'Critical' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      )}>
                        {patient.status === 'Critical' ? 'Immediate' : 'Routine'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10 py-6">
                       <Button variant="ghost" className="rounded-xl h-10 px-4 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          Open EHR <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                       </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
};

export default EHRDashboard;
