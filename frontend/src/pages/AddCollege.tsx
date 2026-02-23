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
import { useEffect } from "react";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        code: college.code,
        name: college.name,
      });
    }
  }, [college, isEditMode, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode) {
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
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} college`);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? "Edit College" : "Add New College"}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? "Update the details for the college." : "Enter the details for the new college."}
        </p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>College Details</CardTitle>
        </CardHeader>
        <CardContent>
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
  );
}
