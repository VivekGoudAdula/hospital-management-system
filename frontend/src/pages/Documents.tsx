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
    fetchPatients,
    doctors,
    fetchDoctors,
    fetchPatientStudies,
    studies: patientStudies
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
    file_type: 'X-Ray',
    scan_date: new Date().toISOString().split('T')[0],
    body_part: '',
    department: '',
    notes: '',
    findings: '',
    impression: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDocumentRepository();
    fetchPatients();
    fetchDoctors();
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
    const studies = await fetchPatientStudies(patientId);
    
    // Combine individual documents and studies for a unified view
    const allRecords = [
      ...docs.map(d => ({ ...d, isStudy: false })),
      ...studies.map(s => ({ ...s, isStudy: true, type: s.studyType, uploadDate: s.createdAt }))
    ].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    if (allRecords.length > 0) {
      setSelectedDoc(allRecords[0]);
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
    formData.append('scan_date', uploadForm.scan_date);
    formData.append('body_part', uploadForm.body_part);
    formData.append('department', uploadForm.department);
    formData.append('notes', uploadForm.notes);
    formData.append('findings', uploadForm.findings);
    formData.append('impression', uploadForm.impression);
    formData.append('file', uploadForm.file);

    try {
      await uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setIsUploadModalOpen(false);
      setUploadForm({ 
        patient_id: '', 
        file_type: 'X-Ray', 
        scan_date: new Date().toISOString().split('T')[0],
        body_part: '',
        department: '',
        notes: '', 
        findings: '',
        impression: '',
        file: null 
      });
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

  const unifiedPatientDocs = React.useMemo(() => {
    if (!selectedPatientId) return [];
    
    const combined = [
      ...patientDocuments.filter(d => d.patientId === selectedPatientId).map(d => ({ ...d, isStudy: false })),
      ...patientStudies.filter(s => s.patientId === selectedPatientId).map(s => ({ 
        ...s, 
        isStudy: true, 
        type: s.studyType, 
        uploadDate: s.createdAt,
        fileName: s.files[0]?.fileName || 'Study'
      }))
    ];
    return combined.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [patientDocuments, patientStudies, selectedPatientId]);

  const [activeFileIndex, setActiveFileIndex] = useState(0);

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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Modality</label>
                  <Select value={uploadForm.file_type} onValueChange={(val) => setUploadForm({...uploadForm, file_type: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="MRI">MRI Scan</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="Blood Test">Blood Test</SelectItem>
                      <SelectItem value="Prescription">Prescription</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Scan Date</label>
                  <Input 
                    type="date" 
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100" 
                    value={uploadForm.scan_date}
                    onChange={(e) => setUploadForm({...uploadForm, scan_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Body Part</label>
                  <Input 
                    placeholder="e.g. Chest, Brain" 
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100" 
                    value={uploadForm.body_part}
                    onChange={(e) => setUploadForm({...uploadForm, body_part: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
                  <Input 
                    placeholder="e.g. Radiology" 
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100" 
                    value={uploadForm.department}
                    onChange={(e) => setUploadForm({...uploadForm, department: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinical Impression</label>
                <textarea 
                  placeholder="Primary diagnostic conclusion..." 
                  className="w-full h-24 p-4 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm resize-none outline-none border focus:border-indigo-200"
                  value={uploadForm.impression}
                  onChange={(e) => setUploadForm({...uploadForm, impression: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinical Notes</label>
                <Input 
                  placeholder="Additional observations..." 
                  className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Diagnostic Asset (File)</label>
                <div className="relative group">
                  <Input 
                    type="file" 
                    className="hidden" 
                    id="doc-file-upload"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  />
                  <label 
                    htmlFor="doc-file-upload" 
                    className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="text-center">
                      <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1 group-hover:text-indigo-600 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        {uploadForm.file ? uploadForm.file.name : 'Select clinical asset'}
                      </p>
                    </div>
                  </label>
                </div>
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
                  <SelectItem value="CT Scan">CT Scan</SelectItem>
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
          {/* Visually hidden title/description for screen reader accessibility */}
          <DialogTitle className="sr-only">Clinical Diagnostic Workspace</DialogTitle>
          <DialogDescription className="sr-only">View and manage patient clinical documents</DialogDescription>
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
               </div>                <div className="flex-1 bg-slate-900/95 p-8 flex items-center justify-center overflow-auto relative group">
                  <div className="w-full max-w-4xl bg-white shadow-2xl rounded-sm overflow-hidden transform transition-transform duration-500 hover:scale-[1.02]">
                    {selectedDoc?.isStudy ? (
                      selectedDoc.files[activeFileIndex]?.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={`${selectedDoc.files[activeFileIndex].fileUrl}#toolbar=0`} className="w-full h-[1200px] border-none" />
                      ) : (
                        <img src={selectedDoc.files[activeFileIndex]?.fileUrl} className="w-full h-auto object-contain" alt="Clinical Study Asset" />
                      )
                    ) : (
                      selectedDoc?.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={`${selectedDoc.fileUrl}#toolbar=0`} className="w-full h-[1200px] border-none" />
                      ) : (
                        <img src={selectedDoc?.fileUrl} className="w-full h-auto object-contain" alt="Clinical Document" />
                      )
                    )}
                  </div>
                  
                  {selectedDoc?.isStudy && selectedDoc.files?.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
                        onClick={() => setActiveFileIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeFileIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="px-3 flex items-center">
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                          {activeFileIndex + 1} / {selectedDoc.files.length}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
                        onClick={() => setActiveFileIndex(prev => Math.min(selectedDoc.files.length - 1, prev + 1))}
                        disabled={activeFileIndex === selectedDoc.files.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Horizontal Quick Gallery - Study Files or Unified Docs */}
                <div className="h-24 bg-white border-t border-slate-100 p-3 flex gap-3 overflow-x-auto scrollbar-hide shrink-0">
                  {selectedDoc?.isStudy ? (
                    selectedDoc.files.map((file, idx) => (
                      <motion.div
                        key={file.id}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "h-full aspect-square rounded-xl border-2 cursor-pointer overflow-hidden relative shrink-0 transition-all",
                          idx === activeFileIndex ? "border-indigo-500 shadow-lg shadow-indigo-100" : "border-slate-100 grayscale hover:grayscale-0"
                        )}
                        onClick={() => setActiveFileIndex(idx)}
                      >
                        {file.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={file.fileUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    unifiedPatientDocs.map((doc) => (
                      <motion.div
                        key={doc.id}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "h-full aspect-square rounded-xl border-2 cursor-pointer overflow-hidden relative shrink-0 transition-all",
                          doc.id === selectedDoc?.id ? "border-indigo-500 shadow-lg shadow-indigo-100" : "border-slate-100 grayscale hover:grayscale-0"
                        )}
                        onClick={() => {setSelectedDoc(doc); setActiveFileIndex(0);}}
                      >
                        {doc.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={doc.fileUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
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
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic ID</p>
                         <p className="text-xs font-bold text-slate-900">DOC-{selectedDoc?.id?.slice?.(-4)?.toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Upload Date</p>
                         <p className="text-xs font-bold text-slate-900">{selectedDoc?.uploadDate ? new Date(selectedDoc?.uploadDate)?.toLocaleDateString?.() : ''}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Modality</p>
                         <p className="text-xs font-bold text-slate-900 truncate">{selectedDoc?.type}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Body Part</p>
                         <p className="text-xs font-bold text-slate-900">{selectedDoc?.bodyPart || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Department</p>
                         <p className="text-xs font-bold text-slate-900">{selectedDoc?.department || 'General'}</p>
                      </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Source</p>
                          <p className="text-xs font-bold text-indigo-600 truncate">Hospital Main</p>
                       </div>
                       <div className="col-span-2 pt-2 border-t border-slate-50 space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Uploaded By</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center text-[8px] font-bold text-indigo-600 border border-indigo-100">
                              {doctors.find(d => d.id === selectedDoc?.uploadedBy)?.name?.charAt(0) || 'U'}
                            </div>
                            <p className="text-xs font-bold text-slate-700">
                              {doctors.find(d => d.id === selectedDoc?.uploadedBy)?.name || 'Medical Staff'}
                            </p>
                          </div>
                       </div>
                    </div>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-6 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ClipboardList className="h-3 w-3 text-emerald-600" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Clinical Report</h3>
                  </div>
                  <div className="space-y-6">
                    {selectedDoc?.findings && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detailed Findings</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedDoc.findings}</p>
                      </div>
                    )}
                    {selectedDoc?.impression && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clinical Impression</p>
                        <p className="text-xs font-bold text-indigo-700 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">{selectedDoc.impression}</p>
                      </div>
                    )}
                    {selectedDoc?.symptoms && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Presenting Symptoms</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/30 p-3 rounded-xl border border-rose-100/30">{selectedDoc.symptoms}</p>
                      </div>
                    )}
                    {!selectedDoc?.findings && !selectedDoc?.impression && !selectedDoc?.notes && (
                      <p className="text-[11px] text-slate-400 italic">No clinical observations attached to this record.</p>
                    )}
                    {selectedDoc?.notes && (
                       <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Physician Annotations</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{selectedDoc.notes}"</p>
                      </div>
                    )}
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col gap-4 shrink-0">
                  <div className="flex flex-col gap-1 mb-2">
                     <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Diagnostic History For</p>
                     <h3 className="text-sm font-bold text-slate-900 truncate">{currentPatient?.patient_name || 'Active Patient'}</h3>
                     <p className="text-[10px] text-slate-400 font-mono">{currentPatient?.mrn}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                         <History className="h-3 w-3 text-indigo-600" />
                      </div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Record Timeline</h3>
                      <span className="ml-auto text-[9px] font-bold text-slate-300 uppercase tracking-widest">{unifiedPatientDocs.length} assets</span>
                   </div>
                   <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {unifiedPatientDocs.map((doc, idx) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group",
                          doc.id === selectedDoc?.id
                            ? "bg-indigo-50 border-indigo-200 shadow-sm"
                            : "bg-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-md"
                        )}
                        onClick={() => {setSelectedDoc(doc); setActiveFileIndex(0);}}
                      >
                         <div className={cn(
                           "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors relative overflow-hidden",
                           doc.id === selectedDoc?.id
                             ? "bg-indigo-600 border-indigo-600 text-white"
                             : "bg-white border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100"
                         )}>
                            {doc.isStudy ? (
                              doc.files[0]?.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={doc.files[0].fileUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Files className="h-5 w-5" />
                              )
                            ) : (
                              doc.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={doc.fileUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )
                            )}
                            {doc.isStudy && (
                              <div className="absolute top-0 right-0 bg-indigo-600 text-[6px] text-white px-1 font-bold">
                                STUDY
                              </div>
                            )}
                         </div>
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                               <p className={cn("text-[11px] font-bold truncate", doc.id === selectedDoc?.id ? "text-indigo-700" : "text-slate-900")}>
                                 {doc.type}
                               </p>
                               <Badge className="bg-slate-200/50 text-[8px] text-slate-500 font-bold border-none h-4 px-1">
                                 {doc.isStudy ? `${doc.files.length} FILES` : 'FILE'}
                               </Badge>
                            </div>
                             <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5 flex items-center justify-between">
                               <span>{new Date(doc.uploadDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                               <span className="text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                 {doctors.find(d => d.id === doc.uploadedBy)?.name?.split(' ')[0] || 'Staff'}
                               </span>
                             </p>
                         </div>
                      </motion.div>
                    ))}
                    {unifiedPatientDocs.length === 0 && (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileSearch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No documents</p>
                      </div>
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
