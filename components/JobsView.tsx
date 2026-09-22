import React, { useState } from "react";
import { 
  Search, SlidersHorizontal, ArrowRight, ExternalLink, Share2,
  Sparkles, Edit3, AlertCircle, Briefcase,
  ChevronRight, Info, Globe, Award, HelpCircle, X, DollarSign, Users, MessageSquare,
  Activity, ShieldCheck, Lock, Sparkle, ArrowLeft
} from "lucide-react";
import { UserStats } from "../types";
import { JobOpportunity, DEFAULT_JOBS } from "../data/jobs";
import { renderFormattedText } from "./LessonContentRenderer";

interface JobsViewProps {
  stats: UserStats;
  jobs?: JobOpportunity[];
  onBack: () => void;
  backLabel?: string;
  setActiveTab?: (tab: string) => void;
  onStartInterviewForJob?: (job: JobOpportunity) => void;
}

export default function JobsView({ stats, jobs, onBack, backLabel = "Back to AI Career Hub", setActiveTab, onStartInterviewForJob }: JobsViewProps) {
  const jobsList = jobs && jobs.length > 0 ? jobs : DEFAULT_JOBS;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string>("All Fields");
  const [sortBy, setSortBy] = useState<"priority" | "pay-high">("priority");

  // Track which job is expanded inline. Default to the first one so they see the gorgeous layout!
  const [expandedJobId, setExpandedJobId] = useState<string | null>("generalist-expert");

  const getJobSkillKey = (jobId: string): keyof UserStats["skills"] => {
    switch (jobId) {
      case "generalist-expert":
        return "responseRanking";
      case "gamers":
        return "annotation";
      case "management-consultants":
        return "reasoningEvaluation";
      case "internal-medicine-expert":
        return "factChecking";
      case "cybersecurity-swe":
        return "safetyReview";
      case "biology-expert-phd":
        return "safetyReview";
      case "chemistry-expert-phd":
        return "safetyReview";
      case "cuda-engineering-expert":
        return "reasoning";
      case "medical-expert":
        return "factChecking";
      case "biology-research-scientist":
        return "factChecking";
      case "devops-sre-cloud":
        return "instructionFollowing";
      case "backend-engineer":
        return "reasoning";
      case "video-game-annotator":
        return "annotation";
      case "frontend-engineer":
        return "instructionFollowing";
      case "investment-banking-expert":
        return "reasoning";
      case "data-engineer":
        return "instructionFollowing";
      case "onetime-consulting":
        return "promptEvaluation";
      case "talent-network-expert":
        return "reasoningEvaluation";
      default:
        return "promptEvaluation";
    }
  };

  const getJobReadiness = (job: JobOpportunity) => {
    const skillKey = getJobSkillKey(job.id);
    const skillValue = stats.skills[skillKey] || 0;

    // Base: 70% from the specific skill value, 20% from total lessons, 10% passedExams
    const lessonProgress = Math.min(100, (stats.completedLessons.length / 5) * 100);
    const examPassed = stats.passedExams.length > 0;

    let score = Math.round(skillValue * 0.7 + lessonProgress * 0.2 + (examPassed ? 10 : 0));
    score = Math.max(15, Math.min(100, score));
    return score;
  };

  // Filter and sort logic
  const filteredJobs = jobsList.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.skillsNeeded.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesField = selectedField === "All Fields" || job.field === selectedField;
    return matchesSearch && matchesField;
  }).sort((a, b) => {
    if (sortBy === "pay-high") {
      const getNum = (str: string) => {
        const matches = str.match(/\$(\d+)/);
        return matches ? parseInt(matches[1], 10) : 0;
      };
      return getNum(b.payRate) - getNum(a.payRate);
    }
    return 0;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pl-1">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>
      </div>

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            Explore Opportunities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
            Transition directly from training to high-paying remote contracts. Click any card to expand details and configure your personal affiliate or referral links.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-2 max-w-2xl leading-relaxed">
            Global Ready AIEval provides third-party opportunity information for convenience. We are not the
            employer or recruiter unless expressly stated. Job availability, eligibility, compensation and
            requirements may change. Always verify an opportunity with the original provider before submitting
            sensitive information.
          </p>
        </div>
      </div>

      {/* Referral Link Disclosure */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-xs font-black text-slate-700 dark:text-slate-300 my-0">Referral Link Disclosure</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed my-0">
            Some job opportunities listed on this platform may contain referral links. If you apply through one of
            these links and are successfully hired or accepted onto a project, our platform may receive a referral
            fee or commission from the hiring company.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed my-0">
            This does not affect the amount you earn, the application process, or the hiring decision. We curate
            opportunities we believe may be relevant to our community, but final recruitment decisions are made
            entirely by the respective companies.
          </p>
        </div>
      </div>

      {/* Practice Boost Alert Banner */}
      {setActiveTab && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/5 dark:to-emerald-500/5 border border-indigo-500/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                PRO TIP
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Boost Your Success Chance to 95%+
              </h4>
            </div>
            <p className="text-xs text-slate-650 dark:text-slate-450 leading-relaxed">
              Platform entry tests are single-attempt and heavily audited. We highly recommend completing the simulated workspace exams and case studies in each part before clicking apply!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (setActiveTab) setActiveTab("practice_overview");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
            >
              <span>Practice Tests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Filters, Sort */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Field filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer shadow-xs min-w-[140px]"
            >
              <option value="All Fields">All Fields</option>
              <option value="AI Safety">AI Safety</option>
              <option value="Coding & SWE">Coding & SWE</option>
              <option value="Medical & Bio">Medical & Bio</option>
              <option value="Consulting">Consulting</option>
              <option value="Generalist">Generalist</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer shadow-xs min-w-[120px]"
          >
            <option value="priority">Priority</option>
            <option value="pay-high">Pay: High to Low</option>
          </select>
        </div>
      </div>

      {/* Stack of Opportunity Cards inline expanded */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-950 dark:text-white">No opportunities match your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filters or modifying the search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const firstLetter = job.title.charAt(0);

            // Compute precise readiness
            const skillKey = getJobSkillKey(job.id);
            const skillValue = stats.skills[skillKey] || 0;
            const skillLabel = skillKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const readiness = getJobReadiness(job);

            let readinessColor = "text-amber-650 bg-amber-50 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
            let readinessLabel = "Moderate Prep";
            let readinessAdvisory = "⚠️ Your readiness is moderate. We highly recommend completing more practice labs to boost your scores. Insider referrals are best used when you're fully prepared, as platforms allow only one entry test attempt.";

            if (readiness >= 80) {
              readinessColor = "text-emerald-650 bg-emerald-50 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
              readinessLabel = "Highly Prepared";
              readinessAdvisory = "🚀 Perfect Match! Your practice metrics exceed the entry threshold. Insider experts confidently refer you for this role, as your scores show a high pass probability on their entrance exam.";
            } else if (readiness < 50) {
              readinessColor = "text-rose-650 bg-rose-50 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
              readinessLabel = "Training Advised";
              readinessAdvisory = "🔒 Additional training is strongly advised. Platform qualification tests are single-attempt and very strict. Please complete relevant course lessons and practice simulations to unlock safe referrals.";
            }

            return (
              <div 
                key={job.id}
                id={`job-row-${job.id}`}
                className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-350 shadow-xs hover:shadow-md flex flex-col ${
                  isExpanded 
                    ? "border-indigo-500 dark:border-indigo-600 ring-1 ring-indigo-500/10" 
                    : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* COMPACT TOP ROW (Visible always, toggles state on click) */}
                <div 
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Circle icon with first letter */}
                    <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-300 shrink-0 animate-pulse-subtle">
                      {firstLetter}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-normal">
                          {job.title}
                        </h2>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-1">
                        <span className="font-bold text-indigo-650 dark:text-indigo-400">{job.field}</span>
                        <span className="text-slate-300 dark:text-slate-750">•</span>
                        <span>{job.payRate}</span>
                        <span className="text-slate-300 dark:text-slate-750">•</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${readinessColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          Readiness: {readiness}% ({readinessLabel})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {isExpanded ? "Show Less" : "Details & Apply"}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-305 ${isExpanded ? "rotate-90 text-indigo-500" : ""}`} />
                  </div>
                </div>

                {/* EXPANDED PANEL INLINE — always rendered (not conditionally
                    mounted) so the full role description is present in the
                    server-rendered HTML for every job, not just the one
                    expanded by default; "hidden" only toggles visibility. */}
                <div
                  className={`px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 ${
                    isExpanded ? "animate-fade-in" : "hidden"
                  }`}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
                      
                      {/* Left Column: Description & Skills */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Role Description</span>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                            {renderFormattedText(job.description)}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Target Skills Required</span>
                          <div className="flex flex-wrap gap-1.5">
                            {job.skillsNeeded.map((skill) => (
                              <span 
                                key={skill} 
                                className="text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-md font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Rate & Custom Apply CTA */}
                      <div className="lg:col-span-4 self-start flex flex-col p-4 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-850 rounded-2xl space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-450 font-extrabold uppercase tracking-wider">Contract Rate:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{job.payRate}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <a
                            href={job.applicationUrl || "https://outlier.ai/?ref=academy"}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="w-full font-black py-2.5 px-4 rounded-xl text-xs text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10"
                          >
                            <span>Apply Now</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {setActiveTab && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-850/60 space-y-1.5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-center">
                              🚀 Boost Pass Chance to 95%+
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  if (setActiveTab) setActiveTab("practice_overview");
                                }}
                                className="font-bold py-2 px-3 rounded-lg text-[10px] text-center flex items-center justify-center gap-1 cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-150/40 dark:border-emerald-900/30"
                              >
                                <span>Practice Sim</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onStartInterviewForJob) onStartInterviewForJob(job);
                                  if (setActiveTab) setActiveTab("interview");
                                }}
                                className="font-bold py-2 px-3 rounded-lg text-[10px] text-center flex items-center justify-center gap-1 cursor-pointer transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-750 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-150/40 dark:border-indigo-900/30"
                              >
                                <span>AI Interview</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
