"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, BookOpen, Target, Rocket, Megaphone
} from "lucide-react";
import type { Testimonial, SiteAnnouncement } from "@/types";
import Reveal from "./Reveal";
import TestimonialsSection from "./TestimonialsSection";
import CookieConsentBanner from "./CookieConsentBanner";
import { LEGAL_LINKS } from "@/lib/legal-links";

interface LandingViewProps {
  onEnterPlatform: () => void;
  onLogin: () => void;
  testimonials: Testimonial[];
  announcement?: SiteAnnouncement | null;
}

export default function LandingView({ onEnterPlatform, onLogin, testimonials, announcement }: LandingViewProps) {
  // State for FAQ Accordions
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Reopens the cookie-preferences banner from the footer link
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  const faqs = [
    {
      question: "Is Global Ready AIEval free?",
      answer: "You can create a free account and access the introductory AI evaluation module without paying. Additional training content and live mentorship are available through optional paid upgrades."
    },
    {
      question: "Do I need coding or AI experience?",
      answer: "No. The core training is suitable for beginners. Some specialist evaluation opportunities may require coding skills, professional qualifications, or relevant experience."
    },
    {
      question: "Can I earn money with AI evaluation?",
      answer: "Some organizations offer paid AI evaluation projects, including flexible contract opportunities. However, project availability, eligibility, compensation, and selection depend on independent providers. Earnings are not guaranteed."
    },
    {
      question: "What happens after I complete the free module?",
      answer: "You can choose to continue with the full self-paced training or explore the live group mentorship option. Both options are designed to help you develop your evaluation skills through further learning and practice."
    },
    {
      question: "Does the training prepare me for AI evaluation assessments?",
      answer: "Yes. The training includes practice with evaluation tasks, scoring guidelines, response comparisons, and simulated assessments. These are independent training activities, not official qualification exams from third-party hiring platforms."
    },
    {
      question: "Is Global Ready AIEval affiliated with hiring platforms?",
      answer: "No. Global Ready AIEval is an independent training and career-preparation provider. References to third-party platforms do not imply affiliation, endorsement, guaranteed access, or preferential hiring treatment."
    },
    {
      question: "Does Global Ready AIEval guarantee a job?",
      answer: "No. Global Ready AIEval provides independent AI evaluation training and career-preparation resources. We do not guarantee employment, assessment success, project allocation, or income."
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div id="landing-page-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-all duration-300">

      {/* Admin-controlled cohort/announcement banner — only renders when
          an admin has one turned on in /admin/announcement. */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] sm:text-xs py-2.5 px-4 text-center font-bold tracking-wide flex flex-wrap items-center justify-center gap-x-2 gap-y-1 shadow-sm">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span>{announcement.message}</span>
          {announcement.linkUrl && (
            <a
              href={announcement.linkUrl}
              className="underline underline-offset-2 hover:no-underline font-black shrink-0"
            >
              {announcement.linkLabel || "Learn More"} &rarr;
            </a>
          )}
        </div>
      )}

      {/* NAVIGATION HEADER */}
      <header className="border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/images/logos/global-logo.png"
              alt="Global Ready AIEval"
              width={28}
              height={28}
            />
            <span className="text-xl font-extrabold text-[#3B28CC] dark:text-indigo-400 tracking-tight">
              Global Ready AIEval
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <a href="#landing-page-root" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#who-we-are" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Who We Are</a>
            <Link href="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Blog</Link>
            <a href="#reviews" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLogin}
              className="hidden sm:inline-flex bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={onEnterPlatform}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <Reveal>
      <section className="relative py-20 sm:py-24 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">

          <div className="inline-flex items-center gap-1.5 bg-[#EEF2FF] dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-[11px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs border border-[#E0E8FF] dark:border-indigo-900/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practical AI Evaluation Training for Professionals</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Turn Your Professional Skills Into <span className="text-[#4F46E5] dark:text-indigo-400">AI Evaluation Opportunities</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Learn to evaluate AI responses, build practical skills, and explore flexible paid AI projects that may match your expertise.
          </p>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Whether you're in tech, healthcare, STEM, law, business, or another field, Global Ready AIEval helps you prepare through interactive lessons, realistic assessment practice, and career resources.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterPlatform}
              className="w-full sm:w-auto bg-[#4F46E5] hover:bg-[#3B28CC] text-white font-black px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Free Training</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-extrabold px-8 py-4 rounded-2xl text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>See How It Works</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Free Introductory Module</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Interactive Evaluation Practice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Career &amp; Interview Preparation</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-550 pt-1 max-w-lg mx-auto leading-relaxed">
            No payment required to access the introductory module. Optional paid upgrades are available. Jobs and
            income are not guaranteed.
          </p>
        </div>
      </section>
      </Reveal>

      {/* SECTION 2 — YOUR PROFESSIONAL EXPERTISE */}
      <Reveal>
      <section id="your-expertise" className="py-20 max-w-3xl mx-auto px-6 text-center space-y-5">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Your Expertise Could Be <span className="text-[#4F46E5] dark:text-indigo-400">Valuable in AI Evaluation</span>
        </h2>
        <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed space-y-4">
          <p>AI can sound confident and still get things wrong.</p>
          <p>That's why evaluating AI responses requires people who can spot mistakes, check facts, follow instructions, and make sound judgments.</p>
          <p>You may already use these skills in your profession. Global Ready AIEval teaches you how to apply them through a structured evaluation process.</p>
          <p>Whether you want to develop a useful AI skill or explore additional income opportunities, your existing knowledge gives you a place to start.</p>
        </div>
      </section>
      </Reveal>

      {/* SECTION 3 — HOW IT WORKS */}
      <Reveal>
      <section id="how-it-works" className="bg-slate-100/50 dark:bg-slate-900/30 py-20 border-y border-slate-200/50 dark:border-slate-900 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Learn the Skills. Practise the Tasks. <span className="text-[#4F46E5] dark:text-indigo-400">Prepare for Opportunities.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-6 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-black text-sm shrink-0">
                1
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Start With the Free Module</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create your free account and learn the basics of AI evaluation through an introductory lesson and practice activity.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-6 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-black text-sm shrink-0">
                2
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Build Your Evaluation Skills</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Learn instruction following, factuality, response comparison, scoring guidelines, and rationale writing through structured lessons and practice.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-6 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-black text-sm shrink-0">
                3
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Explore Opportunities</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Access career-preparation resources as you progress through the training. Learn how to approach relevant AI evaluation assessments and interviews.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEnterPlatform}
              className="bg-[#4F46E5] hover:bg-[#3B28CC] text-white font-black px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Free Training</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
      </Reveal>

      {/* SECTION 4 — ABOUT US */}
      <Reveal>
      <section id="who-we-are" className="py-20 max-w-3xl mx-auto px-6 text-center space-y-5">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Who We Are
        </h2>
        <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed space-y-4">
          <p>
            Global Ready AIEval is an independent AI evaluation training and career-preparation platform built to
            help people develop practical skills for evaluating AI-generated content.
          </p>
          <p>
            We believe your existing knowledge and professional experience can be a valuable starting point in AI
            evaluation. Our training helps you build on that foundation through structured lessons, hands-on
            practice, and simulated assessments.
          </p>
          <p>
            Beyond learning, we provide job discovery and interview-preparation resources to help you explore
            relevant opportunities, including flexible paid AI evaluation projects.
          </p>
          <p className="font-bold text-slate-700 dark:text-slate-200">
            Our mission is simple: Help you build practical AI evaluation skills, apply your expertise, and prepare
            for new possibilities.
          </p>
        </div>
      </section>
      </Reveal>

      {/* SECTION 5 — LEARNER TESTIMONIALS */}
      <Reveal>
      <TestimonialsSection
        testimonials={testimonials}
        id="reviews"
        heading="Real Learners. Real Experiences."
        subtitle="See how learners from different professional backgrounds describe their AI evaluation training and mentorship experiences."
        disclaimer="Testimonials reflect individual experiences. Training does not guarantee employment, project allocation, assessment success, or income."
      />
      </Reveal>

      {/* SECTION 6 — FREE TRAINING OFFER */}
      <Reveal>
      <section id="free-offer" className="bg-slate-100/50 dark:bg-slate-900/30 py-20 border-y border-slate-200/50 dark:border-slate-900 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Experience AI Evaluation Training <span className="text-[#4F46E5] dark:text-indigo-400">Before You Decide</span>
            </h2>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Start learning for free. Upgrade when you're ready for more.
            </p>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
              <p>Not sure if AI evaluation is right for you? You don't need to pay for a course to find out.</p>
              <p>Create your free Global Ready AIEval account and explore an introductory module that explains how AI evaluation works.</p>
              <p>Learn the basics, practise making evaluation decisions, and get a feel for the training experience.</p>
              <p>When you're ready to go further, you can choose to unlock the full self-paced training or join live group mentorship with John.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-450">Your Free Starting Point</h3>
            <ul className="space-y-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {[
                "Free account registration",
                "Introductory AI evaluation module",
                "Beginner-friendly learning experience",
                "Introductory practice activity",
                "Option to upgrade for advanced training",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onEnterPlatform}
              className="w-full bg-[#4F46E5] hover:bg-[#3B28CC] text-white font-black px-6 py-3.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 text-center leading-relaxed">
              Free introductory access. No payment required to start. Full training and live mentorship are
              optional paid upgrades.
            </p>
          </div>
        </div>
      </section>
      </Reveal>

      {/* SECTION 7 — FREQUENTLY ASKED QUESTIONS */}
      <Reveal>
      <section id="faq" className="py-20 px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="max-w-3xl mx-auto space-y-12">

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked <span className="text-[#4F46E5] dark:text-indigo-400">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full py-4.5 px-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Always rendered (not conditionally mounted) so every
                      answer is present in the server-rendered HTML for
                      search engines; "hidden" only toggles visibility. */}
                  <div
                    className={`px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-850 ${
                      isOpen ? "animate-fade-in" : "hidden"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
      </Reveal>

      {/* SECTION 8 — FINAL CALL TO ACTION */}
      <Reveal>
      <section className="py-20 sm:py-24 px-6 text-center relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Your Expertise Is the Starting Point. <span className="text-[#4F46E5] dark:text-indigo-400">Build the Skills to Apply It.</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            You already have valuable knowledge. Now discover how to apply it to AI evaluation through practical
            lessons and exercises. Whether you're developing skills for your current career or exploring new
            opportunities, your first step is free.
          </p>

          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Build the skill. Explore the possibilities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={onEnterPlatform}
              className="w-full sm:w-auto bg-[#4F46E5] hover:bg-[#3B28CC] text-white font-black px-8 py-4.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Free AI Evaluation Training</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-550 pt-1 max-w-lg mx-auto leading-relaxed">
            Free introductory module. No payment required. Optional paid upgrades available.
          </p>
        </div>
      </section>
      </Reveal>

      {/* CONTACT */}
      <Reveal>
      <section id="contact" className="py-16 max-w-2xl mx-auto px-6 text-center space-y-3">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Contact Us
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Questions before you get started? Reach us anytime at{" "}
          <a href="mailto:contact@globalready.tech" className="font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline">
            contact@globalready.tech
          </a>
        </p>
      </section>
      </Reveal>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 pt-12 pb-8 px-6 transition-colors">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/images/logos/global-logo.png"
                  alt="Global Ready AIEval"
                  width={20}
                  height={20}
                />
                <span className="font-extrabold text-[#3B28CC] dark:text-indigo-455">Global Ready AIEval</span>
              </div>
              <span className="hidden sm:inline">&bull;</span>
              <span>Practical AI Evaluation Training for Professionals.</span>
              <span className="hidden sm:inline">&bull;</span>
              <span>Independent AI evaluation training and career preparation.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold shrink-0">
              <a href="#who-we-are" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Who We Are</a>
              <Link href="/blog" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Blog</Link>
              <a href="#reviews" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Reviews</a>
              <a href="#faq" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-semibold">
              {LEGAL_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => setCookieSettingsOpen(true)}
                className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer font-semibold"
              >
                Cookie Settings
              </button>
            </div>
            <p>&copy; 2026 Global Ready AIEval. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <CookieConsentBanner open={cookieSettingsOpen} onOpenChange={setCookieSettingsOpen} />
    </div>
  );
}
