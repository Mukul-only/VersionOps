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
import { collegeService } from "@/api/services";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { College } from "@/api/types";
import { useEffect, useState } from "react";
import Papa from "papaparse";

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
        await collegeService.update(college.id, updateData);
        toast.success("College updated successfully!");
      } else {
        await collegeService.create(values);
        toast.success("College created successfully!");
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/colleges");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(
          error.message || `Failed to ${isEditMode ? "update" : "create"} college`
        );
      }
    }
  }

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCsvFile(event.target.files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file to import.");
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
          .map((college) => collegeService.create(college));

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
          toast.success(
            `${successfulImports} college(s) imported successfully!`
          );
        }
        if (failedImports > 0) {
          toast.warning(
            `${failedImports} college(s) failed to import. Check console for details.`
          );
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
        toast.error(`Error parsing CSV file: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Edit College" : "Add New College"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Update the details for the college."
            : "Enter the details for the new college."}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={isEditMode ? "lg:col-span-2" : ""}>
          <Card>
            <CardHeader>
              <CardTitle>College Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? isEditMode
                        ? "Saving..."
                        : "Creating..."
                      : isEditMode
                      ? "Save Changes"
                      : "Create College"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        {!isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Import Colleges from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  To import a list of colleges, please upload a CSV file with
                  the following format:
                </p>
                <pre className="mt-2 p-2 bg-gray-100 rounded-md text-sm">
                  <code>
                    code,name
                    <br />
                    MIT,MIT College of Engineering
                    <br />
                    COEP,College of Engineering, Pune
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
