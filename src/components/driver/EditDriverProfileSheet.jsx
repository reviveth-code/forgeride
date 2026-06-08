import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Camera } from 'lucide-react';

export default function EditDriverProfileSheet({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    display_name: user?.display_name || user?.full_name || '',
    phone: user?.phone || '',
  });
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = { ...form, profile_photo: photoUrl };
    await base44.auth.updateMe(updates);
    onSaved(updates);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-[300]">
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-gray-900">Edit Profile</h3>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              {photoUrl
                ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                : <span className="text-white font-extrabold text-3xl">
                    {(form.display_name || user?.full_name)?.[0]?.toUpperCase() || 'D'}
                  </span>
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-forge-orange rounded-full flex items-center justify-center shadow-lg">
              {uploadingPhoto ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <p className="text-xs text-gray-400 mt-2">Tap camera to upload headshot</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Display Name</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="How your name appears to passengers"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 08012345678"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
            />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || uploadingPhoto}
          className="w-full mt-6 bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}