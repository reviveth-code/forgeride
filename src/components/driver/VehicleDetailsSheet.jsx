import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';

const VEHICLE_TYPES = ['Keke', 'Okada', 'Car', 'Truck', 'Van', 'Bus'];

export default function VehicleDetailsSheet({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    vehicle_type: user?.vehicle_type || '',
    vehicle_plate: user?.vehicle_plate || '',
    vehicle_model: user?.vehicle_model || '',
    vehicle_color: user?.vehicle_color || '',
    vehicle_year: user?.vehicle_year || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    onSaved(form);
    onClose();
  };

  const field = (label, key, props = {}) => (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-gray-900">Vehicle Details</h3>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, vehicle_type: t }))}
                  className={`py-3 rounded-2xl text-sm font-bold border-2 transition-colors ${
                    form.vehicle_type === t ? 'bg-forge-orange border-forge-orange text-white' : 'border-gray-200 text-gray-600'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {field('Plate Number', 'vehicle_plate', { placeholder: 'e.g. LAG-123-XY' })}
          {field('Make & Model', 'vehicle_model', { placeholder: 'e.g. Toyota Camry' })}
          {field('Colour', 'vehicle_color', { placeholder: 'e.g. Silver' })}
          {field('Year', 'vehicle_year', { placeholder: 'e.g. 2019', type: 'number' })}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-6 bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Vehicle Details'}
        </button>
      </div>
    </div>
  );
}