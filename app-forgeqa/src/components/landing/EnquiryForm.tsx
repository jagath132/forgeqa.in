import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Mail, MessageSquare, ArrowRight, User, Phone, Building, Send } from "lucide-react";

const SUBJECTS = [
  "General Inquiry",
  "Sales",
  "Enterprise Plan",
  "Technical Support",
  "Partnership",
  "Other",
];

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}

export default function EnquiryForm() {
  const [form, setForm] = useState<FormData>({
    name: "", email: "", company: "", phone: "", subject: "General Inquiry", message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => {
      setSent(false);
      setForm({ name: "", email: "", company: "", phone: "", subject: "General Inquiry", message: "" });
    }, 10000);
    return () => clearTimeout(timer);
  }, [sent]);

  const validate = useCallback(() => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.trim().length < 10) errs.message = "Message must be at least 10 characters";
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
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "62dd773d-d156-48a6-baa0-8264963687ee",
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        }),
      });
    } catch { /* ignore */ }
    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <section className="py-20 lg:py-28" style={{ background: "var(--landing-bg)" }} id="enquiry">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl mx-auto mb-6" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Check className="w-10 h-10" style={{ color: "var(--neon-blue)" }} />
            </div>
            <h3 className="text-2xl font-bold" style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk', sans-serif" }}>Message Sent Successfully!</h3>
            <p className="mt-3 text-base max-w-md mx-auto" style={{ color: "var(--landing-text-secondary)" }}>
              Thank you for reaching out. Our team will review your inquiry and respond within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="enquiry" className="py-20 lg:py-28" style={{ background: "var(--landing-bg)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="hero-badge mb-4">
              <MessageSquare className="w-3 h-3" /> Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk', 'Inter', sans-serif", lineHeight: 1.2 }}>
              Let&apos;s start a conversation
            </h2>
            <p className="mt-4 text-base max-w-lg leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>
              Whether you have a question about features, pricing, or anything else — our team is ready to answer all your questions.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Mail className="w-5 h-5" style={{ color: "var(--neon-blue)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--landing-text)" }}>Email us</p>
                  <p className="text-sm" style={{ color: "var(--landing-text-secondary)" }}>hello@forgeqa.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Phone className="w-5 h-5" style={{ color: "var(--neon-blue)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--landing-text)" }}>Call us</p>
                  <p className="text-sm" style={{ color: "var(--landing-text-secondary)" }}>+1 (555) 000-0000</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Building className="w-5 h-5" style={{ color: "var(--neon-blue)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--landing-text)" }}>Visit us</p>
                  <p className="text-sm" style={{ color: "var(--landing-text-secondary)" }}>San Francisco, CA</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--landing-glass-border)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }} noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <InputField
                  label="Full Name"
                  icon={User}
                  value={form.name}
                  onChange={(v) => handleChange("name", v)}
                  placeholder="John Doe"
                  error={errors.name}
                />
                <InputField
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                  placeholder="you@company.com"
                  error={errors.email}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <InputField
                  label="Company"
                  icon={Building}
                  value={form.company}
                  onChange={(v) => handleChange("company", v)}
                  placeholder="Acme Inc."
                />
                <InputField
                  label="Phone"
                  icon={Phone}
                  type="tel"
                  value={form.phone}
                  onChange={(v) => handleChange("phone", v)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="mt-5">
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: "var(--landing-text-secondary)" }}>
                  <MessageSquare className="w-3 h-3" />
                  Subject
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    color: "var(--landing-text)",
                    background: "var(--landing-bg)",
                    border: "1px solid var(--landing-glass-border)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--neon-blue)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--landing-glass-border)"; }}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <InputField
                  label="Message"
                  icon={MessageSquare}
                  value={form.message}
                  onChange={(v) => handleChange("message", v)}
                  placeholder="Tell us about your testing requirements..."
                  error={errors.message}
                  textarea
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="mt-6 w-full py-3.5 text-sm font-semibold rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)"; }}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function InputField({
  label, icon: Icon, value, onChange, placeholder, error, type = "text", textarea = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
  textarea?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "var(--neon-rose)" : focused ? "var(--neon-blue)" : "var(--landing-glass-border)";

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: error ? "var(--neon-rose)" : "var(--landing-text-secondary)" }}>
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all resize-y"
          style={{
            color: "var(--landing-text)",
            background: "var(--landing-bg)",
            border: `1px solid ${borderColor}`,
            minHeight: 100,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full text-sm outline-none px-4 py-3 rounded-xl transition-all"
          style={{
            color: "var(--landing-text)",
            background: "var(--landing-bg)",
            border: `1px solid ${borderColor}`,
          }}
        />
      )}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5" style={{ color: "var(--neon-rose)" }}>
          {error}
        </motion.p>
      )}
    </div>
  );
}
