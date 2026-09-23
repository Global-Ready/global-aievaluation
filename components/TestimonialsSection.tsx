"use client";

import { useState } from "react";
import { Users, Star, ChevronLeft, ArrowRight } from "lucide-react";
import type { Testimonial } from "@/types";
import { renderFormattedText } from "./LessonContentRenderer";

export default function TestimonialsSection({
  testimonials,
  id,
}: {
  testimonials: Testimonial[];
  id?: string;
}) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section id={id} className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#EEF2FF] dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          <Users className="w-3.5 h-3.5" />
          <span>Trusted Worldwide</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          What Others Have <span className="text-[#4F46E5] dark:text-indigo-400">To Say</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real stories from people earning and advancing their alignment skills with Global Ready AIEval.
        </p>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-sm text-slate-400">
          Reviews are coming soon.
        </div>
      ) : (
        <>
          {/* Testimonial card slider frame */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
            {/* Quote bubble absolute icon */}
            <div className="absolute -top-4 left-6 bg-[#4F46E5] text-white p-2.5 rounded-2xl shadow-md">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M11.192 15.757c0-.907-.188-1.754-.565-2.54a5.72 5.72 0 0 1-1.495-2.22c-.3-.747-.45-1.533-.45-2.36 0-1.21.37-2.24 1.101-3.09.73-.85 1.782-1.28 3.141-1.28h.74v2.24h-.74c-.58 0-1.04.183-1.38.55-.34.367-.51.847-.51 1.44 0 .34.05.67.15 1 .1.33.22.65.36.96.14.3.3.61.47.93.18.32.35.64.51.96.16.32.28.66.36 1.02.08.36.12.74.12 1.14 0 1.22-.37 2.25-1.111 3.09-.74.84-1.782 1.26-3.12 1.26h-.74v-2.24h.74a1.455 1.455 0 0 0 1.38-.85zM4 15.757c0-.907-.188-1.754-.565-2.54a5.72 5.72 0 0 1-1.495-2.22c-.3-.747-.45-1.533-.45-2.36 0-1.21.37-2.24 1.101-3.09.73-.85 1.782-1.28 3.141-1.28h.74v2.24h-.74c-.58 0-1.04.183-1.38.55-.34.367-.51.847-.51 1.44 0 .34.05.67.15 1 .1.33.22.65.36.96.14.3.3.61.47.93.18.32.35.64.51.96.16.32.28.66.36 1.02.08.36.12.74.12 1.14 0 1.22-.37 2.25-1.111 3.09-.74.84-1.782 1.26-3.12 1.26h-.74v-2.24h.74a1.455 1.455 0 0 0 1.38-.85z"></path>
              </svg>
            </div>

            <div className={`flex flex-col ${testimonials[activeTestimonial].proofImageUrl ? "md:flex-row md:items-stretch" : ""} gap-6`}>
              {testimonials[activeTestimonial].proofImageUrl && (
                <div className="md:w-2/5 shrink-0 h-48 md:h-full rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={testimonials[activeTestimonial].proofImageUrl}
                    alt={`Proof of work — ${testimonials[activeTestimonial].name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className={`space-y-6 ${testimonials[activeTestimonial].proofImageUrl ? "md:w-3/5" : "w-full"}`}>
                <div className="flex items-center gap-1">
                  {[...Array(testimonials[activeTestimonial].rating ?? 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed italic">
                  "{renderFormattedText(testimonials[activeTestimonial].quote)}"
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-150 bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 font-black text-sm">
                      {testimonials[activeTestimonial].avatarUrl ? (
                        <img
                          src={testimonials[activeTestimonial].avatarUrl}
                          alt={testimonials[activeTestimonial].name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        testimonials[activeTestimonial].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {testimonials[activeTestimonial].name}
                      </h4>
                      {testimonials[activeTestimonial].role && (
                        <p className="text-[11px] text-slate-400 font-semibold">
                          {testimonials[activeTestimonial].role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls arrows */}
            {testimonials.length > 1 && (
              <div className="absolute right-4 bottom-4 flex gap-1.5">
                <button
                  onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bullet indicators */}
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeTestimonial === i ? "w-8 bg-[#4F46E5]" : "w-2 bg-slate-300 dark:bg-slate-800"
                  }`}
                ></button>
              ))}
            </div>
          )}

          <p className="text-center text-[10px] text-slate-400 dark:text-slate-550">
            Testimonials reflect individual experiences. Results vary and are not guaranteed.
          </p>
        </>
      )}
    </section>
  );
}
