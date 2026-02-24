"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { ArrowRight, Briefcase, Building2, CheckCircle2, Sparkles } from "lucide-react";

interface OnboardingWizardProps {
    userName: string | null;
    onComplete: () => void;
}

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const displayName = userName?.split(" ")[0] || "Dort";

    const handleNext = () => setStep((s) => s + 1);

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    department: department.trim() || undefined,
                    position: position.trim() || undefined,
                    onboarding_completed: true,
                }),
            });
            onComplete(); // Triggers a re-fetch of the dashboard data
        } catch (error) {
            console.error("Fehler beim Speichern des Onboardings", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/60 p-4 backdrop-blur-md">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl"
                    >
                        <div className="bg-brand-gradient px-8 py-10 text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
                                <Sparkles className="h-8 w-8" strokeWidth={2} />
                            </div>
                            <h2 className="font-display text-3xl font-bold text-white">
                                Willkommen im AI Hub!
                            </h2>
                            <p className="mt-3 text-[15px] font-medium text-white/90">
                                Hallo {displayName}! Schön, dass du dabei bist.
                            </p>
                        </div>

                        <div className="p-8 text-center">
                            <p className="mb-8 text-[15px] leading-relaxed text-surface-600">
                                Diese Plattform ist dein zentraler Ort, um Künstliche Intelligenz
                                zu meistern. Tausche dich mit Kollegen aus, teile deine besten Prompts
                                und verfolge deinen Lernerfolg in unserem Gamification-System.
                            </p>

                            <Button
                                onClick={handleNext}
                                size="lg"
                                className="w-full text-[15px]"
                                iconRight={<ArrowRight className="h-5 w-5" />}
                            >
                                Lass uns loslegen!
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl p-8"
                    >
                        <div className="mb-8 text-center">
                            <h2 className="font-display text-2xl font-bold text-surface-900">
                                Lass uns dein Profil einrichten
                            </h2>
                            <p className="mt-2 text-surface-500">
                                Diese Infos helfen Kollegen mit ähnlichen Interessen, dich zu finden.
                                Du kannst das später jederzeit anpassen.
                            </p>
                        </div>

                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="mb-1.5 block text-[13px] font-semibold text-surface-700">
                                    Abteilung / Team
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Building2 className="h-5 w-5 text-surface-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="z.B. Marketing, Vertrieb..."
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="block w-full rounded-xl border-surface-200 bg-surface-50 py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all placeholder:text-surface-400 focus:border-brand-primary-500 focus:bg-white focus:ring-1 focus:ring-brand-primary-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[13px] font-semibold text-surface-700">
                                    Position / Rolle
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Briefcase className="h-5 w-5 text-surface-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="z.B. Social Media Manager..."
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="block w-full rounded-xl border-surface-200 bg-surface-50 py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all placeholder:text-surface-400 focus:border-brand-primary-500 focus:bg-white focus:ring-1 focus:ring-brand-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleNext}
                            size="lg"
                            className="w-full text-[15px]"
                        >
                            Weiter
                        </Button>
                        <button
                            onClick={handleNext}
                            className="mt-4 w-full text-center text-[13px] font-medium text-surface-500 hover:text-surface-900"
                        >
                            Überspringen
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl p-10 text-center"
                    >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary-100 ring-8 ring-brand-primary-50">
                            <CheckCircle2 className="h-10 w-10 text-brand-primary-600" />
                        </div>

                        <h2 className="font-display text-3xl font-bold text-surface-900 mb-3">
                            Du bist startklar!
                        </h2>
                        <p className="mb-2 text-[15px] font-medium text-brand-primary-600">
                            🎉 +50 XP Onboarding Bonus freigeschaltet!
                        </p>
                        <p className="mb-8 text-[15px] leading-relaxed text-surface-600">
                            Dein Profil ist eingerichtet. Dein KI-Begleiter ist bereit – und die
                            Community freut sich auf deine ersten Use Cases.
                        </p>

                        <Button
                            onClick={handleComplete}
                            size="lg"
                            className="w-full text-[15px]"
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? "Wird finalisiert..." : "Auf zum Dashboard!"}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
