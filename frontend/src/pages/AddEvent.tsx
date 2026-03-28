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
import { Upload } from "lucide-react";
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
                navigate("/events");
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          {isEditMode ? "Edit Event" : "New Event"}
        </h2>
        <p className="text-sm text-[#bcc9c5] uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_10px_rgba(94,207,186,0.5)]"></span>
          {isEditMode ? "Update Details" : "Event Registration"}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${!isEditMode ? 'lg:grid-cols-3' : ''} gap-8`}>
        <div className={`${!isEditMode ? 'lg:col-span-2' : ''} bg-surface-lowest/80 backdrop-blur-3xl border border-surface-highest/50 shadow-2xl rounded-3xl p-8 lg:p-12`}>
          <h3 className="text-xl font-semibold text-white mb-8 border-b border-surface-highest/50 pb-4">
            {isEditMode ? "Modify Details" : "Manual Entry"}
          </h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-full bg-teal hover:bg-teal/90 text-[#00201b] font-extrabold text-sm py-6 mt-8 transition-all">
                {form.formState.isSubmitting
                  ? isEditMode ? "SAVING..." : "INITIALIZING..."
                  : isEditMode ? "SAVE CHANGES" : "FINALIZE EVENT"}
              </Button>
            </form>
          </Form>
        </div>

        {!isEditMode && (
          <div className="lg:col-span-1">
            <div 
              onClick={() => document.getElementById('csv-upload')?.click()}
              className="group cursor-pointer border-2 border-dashed border-teal/40 bg-surface-lowest/50 backdrop-blur-3xl rounded-3xl p-12 h-full min-h-[400px] flex flex-col items-center justify-center text-center transition-all duration-500 hover:border-teal hover:shadow-[0_0_30px_rgba(94,207,186,0.15)] hover:bg-teal/5"
            >
              <div className="w-20 h-20 rounded-full bg-surface-highest flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(94,207,186,0.4)]">
                <Upload className="w-10 h-10 text-teal" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Bulk Import</h3>
              <p className="text-[#bcc9c5] text-xs mb-4 leading-relaxed font-mono text-left break-all bg-surface-lowest rounded-xl p-4 w-full border border-surface-highest/50">
                name,teamSize,<br/>participationPoints,<br/>firstPrizePoints,<br/>secondPrizePoints,<br/>thirdPrizePoints
              </p>
              
              <div className="flex flex-col space-y-4 w-full px-4">
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  disabled={isImporting}
                  className="hidden"
                />
                
                {csvFile && (
                  <p className="text-teal text-xs font-mono font-bold truncate px-2">{csvFile.name}</p>
                )}

                <Button
                  onClick={(e) => { e.stopPropagation(); handleCsvImport(); }}
                  disabled={!csvFile || isImporting}
                  variant="outline"
                  className="w-full rounded-full border-teal/50 text-teal hover:bg-teal hover:text-[#00201b] transition-all cursor-pointer z-10"
                >
                  {isImporting ? "IMPORTING..." : csvFile ? "EXECUTE IMPORT" : "SELECT FILE ⌘"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
