import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, Search, LineChart, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Search, text: "Searching global databases...", duration: 2500 },
  { icon: LineChart, text: "Analyzing financial performance...", duration: 3500 },
  { icon: FileText, text: "Constructing strategic profile...", duration: 3000 },
  { icon: CheckCircle2, text: "Finalizing presentation...", duration: 1500 },
];

export function LoadingAnalysis() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
      }, totalDelay);
      timeouts.push(timeout);
      totalDelay += step.duration;
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 border-4 border-slate-100 rounded-full"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-center text-slate-900 mb-2 font-serif">
          Generating Analysis
        </h2>
        <p className="text-center text-slate-500 mb-8 text-sm">
          Please wait while our AI constructs your report.
        </p>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0.5, x: -10 }}
                animate={{ 
                  opacity: isActive || isCompleted ? 1 : 0.4, 
                  x: 0 
                }}
                className="flex items-center gap-4"
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500
                  ${isCompleted ? "bg-green-100 text-green-600" : isActive ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-400"}
                `}>
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-sm font-medium transition-colors ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                  {step.text}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="ml-auto w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
