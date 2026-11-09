import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Package, OrderEvent } from '../../types';

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
  const [occasions, setOccasions] = useState<Occasion[]>([]);
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
      venue_name: 'Grand Celebration Hall',
      venue_address: 'Main Ring Road, Bangalore',
      google_maps_url: 'https://maps.google.com',
      dress_code: 'Traditional Festive Attire',
    },
  ]);

  // Uploaded photo asset placeholder
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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
        venue_name: 'Palace Banquet',
        venue_address: 'Bangalore',
        dress_code: 'Western / Indo-Western',
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

  const handleSubmitOrder = async () => {
    if (!customerName || !customerMobile) {
      setError('Please provide your name and mobile number.');
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

      // Upload files if any
      for (const file of uploadedFiles) {
        try {
          await ApiService.uploadAsset(res.order_reference, file, 'COUPLE_PHOTO');
        } catch (e) {
          console.warn('Asset upload error:', e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="card" style={{ maxWidth: '650px', margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Celebration Order Received!
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Your order has been logged into our ServiceNow-grade ticketing system and entered into the active FIFO queue for our internal creative team.
        </p>

        <div style={{ background: 'rgba(9, 15, 36, 0.7)', border: '1px solid var(--silver-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--silver-muted)', fontSize: '0.9rem' }}>Order & Ticket Reference:</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--gold-pure)', fontFamily: 'var(--font-serif)' }}>{orderResult.order_reference}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--silver-muted)', fontSize: '0.9rem' }}>Customer Status:</span>
            <span className="badge badge-new">{orderResult.customer_facing_status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--silver-muted)', fontSize: '0.9rem' }}>Total Amount:</span>
            <strong style={{ color: 'var(--gold-pure)', fontSize: '1.2rem' }}>₹{orderResult.total_amount_inr}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-luxury-gold" onClick={() => onOrderCreated(orderResult.order_reference)}>
            Track Order Progress →
          </button>
          <button className="btn btn-luxury-silver" onClick={onCancel}>
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Wizard Progress Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', background: 'var(--midnight-card)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--silver-border)' }}>
        {[
          { num: 1, label: 'Package & Language' },
          { num: 2, label: 'Hosts & Ceremonies' },
          { num: 3, label: 'Photos & Notes' },
          { num: 4, label: 'Review & Submit' },
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= s.num ? 1 : 0.4 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= s.num ? 'linear-gradient(135deg, #D4AF37, #A67C1E)' : 'rgba(226, 232, 240, 0.15)', color: step >= s.num ? '#070B19' : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {s.num}
            </div>
            <span style={{ fontWeight: step === s.num ? 700 : 500, fontSize: '0.9rem', color: step === s.num ? 'var(--gold-pure)' : 'var(--silver-pure)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              1. Select Occasion & Package
            </h3>

            <div className="form-group">
              <label className="form-label">Occasion Category</label>
              <select
                className="form-control"
                value={selectedOccasionId}
                onChange={(e) => {
                  setSelectedOccasionId(e.target.value);
                  const occ = occasions.find((o) => o.id === e.target.value);
                  if (occ && occ.packages.length > 0) {
                    setSelectedPackageId(occ.packages[0].id);
                  }
                }}
              >
                {occasions.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.display_name}
                  </option>
                ))}
              </select>
            </div>

            {currentOccasion && (
              <div className="form-group">
                <label className="form-label">Select Package</label>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {currentOccasion.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      style={{
                        padding: '1rem',
                        border: '2px solid',
                        borderColor: selectedPackageId === pkg.id ? 'var(--color-primary)' : 'var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: selectedPackageId === pkg.id ? '#FFF1F2' : '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{pkg.name}</span>
                        <span style={{ color: 'var(--color-primary)' }}>₹{parseFloat(pkg.base_price_inr).toFixed(0)}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Includes {pkg.included_revisions} free revisions & web invite
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Preferred Regional Language for Content</label>
              <select className="form-control" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                {REGIONAL_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                Our creative team crafts regional script text, auspicious ceremonial headings, and religious invocations.
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#FDFBF7', border: '1px solid var(--color-accent-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeVideo}
                  onChange={(e) => setIncludeVideo(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Include Animated Video Invitation Add-on (+₹299)</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Bespoke 30–60s motion-animated MP4 video with synced music and transitions produced by our video specialist.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Event Details →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              2. Celebrants & Ceremonial Schedules
            </h3>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Hosts / Couple / Celebrant Names *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul & Sneha / Aarav Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (For OTP & Tracking) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 98860 12345"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. contact@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Ceremonial Itinerary / Events</h4>
                <button type="button" className="btn btn-sm btn-outline" onClick={addEvent}>+ Add Another Ceremony</button>
              </div>

              {events.map((ev, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong>Event #{idx + 1}</strong>
                    {events.length > 1 && (
                      <button type="button" className="btn btn-sm btn-outline" style={{ color: 'var(--color-danger)' }} onClick={() => removeEvent(idx)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Event Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={ev.event_title}
                        onChange={(e) => updateEvent(idx, 'event_title', e.target.value)}
                        placeholder="Muhurtham / Reception"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={ev.event_date}
                        onChange={(e) => updateEvent(idx, 'event_date', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={ev.start_time}
                        onChange={(e) => updateEvent(idx, 'start_time', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Venue Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={ev.venue_name}
                        onChange={(e) => updateEvent(idx, 'venue_name', e.target.value)}
                        placeholder="e.g. Gayatri Vihar, Palace Grounds"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Google Maps Link</label>
                      <input
                        type="url"
                        className="form-control"
                        value={ev.google_maps_url || ''}
                        onChange={(e) => updateEvent(idx, 'google_maps_url', e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Venue Address</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={ev.venue_address}
                      onChange={(e) => updateEvent(idx, 'venue_address', e.target.value)}
                      placeholder="Detailed address for navigation..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Upload Photos →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              3. Creative Notes & Photo Assets
            </h3>

            <div className="form-group">
              <label className="form-label">Special Instructions or Creative Preferences</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="e.g., Traditional temple maroon and gold theme, include Ganesha shloka at top, favorite background instrumental flute track..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Photographs & Portraits</label>
              <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: '#F8FAFC' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
                  Select couple portraits, family photos, or background audio tracks.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,audio/mpeg"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Selected Files ({uploadedFiles.length}):</strong>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    {uploadedFiles.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Review & Submit →</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              4. Review Order Summary
            </h3>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Occasion:</span>
                <strong>{currentOccasion?.display_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Selected Package:</span>
                <strong>{currentPackage?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Celebrants / Contact:</span>
                <strong>{customerName} ({customerMobile})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Language:</span>
                <strong>{selectedLanguage}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Scheduled Events:</span>
                <strong>{events.length} Ceremony Itineraries</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '1.1rem' }}>Total Amount Payable:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ₹{(parseFloat(currentPackage?.base_price_inr || '0') + (includeVideo ? 299 : 0)).toFixed(0)}
                </span>
              </div>
            </div>

            <div style={{ background: '#FDFBF7', border: '1px solid var(--color-accent-light)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
              <strong>Zero Upfront Payment:</strong> You will not be billed now. Our creative team will pick up your ticket via FIFO self-assignment, design your personalized invitation, and share a protected preview. You review, request up to 2 free revisions, and pay only after you approve the final design.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-gold" onClick={handleSubmitOrder} disabled={submitting}>
                {submitting ? 'Creating Order & Ticket...' : 'Confirm & Place Order ✨'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

