"use client";

import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  query: z.string().trim(),
});

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
};

export default function TeamSearchBox(props: Props) {
  const { query, onQueryChange, placeholder } = props;
  const form = useForm({
    resolver: zodResolver(schema),
    values: { query },
  });

  const watchedQuery = form.watch("query");

  // Debounced search with 150ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(watchedQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [watchedQuery, onQueryChange]);

  return (
    <Form {...form}>
      <div className="relative">
        <FormField
          name="query"
          render={({ field }) => (
            <FormItem>
              <Input
                {...field}
                placeholder={
                  placeholder ||
                  "Buscar por nombre, código, email o teléfono..."
                }
                className="pl-9 h-9"
              />
            </FormItem>
          )}
        />
        <SearchIcon className="w-4 h-4 absolute left-3 top-[10px] text-muted-foreground" />
      </div>
    </Form>
  );
}
