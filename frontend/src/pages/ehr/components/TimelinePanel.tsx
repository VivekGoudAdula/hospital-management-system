import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  FileText, 
  Activity, 
  FlaskConical, 
  History, 
  Search, 
  Filter,
  Calendar,
  User,
  ChevronRight,
  ClipboardList,
  Stethoscope,
  Share2,
  FileDown,
  Info,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useEHRStore } from '@/store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const TimelinePanel = () => {
  const { timeline, loading } = useEHRStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'visit': return <Calendar className="h-4 w-4" />;
      case 'soap': return <FileText className="h-4 w-4" />;
      case 'prescription': return <ClipboardList className="h-4 w-4" />;
      case 'lab': return <FlaskConical className="h-4 w-4" />;
      case 'vitals': return <Activity className="h-4 w-4" />;
      case 'diagnosis': return <Stethoscope className="h-4 w-4" />;
      case 'referral': return <Share2 className="h-4 w-4" />;
      case 'document': return <FileDown className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'visit': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'soap': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'prescription': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'lab': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'vitals': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'diagnosis': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'referral': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'document': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredTimeline = timeline.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.metadata?.status as string || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by date
  const groupedTimeline: Record<string, typeof timeline> = {};
  filteredTimeline.forEach(item => {
    const date = format(new Date(item.timestamp), 'MMMM dd, yyyy');
    if (!groupedTimeline[date]) groupedTimeline[date] = [];
    groupedTimeline[date].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Timeline</h2>
          <p className="text-sm text-slate-500 font-medium">Longitudinal medical record view</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search events..." 
              className="pl-10 rounded-xl border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 rounded-xl border-slate-200">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="visit">Visits</SelectItem>
              <SelectItem value="soap">SOAP Notes</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="lab">Labs</SelectItem>
              <SelectItem value="vitals">Vitals</SelectItem>
              <SelectItem value="diagnosis">Diagnoses</SelectItem>
              <SelectItem value="referral">Referrals</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-100" />
        
        <div className="space-y-12">
          {Object.keys(groupedTimeline).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                <History className="h-8 w-8 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">No events found</p>
                <p className="text-slate-400 text-sm">Try adjusting your filters or search query.</p>
              </div>
            </div>
          ) : (
            Object.entries(groupedTimeline).map(([date, items]) => (
              <div key={date} className="space-y-6">
                <div className="sticky top-0 z-10 py-2 bg-[#f8fafc]">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-20">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 text-xs rounded-lg uppercase tracking-widest shadow-sm">
                      {date}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-16 group"
                    >
                      <div className={cn(
                        "absolute left-[14px] top-4 h-5 w-5 rounded-full border-4 border-[#f8fafc] z-10 transition-transform group-hover:scale-110",
                        item.type === 'visit' ? 'bg-indigo-500' :
                        item.type === 'soap' ? 'bg-amber-500' :
                        item.type === 'prescription' ? 'bg-emerald-500' :
                        item.type === 'lab' ? 'bg-violet-500' :
                        'bg-slate-400'
                      )} />
                      
                      <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group-hover:border-indigo-100">
                        <CardContent className="p-0">
                          <div className="flex items-stretch">
                            <div className={cn("w-1.5", 
                              item.type === 'visit' ? 'bg-indigo-500' :
                              item.type === 'soap' ? 'bg-amber-500' :
                              item.type === 'prescription' ? 'bg-emerald-500' :
                              item.type === 'lab' ? 'bg-violet-500' :
                              'bg-slate-400'
                            )} />
                            <div className="flex-1 p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-xl border", getEventColor(item.type))}>
                                    {getEventIcon(item.type)}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                      {format(new Date(item.timestamp), 'hh:mm a')} • {item.created_by || 'System'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.metadata?.status && (
                                    <Badge className="bg-slate-50 text-slate-500 border-none text-[9px] uppercase tracking-widest px-2 font-bold">
                                      {item.metadata.status as string}
                                    </Badge>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                              
                              {item.metadata?.visit_id && (
                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                                  <div className="h-1 w-1 rounded-full bg-indigo-600" />
                                  Visit: #{ (item.metadata.visit_id as string).slice(-8) }
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelinePanel;
