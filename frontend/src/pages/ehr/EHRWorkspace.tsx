import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  User, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Calendar,
  FileText,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  History,
  Share2,
  FileDown,
  LayoutDashboard,
  MoreVertical,
  PlusCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  Files
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEHRStore, useAuthStore } from '@/store';
import SOAPNotesPanel from './components/SOAPNotesPanel';
import DiagnosisPanel from './components/DiagnosisPanel';
import PrescriptionPanel from './components/PrescriptionPanel';
import VitalsPanel from './components/VitalsPanel';
import LabsPanel from './components/LabsPanel';
import TimelinePanel from './components/TimelinePanel';
import ReferralPanel from './components/ReferralPanel';
import DocumentRepository from './components/DocumentRepository';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EHRWorkspace = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const { 
    currentPatient, 
    currentVisit, 
    visitHistory, 
    timeline,
    loading, 
    selectedTab,
    soapNote,
    diagnosis,
    latestVitals,
    fetchPatientEHR, 
    fetchActiveVisit,
    fetchTimeline,
    fetchDiagnosis,
    fetchLatestVitals,
    fetchLabs,
    fetchReferrals,
    fetchDocumentStudies,
    setSelectedTab,
    reset 
  } = useEHRStore();

  useEffect(() => {
    if (patientId) {
      fetchPatientEHR(patientId);
      fetchActiveVisit(patientId);
      fetchTimeline(patientId);
      fetchLatestVitals(patientId);
      fetchReferrals(patientId);
      fetchDocumentStudies(patientId);
    }
    return () => reset();
  }, [patientId]);

  useEffect(() => {
    if (currentVisit?.id) {
      fetchDiagnosis(currentVisit.id);
      fetchLabs(currentVisit.id);
    }
  }, [currentVisit?.id]);

  if (loading && !currentPatient) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100" />
        <div className="text-center space-y-2">
           <h3 className="text-xl font-bold text-slate-800 tracking-tight">Initializing Clinical Workspace</h3>
           <p className="text-slate-400 font-medium animate-pulse">Syncing patient medical records and visit history...</p>
        </div>
      </div>
    );
  }

  if (!currentPatient) return null;

  const menuItems = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'SOAP', icon: FileText, label: 'SOAP Notes', hidden: !['doctor', 'admin'].includes(role?.toLowerCase() || '') },
    { id: 'Diagnoses', icon: Stethoscope, label: 'Diagnoses', hidden: !['doctor', 'admin'].includes(role?.toLowerCase() || '') },
    { id: 'Prescriptions', icon: ClipboardList, label: 'Prescriptions', hidden: !['doctor', 'admin'].includes(role?.toLowerCase() || '') },
    { id: 'Vitals', icon: Activity, label: 'Vitals' },
    { id: 'Labs', icon: FlaskConical, label: 'Labs' },
    { id: 'Timeline', icon: History, label: 'Timeline' },
    { id: 'Referrals', icon: Share2, label: 'Referrals', hidden: !['doctor', 'admin'].includes(role?.toLowerCase() || '') },
    { id: 'Documents', icon: FileDown, label: 'Documents' },
  ].filter(item => !item.hidden);

  return (
    <div className="flex flex-col h-screen -m-6 bg-[#f8fafc] overflow-hidden">
      {/* TOP HEADER - STICKY & PREMIUM */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl h-12 w-12 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all shadow-sm active:scale-95"
            onClick={() => navigate('/ehr')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 font-bold text-2xl relative group cursor-pointer">
              {currentPatient.full_name?.split(' ').map(n => n[0]).join('')}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-4 border-white rounded-full" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{currentPatient.full_name}</h1>
                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">Active Session</Badge>
              </div>
              <div className="flex items-center gap-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md"><User className="h-3.5 w-3.5 text-slate-300" /> {currentPatient.mrn}</span>
                <span className="text-slate-200">|</span>
                <span>{currentPatient.gender}</span>
                <span className="text-slate-200">•</span>
                <span>{format(new Date(currentPatient.dob), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-10 ml-10 border-l border-slate-100 pl-10">
             <div className="space-y-1.5">
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-none">Primary Physician</p>
               <p className="text-sm font-extrabold text-slate-700">Dr. {user?.name || 'Clinical Lead'}</p>
             </div>
             <div className="space-y-1.5">
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-none">Visit Reference</p>
               <p className="text-sm font-mono font-extrabold text-indigo-600">#{currentVisit?.id?.slice(-8) || 'INITIALIZING'}</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-2xl border-slate-200 h-12 px-6 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
             <Share2 className="h-4 w-4 mr-2 text-indigo-500" /> Export Case
          </Button>
          <Button className="rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200/50 h-12 px-8 text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
             Complete & Sign
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT NAV - SLIMMER & INTEGRATED */}
        <div className="w-72 bg-white border-r border-slate-200/60 flex flex-col p-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-1 mb-8">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] px-4 mb-4">Clinical Modules</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={cn(
                  "flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group relative",
                  selectedTab === item.id 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                    : "text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600"
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", selectedTab === item.id ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                  <span>{item.label}</span>
                </div>
                {selectedTab === item.id && (
                  <motion.div layoutId="activeTab" className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-8">
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Files className="h-3 w-3" /> External Records
              </p>
              <div className="space-y-3">
                 {[
                   { name: 'X-Ray_Report_Chest.pdf', date: 'Oct 24' },
                   { name: 'Complete_Blood_Panel.pdf', date: 'Oct 22' },
                 ].map((doc, i) => (
                   <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white p-2 -m-2 rounded-xl transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-bold">PDF</div>
                         <span className="text-[11px] font-extrabold text-slate-600 truncate group-hover:text-indigo-600">{doc.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 shrink-0">{doc.date}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CANVAS - MAXIMUM UTILIZATION */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] scrollbar-hide relative">
          <div className="w-full max-w-[1600px] mx-auto p-8 lg:p-12">
            <AnimatePresence mode="wait">
              {(() => {
                if (selectedTab === 'Overview') {
                  return (
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-12 gap-8"
                    >
                       <div className="col-span-12 lg:col-span-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Clinical Session Engine */}
                             <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100/50 overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-10">
                                   <div className="flex items-center justify-between mb-6">
                                      <Badge className="bg-white/20 backdrop-blur-md text-white border-none rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5">Clinical Protocol Active</Badge>
                                      <Clock className="h-5 w-5 text-indigo-100/60" />
                                   </div>
                                   <CardTitle className="text-3xl font-extrabold tracking-tight">Visit Management</CardTitle>
                                   <p className="text-indigo-100/80 text-sm font-bold mt-2">Session initialized {currentVisit ? format(new Date(currentVisit.admission_date), 'MMM dd • hh:mm a') : '...'}</p>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                   <div className="grid gap-6">
                                      <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-all cursor-pointer">
                                         <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                            <FileText className="h-6 w-6" />
                                         </div>
                                         <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chief Complaint</p>
                                            <p className="text-base font-extrabold text-slate-800">{currentVisit?.chief_complaint || 'No acute distress noted'}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-all cursor-pointer">
                                         <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                            <Stethoscope className="h-6 w-6" />
                                         </div>
                                         <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clinic Objective</p>
                                            <p className="text-base font-extrabold text-slate-800">Comprehensive Clinical Diagnostic</p>
                                         </div>
                                      </div>
                                   </div>
                                   <Button 
                                     className="w-full rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all active:scale-95"
                                     onClick={() => setSelectedTab('SOAP')}
                                   >
                                      Initiate Clinical Assessment
                                   </Button>
                                </CardContent>
                             </Card>

                             {/* Vitals Summary Card */}
                             <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 bg-white p-2">
                                <CardHeader className="p-8">
                                   <CardTitle className="text-xl font-extrabold text-slate-900 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                         <Activity className="h-6 w-6 text-rose-500" />
                                         Latest Vitals
                                      </div>
                                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-300" onClick={() => setSelectedTab('Vitals')}>
                                         <PlusCircle className="h-5 w-5" />
                                      </Button>
                                   </CardTitle>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-8">
                                   <div className="grid grid-cols-2 gap-4">
                                      {[
                                        { label: 'Blood Pressure', value: latestVitals ? `${latestVitals.blood_pressure.systolic}/${latestVitals.blood_pressure.diastolic}` : '120/80', unit: 'mmHg', color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                                        { label: 'Pulse Rate', value: latestVitals?.pulse || '72', unit: 'bpm', color: 'text-rose-600', bg: 'bg-rose-50/50' },
                                        { label: 'Temp', value: latestVitals?.temperature || '98.6', unit: '°F', color: 'text-amber-600', bg: 'bg-amber-50/50' },
                                        { label: 'O2 Sat', value: latestVitals?.spo2 || '98', unit: '%', color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                                      ].map((v, i) => (
                                        <div key={i} className={cn("p-5 rounded-3xl border border-transparent hover:border-slate-100 transition-all", v.bg)}>
                                           <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{v.label}</p>
                                           <div className="flex items-baseline gap-1.5">
                                              <span className={cn("text-2xl font-black tracking-tighter", v.color)}>{v.value}</span>
                                              <span className="text-[11px] font-bold text-slate-400">{v.unit}</span>
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                                   <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                      <div className="flex items-center justify-between text-xs font-bold mb-3">
                                         <span className="text-slate-400 uppercase tracking-widest">BMI Analysis</span>
                                         <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[9px] px-2">{latestVitals?.bmi_status || 'Healthy'}</Badge>
                                      </div>
                                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                         <div className="h-full bg-emerald-500 w-[65%]" />
                                      </div>
                                   </div>
                                </CardContent>
                             </Card>
                          </div>

                          {/* Clinical History Canvas */}
                          <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-200/30 bg-white overflow-hidden">
                             <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                   <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Clinical Longitudinal Feed</CardTitle>
                                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Aggregated medical events for this visit</p>
                                </div>
                                <Button variant="outline" className="rounded-2xl border-slate-100 text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest h-12 px-6" onClick={() => setSelectedTab('Timeline')}>
                                   View Full Timeline
                                </Button>
                             </CardHeader>
                             <CardContent className="p-10">
                                {timeline.length === 0 ? (
                                   <div className="py-20 text-center space-y-4">
                                      <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto shadow-inner">
                                         <History className="h-10 w-10 text-slate-200" />
                                      </div>
                                      <p className="text-slate-400 text-sm font-extrabold uppercase tracking-[0.2em]">Clinical Ledger Empty</p>
                                   </div>
                                ) : (
                                   <div className="space-y-10 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                      {timeline.slice(0, 4).map((item, i) => (
                                         <div key={i} className="relative pl-16 group">
                                            <div className="absolute left-0 top-0 h-12 w-12 rounded-[1.25rem] bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center z-10 group-hover:border-indigo-200 transition-all group-hover:scale-110">
                                               {item.type === 'visit' ? <Calendar className="h-5 w-5 text-indigo-500" /> : 
                                                item.type === 'soap' ? <FileText className="h-5 w-5 text-amber-500" /> :
                                                item.type === 'lab' ? <FlaskConical className="h-5 w-5 text-violet-500" /> :
                                                <ClipboardList className="h-5 w-5 text-indigo-400" />}
                                            </div>
                                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all shadow-sm group-hover:shadow-xl group-hover:shadow-slate-100">
                                               <div className="flex items-center justify-between mb-2">
                                                  <h4 className="text-base font-black text-slate-800">{item.title}</h4>
                                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{format(new Date(item.timestamp), 'MMM dd, yyyy')}</span>
                                               </div>
                                               <div className="flex items-center gap-4">
                                                  <p className="text-xs text-slate-500 font-bold">Status: <span className="text-indigo-600 uppercase text-[10px] tracking-widest">{item.metadata?.status}</span></p>
                                                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                  <p className="text-xs text-slate-500 font-bold">Ref: <span className="text-slate-900">#{item.metadata?.visit_id?.slice(-6)}</span></p>
                                               </div>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                )}
                             </CardContent>
                          </Card>
                       </div>

                       {/* RIGHT SIDEBAR - INTEGRATED INTO GRID */}
                       <div className="col-span-12 lg:col-span-4 space-y-8">
                          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 bg-white p-8 space-y-10">
                             {/* SOAP Snapshot */}
                             {soapNote && (
                               <div className="space-y-6">
                                 <div className="flex items-center justify-between">
                                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active SOAP Note</h3>
                                   <Badge className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] uppercase tracking-widest px-2">{soapNote.status}</Badge>
                                 </div>
                                 <div className="space-y-4">
                                   {soapNote.assessment && (
                                     <div className="p-5 rounded-[1.5rem] bg-amber-50/50 border border-amber-100/50">
                                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Clinical Assessment</p>
                                       <p className="text-sm font-bold text-slate-700 line-clamp-4 leading-relaxed italic">"{soapNote.assessment}"</p>
                                     </div>
                                   )}
                                   <Button variant="ghost" className="w-full rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] h-10 hover:bg-indigo-50" onClick={() => setSelectedTab('SOAP')}>
                                      Edit Document <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                                   </Button>
                                 </div>
                               </div>
                             )}

                             {/* Diagnosis Pulse */}
                             <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dx Index</h3>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600" onClick={() => setSelectedTab('Diagnoses')}>
                                      <PlusCircle className="h-5 w-5" />
                                   </Button>
                                </div>
                                <div className="space-y-4">
                                   {diagnosis ? (
                                     <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 space-y-4 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                        <div className="flex items-center justify-between relative z-10">
                                           <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Primary Dx</p>
                                           <Badge className="bg-white/20 text-white border-none text-[10px] font-mono px-2">{diagnosis.primary_diagnosis.code}</Badge>
                                        </div>
                                        <p className="text-xl font-black leading-tight relative z-10">{diagnosis.primary_diagnosis.label}</p>
                                     </div>
                                   ) : (
                                     <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">No Dx Indexed</p>
                                     </div>
                                   )}
                                </div>
                             </div>

                             {/* Medication Registry */}
                             <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active Rx</h3>
                                   <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black px-2">2 Active</Badge>
                                </div>
                                <div className="space-y-3">
                                   {[
                                     { name: 'Amlodipine', dose: '5mg QD', status: 'Optimal' },
                                     { name: 'Metformin', dose: '500mg BID', status: 'Warning' },
                                   ].map((m, i) => (
                                     <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3">
                                           <div className={cn("h-2 w-2 rounded-full", m.status === 'Optimal' ? "bg-emerald-500" : "bg-amber-500")} />
                                           <div>
                                              <p className="text-sm font-extrabold text-slate-800">{m.name}</p>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.dose}</p>
                                           </div>
                                        </div>
                                        <ChevronLeft className="h-4 w-4 text-slate-200 rotate-180 group-hover:text-indigo-400" />
                                     </div>
                                   ))}
                                   <Button variant="ghost" className="w-full rounded-2xl h-12 border-dashed border border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50 mt-2" onClick={() => setSelectedTab('Prescriptions')}>
                                      <PlusCircle className="h-4 w-4 mr-2" /> New Rx Protocol
                                   </Button>
                                </div>
                             </div>
                          </Card>
                       </div>
                    </motion.div>
                  );
                }
                
                // PANEL VIEWS
                const PanelComponent = {
                  'SOAP': SOAPNotesPanel,
                  'Diagnoses': DiagnosisPanel,
                  'Prescriptions': PrescriptionPanel,
                  'Vitals': VitalsPanel,
                  'Labs': LabsPanel,
                  'Timeline': TimelinePanel,
                  'Referrals': ReferralPanel,
                  'Documents': DocumentRepository
                }[selectedTab];

                if (PanelComponent) {
                  return (
                    <motion.div
                      key={selectedTab}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -10 }}
                      className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-10 min-h-[70vh] border border-white"
                    >
                      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                         <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                               {React.createElement(menuItems.find(i => i.id === selectedTab)!.icon, { className: "h-7 w-7" })}
                            </div>
                            <div>
                               <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedTab} Module</h2>
                               <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.3em] mt-1">Clinical Protocol {selectedTab.toUpperCase()}-v4.1</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-400 hover:text-indigo-600" onClick={() => setSelectedTab('Overview')}>
                               <History className="h-4 w-4 mr-2" /> Recent Activity
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300">
                               <MoreVertical className="h-5 w-5" />
                            </Button>
                         </div>
                      </div>
                      <PanelComponent />
                    </motion.div>
                  );
                }

                return null;
              })()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EHRWorkspace;
