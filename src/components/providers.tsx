"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <RealtimeProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeToggle />
          {children}
        </QueryClientProvider>
      </RealtimeProvider>
    </ThemeProvider>
  );
};
