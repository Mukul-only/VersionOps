import { useEffect, useState } from "react";
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
 ;
import { useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
import {mapped_toast} from "@/lib/toast_map.ts";

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
            if (error?.response?.status === 403) {
                mapped_toast('You do not access to some of the data.', "warning", true);
                return;
            }
            mapped_toast('Failed to fetch event details.', 'error')
          console.error("Failed to fetch event details");
          navigate("/events");
        }
      };
      void fetchEvent();
    }
  }, [id, isEditMode, form, navigate]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode) {
        await eventService.update(parseInt(id), values);
        mapped_toast('Event updated successfully.', 'success')
      } else {
        await eventService.create(values);
        mapped_toast('Event created successfully.', 'success')
      }
      navigate("/events");
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('You do not have permission to perform this action.', 'warning')
            return;
        }
        mapped_toast('Failed to save event.', 'error')
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} event`, error);
    }
  }

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCsvFile(event.target.files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
        mapped_toast('Please select a CSV file to import.', 'warning')
      return;
    }

    setIsImporting(true);
    Papa.parse(csvFile, {
      skipEmptyLines: true,
      complete: async (results) => {
        const dataRows = results.data as string[][];
        const header = dataRows[0]?.map(h => h.trim());
        const eventData = dataRows.slice(1);

        if (!header || header.length < 6) {
            mapped_toast('Invalid CSV format. Please check the headers.', 'error')
            setIsImporting(false);
            return;
        }

        const events = eventData.map((row) => {
            const event: { [key: string]: any } = {};
            header.forEach((h, i) => {
                event[h] = row[i];
            });
            return event;
        });

        const creationPromises = events
          .filter((e) => e.name)
          .map((event) => {
            const parsedEvent = {
                name: event.name,
                teamSize: parseInt(event.teamSize, 10) || 1,
                participationPoints: parseInt(event.participationPoints, 10) || 0,
                firstPrizePoints: parseInt(event.firstPrizePoints, 10) || 0,
                secondPrizePoints: parseInt(event.secondPrizePoints, 10) || 0,
                thirdPrizePoints: parseInt(event.thirdPrizePoints, 10) || 0,
            };
            return eventService.create(parsedEvent);
          });

        const promiseResults = await Promise.allSettled(creationPromises);

        let successfulImports = 0;
        let failedImports = 0;

        promiseResults.forEach((result) => {
          if (result.status === "fulfilled") {
            successfulImports++;
          } else {
            failedImports++;
            console.error("Failed to import event:", result.reason);
          }
        });

        if (successfulImports > 0) {
            mapped_toast(`${successfulImports} event(s) imported successfully!`, 'success')
        }
        if (failedImports > 0) {
            mapped_toast(`${failedImports} event(s) failed to import.`, 'error')
        }

        setIsImporting(false);
        if (successfulImports > 0) {
            navigate("/events");
        }
      },
      error: (error) => {
          mapped_toast('Error parsing CSV file.', 'error')
        console.error(`Error parsing CSV file: ${error}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? "Edit Event" : "Add New Event"}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? "Update the details for the event." : "Enter the details for the new event."}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
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
      {!isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Import Events from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  To import a list of events, please upload a CSV file with the
                  following format:
                </p>
                <pre className="mt-2 p-2 bg-gray-100 rounded-md text-sm">
                  <code>
                    name,teamSize,participationPoints,firstPrizePoints,secondPrizePoints,thirdPrizePoints
                    <br />
                    Code Sprint,1,10,100,50,25
                    <br />
                    Design Challenge,2,20,150,100,75
                  </code>
                </pre>
              </div>
              <div className="flex flex-col space-y-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  disabled={isImporting}
                />
                <Button
                  onClick={handleCsvImport}
                  disabled={!csvFile || isImporting}
                >
                  {isImporting ? "Importing..." : "Import CSV"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
