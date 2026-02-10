import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "mapprr_onboarding_completed";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: "top" | "bottom" | "left" | "right";
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to LinkScape! 🎉",
    description: "Let's take a quick tour to help you get started mapping your digital presence.",
    target: "[data-onboarding='canvas']",
    position: "bottom",
  },
  {
    id: "hub",
    title: "This is your Hub",
    description: "The central node represents your brand or identity. Double-click to rename it.",
    target: "[data-onboarding='hub-node']",
    position: "right",
  },
  {
    id: "add-node",
    title: "Add Your Links",
    description: "Click here to add social media, websites, and other digital properties.",
    target: "[data-onboarding='add-node']",
    position: "left",
  },
  {
    id: "toolbar",
    title: "Your Toolbox",
    description: "Undo, redo, zoom, and export your map from here.",
    target: "[data-onboarding='toolbar']",
    position: "bottom",
  },
  {
    id: "save-share",
    title: "Save & Share",
    description: "Your map auto-saves. Click Share to make it public and share with the world!",
    target: "[data-onboarding='share-button']",
    position: "bottom",
  },
];

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(true); // Default to completed to avoid flash
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsCompleted(false);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const completeTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsCompleted(true);
    setIsActive(false);
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsCompleted(false);
    setCurrentStep(0);
  }, []);

  return {
    isCompleted,
    isActive,
    currentStep,
    totalSteps: onboardingSteps.length,
    currentStepData: onboardingSteps[currentStep],
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
