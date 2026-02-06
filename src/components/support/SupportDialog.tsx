import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, HelpCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ticketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Please provide more details (at least 10 characters)")
    .max(2000, "Description must be less than 2000 characters"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface SupportDialogProps {
  trigger?: React.ReactNode;
}

export function SupportDialog({ trigger }: SupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("submit-ticket", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      setSubmitted(true);
      toast.success("Ticket submitted! We'll get back to you soon.");
      
      // Reset and close after a short delay
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        form.reset();
      }, 2000);
    } catch (err) {
      console.error("Error submitting ticket:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSubmitted(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Having trouble with your account? Let us know and we'll help you out.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Your ticket has been submitted. We'll get back to you soon!
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the issue"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue in detail. Include any error messages you've seen."
                        className="min-h-[120px] resize-none"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
