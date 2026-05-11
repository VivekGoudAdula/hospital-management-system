import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Activity, 
  Thermometer, 
  Wind, 
  Droplets, 
  Scale, 
  Ruler, 
  Dna,
  Heart,
  Save,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useEHRStore } from '@/store';
import { toast } from 'sonner';

interface CaptureVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const CaptureVitalsModal = ({ isOpen, onClose, initialData }: CaptureVitalsModalProps) => {
  const { currentPatient, currentVisit, saveVitals, updateVitals } = useEHRStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    temperature: 98.6,
    spo2: 98,
    respiratory_rate: 16,
    height: 175,
    weight: 70,
    pain_scale: 0,
    blood_sugar: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        systolic: initialData.blood_pressure.systolic,
        diastolic: initialData.blood_pressure.diastolic,
        pulse: initialData.pulse,
        temperature: initialData.temperature,
        spo2: initialData.spo2,
        respiratory_rate: initialData.respiratory_rate,
        height: initialData.height,
        weight: initialData.weight,
        pain_scale: initialData.pain_scale,
        blood_sugar: initialData.blood_sugar || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !currentVisit) return;

    setLoading(true);
    try {
      const payload = {
        patient_id: currentPatient.id,
        visit_id: currentVisit.id,
        blood_pressure: {
          systolic: Number(formData.systolic),
          diastolic: Number(formData.diastolic)
        },
        pulse: Number(formData.pulse),
        temperature: Number(formData.temperature),
        spo2: Number(formData.spo2),
        respiratory_rate: Number(formData.respiratory_rate),
        height: Number(formData.height),
        weight: Number(formData.weight),
        pain_scale: Number(formData.pain_scale),
        blood_sugar: formData.blood_sugar ? Number(formData.blood_sugar) : undefined,
        notes: formData.notes
      };

      if (initialData) {
        await updateVitals(initialData.id, payload);
        toast.success('Vitals updated successfully');
      } else {
        await saveVitals(payload);
        toast.success('Vitals captured successfully');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const h_m = formData.height / 100;
      return (formData.weight / (h_m * h_m)).toFixed(1);
    }
    return '--';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-8 flex items-center justify-between text-white relative">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Capture Vitals</h2>
                </div>
                <p className="text-indigo-100 text-sm font-medium opacity-80">Recording vitals for {currentPatient?.full_name}</p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* BP Section */}
                <div className="md:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Blood Pressure</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Systolic</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.systolic}
                          onChange={(e) => setFormData({...formData, systolic: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">mmHg</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diastolic</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.diastolic}
                          onChange={(e) => setFormData({...formData, diastolic: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">mmHg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pulse & RR Section */}
                <div className="md:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Wind className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Cardiovascular</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pulse</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.pulse}
                          onChange={(e) => setFormData({...formData, pulse: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">BPM</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resp. Rate</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.respiratory_rate}
                          onChange={(e) => setFormData({...formData, respiratory_rate: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">/min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Oxygen & Temp Section */}
                <div className="md:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Thermometer className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Systemic</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SpO2</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.spo2}
                          onChange={(e) => setFormData({...formData, spo2: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temp</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.1"
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.temperature}
                          onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">°F</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Physical Section */}
                <div className="md:col-span-2 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                    <Scale className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Anthropometry</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Height</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">cm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">kg</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI Score</Label>
                      <div className="h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center px-4">
                        <span className="text-sm font-black text-indigo-600">{calculateBMI()}</span>
                        <Badge className="ml-auto bg-indigo-600 text-[8px] border-none font-bold">Auto</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Section */}
                <div className="md:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Droplets className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Others</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Scale</Label>
                      <select 
                        className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold text-sm px-4 outline-none"
                        value={formData.pain_scale}
                        onChange={(e) => setFormData({...formData, pain_scale: Number(e.target.value)})}
                      >
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>{n} - {n === 0 ? 'None' : n === 10 ? 'Worst' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Sugar</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 font-bold"
                          placeholder="Opt"
                          value={formData.blood_sugar}
                          onChange={(e) => setFormData({...formData, blood_sugar: e.target.value})}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">mg/dL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Notes / Observation</Label>
                <Textarea 
                  className="rounded-[1.5rem] bg-slate-50 border-slate-100 focus:bg-white min-h-[100px] font-medium"
                  placeholder="Record any specific clinical observations regarding vitals..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Alert Suggestion Foundation */}
              {(formData.systolic > 140 || formData.spo2 < 95 || formData.temperature > 100) && (
                <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 flex gap-4 items-start animate-pulse">
                  <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Clinical Warning Thresholds Detected</h4>
                    <p className="text-xs text-rose-600 font-medium leading-relaxed">The recorded values exceed normal physiological ranges. Please verify the reading and notify the primary physician if sustained.</p>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">All data is stored in the patient longitudinal record</p>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  className="rounded-2xl h-12 px-8 font-bold text-xs uppercase tracking-widest"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  className="rounded-2xl h-12 px-8 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : initialData ? 'Update Vitals' : 'Capture & Save'}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CaptureVitalsModal;
