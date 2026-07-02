"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";
import { api } from "@/lib/api";

export default function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        provider: () => new Map(), // Global cache map to persist across route changes
        fetcher: (url: string) => api.get(url).then(res => res.data),
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
