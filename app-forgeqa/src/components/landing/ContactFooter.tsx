import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, MessageSquare, Send, User, Phone, ArrowRight } from 'lucide-react';

const SUBJECTS = [
  'General Inquiry',
  'Sales',
  'Enterprise Plan',
  'Technical Support',
  'Partnership',
  'Other',
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: 'GitHub', icon: GithubIcon, href: '#' },
  { label: 'LinkedIn', icon: LinkedinIcon, href: '#' },
  { label: 'Email', icon: MailIcon, href: 'mailto:hello@forgeqa.com' },
];

export default function ContactFooter() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    }, 10000);
    return () => clearTimeout(timer);
  }, [sent]);

  const validate = useCallback(() => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 10)
      errs.message = 'Message must be at least 10 characters';
    return errs;
  }, [form]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '62dd773d-d156-48a6-baa0-8264963687ee',
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        }),
      });
    } catch {
      /* ignore */
    }
    setSent(true);
    setSending(false);
  }

  return (
    <footer id="contact" style={{ background: 'var(--landing-bg)' }}>
      {/* Contact Form Section */}
      <div className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="hero-badge mb-4">
              <MessageSquare className="w-3 h-3" /> Get in Touch
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold mt-4"
              style={{
                color: 'var(--landing-text)',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              }}
            >
              Let&apos;s start a conversation
            </h2>
            <p
              className="mt-3 text-base max-w-lg mx-auto"
              style={{ color: 'var(--landing-text-secondary)' }}
            >
              Have a question or want to work together? Fill out the form below and we&apos;ll get
              back to you shortly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {sent ? (
              <div
                className="p-10 rounded-3xl text-center"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--landing-glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  <Check className="w-8 h-8" style={{ color: '#22C55E' }} />
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{
                    color: 'var(--landing-text)',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Message Sent!
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--landing-text-secondary)' }}>
                  Thank you for reaching out. We&apos;ll respond within 24 hours.
                </p>
              </div>
            ) : (
              <div
                className="p-8 sm:p-10 rounded-3xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--landing-glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                }}
              >
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                        style={{
                          color: errors.name ? 'var(--neon-rose)' : 'var(--landing-text-secondary)',
                        }}
                      >
                        <User className="w-3.5 h-3.5" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all"
                        style={{
                          color: 'var(--landing-text)',
                          background: 'var(--landing-bg)',
                          border: errors.name
                            ? '1.5px solid var(--neon-rose)'
                            : '1.5px solid var(--landing-glass-border)',
                        }}
                        onFocus={(e) => {
                          if (!errors.name) e.target.style.borderColor = 'var(--neon-blue)';
                        }}
                        onBlur={(e) => {
                          if (!errors.name)
                            e.target.style.borderColor = 'var(--landing-glass-border)';
                        }}
                      />
                      {errors.name && (
                        <p className="text-xs mt-1.5" style={{ color: 'var(--neon-rose)' }}>
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                        style={{
                          color: errors.email
                            ? 'var(--neon-rose)'
                            : 'var(--landing-text-secondary)',
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="you@company.com"
                        className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all"
                        style={{
                          color: 'var(--landing-text)',
                          background: 'var(--landing-bg)',
                          border: errors.email
                            ? '1.5px solid var(--neon-rose)'
                            : '1.5px solid var(--landing-glass-border)',
                        }}
                        onFocus={(e) => {
                          if (!errors.email) e.target.style.borderColor = 'var(--neon-blue)';
                        }}
                        onBlur={(e) => {
                          if (!errors.email)
                            e.target.style.borderColor = 'var(--landing-glass-border)';
                        }}
                      />
                      {errors.email && (
                        <p className="text-xs mt-1.5" style={{ color: 'var(--neon-rose)' }}>
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                        style={{ color: 'var(--landing-text-secondary)' }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all"
                        style={{
                          color: 'var(--landing-text)',
                          background: 'var(--landing-bg)',
                          border: '1.5px solid var(--landing-glass-border)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--neon-blue)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--landing-glass-border)';
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                        style={{ color: 'var(--landing-text-secondary)' }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Subject
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all cursor-pointer"
                        style={{
                          color: 'var(--landing-text)',
                          background: 'var(--landing-bg)',
                          border: '1.5px solid var(--landing-glass-border)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--neon-blue)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--landing-glass-border)';
                        }}
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                      style={{
                        color: errors.message
                          ? 'var(--neon-rose)'
                          : 'var(--landing-text-secondary)',
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="Tell us about your testing requirements..."
                      className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all resize-y"
                      style={{
                        color: 'var(--landing-text)',
                        background: 'var(--landing-bg)',
                        border: errors.message
                          ? '1.5px solid var(--neon-rose)'
                          : '1.5px solid var(--landing-glass-border)',
                        minHeight: 120,
                      }}
                      onFocus={(e) => {
                        if (!errors.message) e.target.style.borderColor = 'var(--neon-blue)';
                      }}
                      onBlur={(e) => {
                        if (!errors.message)
                          e.target.style.borderColor = 'var(--landing-glass-border)';
                      }}
                    />
                    {errors.message && (
                      <p className="text-xs mt-1.5" style={{ color: 'var(--neon-rose)' }}>
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 text-sm font-semibold rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'var(--color-surface)',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(37, 99, 235, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        Send Message <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--landing-glass-border)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo + Description */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 mb-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 32,
                    height: 32,
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <span
                    className="text-white font-bold text-xs"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    F
                  </span>
                </div>
                <span
                  style={{
                    color: 'var(--landing-text)',
                    fontFamily: "'Space Grotesk','Inter',sans-serif",
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Forge<span style={{ color: 'var(--neon-blue)' }}>QA</span>
                </span>
              </div>
              <p className="text-xs max-w-xs" style={{ color: 'var(--landing-text-muted)' }}>
                AI-powered test automation for modern teams.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                    style={{
                      color: 'var(--landing-text-muted)',
                      border: '1px solid var(--landing-glass-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--neon-blue)';
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--landing-text-muted)';
                      e.currentTarget.style.borderColor = 'var(--landing-glass-border)';
                    }}
                    aria-label={s.label}
                  >
                    <Icon />
                    <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                  </a>
                );
              })}
            </div>

            {/* Bottom Links */}
            <div
              className="flex items-center gap-4 text-xs"
              style={{ color: 'var(--landing-text-muted)' }}
            >
              <span>&copy; {new Date().getFullYear()} ForgeQA</span>
              <a
                href="#"
                className="no-underline transition-colors hover:text-[var(--neon-blue)]"
                style={{ color: 'inherit' }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="no-underline transition-colors hover:text-[var(--neon-blue)]"
                style={{ color: 'inherit' }}
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
