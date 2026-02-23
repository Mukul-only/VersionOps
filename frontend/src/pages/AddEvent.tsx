import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventService } from "@/api/services";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  teamSize: z.coerce.number().min(1, "Team size must be at least 1."),
  participationPoints: z.coerce.number().min(0, "Points cannot be negative."),
  firstPrizePoints: z.coerce.number().min(0, "Points cannot be negative."),
  secondPrizePoints: z.coerce.number().min(0, "Points cannot be negative."),
  thirdPrizePoints: z.coerce.number().min(0, "Points cannot be negative."),
});

export default function AddEvent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      teamSize: 1,
      participationPoints: 0,
      firstPrizePoints: 0,
      secondPrizePoints: 0,
      thirdPrizePoints: 0,
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          const event = await eventService.getById(parseInt(id));
          form.reset(event);
        } catch (error) {
          toast.error("Failed to fetch event details");
          navigate("/events");
        }
      };
      fetchEvent();
    }
  }, [id, isEditMode, form, navigate]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode) {
        await eventService.update(parseInt(id), values);
        toast.success("Event updated successfully!");
      } else {
        await eventService.create(values);
        toast.success("Event created successfully!");
      }
      navigate("/events");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? "Edit Event" : "Add New Event"}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? "Update the details for the event." : "Enter the details for the new event."}
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Code Sprint" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="teamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Size</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="participationPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participation Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstPrizePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1st Prize Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondPrizePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2nd Prize Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thirdPrizePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3rd Prize Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditMode ? "Saving..." : "Creating..."
                  : isEditMode ? "Save Changes" : "Create Event"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
