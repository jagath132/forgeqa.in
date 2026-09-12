import React, { useState } from 'react';
import { StatusBadge } from '../components/design-system/StatusBadge';
import { MetricCard } from '../components/design-system/MetricCard';
import { DataTable } from '../components/design-system/DataTable';
import type { TestCase } from '../contracts';
import {
  Layers,
  Palette,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Zap,
} from 'lucide-react';

export function DesignSystemPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sampleTestCases: TestCase[] = [
    {
      tcId: 'TC-101',
      category: 'Positive',
      summary: 'Authentication with valid credentials',
      testDescription: 'Ensure user can log in with valid email and password credentials.',
      testSteps: ['Navigate to /login', 'Enter valid credentials', 'Click submit button'],
      expected: 'User redirected to dashboard with valid session token',
      status: 'approved',
    },
    {
      tcId: 'TC-102',
      category: 'Negative',
      summary: 'Login failure with invalid password',
      testDescription: 'Ensure error state is displayed when incorrect password is provided.',
      testSteps: ['Navigate to /login', 'Enter invalid credentials', 'Click submit button'],
      expected: 'Display "Invalid credentials" toast banner',
      status: 'reviewed',
    },
    {
      tcId: 'TC-103',
      category: 'Validation',
      summary: 'Email syntax validation on registration',
      testDescription: 'Ensure invalid email format triggers immediate inline error message.',
      testSteps: ['Navigate to /register', 'Enter "bad-email"', 'Blur input field'],
      expected: 'Show "Please enter a valid email address"',
      status: 'draft',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Layers className="w-4 h-4" />
            ForgeQA Design System
          </div>
          <h1 className="text-3xl font-bold font-display text-[var(--text-primary)]">
            Component Showcase & Canonical Tokens
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Standardized UI components, status pills, metrics, and canonical color palette.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label="Instrument Sans" variant="primary" pulse />
          <StatusBadge label="v2.0 Active" variant="success" />
        </div>
      </div>

      {/* Palette Tokens */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--color-accent)]" />
          Canonical Palette
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Canvas', hex: '#F7F9FC', bg: '#F7F9FC', text: '#0F172A', border: true },
            { label: 'Card / Surface', hex: '#FFFFFF', bg: '#FFFFFF', text: '#0F172A', border: true },
            { label: 'Indigo Brand', hex: '#4F46E5', bg: '#4F46E5', text: '#FFFFFF' },
            { label: 'Indigo Light', hex: '#EEF2FF', bg: '#EEF2FF', text: '#4F46E5', border: true },
            { label: 'Slate Dark', hex: '#0F172A', bg: '#0F172A', text: '#FFFFFF' },
            { label: 'Slate Muted', hex: '#64748B', bg: '#64748B', text: '#FFFFFF' },
            { label: 'Emerald Green', hex: '#10B981', bg: '#10B981', text: '#FFFFFF' },
            { label: 'Amber Warm', hex: '#F59E0B', bg: '#F59E0B', text: '#FFFFFF' },
          ].map((c) => (
            <div
              key={c.label}
              className="p-3 rounded-xl shadow-xs"
              style={{
                backgroundColor: c.bg,
                color: c.text,
                border: c.border ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div className="text-xs font-semibold">{c.label}</div>
              <div className="text-[11px] font-mono opacity-80 mt-1">{c.hex}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
          Metrics & KPI Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Test Cases"
            value="1,420"
            sublabel="Active repository"
            delta={{ text: '+12% this week', positive: true }}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            variant="default"
          />
          <MetricCard
            label="Regression Pass Rate"
            value="98.4%"
            sublabel="Last 24 runs"
            delta={{ text: '+0.6% vs target', positive: true }}
            icon={<Shield className="w-5 h-5 text-[var(--color-accent)]" />}
            variant="accent"
          />
          <MetricCard
            label="Open Defects"
            value="7"
            sublabel="2 critical severity"
            delta={{ text: '-3 resolved today', positive: true }}
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            variant="warning"
          />
          <MetricCard
            label="AI Execution Speed"
            value="1.2s"
            sublabel="RAG context retrieval"
            delta={{ text: 'Ultra-low latency', positive: true }}
            icon={<Zap className="w-5 h-5 text-purple-500" />}
            variant="success"
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--color-accent)]" />
          Status Badges & Pills
        </h2>
        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
          <StatusBadge label="Approved" variant="success" pulse />
          <StatusBadge label="In Review" variant="warning" />
          <StatusBadge label="Critical Bug" variant="danger" pulse />
          <StatusBadge label="Draft" variant="default" />
          <StatusBadge label="AI Provider Active" variant="primary" pulse />
          <StatusBadge label="Streaming Phase" variant="cyan" />
          <StatusBadge label="Regression Suite" variant="violet" />
        </div>
      </div>

      {/* Data Table Showcase */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--color-accent)]" />
          Interactive Data Table
        </h2>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
          <DataTable
            testCases={sampleTestCases}
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryCounts={{ all: 3, positive: 1, negative: 1, edge: 0, validation: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
