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
import { collegeService } from "@/api/services";
 ;
import { useNavigate } from "react-router-dom";
import { College } from "@/api/types";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {mapped_toast} from "@/lib/toast_map.ts";

const formSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters.").max(10),
  name: z.string().min(3, "Name must be at least 3 characters.").max(255),
});

interface AddCollegeProps {
  college?: College | null;
  onSuccess?: () => void;
}

export default function AddCollege({ college, onSuccess }: AddCollegeProps) {
  const navigate = useNavigate();
  const isEditMode = !!college;
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  useEffect(() => {
    if (isEditMode && college) {
      form.reset({
        code: college.code,
        name: college.name,
      });
    }
  }, [college, isEditMode, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode && college) {
        const { code, ...updateData } = values;
        await collegeService.update(college.id, updateData as { name: string });
        mapped_toast('College updated successfully.', 'success')
      } else {
        await collegeService.create(values as { code: string; name: string });
        mapped_toast('College created successfully.', 'success')
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/colleges");
      }
    } catch (error) {
      if (error?.response?.status === 403) {
        mapped_toast('You do not have permission to perform this action.', 'warning')
        return;
      }
      mapped_toast('Failed to save college.', 'error')
      console.error("Failed to save college", error);
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
        // Skip header row
        const collegeData = dataRows.slice(1);

        const colleges = collegeData.map((row) => {
          const [code, ...nameParts] = row;
          const name = nameParts.join(",").trim();
          return { code: code?.trim(), name };
        });

        const creationPromises = colleges
          .filter((c) => c.code && c.name)
          .map((college) =>
            collegeService.create(college as { code: string; name: string })
          );

        const promiseResults = await Promise.allSettled(creationPromises);

        let successfulImports = 0;
        let failedImports = 0;

        promiseResults.forEach((result) => {
          if (result.status === "fulfilled") {
            successfulImports++;
          } else {
            failedImports++;
            console.error("Failed to import college:", result.reason);
          }
        });


        if (successfulImports > 0) {
          mapped_toast(`${successfulImports} colleges imported successfully.`, 'success')
        }
        if (failedImports > 0) {
          mapped_toast(`${failedImports} colleges failed to import.`, 'error')
          console.error(`${failedImports} colleges failed to import.`);
        }

        setIsImporting(false);
        if (successfulImports > 0) {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/colleges");
          }
        }
      },
      error: (error) => {
        mapped_toast('Error parsing CSV file.', 'error')
        console.error(`Error parsing CSV file: `, error);
        setIsImporting(false);
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          {isEditMode ? "Edit College" : "New College"}
        </h2>
        <p className="text-sm text-[#bcc9c5] uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_10px_rgba(94,207,186,0.5)]"></span>
          {isEditMode ? "Update Details" : "College Registration"}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${!isEditMode ? 'lg:grid-cols-3' : ''} gap-8`}>
        <div className={`${!isEditMode ? 'lg:col-span-2' : ''} bg-surface-lowest/80 backdrop-blur-3xl border border-surface-highest/50 shadow-2xl rounded-3xl p-8 lg:p-12`}>
          <h3 className="text-xl font-semibold text-white mb-8 border-b border-surface-highest/50 pb-4">
            {isEditMode ? "Modify Details" : "Manual Entry"}
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MIT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., MIT College of Engineering"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-full bg-teal hover:bg-teal/90 text-[#00201b] font-extrabold text-sm py-6 mt-8 transition-all">
                {form.formState.isSubmitting
                  ? isEditMode
                    ? "SAVING..."
                    : "INITIALIZING..."
                  : isEditMode
                  ? "SAVE CHANGES"
                  : "FINALIZE COLLEGE"}
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
              <p className="text-[#bcc9c5] text-sm mb-4 leading-relaxed">Format: <code className="text-teal font-mono">code,name</code></p>
              
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
