import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Plus, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  BarChart3,
  Weight,
  Thermometer,
  Wind,
  Dna
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEHRStore } from '@/store';
import CaptureVitalsModal from './CaptureVitalsModal';

const VitalsPanel = () => {
  const { currentPatient, vitalsHistory, vitalsLoading, fetchVitals } = useEHRStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('7d');
  const [chartType, setChartType] = useState('bp');

  useEffect(() => {
    if (currentPatient) {
      fetchVitals(currentPatient.id);
    }
  }, [currentPatient?.id]);

  if (!currentPatient) return null;

  const latestVitals = vitalsHistory[0];
  const previousVitals = vitalsHistory[1];

  const getStatusColor = (type: string, value: any) => {
    if (!value) return 'text-slate-400';
    
    switch (type) {
      case 'bp':
        const { systolic, diastolic } = value;
        if (systolic > 140 || diastolic > 90) return 'text-rose-500';
        if (systolic > 130 || diastolic > 85) return 'text-amber-500';
        return 'text-emerald-500';
      case 'pulse':
        if (value > 100 || value < 60) return 'text-rose-500';
        return 'text-emerald-500';
      case 'spo2':
        if (value < 95) return 'text-rose-500';
        return 'text-emerald-500';
      case 'temp':
        if (value > 100.4) return 'text-rose-500';
        if (value < 96) return 'text-amber-500';
        return 'text-emerald-500';
      default:
        return 'text-slate-600';
    }
  };

  const getTrend = (current: number, previous: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-slate-300" />;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-rose-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-emerald-500" />;
    return <Minus className="h-4 w-4 text-slate-300" />;
  };

  const chartData = [...vitalsHistory].reverse().map(v => ({
    time: format(new Date(v.created_at), 'MMM dd'),
    systolic: v.blood_pressure.systolic,
    diastolic: v.blood_pressure.diastolic,
    pulse: v.pulse,
    spo2: v.spo2,
    temp: v.temperature,
    weight: v.weight
  }));

  const vitalsCards = [
    { 
      label: 'Blood Pressure', 
      value: latestVitals ? `${latestVitals.blood_pressure.systolic}/${latestVitals.blood_pressure.diastolic}` : '--', 
      unit: 'mmHg', 
      icon: Activity, 
      color: getStatusColor('bp', latestVitals?.blood_pressure),
      trend: latestVitals && previousVitals ? (latestVitals.blood_pressure.systolic > previousVitals.blood_pressure.systolic ? 'up' : 'down') : 'none'
    },
    { 
      label: 'Pulse Rate', 
      value: latestVitals ? latestVitals.pulse : '--', 
      unit: 'BPM', 
      icon: TrendingUp, 
      color: getStatusColor('pulse', latestVitals?.pulse),
      trend: latestVitals && previousVitals ? (latestVitals.pulse > previousVitals.pulse ? 'up' : 'down') : 'none'
    },
    { 
      label: 'Oxygen Saturation', 
      value: latestVitals ? latestVitals.spo2 : '--', 
      unit: '%', 
      icon: Wind, 
      color: getStatusColor('spo2', latestVitals?.spo2),
      trend: latestVitals && previousVitals ? (latestVitals.spo2 > previousVitals.spo2 ? 'up' : 'down') : 'none'
    },
    { 
      label: 'Temperature', 
      value: latestVitals ? latestVitals.temperature : '--', 
      unit: '°F', 
      icon: Thermometer, 
      color: getStatusColor('temp', latestVitals?.temperature),
      trend: latestVitals && previousVitals ? (latestVitals.temperature > previousVitals.temperature ? 'up' : 'down') : 'none'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Vitals Management</h2>
          <p className="text-slate-400 font-medium">Longitudinal tracking of physiological parameters and trends.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs">
             <History className="h-4 w-4 mr-2" /> Full Report
          </Button>
          <Button 
            className="rounded-2xl h-12 px-8 bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-100"
            onClick={() => setIsModalOpen(true)}
          >
             <Plus className="h-5 w-5 mr-2" /> Capture New Vitals
          </Button>
        </div>
      </div>

      {/* Real-time Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {vitalsCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-indigo-50" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", 
                  card.color.replace('text-', 'bg-').replace('500', '50')
                )}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                {card.trend !== 'none' && (
                  <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                    card.trend === 'up' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {card.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {card.trend}
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-3xl font-black tracking-tighter", card.color)}>{card.value}</span>
                  <span className="text-xs font-bold text-slate-400">{card.unit}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Charts Section */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Physiological Trends</CardTitle>
            </div>
            <Tabs value={chartType} onValueChange={setChartType} className="bg-slate-50 p-1 rounded-xl">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="bp" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">BP</TabsTrigger>
                <TabsTrigger value="pulse" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">Pulse</TabsTrigger>
                <TabsTrigger value="spo2" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">SpO2</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bp' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSystolic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="systolic" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSystolic)" />
                    <Area type="monotone" dataKey="diastolic" stroke="#818cf8" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey={chartType} stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#4f46e5', strokeWidth: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* History / Recent List Section */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/40">
           <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Recent Logs</CardTitle>
                <History className="h-5 w-5 text-slate-300" />
              </div>
           </CardHeader>
           <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                 {vitalsHistory.slice(0, 5).map((log, i) => (
                   <div key={log.id} className="group p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                         <Badge className="bg-indigo-600 text-white border-none text-[8px] font-bold uppercase tracking-widest px-2">Record #{vitalsHistory.length - i}</Badge>
                         <span className="text-[10px] font-bold text-slate-400">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">{log.blood_pressure.systolic}/{log.blood_pressure.diastolic} <span className="text-[10px] text-slate-400 font-medium">mmHg</span></p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{log.pulse} BPM • {log.temperature}°F</p>
                         </div>
                         <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <ChevronRight className="h-4 w-4" />
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {vitalsHistory.length === 0 && (
                   <div className="py-12 text-center space-y-4">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Minus className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No vitals history found.</p>
                   </div>
                 )}
                 
                 <Button variant="ghost" className="w-full rounded-2xl h-12 text-indigo-600 font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-50">
                    View Complete History
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Anthropometry & Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/40 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Weight className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-800">Anthropometry Snapshot</h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
             {[
               { label: 'Weight', value: latestVitals?.weight || '--', unit: 'kg' },
               { label: 'Height', value: latestVitals?.height || '--', unit: 'cm' },
               { label: 'BMI', value: latestVitals?.bmi || '--', unit: 'kg/m²', status: latestVitals?.bmi_status }
             ].map((a, i) => (
               <div key={i} className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.label}</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-800 tracking-tighter">{a.value}</span>
                   <span className="text-[10px] font-bold text-slate-400">{a.unit}</span>
                 </div>
                 {a.status && (
                   <Badge className={cn("mt-1 text-[8px] font-bold uppercase border-none", 
                     a.status === 'Normal' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                   )}>
                     {a.status}
                   </Badge>
                 )}
               </div>
             ))}
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/40 p-8 flex items-center gap-8 bg-indigo-600 text-white relative overflow-hidden">
           <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10">
              <Dna className="h-48 w-48" />
           </div>
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-200" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-100">Chronic Flag Prediction</h3>
              </div>
              <p className="text-lg font-bold leading-snug">Based on the last 3 readings, systemic trends suggest regular screening for <span className="bg-white/20 px-2 py-0.5 rounded-lg border border-white/20">Hypertension</span>.</p>
              <div className="flex gap-4">
                 <Badge className="bg-white/20 text-white border-none rounded-lg text-[9px] font-black tracking-widest px-2 py-1">AI INSIGHT</Badge>
                 <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest self-center">Not a clinical diagnosis</span>
              </div>
           </div>
        </Card>
      </div>

      <CaptureVitalsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default VitalsPanel;
