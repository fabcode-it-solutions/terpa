"use client";

import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  query: z.string().trim(),
});

type Props = {
  placeholder?: string;
};

export default function SearchBox(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm({
    resolver: zodResolver(schema),
    values: { query: searchParams.get("query") ?? "" },
  });

  const onSubmit = form.handleSubmit((data) => {
    const newSearchParams = new URLSearchParams(searchParams);
    data.query.length > 0
      ? newSearchParams.set("query", data.query)
      : newSearchParams.delete("query");
    router.push(`?${newSearchParams.toString()}`);
    setTimeout(() => router.refresh(), 0);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="relative">
          <FormField
            name="query"
            render={({ field }) => (
              <FormItem>
                <Input
                  {...field}
                  placeholder={props.placeholder || "Buscar..."}
                  className="pl-9 h-9"
                />
              </FormItem>
            )}
          />
          <SearchIcon className="w-4 h-4 absolute left-3 top-[10px] text-muted-foreground" />
        </div>
      </form>
    </Form>
  );
}
