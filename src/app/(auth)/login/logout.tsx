"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    // Basic client-side logout just to be sure we clear local auth state
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.auth.signOut();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    window.location.href = "/login";
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-[10px] bg-red-50/50 px-3 py-2.5 transition-colors duration-150 hover:bg-red-100 text-red-600 mt-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span className="truncate text-[13px] font-semibold">Abmelden</span>
    </button>
  );
}
