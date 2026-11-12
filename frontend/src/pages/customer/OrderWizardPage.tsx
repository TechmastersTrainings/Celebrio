import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Package, OrderEvent } from '../../types';
import { OFFICIAL_OCCASIONS } from '../../data/defaultCatalog';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Upload,
  CheckCircle2,
  Trash2,
  Plus,
  Video,
  FileText,
  ShieldCheck,
  Languages,
  User,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

interface OrderWizardPageProps {
  initialOccasionId?: string;
  initialPackageId?: string;
  onOrderCreated: (orderRef: string) => void;
  onCancel: () => void;
}

const REGIONAL_LANGUAGES = [
  'English',
  'Kannada (ಕನ್ನಡ)',
  'Hindi (हिन्दी)',
  'Telugu (తెలుగు)',
  'Marathi (मराठी)',
  'Urdu (اردو)',
  'Tamil (தமிழ்)',
  'Malayalam (മലയാളം)',
  'Bengali (বাংলা)',
  'Gujarati (ગુજરાતી)',
  'Punjabi (ਪੰਜਾਬੀ)',
];

export const OrderWizardPage: React.FC<OrderWizardPageProps> = ({
  initialOccasionId,
  initialPackageId,
  onOrderCreated,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);
  const [selectedOccasionId, setSelectedOccasionId] = useState(initialOccasionId || '');
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [includeVideo, setIncludeVideo] = useState(false);

  // Sub-events
  const [events, setEvents] = useState<OrderEvent[]>([
    {
      event_title: 'Main Ceremony',
      event_date: '2026-12-15',
      start_time: '10:00',
      venue_name: 'Celebration Hall',
      venue_address: 'Mailoor Road, Bidar, Karnataka',
      google_maps_url: 'https://maps.google.com',
      dress_code: 'Traditional Festive Attire',
    },
  ]);

  // Uploaded photo assets
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  useEffect(() => {
    ApiService.getOccasions().then((data) => {
      setOccasions(data);
      if (!selectedOccasionId && data.length > 0) {
        setSelectedOccasionId(data[0].id);
        if (data[0].packages.length > 0) {
          setSelectedPackageId(data[0].packages[0].id);
        }
      }
    });
  }, []);

  const currentOccasion = occasions.find((o) => o.id === selectedOccasionId);
  const currentPackage = currentOccasion?.packages.find((p) => p.id === selectedPackageId);

  const addEvent = () => {
    setEvents([
      ...events,
      {
        event_title: 'Evening Reception',
        event_date: '2026-12-15',
        start_time: '19:00',
        venue_name: 'Palace Banquet Hall',
        venue_address: 'Bidar / Bengaluru',
        dress_code: 'Indo-Western Festive',
      },
    ]);
  };

  const removeEvent = (index: number) => {
    if (events.length > 1) {
      setEvents(events.filter((_, i) => i !== index));
    }
  };

  const updateEvent = (index: number, field: keyof OrderEvent, value: string) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setEvents(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !customerMobile) {
      setError('Please provide your name and mobile phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_email: customerEmail || undefined,
        occasion_id: selectedOccasionId,
        package_id: selectedPackageId,
        selected_language: selectedLanguage.split(' ')[0],
        special_instructions: specialInstructions,
        include_video: includeVideo,
        events: events.map((ev) => ({
          ...ev,
          start_time: ev.start_time.length === 5 ? `${ev.start_time}:00` : ev.start_time,
        })),
      };

      const res: any = await ApiService.submitOrder(payload);
      setOrderResult(res);

      // Upload files sequentially with progress feedback
      if (uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          try {
            await ApiService.uploadAsset(res.order_reference, uploadedFiles[i], 'COUPLE_PHOTO');
            setUploadProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
          } catch (e) {
            console.warn('Asset upload error:', e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit celebration order.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SUBMISSION SCREEN
  if (orderResult) {
    return (
      <div style={{ maxWidth: '680px', margin: '3.5rem auto', padding: '0 1rem' }}>
        <div className="card card-gold-accent" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-champagne)', color: 'var(--burgundy-rich)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Sparkles size={32} />
          </div>

          <span className="editorial-kicker">ORDER RECEIVED &bull; SERVICENOW TICKET LOGGED</span>
          <h2 style={{ fontSize: '2.1rem', marginBottom: '0.75rem', color: 'var(--navy-deep)' }}>
            Celebration Order Registered!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginBottom: '2rem', lineHeight: 1.65 }}>
            Your order has been received by our internal creative design team. You will receive an SMS/WhatsApp notification once your draft preview is ready.
          </p>

          <div
            style={{
              background: 'var(--bg-champagne)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              marginBottom: '2.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Order Reference:</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)' }}>
                {orderResult.order_reference}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status:</span>
              <span className="badge badge-new">{orderResult.customer_facing_status || 'Under Artisan Review'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Service Fee:</span>
              <strong style={{ color: 'var(--burgundy-rich)', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                ₹{parseFloat(String(orderResult.total_amount_inr)).toFixed(2)}
              </strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
              * Zero upfront payment. Payment is authorized only after you inspect and approve your watermarked preview.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => onOrderCreated(orderResult.order_reference)}
            >
              <span>Track Order Progress &rarr;</span>
            </button>
            <button className="btn btn-outline" onClick={onCancel}>
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '3rem auto 5rem', padding: '0 1rem' }}>
      {/* Editorial Stepper Header */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 2rem',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {[
          { num: 1, label: 'Package & Language' },
          { num: 2, label: 'Hosts & Ceremonies' },
          { num: 3, label: 'Photos & Assets' },
          { num: 4, label: 'Review & Submit' },
        ].map((s) => (
          <div
            key={s.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              opacity: step >= s.num ? 1 : 0.45,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= s.num ? 'var(--burgundy-rich)' : 'var(--bg-champagne)',
                color: step >= s.num ? '#FFFFFF' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {s.num}
            </div>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: step === s.num ? 700 : 500,
                color: step === s.num ? 'var(--burgundy-rich)' : 'var(--text-body)',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: 'var(--color-danger)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          STEP 1: PACKAGE & LANGUAGE
          ========================================================================= */}
      {step === 1 && (
        <div className="card" style={{ padding: '2.5rem' }}>
          <span className="editorial-kicker">STEP 1 OF 4</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--navy-deep)' }}>
            Select Occasion, Tier &amp; Regional Language
          </h2>

          {/* Occasion Selector */}
          <div className="form-group">
            <label className="form-label">Occasion Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {occasions.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => {
                    setSelectedOccasionId(occ.id);
                    if (occ.packages.length > 0) {
                      setSelectedPackageId(occ.packages[0].id);
                    }
                  }}
                  className={`btn ${selectedOccasionId === occ.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.84rem',
                    padding: '0.65rem 0.5rem',
                    justifyContent: 'center',
                    borderWidth: selectedOccasionId === occ.id ? '2px' : '1px',
                  }}
                >
                  {occ.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* Package Tier Selector */}
          {currentOccasion && (
            <div className="form-group" style={{ marginTop: '1.75rem' }}>
              <label className="form-label">Available Service Tiers *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {currentOccasion.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    style={{
                      border: selectedPackageId === pkg.id ? '2px solid var(--burgundy-rich)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      background: selectedPackageId === pkg.id ? 'var(--bg-cream)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-heading)' }}>{pkg.name}</strong>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
                        ₹{parseFloat(String(pkg.base_price_inr)).toFixed(2)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--gold-primary)', fontWeight: 600, display: 'block' }}>
                      Bespoke Designer Preview Included
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regional Multilingual Selection */}
          <div className="form-group" style={{ marginTop: '1.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Languages size={16} />
              <span>Primary Regional Language *</span>
            </label>
            <select
              className="form-control"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {REGIONAL_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              Our designers will craft your typography in authentic regional Unicode fonts (Kannada, Hindi, Telugu, Marathi, etc.).
            </small>
          </div>

          {/* Add-on: Motion Video */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '1.25rem',
              background: 'var(--bg-champagne)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Video size={24} style={{ color: 'var(--burgundy-rich)' }} />
              <div>
                <strong style={{ fontSize: '0.96rem', display: 'block' }}>
                  Include Animated Motion Video Invitation
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Cinematic 60-second MP4 video for WhatsApp sharing (+₹299)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeVideo}
              onChange={(e) => setIncludeVideo(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--burgundy-rich)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              <span>Next: Host &amp; Ceremonies &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: HOSTS & CEREMONIES
          ========================================================================= */}
      {step === 2 && (
        <div className="card" style={{ padding: '2.5rem' }}>
          <span className="editorial-kicker">STEP 2 OF 4</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--navy-deep)' }}>
            Customer Details &amp; Event Itinerary
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kulkarni"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile Phone Number (OTP) *</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +91 98860 12345"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. ramesh@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '1.5rem 0' }} />

          {/* Multi-Ceremony Schedules */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem' }}>Ceremony &amp; Event Itinerary</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={addEvent}>
              <Plus size={14} /> Add Another Ceremony
            </button>
          </div>

          {events.map((ev, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-champagne)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--burgundy-rich)' }}>
                  Ceremony #{idx + 1}
                </strong>
                {events.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEvent(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">Ceremony Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Muhurtham / Sangeet / Namakarana"
                    value={ev.event_title}
                    onChange={(e) => updateEvent(idx, 'event_title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={ev.event_date}
                    onChange={(e) => updateEvent(idx, 'event_date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={ev.start_time}
                    onChange={(e) => updateEvent(idx, 'start_time', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label className="form-label">Venue Name &amp; Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. The Leela Palace, Bengaluru"
                    value={ev.venue_name}
                    onChange={(e) => updateEvent(idx, 'venue_name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Google Maps Link (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://maps.google.com/?q=..."
                    value={ev.google_maps_url || ''}
                    onChange={(e) => updateEvent(idx, 'google_maps_url', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>
              <ArrowLeft size={15} /> Previous
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              <span>Next: Photos &amp; Assets &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: PHOTOS & CUSTOMISATION NOTES
          ========================================================================= */}
      {step === 3 && (
        <div className="card" style={{ padding: '2.5rem' }}>
          <span className="editorial-kicker">STEP 3 OF 4</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--navy-deep)' }}>
            Upload Photographs &amp; Add Customisation Notes
          </h2>

          {/* Upload Dropzone */}
          <div
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              background: 'var(--bg-cream)',
              marginBottom: '1.5rem',
            }}
          >
            <Upload size={36} style={{ color: 'var(--burgundy-rich)', margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
              Drag &amp; Drop Photographs Here, or Browse Files
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Upload high-resolution couple photographs, family pictures, baby portraits, or background audio. Max 10MB per file.
            </p>

            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              <span>Choose Files from Device</span>
              <input
                type="file"
                multiple
                accept="image/*,audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Uploaded File List */}
          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '0.75rem' }}>
                Files Selected ({uploadedFiles.length}):
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 1rem',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.86rem',
                    }}
                  >
                    <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalisation Instructions */}
          <div className="form-group">
            <label className="form-label">
              Special Customisation Instructions &amp; Family Names
            </label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="e.g. Host family details, preferred fonts or regional script preferences (Kannada/Hindi/Telugu), specific mantras, color themes, or special notes for our design artisans."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>
              <ArrowLeft size={15} /> Previous
            </button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              <span>Next: Review Submission &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: REVIEW & SUBMIT
          ========================================================================= */}
      {step === 4 && (
        <div className="card" style={{ padding: '2.5rem' }}>
          <span className="editorial-kicker">STEP 4 OF 4</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--navy-deep)' }}>
            Review Your Celebration Order
          </h2>

          <div style={{ background: 'var(--bg-champagne)', borderRadius: 'var(--radius-md)', padding: '1.75rem', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <span className="editorial-kicker" style={{ fontSize: '0.70rem', marginBottom: '2px' }}>
                  SELECTED PACKAGE
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                  {currentPackage?.name || 'Standard Celebration Package'}
                </h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Occasion: {currentOccasion?.display_name} &bull; Language: {selectedLanguage}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
                  ₹{(currentPackage ? (parseFloat(String(currentPackage.base_price_inr)) + (includeVideo ? 299 : 0)) : 399).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                  Zero Upfront Payment
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Customer Name:</span>
                <strong>{customerName || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Contact Mobile:</span>
                <strong>{customerMobile || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Ceremonies Configured:</span>
                <strong>{events.length} Ceremony Itineraries</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Photographs Attached:</span>
                <strong>{uploadedFiles.length} Media Files</strong>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Guarantee */}
          <div style={{ padding: '1rem 1.25rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--burgundy-rich)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>TechMasters Assurance:</strong> You will receive a watermarked preview within 24-48 business hours. Payment is made only when you are 100% satisfied.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => setStep(3)} disabled={submitting}>
              <ArrowLeft size={15} /> Previous
            </button>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmitOrder}
              disabled={submitting}
            >
              {submitting ? (
                <span>Submitting Your Order...</span>
              ) : (
                <>
                  <Sparkles size={16} style={{ color: '#F59E0B' }} />
                  <span>Confirm &amp; Generate Order Reference</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
