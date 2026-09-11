import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp, Camera, CheckCircle2, Image as ImageIcon, MapPin, Tag, Sparkles, Filter, X } from 'lucide-react';
import { CommunityNote } from '../types';

interface CommunityNotesPageProps {
  notes: CommunityNote[];
  onAddNote: (newNote: CommunityNote) => void;
}

export const CommunityNotesPage: React.FC<CommunityNotesPageProps> = ({
  notes,
  onAddNote
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotedMap, setUpvotedMap] = useState<Record<string, number>>({});

  // Form states
  const [category, setCategory] = useState<CommunityNote['category']>("Streetlights");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["All", "Streetlights", "Footfall", "Transit & Stations", "General"];

  const filteredNotes = activeCategory === "All"
    ? notes
    : notes.filter(n => n.category === activeCategory);

  const handleUpvote = (id: string) => {
    setUpvotedMap(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !text.trim()) return;

    const newNoteObj: CommunityNote = {
      id: `note-${Date.now()}`,
      author: 'Anonymous Neighbor',
      category,
      location,
      text,
      timestamp: 'Just now',
      photoUrl,
      upvotes: 1,
      verified: true
    };

    onAddNote(newNoteObj);
    setIsModalOpen(false);

    // Reset Form
    setLocation("");
    setText("");
    setPhotoUrl(undefined);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-brand-purple text-xs font-bold mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Environmental Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Condition Feed
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Anonymous, crowdsourced updates on street lighting, bus stops, and footfall.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6C2BD9] via-[#7C3AED] to-[#FF4D8D] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add a Note</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-purple-100 no-scrollbar">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-brand-purple text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNotes.map((note, idx) => {
            const addedUpvotes = upvotedMap[note.id] || 0;
            const totalUpvotes = note.upvotes + addedUpvotes;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-md hover:shadow-lg transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-brand-purple font-bold flex items-center justify-center text-xs">
                      {note.author.charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{note.author}</span>
                        {note.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Community Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{note.timestamp}</span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-purple-50 text-brand-purple text-xs font-bold border border-purple-100">
                    {note.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    <span>{note.location}</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">
                    "{note.text}"
                  </p>
                </div>

                {/* Optional Attached Photo Preview */}
                {note.photoUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-56 border border-slate-200">
                    <img
                      src={note.photoUrl}
                      alt="Condition evidence"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleUpvote(note.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-purple text-xs font-bold flex items-center gap-1.5 transition-all border border-purple-200"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({totalUpvotes})</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Anonymous submission
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Add an Anonymous Note
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Help other women travel confidently by reporting lighting, footfall, or transit conditions.
              </p>

              <form onSubmit={handleSubmitNote} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50"
                  >
                    <option value="Streetlights">Streetlights & Lighting</option>
                    <option value="Footfall">Pedestrian & Footfall</option>
                    <option value="Transit & Stations">Transit & Bus Stops</option>
                    <option value="General">General Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Location / Intersection
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4th Cross Street near Metro Gate 2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Condition Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe real condition details (e.g. 'Newly installed bright LED streetlights on sidewalk...')"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800"
                  />
                </div>

                {/* Photo Upload Attachment Area */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Attach Photo (Optional)
                  </label>

                  {photoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden h-36 border border-purple-200">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(undefined)}
                        className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-purple hover:bg-purple-50/50 transition-all"
                    >
                      <Camera className="w-8 h-8 text-brand-purple mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-700 block">Click to upload photo</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">JPEG, PNG supported</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6C2BD9] to-[#FF4D8D] text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Publish Anonymous Note
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
