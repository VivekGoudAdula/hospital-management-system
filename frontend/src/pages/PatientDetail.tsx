import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Droplet, 
  Stethoscope, 
  Shield, 
  FileText, 
  Clock,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Eye,
  Download,
  Share2,
  AlertCircle,
  Activity,
  History,
  ClipboardList,
  Upload,
  Search,
  Tag as TagIcon,
  Filter,
  Users
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { patients, documents, notes, doctors } from '@/lib/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('clinical');
  const [searchTerm, setSearchTerm] = useState('');

  const patient = patients.find(p => p.id === id);
  const assignedDoctor = doctors.find(d => d.id === patient?.assignedDoctorId);
  const patientDocs = documents.filter(d => d.patientId === id);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Patient Data Unavailable</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">The patient record you're looking for might have been archived.</p>
        <Button variant="outline" className="rounded-md border-slate-200" onClick={() => navigate('/patients')}>
          Return to Registry
        </Button>
      </div>
    );
  }

  // Filter docs for search in Documents tab
  const filteredDocs = patientDocs.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="group h-10 w-10 bg-white border border-slate-200 shadow-sm rounded-md hover:bg-slate-50" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5 text-slate-500 group-hover:text-slate-900" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 leading-none">{patient.name}</h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded text-[10px] font-bold uppercase tracking-widest leading-none h-5">Patient Active</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">{patient.mrn}</span>
              <Separator orientation="vertical" className="h-3 bg-slate-200" />
              <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5" /> Admitted Apr 12, 2024 • Floor 2, Room 204
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-md border-slate-200 text-slate-600 gap-2 font-bold text-xs">
            <Share2 className="h-3.5 w-3.5" /> Export EMR
          </Button>
          <Button className="h-10 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs px-5 shadow-lg shadow-indigo-100">
            <Plus className="h-3.5 w-3.5" /> Add Log Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border">
            <div className="h-20 bg-slate-50 border-b border-slate-100 flex items-center justify-end px-4 gap-2">
               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><History className="h-3.5 w-3.5" /></Button>
               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="px-6 pb-8 -mt-10">
              <div className="relative inline-block mb-4">
                <Avatar className="h-20 w-20 rounded-xl border-4 border-white shadow-md bg-white">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${patient.id}`} />
                  <AvatarFallback className="text-xl font-bold text-indigo-600 bg-indigo-50 border border-indigo-100">{patient.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                   <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{patient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{patient.gender} • {new Date().getFullYear() - new Date(patient.dob).getFullYear()} Years Old</p>
                  </div>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Mobile Contact</p>
                       <p className="text-xs font-bold text-slate-700">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Secure Email</p>
                       <p className="text-xs font-bold text-slate-700 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Residency</p>
                       <p className="text-xs font-bold text-slate-700">Brooklyn, NY 11201</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Droplet className="h-3 w-3 text-rose-500 fill-rose-500" />
                      <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Group</p>
                    </div>
                    <p className="text-[14px] font-black text-slate-800">{patient.bloodGroup}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="h-3 w-3 text-slate-400" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Insurer</p>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 truncate">Aetna Blue</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Attending Staff</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400"><Plus className="h-3 w-3" /></Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                <Avatar className="h-9 w-9 rounded-md border border-slate-100 shadow-sm">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${assignedDoctor?.id || 'doc'}`} />
                  <AvatarFallback className="text-xs font-bold bg-indigo-50 text-indigo-600">SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{assignedDoctor?.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{assignedDoctor?.specialization}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 w-full md:w-auto h-11 rounded-md border border-slate-200 p-1 flex items-center gap-1 mb-8 shadow-inner overflow-x-auto">
              <TabsTrigger value="clinical" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Clinical Insights</TabsTrigger>
              <TabsTrigger value="documents" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2">Records <Badge className="bg-slate-100 text-slate-500 text-[9px] border-none px-1 h-3.5">{patientDocs.length}</Badge></TabsTrigger>
              <TabsTrigger value="timeline" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Phase Timeline</TabsTrigger>
              {/* <TabsTrigger value="billing" className="px-5 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Billing</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="clinical" className="mt-0 space-y-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-3">
                  <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-50">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-indigo-500" /> Care Observations</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Collaboration logs and patient notes</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Plus className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {notes.filter(n => n.patientId === id).length > 0 ? (
                        notes.filter(n => n.patientId === id).map((note, i) => (
                          <div key={i} className="p-6 flex gap-4 hover:bg-slate-50/50 transition-colors">
                            <Avatar className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                              <AvatarFallback className="text-[10px] font-bold text-slate-400">{note.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-1">
                               <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-bold text-slate-900">{note.authorName}</p>
                                  <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-sm italic">
                                  "{note.content}"
                               </p>
                               <div className="flex items-center gap-3 pl-1">
                                  <Button variant="ghost" className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-indigo-600">Reply</Button>
                                  <Button variant="ghost" className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-rose-600">Pin Note</Button>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                           <p className="text-sm text-slate-400">No clinical notes recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-2 h-fit overflow-hidden">
                  <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><Activity className="h-4 w-4 text-rose-500" /> Vital Snapshots</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Search className="h-3.5 w-3.5" /></Button>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {[
                      { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'Stable', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'Heart Rate', value: '68', unit: 'BPM', status: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'Core Temp.', value: '98.2', unit: '°F', status: 'Post-op', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                      { label: 'SpO2 Level', value: '99', unit: '%', status: 'Optimal', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
                    ].map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group hover:ring-1 hover:ring-slate-200 transition-all">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{v.label}</p>
                          <p className="text-xl font-bold text-slate-900 tracking-tight leading-none">{v.value} <span className="text-xs font-medium text-slate-300 ml-0.5">{v.unit}</span></p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded h-5 border px-2", v.color, v.bg)}>
                          {v.status}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest pt-2">View Trends Timeline</Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 flex items-center justify-between flex-row space-y-0">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" /> Active Prescriptions</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md border-slate-200 text-indigo-600">Print Pharmacy Slip</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4 pl-6">Medication / Pharma</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Quantity / Unit</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Administration</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4">Valid Until</TableHead>
                          <TableHead className="text-slate-500 text-[10px] uppercase font-bold py-4 text-center">Status</TableHead>
                          <TableHead className="text-right pr-6 py-4" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: 'Lisinopril-20', company: 'Pfizer Pharm', dosage: '20mg / Tablet', frequency: 'Daily • 1-0-0', status: 'Active', expiry: 'Oct 12, 2024' },
                          { name: 'Atorvastatin-S', company: 'Zydus Med', dosage: '10mg / Tablet', frequency: 'Daily • 0-0-1', status: 'Refillable', expiry: 'Dec 05, 2024' },
                        ].map((m, i) => (
                          <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="py-4 pl-6">
                               <div>
                                  <p className="font-bold text-sm text-slate-900">{m.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{m.company}</p>
                               </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 font-bold py-4">{m.dosage}</TableCell>
                            <TableCell className="text-xs text-slate-500 font-medium py-4">{m.frequency}</TableCell>
                            <TableCell className="text-xs text-slate-400 font-medium py-4">{m.expiry}</TableCell>
                            <TableCell className="text-center py-4">
                               <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-bold uppercase rounded h-5">{m.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4">
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-900"><MoreHorizontal className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-80">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     <Input 
                        placeholder="Search records, types, or tags..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 bg-white border-slate-200 rounded-md shadow-sm"
                     />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-md border-slate-200 text-slate-600 font-bold gap-2 text-xs">
                        <Filter className="h-3.5 w-3.5" /> Categorize
                     </Button>
                     <Button className="flex-1 sm:flex-none h-10 rounded-md bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold gap-2 text-xs shadow-sm" onClick={() => toast.info('Initiating multi-upload protocol...')}>
                        <Upload className="h-3.5 w-3.5" /> Batch Upload
                     </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredDocs.map((doc, i) => (
                     <Card key={doc.id} className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer bg-white" onClick={() => setSelectedDoc(doc)}>
                       <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100">
                         <img src={doc.thumbnail} alt={doc.type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                         <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 border-none text-[9px] font-bold uppercase shadow-sm tracking-tight h-5">
                            {doc.applicationId}
                         </Badge>
                         <Button variant="secondary" className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl flex items-center justify-center p-0">
                            <Eye className="h-5 w-5 text-indigo-600" />
                         </Button>
                       </div>
                       <CardHeader className="p-4 space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{doc.type}</CardTitle>
                            <Badge variant="ghost" className="text-[10px] text-slate-400 p-0 font-bold uppercase tracking-widest h-auto leading-none">{doc.uploadDate}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                             <TagIcon className="h-3 w-3 text-slate-300" />
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Radiology • Verified</p>
                          </div>
                       </CardHeader>
                       <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.filesCount || 1} Attachments</span>
                          <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-white rounded" onClick={(e) => {e.stopPropagation(); toast.success('Link copied');}}><Share2 className="h-3.5 w-3.5" /></Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-white rounded"><Download className="h-3.5 w-3.5" /></Button>
                          </div>
                       </CardFooter>
                     </Card>
                   ))}
                   
                   <Card className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center py-12 px-6 group" onClick={() => toast.info('File Picker Protocol Initiated')}>
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-600">New Clinical Record</h4>
                      <p className="text-[11px] text-slate-400 text-center mt-1">Append PDF, MRI scans or Lab reports to patient chart.</p>
                   </Card>
                </div>

                {filteredDocs.length === 0 && searchTerm && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 text-sm">No records matching "{searchTerm}" found.</p>
                    <Button variant="link" className="text-indigo-600 text-xs font-bold" onClick={() => setSearchTerm('')}>Reset and Show All</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 focus-visible:outline-none">
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] border">
                 <div className="h-20 w-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                    <History className="h-10 w-10" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Phase Timeline & Journey</h3>
                 <p className="text-slate-500 text-sm italic max-w-sm text-center">Full journey logs including triage, consultation, diagnostic phases and discharge trajectory will be visualized in the next release.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Detail Viewer */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-white">
          <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4 mb-4">
               <Badge className="bg-indigo-600 text-white rounded-xl px-4 py-1.5 font-mono border-none text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-100">{selectedDoc?.applicationId}</Badge>
               <Badge variant="outline" className="rounded-xl px-4 py-1.5 text-[10px] border-slate-200 text-slate-500 font-bold uppercase tracking-widest">{selectedDoc?.type}</Badge>
            </div>
            <DialogTitle className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{selectedDoc?.patientName || patient.name}</DialogTitle>
            <DialogDescription className="text-sm text-slate-400 font-medium mt-2">
               Medical Record Summary Protocol • MRN: <span className="text-slate-900 font-bold">{selectedDoc?.patientMrn || patient.mrn}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-10 overflow-y-auto max-h-[60vh] scrollbar-hide">
            <div className="aspect-[16/10] rounded-[2rem] border border-slate-100 bg-slate-50 overflow-hidden relative group shadow-inner">
               <img 
                 src={selectedDoc?.thumbnail} 
                 alt="Report Preview" 
                 className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-1000" 
               />
               <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/20 to-transparent flex justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                 <Button size="lg" className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl text-slate-900 text-xs font-bold gap-3 border-none hover:bg-white h-12 px-8">
                   <Eye className="h-4 w-4 text-indigo-600" /> View Master Integrity File
                 </Button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Upload Lifecycle</p>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-indigo-400" />
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Date Indexed</p>
                           <p className="text-sm font-bold text-slate-800">{selectedDoc?.uploadDate}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Verification Agent</p>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <Users className="h-5 w-5 text-indigo-400" />
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Medical Staff</p>
                           <p className="text-sm font-bold text-slate-800">{selectedDoc?.uploadedBy || 'Senior Registrar'}</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Department Scope</p>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <Plus className="h-5 w-5 text-indigo-400" />
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Allocation</p>
                           <p className="text-sm font-bold text-slate-800">{selectedDoc?.departmentName || 'Diagnostic Services'}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Protocol Status</p>
                     <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        <div>
                           <p className="text-[10px] text-emerald-600 font-bold uppercase leading-none mb-1">Integrity Check</p>
                           <p className="text-sm font-bold text-emerald-700">Verified Secure</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Clinical Meta Analysis</p>
               <div className="p-6 bg-indigo-50/30 rounded-[2rem] border border-dashed border-indigo-100 relative group overflow-hidden">
                  <FileText className="absolute -top-6 -right-6 h-20 w-20 text-indigo-100 opacity-20 transform rotate-12" />
                  <p className="text-sm text-slate-600 leading-relaxed italic font-medium relative z-10">
                    "{selectedDoc?.notes || 'Biological verification loop complete. No further corrective observations were appended to this document bundle during initialization.'}"
                  </p>
               </div>
            </div>
          </div>

          <div className="p-10 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between gap-8 shrink-0">
             <Button variant="ghost" className="rounded-2xl h-14 px-8 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white" onClick={() => setSelectedDoc(null)}>Abort Interface</Button>
             <div className="flex gap-4">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs bg-white hover:bg-slate-50 shadow-sm gap-3">
                   <Download className="h-4 w-4" /> Download Bundle ({selectedDoc?.filesCount || 1})
                </Button>
                <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Sync Master Record</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PatientDetail;

