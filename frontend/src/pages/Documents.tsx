import React, { useState } from 'react';
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
  ExternalLink,
  History,
  FileSearch,
  Tag,
  Users,
  Plus,
  Shield
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
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useHospitalStore } from '@/store/hospitalStore';
import { Document } from '@/types';

const Documents = () => {
  const { documents } = useHospitalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Document Repository</h1>
          <p className="text-slate-500 text-sm">Centralized view of all patient-related medical documents</p>
        </div>

        <Dialog>
          <DialogTrigger render={
            <Button size="lg" className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2 h-11 px-5">
              <Upload className="h-4 w-4" /> Import Record
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Import Medical Record</DialogTitle>
              <DialogDescription>
                Upload diagnostic reports, imaging, or prescriptions to the repository.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB each</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Patient name, MRN or Application ID..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-1 focus-visible:ring-indigo-600 text-sm" 
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-10 rounded-md bg-white border-slate-200 shadow-sm text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="MRI">MRI Scan</SelectItem>
                  <SelectItem value="X-Ray">X-Ray Image</SelectItem>
                  <SelectItem value="Blood Test">Pathology Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border border-slate-100">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8 rounded-md", viewMode === 'list' ? "bg-white shadow-sm border-slate-200" : "text-slate-400")}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8 rounded-md", viewMode === 'grid' ? "bg-white shadow-sm border-slate-200" : "text-slate-400")}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="h-10 rounded-md border-slate-200 text-slate-600 gap-2 font-bold text-xs">
                <History className="h-3.5 w-3.5" /> Recent
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4 pl-6">APPLICATION INFO</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">PATIENT / MRN</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">UNIT / TYPE</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">FILES</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4">LATEST ACTIVITY</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase tracking-wider font-bold py-4 text-right pr-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredDocs.map((doc, index) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <TableCell className="py-4 pl-6">
                           <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                             {doc.applicationId}
                           </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{doc.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{doc.patientMrn}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                             <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                               <FileText className="h-3.5 w-3.5" />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-slate-800">{doc.type}</p>
                               <p className="text-[10px] text-slate-400 font-medium">{doc.departmentName || 'General'}</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                           <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-bold rounded px-1.5 h-5 border-none">
                             {doc.filesCount || 1} Files
                           </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                           <p className="text-xs font-medium text-slate-500">{doc.latestActivity || doc.uploadDate}</p>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => setSelectedDoc(doc)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                           </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocs.map((doc, i) => (
                <Card key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group border">
                  <div className="aspect-video relative bg-slate-50 cursor-pointer overflow-hidden border-b border-slate-200" onClick={() => setSelectedDoc(doc)}>
                    <img src={doc.thumbnail} alt={doc.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                    <Badge className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-900 border-none text-[9px] uppercase font-bold shadow-sm h-5">
                      {doc.applicationId}
                    </Badge>
                  </div>
                  <CardHeader className="p-4 space-y-1">
                    <CardTitle className="text-sm font-bold text-slate-900 truncate leading-none">{doc.patientName}</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {doc.type} • {doc.uploadDate}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">By {doc.uploadedBy.split(' ')[1]}</span>
                    <div className="flex gap-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 rounded-md" onClick={() => setSelectedDoc(doc)}><Eye className="h-3.5 w-3.5" /></Button>
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-md"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {filteredDocs.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                <FileSearch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No documents found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Try adjusting your search filters or record category to find what you're looking for.</p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-md border-slate-200 text-indigo-600 font-bold text-xs px-6"
                onClick={() => {setSearchTerm(''); setTypeFilter('all');}}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-white">
          <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4 mb-4">
               <Badge className="bg-indigo-600 text-white rounded-xl px-4 py-1.5 font-mono border-none text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-100">{selectedDoc?.applicationId}</Badge>
               <Badge variant="outline" className="rounded-xl px-4 py-1.5 text-[10px] border-slate-200 text-slate-500 font-bold uppercase tracking-widest">{selectedDoc?.type}</Badge>
            </div>
            <DialogTitle className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{selectedDoc?.patientName}</DialogTitle>
            <DialogDescription className="text-sm text-slate-400 font-medium mt-2">
               Medical Record Summary Protocol • MRN: <span className="text-slate-900 font-bold">{selectedDoc?.patientMrn}</span>
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
                           <p className="text-sm font-bold text-slate-800">{selectedDoc?.uploadedBy}</p>
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

export default Documents;

