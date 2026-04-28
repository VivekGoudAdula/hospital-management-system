import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Lock,
  Hospital,
  ArrowRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-10 pb-12"
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Enterprise Controls</h1>
        <p className="text-slate-500 font-medium text-sm">System infrastructure and administrative framework configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
        <div className="md:col-span-1 space-y-4">
          <Card className="premium-card p-2 rounded-[2rem]">
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Facility Profile', icon: Hospital, active: true },
                { label: 'Identity Auth', icon: User, active: false },
                { label: 'Pulse Alerts', icon: Bell, active: false },
                { label: 'Encryption', icon: Lock, active: false },
                { label: 'Data Warehouse', icon: Database, active: false },
              ].map((item, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className={`justify-start gap-4 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                    item.active 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </Card>
          
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Version</p>
             <p className="text-sm font-black text-slate-900 text-center mt-1">v4.8.2-PRO</p>
          </div>
        </div>

        <div className="md:col-span-3 space-y-8">
          <Card className="premium-card overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Institutional Profile</CardTitle>
                <CardDescription className="text-xs text-slate-400 font-medium">Public clinical credentials and facility metadata</CardDescription>
              </div>
              <Hospital className="h-8 w-8 text-indigo-50 opacity-20" />
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Hospital Nomenclature</Label>
                <Input defaultValue="ApexCare Enterprise Hospital" className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-indigo-600 font-bold px-6 shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Administrative Node</Label>
                  <Input defaultValue="ops@apexcare.hospital" className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 font-bold flex items-center shadow-inner" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Crisis Response Link</Label>
                  <Input defaultValue="+1 (555) 900-1000" className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 font-bold shadow-inner" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Geospatial Coordinates</Label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-bold focus:ring-1 focus:ring-indigo-600 outline-none transition-all resize-none h-32 shadow-inner"
                  defaultValue="450 Health Avenue, Medical District, NY 10016, USA (Eastern Seaboard)"
                />
              </div>
            </CardContent>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 mt-4">
               <Button variant="ghost" className="text-slate-400 font-black text-[10px] uppercase tracking-widest h-12 px-8 hover:bg-white rounded-xl">Discard Modifications</Button>
               <Button className="h-14 px-10 bg-indigo-600 shadow-xl shadow-indigo-100 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-transform hover:scale-[1.02]">Commit Preferences</Button>
            </div>
          </Card>

          <Card className="premium-card overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight leading-none">Operational Directives</CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium mt-2">Autonomous system behaviors and clinical automation toggles</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-50">
              {[
                { title: 'Smart Triage Protocol', desc: 'Real-time prioritization of critical ER admissions via ML diagnostic matching', icon: Shield, enabled: true },
                { title: 'Warehouse Sync Loop', icon: Database, desc: 'Bi-hourly redundancy checks and clinical data warehousing', enabled: true },
                { title: 'Institutional Indexing', icon: Globe, desc: 'Allow public discovery through regional EMR network clusters', enabled: false },
              ].map((pref, i) => (
                <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50/20 transition-all group">
                  <div className="flex gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <pref.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 text-base leading-none tracking-tight">{pref.title}</p>
                      <p className="text-xs text-slate-400 font-medium max-w-sm">{pref.desc}</p>
                    </div>
                  </div>
                  <Switch checked={pref.enabled} className="data-[state=checked]:bg-indigo-600" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
