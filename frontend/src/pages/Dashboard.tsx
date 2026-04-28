import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserRound, 
  Building2, 
  Files, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Stethoscope,
  Activity,
  Heart,
  MessageSquare,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { useHospitalStore } from '@/store/hospitalStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { role, user } = useAuthStore();
  const { patients, doctors, departments, documents } = useHospitalStore();
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (role === 'Admin') {
    return (
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50 w-fit">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Command Center Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Enterprise Overview</h1>
          <p className="text-slate-500 font-medium">Monitoring ApexCare health systems and clinical throughput in real-time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Patients', value: '12,845', trend: '+12.5%', color: 'text-emerald-600', trendBg: 'bg-emerald-50', icon: Users },
            { label: 'Doctors Active', value: '158', trend: 'Stable', color: 'text-indigo-600', trendBg: 'bg-indigo-50', icon: UserRound },
            { label: 'Total Services', value: '12', trend: 'Active', color: 'text-blue-600', trendBg: 'bg-blue-50', icon: Building2 },
            { label: 'Cloud Records', value: '4,219', trend: '+4.2%', color: 'text-emerald-600', trendBg: 'bg-emerald-50', icon: Files },
          ].map((stat, i) => (
            <motion.div key={i} variants={item}>
              <div className="premium-card p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-16 w-16" />
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border-none", stat.trendBg, stat.color)}>
                      {stat.trend}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</h2>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '70%' }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className={cn("h-full", stat.color.replace('text-', 'bg-'))} 
                     />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div variants={item} className="lg:col-span-2">
            <div className="premium-card h-[450px] flex flex-col">
              <div className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl tracking-tight">Clinical Admittance Rate</h3>
                  <p className="text-xs text-slate-400 font-medium">Cross-departmental statistical analysis (Active Cycle)</p>
                </div>
                <div className="flex gap-2">
                   {['Week', 'Month', 'Year'].map((t, i) => (
                     <Button key={t} variant={i === 0 ? "secondary" : "ghost"} className="h-8 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">{t}</Button>
                   ))}
                </div>
              </div>
              <div className="p-10 flex-1 flex items-end justify-between gap-4">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, ix) => {
                  const heights = ['40%', '55%', '85%', '70%', '95%', '35%', '25%'];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-6 h-full group">
                      <div className="w-full bg-slate-50/50 rounded-2xl relative flex-1 border border-slate-100/50 overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: heights[ix] }}
                          transition={{ delay: 0.5 + ix * 0.1, duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                          className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all cursor-pointer shadow-[0_-4px_12px_rgba(79,70,229,0.2)]"
                        >
                           <div className="absolute top-2 inset-x-0 mx-auto w-1.5 h-1.5 bg-white/40 rounded-full" />
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] group-hover:text-indigo-600 transition-colors uppercase">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="premium-card h-[450px] flex flex-col">
              <div className="p-8 border-b border-slate-50 items-center flex justify-between">
                <h3 className="font-bold text-slate-900 text-xl tracking-tight">Facility Hub</h3>
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                {[
                  { name: 'ICU Ward Critical', used: 18, total: 24, color: 'bg-rose-500', pct: '75%', trend: 'High' },
                  { name: 'Emergency Triage', used: 25, total: 30, color: 'bg-amber-500', pct: '84%', trend: 'Extreme' },
                  { name: 'Medical Oncology', used: 120, total: 150, color: 'bg-indigo-600', pct: '80%', trend: 'Normal' },
                  { name: 'Surgery Suite B', used: 4, total: 6, color: 'bg-emerald-500', pct: '66%', trend: 'Low' },
                ].map((ward) => (
                  <div key={ward.name} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-slate-900 block tracking-tight">{ward.name}</span>
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{ward.used} / {ward.total} Capacity</span>
                      </div>
                      <Badge className={cn("text-[8px] font-bold uppercase rounded-full px-2 border-none", 
                        ward.trend === 'Extreme' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                      )}>
                        {ward.trend}
                      </Badge>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 rounded-full border border-slate-100 overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: ward.pct }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={cn("h-full rounded-full shadow-sm", ward.color)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-50 mt-auto">
                 <Button className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl h-11 text-xs font-bold uppercase tracking-widest shadow-sm">
                    Optimize Assignments
                 </Button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={item}>
          <div className="premium-card overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <CalendarIcon className="h-5 w-5" />
                 </div>
                 <h3 className="font-bold text-slate-900 text-xl tracking-tight">Active Admissions Log</h3>
              </div>
              <Button variant="ghost" className="text-indigo-600 text-xs font-bold gap-2 h-10 px-4 rounded-xl hover:bg-indigo-50 tracking-widest uppercase">
                Enterprise Log <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left">
                <thead className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-6 font-bold">Identified Patient</th>
                    <th className="px-8 py-6 font-bold">Master MRN</th>
                    <th className="px-8 py-6 font-bold">Assigned Unit</th>
                    <th className="px-8 py-6 font-bold text-center">Status Protocol</th>
                    <th className="px-8 py-6 font-bold text-right">Entry Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                  {[
                    { name: 'James Sullivan', initials: 'JS', color: 'bg-indigo-50 text-indigo-600', mrn: '#PC-102938', dept: 'Cardiology', status: 'In Evaluation', statusColor: 'bg-amber-50 text-amber-600 border-amber-100', time: '09:45 AM Today' },
                    { name: 'Martha Wright', initials: 'MW', color: 'bg-emerald-50 text-emerald-600', mrn: '#PC-110294', dept: 'Ophthalmology', status: 'Stable Discharge', statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-100', time: '11:20 AM Today' },
                    { name: 'Robert Davis', initials: 'RD', color: 'bg-rose-50 text-rose-600', mrn: '#PC-118273', dept: 'Neurology Unit A', status: 'Critical Audit', statusColor: 'bg-rose-50 text-rose-600 border-rose-100', time: 'Yesterday, 04:30 PM' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => navigate(`/patients/${row.mrn}`)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[11px] border shadow-sm transition-all group-hover:scale-105", row.color, row.color.replace('bg-', 'border-'))}>
                            {row.initials}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs font-bold text-slate-400 tracking-tighter">{row.mrn}</td>
                      <td className="px-8 py-6">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg border border-slate-200/50 leading-none">
                           <Building2 className="h-3 w-3 opacity-50" /> {row.dept}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded-full px-3 py-1 border-none shadow-sm", row.statusColor)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right text-slate-400 font-bold text-[10px] uppercase tracking-wider">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Doctor Dashboard
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50 w-fit animate-pulse">
             <Heart className="h-3.5 w-3.5" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Clinical Station Active</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">Good Day, Dr. {user?.name.split(' ')[1] || user?.name}</h1>
          <p className="text-slate-500 font-medium">You have <span className="text-indigo-600 font-bold">8 diagnostics pending</span> and <span className="text-emerald-600 font-bold">12 synchronized charts</span> for today.</p>
        </div>
        
        <div className="flex items-center gap-6 p-4 premium-card bg-slate-50/50">
           <div className="flex flex-col items-center px-4 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
              <Badge className="bg-emerald-500 text-white border-none text-[8px] font-bold uppercase px-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">Active</Badge>
           </div>
           <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shift Time</span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">09:00 — 18:00</span>
           </div>
           <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-6 shadow-lg shadow-indigo-100 gap-3 group">
              <Plus className="h-4 w-4 bg-white/20 rounded h-5 w-5 flex items-center justify-center p-1" />
              <span className="font-bold text-xs uppercase tracking-[0.1em]">Create Script</span>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Patient Queue', value: '08', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', note: 'Next: Martha Wright' },
          { label: 'Pending Charts', value: '03', icon: Files, color: 'text-amber-600', bg: 'bg-amber-50', note: 'Requires Verification' },
          { label: 'Clinical Alerts', value: '01', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', note: 'Urgent: Room 104' },
        ].map((metric, i) => (
          <motion.div key={i} variants={item}>
            <div className="premium-card p-6 flex items-center gap-5 group cursor-pointer hover:border-indigo-200 transition-colors">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105", metric.bg)}>
                <metric.icon className={cn("h-7 w-7", metric.color)} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{metric.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 leading-none tracking-tighter">{metric.value}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">{metric.note}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <div className="premium-card overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shadow-inner">
                    <Clock className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active Consultation Queue</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Real-time sync protocol active</p>
                 </div>
               </div>
               <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-full px-3 py-1 text-[9px] font-bold uppercase shadow-sm">Synchronized</Badge>
            </div>
            
            <div className="p-4 space-y-2">
               {patients.slice(0, 4).map((patient, i) => (
                 <div 
                   key={patient.id} 
                   className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all group cursor-pointer rounded-[1.5rem] border border-transparent hover:border-slate-100/50"
                   onClick={() => navigate(`/patients/${patient.id}`)}
                 >
                   <div className="flex items-center gap-6">
                     <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-2xl group-hover:bg-indigo-600 transition-all border border-slate-100 shadow-sm group-hover:shadow-indigo-200 group-hover:border-indigo-500">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-white transition-colors tracking-tighter">09:{i * 30}</span>
                        <span className="text-[8px] text-slate-400 group-hover:text-white/70 transition-colors uppercase font-bold tracking-widest">AM</span>
                     </div>
                     <div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{patient.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5 font-sans">
                           <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">Triage Priority 2</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Floor 2 • B-104</span>
                        </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col items-end gap-1.5">
                         <Badge className={cn("text-[8px] font-bold uppercase rounded-full shadow-sm border-none px-3", 
                           patient.status === 'Critical' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                         )}>
                            {patient.status}
                         </Badge>
                         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Diagnostic Sync</span>
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all group-hover:translate-x-1 duration-300">
                         <ChevronRight className="h-5 w-5" />
                      </div>
                   </div>
                 </div>
               ))}
            </div>
            <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex justify-center">
               <Button variant="ghost" className="text-xs font-bold text-slate-400 hover:text-indigo-600 gap-2 uppercase tracking-[0.2em] transition-all">
                 Full Schedule Timeline <ArrowRight className="h-3 w-3" />
               </Button>
            </div>
          </div>

          <div className="premium-card overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Diagnostics</h3>
                <Button variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-widest rounded-2xl border-slate-200 px-5 shadow-sm">Audit Records</Button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-50">
               {documents.slice(0, 4).map((doc) => (
                 <div key={doc.id} className="bg-white p-6 flex items-center gap-5 hover:bg-slate-50/50 transition-all cursor-pointer group relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative shrink-0 transition-transform group-hover:-translate-y-1 duration-500">
                       <img src={doc.thumbnail} alt={doc.type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                    </div>
                    <div className="min-w-0 space-y-1">
                       <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight text-base">{doc.type}</h5>
                       <p className="text-xs text-slate-500 font-semibold truncate leading-none">{doc.patientName}</p>
                       <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                             <Clock className="h-3 w-3" /> 2h ago
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 text-[8px] border-none font-bold">Verified</Badge>
                       </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                       <ArrowUpRight className="h-4 w-4 text-indigo-400" />
                    </div>
                 </div>
               ))}
             </div>
             <div className="p-6 bg-slate-50/20 text-center border-t border-slate-50">
                <Button variant="ghost" className="text-[10px] font-bold text-indigo-600 gap-2 uppercase tracking-[0.2em] w-full">
                   Analyze Complete Repository <Files className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-10">
          <div className="relative group perspective-1000">
            <div className="premium-card bg-indigo-600 text-white rounded-[2.5rem] border-none shadow-2xl shadow-indigo-200 overflow-hidden relative z-10 p-8 transform group-hover:rotate-y-2 transition-transform duration-700">
              <div className="absolute top-[-20%] right-[-10%] p-4 opacity-10 blur-xl">
                 <Activity className="h-64 w-64" />
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight">Priority Protocol</h3>
                      <Badge className="bg-white/10 text-white border-white/20 text-[8px] font-bold uppercase px-3 py-1 backdrop-blur-md">Deep Scan Internal</Badge>
                   </div>
                   <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <AlertCircle className="h-6 w-6 text-white" />
                   </div>
                </div>
                
                <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner">
                  <p className="text-sm font-medium leading-relaxed italic text-indigo-50">
                    "Robert Davis (Neurology) MRN-89112 flagged. Recent diagnostic telemetry indicates localized pressure spikes. Immediate review mandated."
                  </p>
                </div>
                
                <Button className="w-full rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 font-bold text-xs h-12 shadow-xl shadow-black/5 group" onClick={() => navigate('/patients/PC-118273')}>
                  Initiate Chart Review <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          <div className="premium-card p-2">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-widest opacity-80">Relay Station</h3>
                <div className="flex gap-1.5">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="w-2 h-2 rounded-full bg-indigo-200" />
                </div>
             </div>
             <div className="p-4 space-y-5">
                {[
                  { name: 'Dr. Evans', avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop', time: '2m ago', text: 'Oncology ward rounds finished. Chart updates incoming.', color: 'bg-indigo-50 text-indigo-600' },
                  { name: 'Nrs. Clara', avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=80&h=80&fit=crop', time: '1h ago', text: 'MRI slot available for #PC-1029. Ready for transport?', color: 'bg-emerald-50 text-emerald-600' },
                ].map((note, i) => (
                  <div key={i} className="flex gap-4 group">
                    <Avatar className="h-10 w-10 rounded-2xl border-2 border-white shadow-sm ring-1 ring-slate-100 transform transition-transform group-hover:scale-105">
                      <AvatarImage src={note.avatar} className="object-cover" />
                      <AvatarFallback className="text-[11px] font-bold bg-slate-100 text-slate-600">{note.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1.5">
                       <div className="flex items-center justify-between font-sans">
                          <span className="text-xs font-bold text-slate-900">{note.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{note.time}</span>
                       </div>
                       <div className="text-[11px] bg-slate-50 p-4 rounded-3xl rounded-tl-none border border-slate-100 text-slate-600 font-medium leading-relaxed italic group-hover:bg-white group-hover:shadow-sm transition-all">
                          {note.text}
                       </div>
                    </div>
                  </div>
                ))}
                
                <div className="relative pt-4 px-2 pb-2">
                  <Input 
                    className="w-full bg-slate-100/50 border-transparent rounded-[1.5rem] py-6 pl-5 pr-14 text-xs font-medium focus-visible:ring-2 focus-visible:ring-indigo-100 outline-none transition-all placeholder:text-slate-400" 
                    placeholder="Broadcast relay message..."
                  />
                  <Button variant="ghost" size="icon" className="absolute right-4 top-[calc(50%+4px)] -translate-y-1/2 h-10 w-10 text-indigo-600 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm">
                     <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
             </div>
          </div>
          
          <div className="premium-card p-8 bg-gradient-to-br from-white to-slate-50 flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all">
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">System Documentation</h4>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Protocol v4.2 Deployment</p>
             </div>
             <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                <ArrowRight className="h-5 w-5" />
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;

