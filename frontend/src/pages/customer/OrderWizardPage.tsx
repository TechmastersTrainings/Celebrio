import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Package, OrderEvent, Coupon } from '../../types';
import { OFFICIAL_OCCASIONS } from '../../data/defaultCatalog';
import { VenueSelector } from '../../components/venue/VenueSelector';
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
  AlertCircle,
  HelpCircle,
  PhoneCall,
  MessageCircle,
  Tag,
  Check,
  X,
  RefreshCw,
  ImageIcon,
  FolderOpen,
  Info,
  Gift,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Baby,
  Smile,
  Percent,
  DollarSign
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
  // Wizard Step Progress (1 to 5)
  const [step, setStep] = useState(1);

  // Catalog State
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);
  const [selectedOccasionId, setSelectedOccasionId] = useState(initialOccasionId || '');
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId || '');

  // Step 1: Customer Contact
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [includeVideo, setIncludeVideo] = useState(false);

  // Step 2: Physical Invitation Card Choice (Mandatory YES / NO Toggle)
  const [hasPhysicalCard, setHasPhysicalCard] = useState<boolean | null>(null);
  const [cardFiles, setCardFiles] = useState<File[]>([]);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [editableOcrFields, setEditableOcrFields] = useState<Record<string, { value: string; status: string; label: string; needs_assistance?: boolean }>>({});
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Dynamic Occasion Requirements
  const [occasionData, setOccasionData] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<OrderEvent[]>([
    {
      event_title: 'Main Ceremony',
      event_date: '2026-12-18',
      start_time: '10:30',
      venue_name: '',
      venue_address: '',
      google_maps_url: '',
      venue_type: '',
      dress_code: 'Traditional Festive Attire',
    },
  ]);

  // Step 4: Multiple Photo & Attachment Uploads (No Fixed Limit)
  const [photoFiles, setPhotoFiles] = useState<Array<{ file: File; category: string; previewUrl: string }>>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState('COUPLE_PHOTO');

  // Step 5: Savings, Coupons & Submission
  const [publicCoupons, setPublicCoupons] = useState<Coupon[]>([]);
  const [defaultOffer, setDefaultOffer] = useState<any>({ percentage: 12 });
  const [enteredCouponCode, setEnteredCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCouponData, setAppliedCouponData] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Callback Modal State
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackMobile, setCallbackMobile] = useState('');
  const [callbackTime, setCallbackTime] = useState('As soon as possible');
  const [callbackReason, setCallbackReason] = useState('Help me fill out my invitation details');
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);

  // Operational State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  // Load Occasions & Public Coupons on Mount
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

    ApiService.getPublicCoupons().then((res) => {
      if (res?.coupons) setPublicCoupons(res.coupons);
      if (res?.default_offer) setDefaultOffer(res.default_offer);
    }).catch(() => {});
  }, []);

  const currentOccasion = occasions.find((o) => o.id === selectedOccasionId);
  const currentPackage = currentOccasion?.packages.find((p) => p.id === selectedPackageId) || currentOccasion?.packages[0];

  // Base Order Calculation
  const basePrice = (currentPackage ? Number(currentPackage.base_price_inr) : 999) + (includeVideo ? 299 : 0);
  const defaultAutoSavings = Math.round(basePrice * 0.12);

  // Final Pricing Calculation
  const calculatePricing = () => {
    if (appliedCouponData && appliedCouponData.is_valid) {
      return {
        basePrice,
        autoDiscount: Number(appliedCouponData.auto_discount_amount || 0),
        couponDiscount: Number(appliedCouponData.coupon_discount_amount || 0),
        totalDiscount: Number(appliedCouponData.total_discount || defaultAutoSavings),
        finalPayable: Number(appliedCouponData.final_payable_amount || (basePrice - defaultAutoSavings)),
        youSave: Number(appliedCouponData.you_save || defaultAutoSavings),
        appliedCouponCode: appliedCouponData.coupon_code,
      };
    }
    return {
      basePrice,
      autoDiscount: defaultAutoSavings,
      couponDiscount: 0,
      totalDiscount: defaultAutoSavings,
      finalPayable: Math.max(0, basePrice - defaultAutoSavings),
      youSave: defaultAutoSavings,
      appliedCouponCode: null,
    };
  };

  const pricing = calculatePricing();

  // Handle Physical Card Upload & OCR Extraction
  const handleCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    setCardFiles((prev) => [...prev, ...newFiles]);

    // Trigger OCR extraction on first file
    try {
      setIsExtractingOCR(true);
      setError(null);
      const ocr = await ApiService.extractCardOCR(newFiles[0], currentOccasion?.slug || 'wedding');
      if (ocr && ocr.fields) {
        setOcrResult(ocr);
        setEditableOcrFields(ocr.fields);
        // Pre-fill corresponding occasion fields
        const autoFilled: Record<string, string> = {};
        Object.entries(ocr.fields).forEach(([k, item]: [string, any]) => {
          if (item.value && item.status === 'INFORMATION_FOUND') {
            autoFilled[k] = item.value;
          }
        });
        setOccasionData((prev) => ({ ...prev, ...autoFilled }));
      }
    } catch (err: any) {
      console.warn('OCR extraction non-blocking error:', err);
    } finally {
      setIsExtractingOCR(false);
      if (cardFileInputRef.current) cardFileInputRef.current.value = '';
    }
  };

  // Add / Remove Event
  const addEvent = () => {
    setEvents((prev) => {
      // Carry the location over from the first ceremony so customers don't re-pick city/locality.
      const first = prev[0] || ({} as OrderEvent);
      return [
        ...prev,
        {
          event_title: 'Reception',
          event_date: first.event_date || '2026-12-18',
          start_time: '19:00',
          venue_name: '',
          venue_address: '',
          google_maps_url: '',
          venue_type: '',
          country_id: first.country_id ?? null,
          state_id: first.state_id ?? null,
          city_id: first.city_id ?? null,
          locality_id: first.locality_id ?? null,
          // venue_locality is filled by the selector from locality_id (first.venue_locality may be
          // the locality of a venue chosen elsewhere, not the customer's own area).
          venue_city: first.venue_city || '',
          venue_locality: '',
          dress_code: 'Festive Attire',
        },
      ];
    });
  };

  const removeEvent = (index: number) => {
    if (events.length > 1) {
      setEvents(events.filter((_, i) => i !== index));
    }
  };

  const updateEvent = (index: number, field: keyof OrderEvent, value: string) => {
    patchEvent(index, { [field]: value } as Partial<OrderEvent>);
  };

  // Functional update: the venue selector can emit several patches in quick succession.
  const patchEvent = (index: number, patch: Partial<OrderEvent>) => {
    setEvents((prev) => prev.map((ev, i) => (i === index ? { ...ev, ...patch } : ev)));
  };

  // Add Photos (No Fixed Photo Count)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    const mapped = newFiles.map((file) => ({
      file,
      category: selectedCategoryForUpload,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotoFiles((prev) => [...prev, ...mapped]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Coupon Application
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || enteredCouponCode).trim().toUpperCase();
    if (!targetCode) return;
    try {
      setValidatingCoupon(true);
      setCouponError(null);
      const res = await ApiService.validateCoupon(targetCode, basePrice, selectedOccasionId);
      if (res && res.is_valid) {
        setAppliedCouponData(res);
        setEnteredCouponCode(targetCode);
      } else {
        setCouponError(res?.message || 'Invalid coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Unable to apply coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponData(null);
    setEnteredCouponCode('');
    setCouponError(null);
  };

  // Submit Callback Request
  const handleSubmitCallback = async () => {
    const mobile = (callbackMobile || customerMobile).trim();
    if (!mobile) return;
    try {
      setCallbackLoading(true);
      await ApiService.requestCallback({
        customer_name: callbackName || customerName || 'Valued Customer',
        customer_mobile: mobile,
        preferred_callback_time: callbackTime,
        assistance_required: callbackReason,
      });
      setCallbackSubmitted(true);
    } catch (e: any) {
      alert('Unable to log callback right now. Please call us directly at +91 9880768222.');
    } finally {
      setCallbackLoading(false);
    }
  };

  // Final Order Submission
  const handleSubmitOrder = async () => {
    if (!customerName || !customerMobile) {
      setError('Please provide your name and mobile phone number.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Collect missing fields
      const missingFields: string[] = [];
      Object.entries(editableOcrFields).forEach(([k, item]) => {
        if (item.status === 'INFORMATION_MISSING' || item.needs_assistance) {
          missingFields.push(item.label || k);
        }
      });

      const payload = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_email: customerEmail || undefined,
        occasion_id: selectedOccasionId,
        package_id: selectedPackageId,
        selected_language: selectedLanguage.split(' ')[0],
        special_instructions: specialInstructions,
        include_video: includeVideo,
        has_physical_card: Boolean(hasPhysicalCard),
        physical_card_notes: hasPhysicalCard ? `${cardFiles.length} physical card file(s) attached` : 'Customer confirmed NO physical card',
        ocr_extracted_text: ocrResult?.raw_text || '',
        ocr_data_json: editableOcrFields,
        occasion_requirements_json: occasionData,
        missing_fields_json: missingFields,
        coupon_code: pricing.appliedCouponCode || undefined,
        events: events.map((ev) => {
          // Drop UI-only fields; the server re-resolves directory venues authoritatively.
          const {
            venue_is_verified: _v,
            venue_distance_km: _d,
            country_id: _c,
            state_id: _s,
            nearby_locality_id: _n,
            ...rest
          } = ev;
          return {
            ...rest,
            start_time: ev.start_time.length === 5 ? `${ev.start_time}:00` : ev.start_time,
          };
        }),
      };

      const res: any = await ApiService.submitOrder(payload);
      setOrderResult(res);

      // Upload physical card files
      if (hasPhysicalCard && cardFiles.length > 0) {
        for (let i = 0; i < cardFiles.length; i++) {
          try {
            await ApiService.uploadOrderAsset(res.order_reference, cardFiles[i], 'PHYSICAL_CARD_FRONT');
          } catch (e) {
            console.warn('Physical card upload error:', e);
          }
        }
      }

      // Upload all customer photos without limit
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          try {
            await ApiService.uploadOrderAsset(res.order_reference, photoFiles[i].file, photoFiles[i].category);
          } catch (e) {
            console.warn('Photo upload error:', e);
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

          <span className="editorial-kicker">REQUIREMENTS RECEIVED &bull; DEDICATED DESIGNER ASSIGNED</span>
          <h2 style={{ fontSize: '2.1rem', marginBottom: '0.75rem', color: 'var(--navy-deep)', fontFamily: 'var(--font-serif)' }}>
            Your Celebration Order is Confirmed!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginBottom: '1.75rem', lineHeight: 1.65 }}>
            Thank you, <strong>{customerName}</strong>! Our creative design team has received your celebration requirements. A dedicated TechMasters designer is now crafting your invitation drafts.
          </p>

          <div
            style={{
              background: '#FFFDF9',
              border: '2px dashed var(--gold-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-accent)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Your Unique Order Reference
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--burgundy-rich)', letterSpacing: '0.05em' }}>
              {orderResult.order_reference}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Save this reference number to check draft previews and track progress anytime.
            </div>
          </div>

          {/* Quotation Summary */}
          <div
            style={{
              background: 'var(--bg-champagne)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '2rem',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span>Base Order Price ({currentPackage?.name}):</span>
              <strong>₹{pricing.basePrice}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', marginBottom: '0.35rem' }}>
              <span>Applied Celebration Savings:</span>
              <strong>-₹{pricing.totalDiscount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '0.5rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-deep)' }}>
              <span>Amount Payable on Approval:</span>
              <span style={{ color: 'var(--burgundy-rich)' }}>₹{pricing.finalPayable}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
              * You do not need to pay now. Review your invitation preview first, approve it, and then complete payment.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => onOrderCreated(orderResult.order_reference)}
            >
              Track Order Status &rarr;
            </button>
            <button
              className="btn btn-outline"
              onClick={onCancel}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* Header Ribbon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="editorial-kicker">TECHMASTERS MANAGED DIGITAL INVITATION SERVICE</span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--navy-deep)', margin: '0.4rem 0 0.5rem', fontFamily: 'var(--font-serif)' }}>
            Create Your Digital Celebration Invitation
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Share your ceremony requirements and photos. Our professional creative team designs, crafts, and delivers your interactive celebration invitation.
          </p>
        </div>

        {/* Step Progress Stepper */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.5rem',
            background: '#FFFFFF',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            marginBottom: '2rem',
          }}
        >
          {[
            { num: 1, title: 'Occasion & Details' },
            { num: 2, title: 'Physical Card (Yes/No)' },
            { num: 3, title: 'Ceremonies & Wording' },
            { num: 4, title: 'Photos & Media' },
            { num: 5, title: 'Savings & Submit' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (step > s.num) setStep(s.num);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent ? 'var(--navy-deep)' : isCompleted ? '#F0FDF4' : '#F8FAFC',
                  color: isCurrent ? '#FFFFFF' : isCompleted ? '#166534' : '#64748B',
                  border: isCurrent ? '1px solid var(--navy-deep)' : isCompleted ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  cursor: isCompleted ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--gold-soft)' : isCompleted ? '#16A34A' : '#CBD5E1',
                    color: isCurrent ? '#0B1B3D' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <Check size={14} /> : s.num}
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            PROMINENT CUSTOMER ASSISTANCE RIBBON (Visible across all steps)
            ========================================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFDF7 0%, #FDF7EA 100%)',
            border: '1px solid rgba(184, 142, 62, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 10px rgba(184, 142, 62, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--burgundy-rich)', fontWeight: 700, fontSize: '0.95rem' }}>
              <HelpCircle size={18} color="var(--gold-primary)" />
              Need Help Creating Your Invitation? We're Here to Help!
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
              Not sure what details to enter? Have a printed card? Need help uploading photos? Our team can guide you and even help complete your requirements over a call.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="tel:+919880768222"
              className="btn btn-outline btn-sm"
              style={{ background: '#FFFFFF', borderColor: 'var(--gold-primary)', color: 'var(--burgundy-rich)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <PhoneCall size={13} /> Call 9880768222
            </a>
            <a
              href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20need%20help%20creating%20my%20digital%20invitation."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ background: '#25D366', color: '#FFFFFF', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <MessageCircle size={14} /> WhatsApp Us
            </a>
            <button
              type="button"
              className="btn btn-navy btn-sm"
              onClick={() => {
                setCallbackSubmitted(false);
                setShowCallbackModal(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <Phone size={13} /> Request Callback
            </button>
          </div>
        </div>

        {/* =========================================================================
            STEP 1: CHOOSE OCCASION, PACKAGE & HOST DETAILS
            ========================================================================= */}
        {step === 1 && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease-in' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>
              1. Choose Occasion &amp; Enter Host Information
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Select your milestone celebration and package tier. The requirements form will dynamically adapt.
            </p>

            {/* Occasion Selection Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Select Celebration Occasion</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {occasions.map((occ) => {
                  const isSelected = occ.id === selectedOccasionId;
                  return (
                    <div
                      key={occ.id}
                      onClick={() => {
                        setSelectedOccasionId(occ.id);
                        if (occ.packages.length > 0) setSelectedPackageId(occ.packages[0].id);
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--burgundy-rich)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--bg-champagne)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ fontSize: '0.92rem', color: isSelected ? 'var(--burgundy-rich)' : 'var(--navy-deep)', display: 'block' }}>
                        {occ.display_name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        From ₹{occ.packages[0]?.base_price_inr || '499'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Package Selection */}
            {currentOccasion && currentOccasion.packages.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Choose Package Tier</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {currentOccasion.packages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                          background: isSelected ? '#FFFDF9' : '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--navy-deep)' }}>{pkg.name}</strong>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--burgundy-rich)' }}>
                            ₹{pkg.base_price_inr}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Includes {pkg.included_revisions} revisions &bull; Interactive Web Card
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Contact Information */}
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Your Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Rajesh Patil / Sunita Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Mobile Number (WhatsApp Notifications) *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g., 9880768222"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., rajesh@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Invitation Language</label>
                <select
                  className="form-control"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {REGIONAL_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Video Invitation Add-on */}
            <div
              style={{
                background: '#FAF7F2',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <input
                type="checkbox"
                id="includeVideo"
                checked={includeVideo}
                onChange={(e) => setIncludeVideo(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--burgundy-rich)', cursor: 'pointer' }}
              />
              <label htmlFor="includeVideo" style={{ cursor: 'pointer', fontSize: '0.88rem', margin: 0 }}>
                <strong>Add Luxury Motion Video Invitation (+₹299)</strong>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Our motion specialist crafts a 45-second cinematic WhatsApp video with custom music &amp; animations.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!customerName || !customerMobile) {
                    setError('Please provide your name and mobile phone number.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Continue to Step 2 &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: PHYSICAL INVITATION CARD (MANDATORY YES / NO TOGGLE)
            ========================================================================= */}
        {step === 2 && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease-in' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>
              2. Do you already have a printed / physical invitation card?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              If you have printed cards, simply upload photos or scans. We will extract the ceremony text, dates, and venues automatically!
            </p>

            {/* MANDATORY YES / NO TOGGLE CONTROL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div
                onClick={() => setHasPhysicalCard(true)}
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: hasPhysicalCard === true ? '2px solid var(--burgundy-rich)' : '1px solid var(--border-subtle)',
                  background: hasPhysicalCard === true ? '#FFFDF9' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: hasPhysicalCard === true ? '0 4px 12px rgba(107, 23, 40, 0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💌</div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem' }}>
                  YES, I have an invitation card
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  Upload photos/scans of your card front, back, or ceremony inserts. We extract the details so you don't have to retype them.
                </p>
              </div>

              <div
                onClick={() => setHasPhysicalCard(false)}
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: hasPhysicalCard === false ? '2px solid var(--burgundy-rich)' : '1px solid var(--border-subtle)',
                  background: hasPhysicalCard === false ? '#FFFDF9' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: hasPhysicalCard === false ? '0 4px 12px rgba(107, 23, 40, 0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem' }}>
                  NO, I don't have an invitation card
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  No problem at all! Enter the details you know, and our team will guide you to complete any remaining information over a call.
                </p>
              </div>
            </div>

            {/* =====================================================================
                SECTION A: CUSTOMER SELECTED "YES" (Card Upload & OCR Extraction)
                ===================================================================== */}
            {hasPhysicalCard === true && (
              <div
                style={{
                  background: '#FAF7F2',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--navy-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Upload size={16} color="var(--burgundy-rich)" />
                      Upload Your Existing Invitation Card
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Upload card front, back, inserts, and ceremony cards (JPG, PNG, PDF). Multiple pages supported.
                    </p>
                  </div>

                  <input
                    ref={cardFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleCardFileSelect}
                  />

                  <button
                    type="button"
                    className="btn btn-gold btn-sm"
                    onClick={() => cardFileInputRef.current?.click()}
                    disabled={isExtractingOCR}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={14} /> Add Card Photo / Scan
                  </button>
                </div>

                {/* Uploaded Card Thumbnails */}
                {cardFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {cardFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <FileText size={14} color="var(--burgundy-rich)" />
                        <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCardFiles(cardFiles.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* OCR Progress Spinner */}
                {isExtractingOCR && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FFFFFF', borderRadius: 'var(--radius-xs)', marginBottom: '1rem' }}>
                    <RefreshCw size={24} className="spin" style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-deep)' }}>
                      Reading your invitation card...
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Extracting names, ceremony dates, Muhurtham timings, and venues.
                    </div>
                  </div>
                )}

                {/* OCR Extracted Information Form */}
                {ocrResult && !isExtractingOCR && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-xs)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--navy-deep)' }}>
                        Extracted Card Details ({ocrResult.found_count} Found &bull; {ocrResult.missing_count} Missing)
                      </strong>
                      <span className="badge badge-assigned" style={{ fontSize: '0.74rem' }}>
                        Completeness: {ocrResult.completeness_score}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Please review the extracted details below. You can correct any mistakes or mark missing fields for support assistance.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      {Object.entries(editableOcrFields).map(([key, item]) => {
                        const isFound = item.status === 'INFORMATION_FOUND';
                        return (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                {item.label}
                              </label>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  background: isFound ? '#DCFCE7' : '#FEF3C7',
                                  color: isFound ? '#166534' : '#92400E',
                                }}
                              >
                                {isFound ? 'Information Found' : 'Information Missing'}
                              </span>
                            </div>

                            <input
                              type="text"
                              className="form-control"
                              value={item.value}
                              placeholder={isFound ? '' : 'Enter if known or leave blank for support team'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditableOcrFields({
                                  ...editableOcrFields,
                                  [key]: {
                                    ...item,
                                    value: val,
                                    status: val ? 'INFORMATION_FOUND' : 'INFORMATION_MISSING',
                                  },
                                });
                                setOccasionData({ ...occasionData, [key]: val });
                              }}
                              style={{ height: '34px', fontSize: '0.84rem' }}
                            />

                            {!isFound && (
                              <label style={{ fontSize: '0.72rem', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', marginTop: '2px' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.needs_assistance)}
                                  onChange={(e) => {
                                    setEditableOcrFields({
                                      ...editableOcrFields,
                                      [key]: {
                                        ...item,
                                        needs_assistance: e.target.checked,
                                      },
                                    });
                                  }}
                                  style={{ accentColor: 'var(--gold-primary)' }}
                                />
                                I need assistance with this information
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                SECTION B: CUSTOMER SELECTED "NO" (Friendly Reassurance)
                ===================================================================== */}
            {hasPhysicalCard === false && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                <h3 style={{ fontSize: '1.1rem', color: '#166534', margin: '0 0 0.4rem' }}>
                  No physical invitation card? That's absolutely fine!
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#15803D', maxWidth: '640px', margin: '0 auto 1.25rem', lineHeight: 1.55 }}>
                  Simply share the details you know in the next step. Our dedicated TechMasters team will contact you to collect any additional information and help prepare your digital invitation.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowCallbackModal(true)}
                  style={{ background: '#FFFFFF', borderColor: '#16A34A', color: '#166534' }}
                >
                  <Phone size={13} style={{ marginRight: '5px' }} /> Speak with a TechMasters Specialist
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep(1)}
              >
                &larr; Back to Step 1
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (hasPhysicalCard === null) {
                    setError('Please select whether you have a physical invitation card.');
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
              >
                Continue to Ceremonies &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: OCCASION-SPECIFIC REQUIREMENTS & CEREMONIES
            ========================================================================= */}
        {step === 3 && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease-in' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>
              3. {currentOccasion?.display_name || 'Occasion'} Details &amp; Ceremony Schedule
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Enter the names, itinerary, and venue details. Don't worry if some details are pending—you can submit now and confirm later.
            </p>

            {/* Dynamic Occasion Fields */}
            {currentOccasion?.slug === 'birthday' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Birthday Person Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Aarav Sharma"
                    value={occasionData['birthday_person_name'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, birthday_person_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Turning Age / Milestone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 5th Birthday / Sweet 16 / 50th Jubilee"
                    value={occasionData['age'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Party Theme / Colors</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Little Prince Royale / Pastel Rainbow"
                    value={occasionData['party_theme'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, party_theme: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cake Cutting Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 07:00 PM"
                    value={occasionData['cake_cutting_time'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, cake_cutting_time: e.target.value })}
                  />
                </div>
              </div>
            ) : currentOccasion?.slug === 'naming-ceremony' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Baby's Name (or To Be Announced)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Ananya / To be revealed at ceremony"
                    value={occasionData['baby_name'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, baby_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parents' Names</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Rajesh & Sneha Patil"
                    value={occasionData['parents_names'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, parents_names: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grandparents' Names</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Shri Suresh & Smt. Shanta"
                    value={occasionData['grandparents_names'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, grandparents_names: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cradle Ceremony / Muhurtham Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 10:15 AM Auspicious Muhurtham"
                    value={occasionData['muhurtham_time'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, muhurtham_time: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              /* Wedding / Marriage Default */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Bride's Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Pooja Patil"
                    value={occasionData['bride_name'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, bride_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Groom's Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Rahul Deshmukh"
                    value={occasionData['groom_name'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, groom_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bride's Parents' Names</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Smt. Sunita & Shri Ramesh Patil"
                    value={occasionData['bride_parents'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, bride_parents: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Groom's Parents' Names</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Smt. Geetha & Shri Anand Deshmukh"
                    value={occasionData['groom_parents'] || ''}
                    onChange={(e) => setOccasionData({ ...occasionData, groom_parents: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Repeatable Ceremony Itinerary */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--navy-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Calendar size={16} color="var(--burgundy-rich)" />
                  Ceremony Events &amp; Venue Schedule
                </h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={addEvent}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={13} /> Add Another Ceremony
                </button>
              </div>

              {events.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-champagne)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--navy-deep)' }}>Ceremony #{idx + 1}</strong>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvent(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Event Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Muhurtham / Reception / Sangeet"
                        value={ev.event_title}
                        onChange={(e) => updateEvent(idx, 'event_title', e.target.value)}
                        style={{ height: '34px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={ev.event_date}
                        onChange={(e) => updateEvent(idx, 'event_date', e.target.value)}
                        style={{ height: '34px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Start Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        value={ev.start_time}
                        onChange={(e) => updateEvent(idx, 'start_time', e.target.value)}
                        style={{ height: '34px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <VenueSelector value={ev} onChange={(patch) => patchEvent(idx, patch)} />
                </div>
              ))}
            </div>

            {/* Special Instructions / Wording Notes */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Special Instructions / Custom Family Wording</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Share any special wording, shlokas, family blessings, or styling preferences..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep(2)}
              >
                &larr; Back to Physical Card
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(4)}
              >
                Continue to Photos &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: MULTIPLE PHOTO & ATTACHMENT UPLOADS (NO FIXED LIMIT)
            ========================================================================= */}
        {step === 4 && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease-in' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>
              4. Upload Photographs &amp; Media (No Fixed Limit)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Upload portrait photos, couple shots, family pictures, background music tracks, or family crest logos. You can select multiple files or add more anytime.
            </p>

            {/* Upload Category Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#FAF7F2',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-deep)' }}>
                Upload Category:
              </div>
              <select
                className="form-control"
                value={selectedCategoryForUpload}
                onChange={(e) => setSelectedCategoryForUpload(e.target.value)}
                style={{ width: 'auto', minWidth: '180px', height: '36px', fontSize: '0.85rem' }}
              >
                <option value="COUPLE_PHOTO">Couple / Portrait Photo</option>
                <option value="FAMILY_PHOTO">Family Photo</option>
                <option value="BACKGROUND_AUDIO">Background Audio / Music Track</option>
                <option value="LOGO_ASSET">Logo / Monogram</option>
                <option value="OTHER">Other Celebration Asset</option>
              </select>

              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,.pdf"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={() => photoInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '36px' }}
              >
                <Upload size={14} /> Choose Multiple Files
              </button>
            </div>

            {/* Photo Gallery Grid */}
            {photoFiles.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {photoFiles.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      background: '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ height: '110px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.file.type.startsWith('image/') ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <FileText size={32} color="var(--burgundy-rich)" />
                      )}
                    </div>
                    <div style={{ padding: '0.45rem', fontSize: '0.72rem' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {item.file.name}
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{item.category.replace(/_/g, ' ')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  marginBottom: '1.5rem',
                }}
              >
                <ImageIcon size={36} color="var(--gold-soft)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No photographs uploaded yet</div>
                <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                  Click "Choose Multiple Files" above to upload photos, or skip this step and send them later via WhatsApp.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep(3)}
              >
                &larr; Back to Ceremonies
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(5)}
              >
                Review &amp; Apply Savings &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: REVIEW REQUIREMENTS, APPLY SAVINGS (12% DEFAULT + COUPONS) & SUBMIT
            ========================================================================= */}
        {step === 5 && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.2s ease-in' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>
              5. Review Requirements &amp; Confirm Celebration Order
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Review your quotation with automatic savings. No upfront payment is required—pay only after approving your draft preview!
            </p>

            {/* Order Specification Summary Strip */}
            <div
              style={{
                background: 'var(--bg-champagne)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Customer / Host</span>
                  <strong>{customerName}</strong> ({customerMobile})
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Occasion &amp; Package</span>
                  <strong>{currentOccasion?.display_name}</strong> &bull; {currentPackage?.name}
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Ceremonies &amp; Venues</span>
                  <strong>{events.length} Ceremony Events</strong> ({events[0]?.venue_name})
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Uploaded Assets</span>
                  <strong>{photoFiles.length} Photos</strong> {hasPhysicalCard ? `&bull; ${cardFiles.length} Card Scans` : ''}
                </div>
              </div>
            </div>

            {/* =====================================================================
                SAVINGS & COUPON ENGINE SECTION (Requirement 8, 9, 10)
                ===================================================================== */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
                <Gift size={18} color="var(--burgundy-rich)" />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--navy-deep)', margin: 0 }}>
                  Celebration Savings &amp; Promotional Offers
                </h3>
              </div>

              {/* Automatic 12% Default Offer Banner */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Percent size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#166534', display: 'block' }}>
                    An automatic offer worth ₹{pricing.autoDiscount || defaultAutoSavings} has been applied to your order!
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#15803D' }}>
                    TechMasters Default 12% Celebration Offer &bull; You save ₹{pricing.autoDiscount || defaultAutoSavings} automatically.
                  </span>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Have an additional coupon code?</label>
                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Coupon Code (e.g., FESTIVE15)"
                    value={enteredCouponCode}
                    onChange={(e) => setEnteredCouponCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', height: '38px', fontSize: '0.88rem' }}
                  />
                  {appliedCouponData ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleRemoveCoupon}
                      style={{ color: 'var(--color-danger)', borderColor: '#FECACA' }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      onClick={() => handleApplyCoupon()}
                      disabled={validatingCoupon || !enteredCouponCode.trim()}
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  )}
                </div>

                {couponError && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {couponError}
                  </div>
                )}

                {appliedCouponData && (
                  <div style={{ color: '#16A34A', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600 }}>
                    ✓ {appliedCouponData.message}
                  </div>
                )}
              </div>

              {/* Public Available Offers Strip */}
              {publicCoupons.length > 0 && !appliedCouponData && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.45rem' }}>
                    Available Public Coupons (Click to Apply)
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {publicCoupons.filter((c) => !c.is_system_default_offer).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        style={{
                          background: '#FAF7F2',
                          border: '1px dashed var(--gold-primary)',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--burgundy-rich)',
                          fontWeight: 600,
                        }}
                      >
                        <Tag size={12} /> {c.code} ({c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quotation Breakdown Snapshot */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-deep)', textTransform: 'uppercase', margin: '0 0 1rem' }}>
                Quotation Snapshot (Preview-First Guarantee)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Order Price:</span>
                  <span>₹{pricing.basePrice}.00</span>
                </div>
                {includeVideo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <span>Included Motion Video Invitation Add-on:</span>
                    <span>+₹299.00</span>
                  </div>
                )}
                {pricing.autoDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                    <span>Automatic 12% Celebration Offer:</span>
                    <span>-₹{pricing.autoDiscount}.00</span>
                  </div>
                )}
                {pricing.couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                    <span>Coupon Savings ({pricing.appliedCouponCode}):</span>
                    <span>-₹{pricing.couponDiscount}.00</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #E2E8F0', paddingTop: '0.65rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-deep)' }}>
                  <span>Amount Payable on Approval:</span>
                  <span style={{ color: 'var(--burgundy-rich)' }}>₹{pricing.finalPayable}.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16A34A', fontWeight: 600 }}>
                  <span>Total Amount You Save:</span>
                  <span>₹{pricing.youSave}.00</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep(4)}
              >
                &larr; Back to Photos
              </button>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleSubmitOrder}
                disabled={submitting}
                style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700 }}
              >
                {submitting ? 'Registering Celebration Order...' : 'Confirm & Submit Order'}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            REQUEST A CALLBACK MODAL
            ========================================================================= */}
        {showCallbackModal && (
          <div className="modal-backdrop" onClick={() => setShowCallbackModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <PhoneCall size={17} color="var(--burgundy-rich)" />
                    Request a Free Specialist Callback
                  </h3>
                  <button
                    onClick={() => setShowCallbackModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={17} />
                  </button>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Our team can guide you or take down your requirements directly over a call.
                </p>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {callbackSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <CheckCircle2 size={42} color="#16A34A" style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-deep)', marginBottom: '0.35rem' }}>
                      Callback Request Confirmed!
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      A TechMasters invitation specialist will call you at <strong>{callbackMobile || customerMobile}</strong> ({callbackTime}).
                    </p>
                    <button
                      className="btn btn-navy btn-sm"
                      onClick={() => setShowCallbackModal(false)}
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Your Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Rajesh Patil"
                        value={callbackName || customerName}
                        onChange={(e) => setCallbackName(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g., 9880768222"
                        value={callbackMobile || customerMobile}
                        onChange={(e) => setCallbackMobile(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Preferred Callback Time</label>
                      <select
                        className="form-control"
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                      >
                        <option value="As soon as possible">As soon as possible (Immediate)</option>
                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">What do you need assistance with?</label>
                      <select
                        className="form-control"
                        value={callbackReason}
                        onChange={(e) => setCallbackReason(e.target.value)}
                      >
                        <option value="Help me fill out my invitation details">Help me fill out my invitation details</option>
                        <option value="Understanding invitation packages & options">Understanding invitation packages &amp; options</option>
                        <option value="Reading an existing printed invitation card">Reading an existing printed invitation card</option>
                        <option value="Assistance with photo & media uploads">Assistance with photo &amp; media uploads</option>
                        <option value="Questions regarding pricing and discounts">Questions regarding pricing and discounts</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowCallbackModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmitCallback}
                        disabled={callbackLoading || !(callbackMobile || customerMobile).trim()}
                      >
                        {callbackLoading ? 'Submitting...' : 'Submit Callback Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
