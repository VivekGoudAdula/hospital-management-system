import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  Eye, 
  MoreHorizontal, 
  Download, 
  Calendar,
  Grid,
  List,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  History,
  FileSearch,
  Tag,
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Files,
  Loader2,
  Trash2,
  Activity,
  ArrowLeft,
  Share2,
  ClipboardList
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useHospitalStore } from '@/store/hospitalStore';
import { Document, Patient } from '@/types';
import { toast } from 'sonner';

const Documents = () => {
  const { 
    documentRepository, 
    fetchDocumentRepository, 
    fetchPatientDocuments, 
    documents: patientDocuments,
    uploadDocument,
    deleteDocument,
    patients,
    fetchPatients
  } = useHospitalStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [uploadForm, setUploadForm] = useState({
    patient_id: '',
    file_type: 'Blood Test',
    notes: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDocumentRepository();
    fetchPatients();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocumentRepository({
        search: searchTerm,
        file_type: typeFilter,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, typeFilter, dateRange]);

  const handleOpenPatientRecords = async (patientId: string) => {
    setSelectedPatientId(patientId);
    const docs = await fetchPatientDocuments(patientId);
    if (docs && docs.length > 0) {
      setSelectedDoc(docs[0]); // Open the latest document immediately
    } else {
      toast.info('No documents found for this patient. Use the upload button to add one.');
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.patient_id || !uploadForm.file) {
      toast.error('Please select a patient and a file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('patient_id', uploadForm.patient_id);
    formData.append('file_type', uploadForm.file_type);
    formData.append('notes', uploadForm.notes);
    formData.append('file', uploadForm.file);

    try {
      await uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setIsUploadModalOpen(false);
      setUploadForm({ patient_id: '', file_type: 'Blood Test', notes: '', file: null });
      fetchDocumentRepository(); // Refresh list
      if (selectedPatientId) fetchPatientDocuments(selectedPatientId);
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        toast.success('Document deleted');
        if (selectedPatientId) fetchPatientDocuments(selectedPatientId);
        fetchDocumentRepository();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const currentPatient = documentRepository.data.find(d => d.patient_id === selectedPatientId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Document Repository</h1>
          <p className="text-slate-500 text-sm">Centralized patient-wise medical record management</p>
        </div>

        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2 h-11 px-5">
              <Upload className="h-4 w-4" /> Upload New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
              <DialogDescription>
                Attach diagnostic reports or imaging to a patient's file.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Patient</label>
                <Select value={uploadForm.patient_id} onValueChange={(val) => setUploadForm({...uploadForm, patient_id: val})}>
                  <SelectTrigger className="h-11 rounded-md border-slate-200">
                    <SelectValue placeholder="Choose a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.mrn})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">File Type</label>
                  <Select value={uploadForm.file_type} onValueChange={(val) => setUploadForm({...uploadForm, file_type: val})}>
                    <SelectTrigger className="h-11 rounded-md border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blood Test">Blood Test</SelectItem>
                      <SelectItem value="MRI">MRI Scan</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="Prescription">Prescription</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">File</label>
                  <Input 
                    type="file" 
                    className="h-11 rounded-md border-slate-200 pt-2" 
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Clinical Notes</label>
                <Input 
                  placeholder="Additional observations..." 
                  className="h-11 rounded-md border-slate-200"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Record'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search patient name or MRN..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-md text-sm" 
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-10 rounded-md bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MRI">MRI Scan</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="Blood Test">Blood Test</SelectItem>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  className="h-10 text-xs border-slate-200 rounded-md w-32" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input 
                  type="date" 
                  className="h-10 text-xs border-slate-200 rounded-md w-32" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-100"
                onClick={() => {setSearchTerm(''); setTypeFilter('all'); setDateRange({start: '', end: ''})}}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4 pl-6">APPLICATION ID</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">PATIENT / MRN</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">UNIT / DEPARTMENT</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">DOCUMENT TYPES</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">FILES</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">LATEST ACTIVITY</TableHead>
                  <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {documentRepository.data.map((item, index) => (
                    <motion.tr
                      key={item.patient_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer"
                      onClick={() => handleOpenPatientRecords(item.patient_id)}
                    >
                      <TableCell className="py-4 pl-6">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.app_id}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.patient_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.mrn}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 font-bold uppercase">
                          {item.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.document_types.slice(0, 2).map((type: string) => (
                            <Badge key={type} className="bg-slate-100 text-slate-600 text-[9px] font-bold border-none h-5">
                              {type}
                            </Badge>
                          ))}
                          {item.document_types.length > 2 && (
                            <Badge className="bg-slate-50 text-slate-400 text-[9px] font-bold border-none h-5">
                              +{item.document_types.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-12 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${Math.min(item.files_count * 20, 100)}%` }} 
                              />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600">{item.files_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="text-xs font-medium text-slate-500">
                          {new Date(item.latest_activity).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-md"
                            onClick={() => handleOpenPatientRecords(item.patient_id)}
                          >
                            View Records
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-md"
                            onClick={() => {
                              setUploadForm({...uploadForm, patient_id: item.patient_id});
                              setIsUploadModalOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          
          {documentRepository.data.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                <FileSearch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No patient records found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Try adjusting your filters or search term to find clinical documents.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Document Viewer - Clinical Diagnostic Workspace */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[1400px] h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-[#F8FAFC]">
          <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                   <Files className="h-5 w-5" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">Clinical Diagnostic Workspace</h2>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                     DOC-{selectedDoc?.id?.slice(-4).toUpperCase()} • ACTIVE VIEW
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                   <ShieldCheck className="h-4 w-4 text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Enterprise Secured</span>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-600 rounded-full" onClick={() => setSelectedDoc(null)}>
                   <ArrowLeft className="h-5 w-5" />
                </Button>
             </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6">
            <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               <div className="h-14 bg-slate-50/50 border-b border-slate-50 px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <FileText className="h-4 w-4 text-indigo-500" />
                     <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{selectedDoc?.fileName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100" onClick={() => window.open(selectedDoc.fileUrl)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"><Share2 className="h-4 w-4" /></Button>
                  </div>
               </div>

               <div className="flex-1 bg-[#475569] p-8 flex items-center justify-center overflow-auto">
                  <div className="w-full max-w-4xl bg-white shadow-2xl rounded-sm overflow-hidden">
                    {selectedDoc?.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                      <iframe src={`${selectedDoc.fileUrl}#toolbar=0`} className="w-full h-[1200px] border-none" />
                    ) : (
                      <img src={selectedDoc?.fileUrl} className="w-full h-auto" alt="Clinical Document" />
                    )}
                  </div>
               </div>
            </div>

            <div className="w-full md:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-8 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Activity className="h-3 w-3 text-indigo-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Diagnostic Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic ID</p>
                        <p className="text-xs font-bold text-slate-900">DOC-{selectedDoc?.id?.slice(-4).toUpperCase()}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Entry Date</p>
                        <p className="text-xs font-bold text-slate-900">{selectedDoc && new Date(selectedDoc.uploadDate).toLocaleDateString()}</p>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Record Type</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedDoc?.type}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ClipboardList className="h-3 w-3 text-emerald-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Clinical Notes</h3>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">"{selectedDoc?.notes || 'No clinical observations attached to this record.'}"</p>
                  </div>
               </div>

               {/* Related Archive Section */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                        <History className="h-3 w-3 text-indigo-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Related Archive</h3>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {patientDocuments.filter(d => d.id !== selectedDoc?.id).map(doc => (
                      <div 
                        key={doc.id} 
                        className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group"
                        onClick={() => setSelectedDoc(doc)}
                      >
                         <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                            <FileText className="h-5 w-5" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 truncate">{doc.type}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                         </div>
                      </div>
                    ))}
                    {patientDocuments.filter(d => d.id !== selectedDoc?.id).length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">No other documents found.</p>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Documents;
