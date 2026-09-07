"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MailIcon, MenuIcon, PhoneIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
];

// Generic placeholder wordmarks for the "trusted by" strip — the source
// template used real third-party logos (DocuSign, ChartMogul, etc.) here,
// which would falsely imply those companies use/endorse PRIMEFX, so this
// swaps them for made-up placeholder names instead.
const PARTNER_WORDMARKS = ["Northbridge", "Solace Capital", "Vantage Group", "Larkspur & Co."];

const SERVICES = [
  {
    highlight: "Investment",
    name: "Investment Planning",
    description:
      "Ut eius quae sed. Quibusdam id minus nihil repellendus. Consequatur est est modi magnam et ab sapiente. Doloremque officia a tempora. Cumque ratione optio deserunt voluptates quasi.",
    image: "/fincept/media/services/img-1.png",
  },
  {
    name: "Retirement Strategy",
    highlight: "Retirement",
    description:
      "Ut eius quae sed. Quibusdam id minus nihil repellendus. Consequatur est est modi magnam et ab sapiente. Doloremque officia a tempora. Cumque ratione optio deserunt voluptates quasi.",
    image: "/fincept/media/services/img-2.png",
  },
  {
    name: "Tax Optimization",
    highlight: "Tax",
    description:
      "Ut eius quae sed. Quibusdam id minus nihil repellendus. Consequatur est est modi magnam et ab sapiente. Doloremque officia a tempora. Cumque ratione optio deserunt voluptates quasi.",
    image: "/fincept/media/services/img-3.png",
  },
];

const PRICING_PLANS = [
  {
    name: "Basic Plan",
    description: "Numerous businesses looking to improve their web efficiency.",
    price: "$30",
    features: [
      "Exclusive 24/7 support access.",
      "24/7 financial help.",
      "Tailored investment plans.",
      "In-depth portfolio review.",
      "Priority assistance",
    ],
    featured: false,
  },
  {
    name: "Economy Plan",
    description: "Many companies aiming to enhance their online performance.",
    price: "$55",
    features: [
      "Premium support anytime.",
      "24/7 financial help.",
      "Custom investment strategies.",
      "Experience priority support",
      "Thorough portfolio analysis.",
    ],
    featured: true,
  },
  {
    name: "Premium Plan",
    description: "A variety of organizations seeking to optimize their web results.",
    price: "$90",
    features: [
      "White-glove 24/7 support.",
      "24/7 financial help.",
      "Dedicated investment advisor.",
      "Quarterly portfolio review.",
      "Top priority assistance",
    ],
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "PRIMEFX transformed the way we manage our company’s finances. From tracking expenses to forecasting it’s all just seamless now.",
    name: "Samantha Lin",
    role: "CFO at Ledgerline Group",
  },
  {
    quote:
      "We were drowning in spreadsheets. PRIMEFX gave us structure, insights, and peace of mind. It’s like having a full finance team on autopilot.",
    name: "Michelle Okafor",
    role: "Founder at Finverse AI",
  },
  {
    quote:
      "In just 90 days, we improved our tax efficiency by 27%. The reporting dashboards are intuitive and helped our team make smarter decisions faster.",
    name: "Andre Vasquez",
    role: "Director of Finance, Logistics",
  },
  {
    quote:
      "PRIMEFX transformed the way we manage our company’s finances. From tracking expenses to forecasting it’s all just seamless now.",
    name: "Priya Nair",
    role: "Head of Ops, Solvex Capital",
  },
];

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 30" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 5C4.47715 5 0 9.47715 0 15C0 20.5228 4.47715 25 10 25C15.5228 25 20 20.5228 20 15C19.9936 9.47982 15.5202 5.00643 10 5Z"
        fill="var(--fincept-green-light)"
      />
      <path
        d="M15.2819 11.3571L9.57777 19.0979C9.44174 19.2784 9.23888 19.3966 9.01479 19.4261C8.7907 19.4556 8.56418 19.3938 8.38611 19.2546L4.31277 15.9979C3.95333 15.7102 3.89513 15.1857 4.18277 14.8262C4.47042 14.4668 4.995 14.4086 5.35444 14.6962L8.75111 17.4137L13.9403 10.3712C14.1104 10.1159 14.4072 9.97471 14.7126 10.0038C15.0181 10.0328 15.2829 10.2274 15.4019 10.5102C15.5209 10.793 15.4748 11.1184 15.2819 11.3571Z"
        fill="#0C0C0D"
      />
    </svg>
  );
}

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
            <p className="text-lg font-medium text-[color:var(--fincept-green-light)]">Regain Control Of Your Money</p>
          </div>

          <h1 className="text-5xl leading-[1.05] font-extrabold sm:text-6xl md:text-7xl">
            Plan Your <span className="fincept-gradient-text">Finance</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base text-[color:var(--fincept-text)] sm:text-lg">
            We can Get you the best Finance can Get you the best Finance Possible. We can Get you the best Finance
            Possible.
          </p>

          <Link href="/signup" className="fincept-btn mt-10 !w-auto px-8 py-3.5">
            Get Started
          </Link>

          <div className="mx-auto mt-14 flex max-w-xs items-center justify-center gap-4 rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-5">
            <p className="font-hanken text-3xl font-bold text-[color:var(--fincept-green-light)]">4.7+</p>
            <h2 className="text-left text-lg font-semibold">
              Out of 40k+
              <br />
              Reviews
            </h2>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-12 text-center text-xl font-semibold sm:text-2xl">
          Trusted by over <br className="sm:hidden" />
          <span className="fincept-gradient-text">6,500 companies</span>
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
                HANDLING <span className="fincept-gradient-text">Expenses</span> FOR
              </h2>
              <p className="text-[color:var(--fincept-text-muted)]">
                We can Get you the best Finance can Get you the best Finance Possible. We can Get you the best Finance
                Possible. We can Get you the best Finance can Get you the best Finance Possible. We can Get you the
                best Finance Possible.
              </p>
            </div>
            <h2 className="shrink-0 text-3xl font-bold sm:text-4xl">
              <span className="fincept-gradient-text">3K+</span> <br />
              Clients
            </h2>
          </div>

          <Image
            src="/fincept/media/images/chart.png"
            alt="Expense trend chart"
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
          Elevate Your Finance with <span className="fincept-gradient-text">PRIMEFX</span>
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
              alt="Members trust PRIMEFX with their money"
              width={708}
              height={492}
              className="w-full"
            />
            <div className="absolute left-6 top-6 rounded-2xl bg-[rgba(12,12,13,0.8)] px-5 py-4 backdrop-blur">
              <p className="text-2xl font-bold">43%</p>
              <p className="text-sm font-semibold text-[color:var(--fincept-text-muted)]">Tax Saving</p>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Over <span className="fincept-gradient-text">100K</span> People Trust Us With Their Money
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
              Tax <span className="text-[color:var(--fincept-green-light)]">Optimization</span> to Boost Savings
            </h3>
            <p className="text-[color:var(--fincept-text-muted)]">
              Et nulla tempore molestiae qui. Est delectus veniam consequatur omnis. Libero non eaque dolore dolorum
              architecto eius.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { label: "Effectiveness", value: 70 },
              { label: "Savings", value: 90 },
              { label: "Revenue Increase", value: 80 },
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

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-16 text-center text-3xl font-bold uppercase sm:text-4xl">
          Our Pricing <span className="fincept-gradient-text">Plans</span>
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-3xl border p-8 ${
                plan.featured
                  ? "border-[color:var(--fincept-green)] bg-gradient-to-b from-[rgba(83,159,117,0.1)] to-transparent"
                  : "border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)]"
              }`}
            >
              <h3 className="mb-3 text-lg font-semibold text-[color:var(--fincept-green-light)]">{plan.name}</h3>
              <p className="mb-8 text-sm text-[color:var(--fincept-text-muted)]">{plan.description}</p>
              <div className="mb-2 flex items-end gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="pb-1 text-sm text-[color:var(--fincept-text-muted)]">/Per Hour</span>
              </div>
              <p className="mb-8 text-sm text-[color:var(--fincept-text-muted)]">Billed Yearly</p>

              <ul className="mb-10 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[color:var(--fincept-text-muted)]">
                    <CheckIcon className="h-5 w-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="fincept-btn mt-auto">
                Book Session
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="mb-16 text-center text-3xl font-bold uppercase sm:text-4xl">What Our Clients Say</h2>
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
            Ready to <span className="fincept-gradient-text">Plan Your Finance</span> With PRIMEFX?
          </h2>
          <p className="max-w-xl text-[color:var(--fincept-text-muted)]">
            Create your free account in minutes and get access to your personal finance dashboard.
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
                Unlock your brand&rsquo;s true potential with innovative digital strategies that drive results.
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
                <li><a href="#services" className="hover:text-[color:var(--fincept-green-light)]">Services</a></li>
                <li><a href="#pricing" className="hover:text-[color:var(--fincept-green-light)]">Pricing</a></li>
                <li><Link href="/login" className="hover:text-[color:var(--fincept-green-light)]">Log In</Link></li>
                <li><Link href="/signup" className="hover:text-[color:var(--fincept-green-light)]">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
                Services
              </h3>
              <ul className="space-y-3 text-sm text-[color:var(--fincept-text-muted)]">
                <li>Investment Planning</li>
                <li>Retirement Strategy</li>
                <li>Tax Optimization</li>
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

          <div className="mt-14 border-t border-white/5 pt-8 text-center text-xs text-[color:var(--fincept-text-muted)]">
            &copy;2026 All Rights Reserved By PRIMEFX
          </div>
        </div>
      </footer>
    </div>
  );
}
