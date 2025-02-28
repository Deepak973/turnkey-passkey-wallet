"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

// Step components
import AgentDetails from "./components/AgentDetails";
import AgentActions from "./components/AgentActions";
import CharacterTone from "./components/CharacterTone";
import ResponseCustomization from "./components/ResponseCustomization";
import TokenSection from "./components/TokenSection";

export default function CreateAgentPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const steps = [
        { id: 1, title: "Agent details", component: AgentDetails },
        { id: 2, title: "Actions", component: AgentActions },
        { id: 3, title: "Character & Tone", component: CharacterTone },
        { id: 4, title: "Response customization", component: ResponseCustomization },
        { id: 5, title: "Token", component: TokenSection, optional: true },
    ];

    const handleStepComplete = (stepId: number) => {
        if (!completedSteps.includes(stepId)) {
            setCompletedSteps([...completedSteps, stepId]);
        }
        if (stepId < steps.length) {
            setCurrentStep(stepId + 1);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                    <h1 className="text-2xl font-semibold">Create Agent</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div>
                        <div className="text-sm">By</div>
                        <div className="text-sm font-medium">Jenil</div>
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = completedSteps.includes(step.id);
                    const StepComponent = step.component;

                    return (
                        <div
                            key={step.id}
                            className={`bg-gray-50 rounded-xl transition-all ${isActive ? "p-6" : "p-4"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
                                    >
                                        {isCompleted && <Check className="text-white" />}
                                    </div>
                                    <span className="font-medium">{step.title}</span>
                                    {step.optional && (
                                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                                            OPTIONAL
                                        </span>
                                    )}
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 border-green-500 
                  ${isCompleted ? "border-green-500" : "border-gray-200"}`}
                                >
                                    {isCompleted && (
                                        <div className="w-full h-full bg-green-500 rounded-full" />
                                    )}
                                </div>
                            </div>

                            {/* Step Content */}
                            {isActive && (
                                <div className="mt-6">
                                    <StepComponent onComplete={() => handleStepComplete(step.id)} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-8">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-6 h-6 bg-gray-200 rounded mt-1"></div>
                    <p className="text-gray-600 text-sm">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                        incididunt ut labore et
                    </p>
                </div>

                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-blue-500 text-white py-4 rounded-full hover:bg-blue-600 transition-colors"
                >
                    Go live →
                </button>
            </div>
        </div>
    );
} 