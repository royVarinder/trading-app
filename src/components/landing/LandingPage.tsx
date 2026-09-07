"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MailIcon, MenuIcon, PhoneIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Trading" },
  { href: "#testimonials", label: "Testimonials" },
];

// Generic placeholder wordmarks for the "trusted by" strip — the source
// template used real third-party logos (DocuSign, ChartMogul, etc.) here,
// which would falsely imply those companies use/endorse PRIMEFX, so this
// swaps them for made-up placeholder names instead.
const PARTNER_WORDMARKS = ["Northbridge", "Solace Capital", "Vantage Group", "Larkspur & Co."];

const SERVICES = [
  {
    highlight: "Copy",
    name: "Copy Trading",
    description:
      "Mirror the live positions of experienced, verified traders in real time. Your results move with theirs — gains and losses included — so you always know exactly what you're exposed to.",
    image: "/fincept/media/services/img-1.png",
  },
  {
    name: "Leverage Trading",
    highlight: "Leverage",
    description:
      "Trade major and minor currency pairs with up to 4x leverage. Amplify your market exposure while managing risk with built-in stop-loss and take-profit tools on every position.",
    image: "/fincept/media/services/img-2.png",
  },
  {
    name: "Market Education",
    highlight: "Market",
    description:
      "Access webinars, market analysis, and a growing library of trading guides. Learn risk management and technical analysis from real practitioners, at your own pace.",
    image: "/fincept/media/services/img-3.png",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "PRIMEFX’s copy trading feature let me see exactly what I was mirroring before committing a single dollar. The transparency is what kept me around.",
    name: "Daniel Cho",
    role: "Retail Forex Trader",
  },
  {
    quote:
      "The market education library helped me understand leverage and risk before I started trading, not after I’d already learned the hard way.",
    name: "Amara Obi",
    role: "Part-Time Trader",
  },
  {
    quote:
      "Execution is fast and the platform never hides my open risk. I always know my exposure before the market moves.",
    name: "Marcus Feldman",
    role: "Full-Time Trader",
  },
  {
    quote:
      "Support actually answers when the market is moving at 2am. That alone puts PRIMEFX ahead of every other platform I’ve used.",
    name: "Priya Nair",
    role: "Active Trader",
  },
];

function ArrowUpRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 30L30 10M30 10H16.6667M30 10V23.3333"
        stroke="var(--fincept-green-light)"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SocialIcon({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div id="top" className="fincept fincept-bg-image min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(12,12,13,0.8)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-2">
            <Image src="/primeLogo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full" priority />
            <span className="font-hanken text-lg font-bold tracking-wide">PRIMEFX</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[color:var(--fincept-text-muted)] lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-[color:var(--fincept-text)]">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="fincept-btn-outline">
              Log In
            </Link>
            <Link href="/signup" className="fincept-btn !w-auto px-6">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-full border border-white/10 p-2 text-[color:var(--fincept-text)] lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav overlay — rendered as a sibling of <header>, not nested
          inside it. Chromium treats `backdrop-filter` (Tailwind's
          `backdrop-blur`, used on the header for its scroll backdrop) as
          establishing a containing block for `position: fixed` descendants,
          the same way `filter`/`transform` do. Nested here, this panel's
          `fixed inset-0` was resolving against the ~70px-tall sticky header
          box instead of the viewport — full width, but only as tall as the
          header, so everything below that strip was transparent. */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0c0c0d] lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <Image src="/primeLogo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
              <span className="font-hanken text-base font-bold tracking-wide">PRIMEFX</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="rounded-full border border-white/10 p-2 text-[color:var(--fincept-text)]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col items-center gap-6 px-5 py-10 text-lg font-medium">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileNavOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setMobileNavOpen(false)} className="fincept-btn-outline mt-4 w-full max-w-xs">
              Log In
            </Link>
            <Link href="/signup" onClick={() => setMobileNavOpen(false)} className="fincept-btn w-full max-w-xs">
              Get Started
            </Link>
          </nav>
        </div>
      )}

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
        <Image
          src="/fincept/media/hero/left-shape.png"
          alt=""
          width={290}
          height={522}
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-10 hidden w-[220px] opacity-90 md:block lg:w-[280px]"
        />
        <Image
          src="/fincept/media/hero/right-shape.png"
          alt=""
          width={290}
          height={522}
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-10 hidden w-[220px] opacity-90 md:block lg:w-[280px]"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <ArrowUpRightIcon className="h-8 w-8 shrink-0" />
            <p className="text-lg font-medium text-[color:var(--fincept-green-light)]">Trade Global Forex Markets</p>
          </div>

          <h1 className="text-5xl leading-[1.05] font-extrabold sm:text-6xl md:text-7xl">
            Trade Forex <span className="fincept-gradient-text">Smarter</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base text-[color:var(--fincept-text)] sm:text-lg">
            Access global currency markets with up to 4x leverage, professional copy-trading strategies, and
            transparent risk management — trade on your terms, backed by real market data.
          </p>

          <Link href="/signup" className="fincept-btn mt-10 !w-auto px-8 py-3.5">
            Get Started
          </Link>

          <div className="mx-auto mt-14 flex max-w-xs items-center justify-center gap-4 rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-5">
            <p className="font-hanken text-3xl font-bold text-[color:var(--fincept-green-light)]">4.7+</p>
            <h2 className="text-left text-lg font-semibold">
              Rated by 40k+
              <br />
              Traders
            </h2>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-12 text-center text-xl font-semibold sm:text-2xl">
          Backed by trusted <br className="sm:hidden" />
          <span className="fincept-gradient-text">market partners</span>
        </h2>
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-[marquee_22s_linear_infinite] items-center gap-16 opacity-60">
            {[...Array(2)].map((_, loop) => (
              <div key={loop} className="flex items-center gap-16">
                {PARTNER_WORDMARKS.map((name) => (
                  <span
                    key={`${loop}-${name}`}
                    className="font-hanken text-xl font-bold tracking-wide text-[color:var(--fincept-text)] whitespace-nowrap"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expenses / chart */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="fincept-card p-6 sm:p-10">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                TRACK YOUR <span className="fincept-gradient-text">Trading</span> PERFORMANCE
              </h2>
              <p className="text-[color:var(--fincept-text-muted)]">
                Monitor your open positions, closed trades, and portfolio performance in real time — all from one
                clean, intuitive dashboard built for active forex traders.
              </p>
            </div>
            <h2 className="shrink-0 text-3xl font-bold sm:text-4xl">
              <span className="fincept-gradient-text">3K+</span> <br />
              Active Traders
            </h2>
          </div>

          <Image
            src="/fincept/media/images/chart.png"
            alt="Trading performance chart"
            width={2682}
            height={816}
            className="mb-6 w-full rounded-2xl"
          />

          <div className="flex items-center justify-center gap-8 text-sm text-[color:var(--fincept-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--fincept-text)]" />
              This Week
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--fincept-green-muted)]" />
              Last Week
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-16 text-center text-3xl font-bold uppercase sm:text-4xl">
          Trade the Markets with <span className="fincept-gradient-text">PRIMEFX</span>
        </h2>

        <div className="space-y-8">
          {SERVICES.map((service, i) => (
            <div
              key={service.name}
              className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "" : ""}`}
            >
              <div className={`fincept-card flex flex-col gap-6 p-8 sm:p-10 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <p className="text-2xl font-bold">
                  <span className="text-[color:var(--fincept-green-light)]">{service.highlight}</span>{" "}
                  {service.name.replace(service.highlight, "").trim()}
                </p>
                <p className="text-[color:var(--fincept-text-muted)]">{service.description}</p>
                <Link href="/signup" className="fincept-btn !w-auto self-start px-6">
                  Learn More
                </Link>
              </div>
              <div className={`overflow-hidden rounded-3xl ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <Image
                  src={service.image}
                  alt={service.name}
                  width={705}
                  height={458}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / progress */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src="/fincept/media/images/shape-1.png"
              alt="Traders using the PRIMEFX platform"
              width={708}
              height={492}
              className="w-full"
            />
            <div className="absolute left-6 top-6 rounded-2xl bg-[rgba(12,12,13,0.8)] px-5 py-4 backdrop-blur">
              <p className="text-2xl font-bold">4x</p>
              <p className="text-sm font-semibold text-[color:var(--fincept-text-muted)]">Max Leverage</p>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Join a Growing <span className="fincept-gradient-text">Global Trading</span> Community
            </h2>
            <div className="flex -space-x-3">
              {["user-1", "user-2", "user-3", "user-4"].map((u) => (
                <Image
                  key={u}
                  src={`/fincept/media/user/${u}.png`}
                  alt="Member avatar"
                  width={68}
                  height={68}
                  className="h-12 w-12 rounded-full border-2 border-[color:var(--fincept-bg)] object-cover"
                />
              ))}
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[color:var(--fincept-bg)] bg-[color:var(--fincept-green)] text-xs font-bold text-[#0c0c0d]">
                +
              </span>
            </div>
          </div>
        </div>

        <div className="fincept-card mt-10 grid gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
              Execution <span className="text-[color:var(--fincept-green-light)]">Built</span> for Active Traders
            </h3>
            <p className="text-[color:var(--fincept-text-muted)]">
              Every order runs through infrastructure designed for speed and reliability, so the price you see is the
              price you get — no surprises when the market is moving fast.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { label: "Order Execution Speed", value: 92 },
              { label: "Platform Uptime", value: 99 },
              { label: "Client Satisfaction", value: 88 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[color:var(--fincept-green)] to-[color:var(--fincept-green-light)]"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-16 text-center text-3xl font-bold uppercase sm:text-4xl">What Our Traders Say</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div key={t.name + t.role} className="fincept-card p-8">
              <p className="mb-6 text-[color:var(--fincept-text)]">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-[color:var(--fincept-text-muted)]">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="fincept-card flex flex-col items-center gap-6 p-10 text-center sm:p-16">
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Ready to <span className="fincept-gradient-text">Trade Forex</span> With PRIMEFX?
          </h2>
          <p className="max-w-xl text-[color:var(--fincept-text-muted)]">
            Open your account in minutes and get access to copy trading, up to 4x leverage, and real-time market
            tools.
          </p>
          <Link href="/signup" className="fincept-btn !w-auto px-8 py-3.5">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[color:var(--fincept-bg-soft)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-5 flex items-center gap-2">
                <Image src="/primeLogo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
                <span className="font-hanken text-base font-bold tracking-wide">PRIMEFX</span>
              </div>
              <p className="mb-6 max-w-xs text-sm text-[color:var(--fincept-text-muted)]">
                PRIMEFX gives traders access to global forex markets with real-time execution, professional
                copy-trading strategies, and up to 4x leverage &mdash; trade with transparent risk management.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { label: "Twitter", path: "M20 5.8a7.6 7.6 0 0 1-2.2.6 3.8 3.8 0 0 0 1.7-2.1 7.6 7.6 0 0 1-2.4.9 3.8 3.8 0 0 0-6.5 3.5A10.8 10.8 0 0 1 3 4.9a3.8 3.8 0 0 0 1.2 5.1 3.8 3.8 0 0 1-1.7-.5v.1a3.8 3.8 0 0 0 3 3.7 3.8 3.8 0 0 1-1.7.1 3.8 3.8 0 0 0 3.5 2.6A7.6 7.6 0 0 1 2 17.4a10.8 10.8 0 0 0 5.8 1.7c7 0 10.8-5.8 10.8-10.8v-.5A7.7 7.7 0 0 0 20 5.8Z" },
                  { label: "Facebook", path: "M14 8.5h2V5.6h-2c-2 0-3.5 1.6-3.5 3.5v1.7H8.5V13.5H10.5V20h2.9V13.5h2l.6-2.7h-2.6V9.1c0-.4.3-.6.6-.6Z" },
                  { label: "Instagram", path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm4.9-1.8a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" },
                  { label: "LinkedIn", path: "M4.5 8.5h3v11h-3v-11ZM6 3.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM10.5 8.5h2.9v1.5h.04c.4-.76 1.4-1.56 2.86-1.56 3.06 0 3.6 2 3.6 4.6v6.46h-3V14c0-1.35-.03-3.1-1.9-3.1-1.9 0-2.2 1.5-2.2 3v5.6h-3v-11Z" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#top"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[color:var(--fincept-text-muted)] transition-colors hover:border-[color:var(--fincept-green)] hover:text-[color:var(--fincept-green-light)]"
                  >
                    <SocialIcon path={s.path} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
                Explore
              </h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#top" className="hover:text-[color:var(--fincept-green-light)]">Home</a></li>
                <li><a href="#services" className="hover:text-[color:var(--fincept-green-light)]">Trading</a></li>
                <li><a href="#testimonials" className="hover:text-[color:var(--fincept-green-light)]">Testimonials</a></li>
                <li><Link href="/login" className="hover:text-[color:var(--fincept-green-light)]">Log In</Link></li>
                <li><Link href="/signup" className="hover:text-[color:var(--fincept-green-light)]">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
                Trading
              </h3>
              <ul className="space-y-3 text-sm text-[color:var(--fincept-text-muted)]">
                <li>Copy Trading</li>
                <li>Leverage Trading</li>
                <li>Market Education</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
                Contact
              </h3>
              <ul className="space-y-3 text-sm text-[color:var(--fincept-text-muted)]">
                <li className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 shrink-0" /> +12 123 123 456
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 shrink-0" /> contact@finance.com
                </li>
                <li>25 Susan Street London</li>
              </ul>
            </div>
          </div>

          <div className="mt-14 space-y-3 border-t border-white/5 pt-8 text-center text-xs text-[color:var(--fincept-text-muted)]">
            <p className="mx-auto max-w-2xl">
              Trading forex and CFDs involves significant risk and may result in losses exceeding your deposit. Past
              performance is not indicative of future results.
            </p>
            <p>&copy;2026 All Rights Reserved By PRIMEFX</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
