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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { participantService, collegeService } from "@/api/services";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { College } from "@/api/types";
import { Upload } from "lucide-react";

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
        toast.error("Failed to load colleges for selection.");
      }
    }
    fetchColleges();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await participantService.create(values);
      toast.success("Participant created successfully!");
      navigate("/participants");
    } catch (error: any) {
      toast.error(error.message || "Failed to create participant");
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
          toast.error("Could not read file.");
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
        toast.success(
          `Bulk import finished: ${result.inserted} inserted, ${result.failed} failed.`,
        );
        if (result.failed > 0) {
          // TODO: Display detailed errors to the user
          console.error("Failed imports:", result.errors);
        }
        navigate("/participants");
      } catch (error: any) {
        toast.error(error.message || "Failed to process bulk import.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Add New Participant
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the details for the new participant or use bulk import.
          </p>
        </div>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import (CSV)
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Participant Details</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Creating..."
                  : "Create Participant"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
