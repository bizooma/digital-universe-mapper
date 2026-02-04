import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingSteps, type OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  arrowPosition: "top" | "bottom" | "left" | "right";
}

export function OnboardingTour({ 
  isActive, 
  currentStep, 
  onNext, 
  onPrev, 
  onSkip 
}: OnboardingTourProps) {
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = onboardingSteps[currentStep];

  const updatePosition = useCallback(() => {
    if (!step) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Responsive tooltip sizing
    const isSmallScreen = viewportWidth < 1024;
    const tooltipWidth = isSmallScreen ? Math.min(280, viewportWidth - 32) : 320;
    const tooltipHeight = 160;
    const padding = isSmallScreen ? 12 : 16;

    const target = document.querySelector(step.target);
    if (!target) {
      // If target not found, center the tooltip
      setTooltipPosition({
        top: Math.max(padding, viewportHeight / 2 - tooltipHeight / 2),
        left: Math.max(padding, viewportWidth / 2 - tooltipWidth / 2),
        arrowPosition: "top",
      });
      setTargetRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect(rect);

    let position: TooltipPosition;
    let preferredPosition = step.position;

    // On smaller screens, prefer bottom/top positioning to avoid horizontal overflow
    if (isSmallScreen && (preferredPosition === "left" || preferredPosition === "right")) {
      // Check if there's more space above or below
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      preferredPosition = spaceBelow >= spaceAbove ? "bottom" : "top";
    }

    switch (preferredPosition) {
      case "top":
        position = {
          bottom: viewportHeight - rect.top + padding,
          left: Math.max(padding, Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            viewportWidth - tooltipWidth - padding
          )),
          arrowPosition: "bottom",
        };
        // Check if tooltip would go off-screen at top
        if (rect.top - tooltipHeight - padding < 0) {
          position = {
            top: rect.bottom + padding,
            left: position.left,
            arrowPosition: "top",
          };
        }
        break;
      case "bottom":
        position = {
          top: Math.min(rect.bottom + padding, viewportHeight - tooltipHeight - padding),
          left: Math.max(padding, Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            viewportWidth - tooltipWidth - padding
          )),
          arrowPosition: "top",
        };
        break;
      case "left":
        position = {
          top: Math.max(padding, Math.min(
            rect.top + rect.height / 2 - tooltipHeight / 2,
            viewportHeight - tooltipHeight - padding
          )),
          right: Math.max(padding, viewportWidth - rect.left + padding),
          arrowPosition: "right",
        };
        // Check if tooltip would go off-screen at left
        if (rect.left - tooltipWidth - padding < 0) {
          position = {
            top: position.top,
            left: rect.right + padding,
            arrowPosition: "left",
          };
        }
        break;
      case "right":
        position = {
          top: Math.max(padding, Math.min(
            rect.top + rect.height / 2 - tooltipHeight / 2,
            viewportHeight - tooltipHeight - padding
          )),
          left: Math.min(rect.right + padding, viewportWidth - tooltipWidth - padding),
          arrowPosition: "left",
        };
        break;
      default:
        position = {
          top: Math.min(rect.bottom + padding, viewportHeight - tooltipHeight - padding),
          left: Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding)),
          arrowPosition: "top",
        };
    }

    setTooltipPosition(position);
  }, [step]);

  useEffect(() => {
    if (!isActive) return;

    updatePosition();
    
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    
    // Update position periodically to handle dynamic content
    const interval = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [isActive, currentStep, updatePosition]);

  if (!isActive || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === onboardingSteps.length - 1;

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onSkip}
      />

      {/* Highlight cutout for target element */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[101] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: 8,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {tooltipPosition && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed z-[102] w-[280px] lg:w-80 max-w-[calc(100vw-24px)] bg-card border border-border rounded-xl shadow-2xl"
            style={{
              top: tooltipPosition.top,
              bottom: tooltipPosition.bottom,
              left: tooltipPosition.left,
              right: tooltipPosition.right,
            }}
          >
            {/* Arrow */}
            <div
              className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
                tooltipPosition.arrowPosition === "top"
                  ? "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t"
                  : tooltipPosition.arrowPosition === "bottom"
                  ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b"
                  : tooltipPosition.arrowPosition === "left"
                  ? "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b"
                  : "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t"
              }`}
            />

            {/* Close button */}
            <button
              onClick={onSkip}
              className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </span>
              </div>
              
              <h3 className="font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentStep 
                        ? "bg-primary" 
                        : index < currentStep 
                        ? "bg-primary/50" 
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  disabled={isFirst}
                  className={isFirst ? "invisible" : ""}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                <Button
                  variant="hero"
                  size="sm"
                  onClick={onNext}
                >
                  {isLast ? (
                    "Get Started"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
