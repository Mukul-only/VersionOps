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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { participantService, collegeService } from "@/api/services";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { College } from "@/api/types";
import { Upload } from "lucide-react";
import { mapped_toast } from "@/lib/toast_map.ts";

const yearEnum = z.enum(["ONE", "TWO"]);

const formSchema = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email address"),
  collegeId: z.coerce.number().min(1, "College is required"),
  year: yearEnum,
  phone: z.string().optional(),
  hackerearthUser: z.string().optional(),
});

export default function AddParticipant() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      year: "ONE",
    },
  });

  useEffect(() => {
    async function fetchColleges() {
      try {
        const response = await collegeService.getAll({ take: 500 }); // Fetch a large number of colleges
        setColleges(response.items);
      } catch (error) {
        console.error("Failed to load colleges for selection.");
      }
    }
    fetchColleges();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await participantService.create(values);
      mapped_toast("Participant created successfully!", "success");
      navigate("/participants");
    } catch (error: any) {
      if (error?.response?.status === 403) {
        mapped_toast(
          "You do not have permission to perform this action.",
          "warning",
        );
        return;
      }
      mapped_toast(error?.message || "Failed to create participant.", "error");
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          mapped_toast("Could not read file.", "error");
          return;
        }
        // Assuming CSV format: name,email,collegeCode, year,hackerearthUser, phone
        const lines = text.split("\n").slice(1); // Skip header
        const data = lines
          .map((line) => {
            const [name, email, collegeCode, year, phone, hackerearthUser] =
              line.split(",");
            return { name, email, collegeCode, year, phone, hackerearthUser };
          })
          .filter((d) => d.email); // Basic validation
        const result = await participantService.bulkImport(data);
        if (result.failed > 0) {
          // TODO: Display detailed errors to the user
          mapped_toast(
            `Bulk import finished: ${result.inserted} inserted, ${result.failed} failed.`,
            "warning",
          );
          console.error(result);
        } else
          mapped_toast(
            `Bulk import finished: ${result.inserted} inserted`,
            "success",
          );
        navigate("/participants");
      } catch (error: any) {
        mapped_toast("Failed to process bulk import.", "error");
        console.error("Failed to process bulk import.", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          New Participant
        </h2>
        <p className="text-sm text-[#bcc9c5]">
          Participant Registration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-lowest rounded-2xl p-8 lg:p-12">
          <h3 className="text-xl font-semibold text-white mb-8 border-b border-surface-highest/50 pb-4">
            Manual Entry
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="collegeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ONE">First</SelectItem>
                          <SelectItem value="TWO">Second</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hackerearthUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HackerEarth User (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-teal hover:bg-teal/90 text-[#00201b] font-semibold py-6 mt-8"
              >
                {form.formState.isSubmitting ? "Saving..." : "Add Participant"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-teal/40 bg-surface-lowest rounded-2xl p-12 h-full min-h-[400px] flex flex-col items-center justify-center text-center hover:border-teal"
          >
            <div className="w-20 h-20 rounded-full bg-surface-highest flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-teal" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Bulk Import</h3>
            <p className="text-[#bcc9c5] text-sm mb-8 leading-relaxed">
              Upload a CSV file to add multiple participants at once.
            </p>
            <span className="text-xs font-semibold text-teal bg-teal/10 px-5 py-3 rounded-full">
              Select File
            </span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
