"use client";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
};

function Lobby() {
  const { username } = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-linear-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Alerts */}
        {wasDestroyed && (
          <div className="border border-red-500/50 bg-red-950/30 p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-red-500">
              <span className="text-xl">💥</span>
              <span className="font-bold tracking-wider">ROOM DESTROYED</span>
            </div>
            <p className="text-red-400/70 text-sm mt-1">All messages have been permanently erased</p>
          </div>
        )}
        {error === "room_not_found" && (
          <div className="border border-amber-500/50 bg-amber-950/30 p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <span className="text-xl">⚠️</span>
              <span className="font-bold tracking-wider">ROOM NOT FOUND</span>
            </div>
            <p className="text-amber-400/70 text-sm mt-1">This room may have self-destructed</p>
          </div>
        )}
        {error === "room_full" && (
          <div className="border border-amber-500/50 bg-amber-950/30 p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <span className="text-xl">🚫</span>
              <span className="font-bold tracking-wider">ROOM FULL</span>
            </div>
            <p className="text-amber-400/70 text-sm mt-1">Maximum participants reached</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 text-red-500/80 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase">
            <span className="w-4 sm:w-8 h-px bg-red-500/50" />
            <span>Ephemeral Communications</span>
            <span className="w-4 sm:w-8 h-px bg-red-500/50" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-red-500 glow-red flicker">BURN</span>
            <span className="text-foreground">ROOM</span>
          </h1>
          
          <p className="text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed px-2">
            Self-destructing chat rooms. Messages vanish forever when the timer hits zero.
            <span className="text-red-400"> No logs. No traces. No evidence.</span>
          </p>
        </div>

        {/* Main card */}
        <div className="relative group mx-2 sm:mx-0">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-red-500/20 via-amber-500/20 to-red-500/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
          
          <div className="relative border border-card-border bg-card/80 p-5 sm:p-8 backdrop-blur-xl rounded-lg">
            <div className="space-y-5 sm:space-y-6">
              {/* Identity section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <label className="text-xs text-muted uppercase tracking-wider">
                    Your Anonymous Identity
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-background border border-card-border p-4 font-mono text-green-500 dark:text-green-400 dark:glow-green relative overflow-hidden">
                    <span className="relative z-10">{username}</span>
                    <div className="absolute inset-0 bg-linear-to-r from-green-500/5 to-transparent" />
                  </div>
                </div>
                <p className="text-muted text-xs">
                  This identity exists only for this session
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-card-border to-transparent" />
                <span className="text-muted text-xs">●</span>
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-card-border to-transparent" />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 p-3 rounded">
                <span className="text-amber-500 text-lg">⏱️</span>
                <div className="text-xs text-amber-700 dark:text-amber-200/70 leading-relaxed">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">10:00 countdown</span> begins when the room is created. 
                  All messages are permanently destroyed when time expires.
                </div>
              </div>

              {/* Create button */}
              <button
                disabled={isPending}
                onClick={() => createRoom()}
                className="w-full relative group/btn overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-linear-to-r from-red-600 via-red-500 to-amber-500 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                <div className="relative flex items-center justify-center gap-3 p-4 font-bold text-white tracking-wider">
                  {isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🔥</span>
                      <span>IGNITE NEW ROOM</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 px-2">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-muted text-[10px] sm:text-xs">
            <span className="flex items-center gap-1">
              <span className="text-red-500">◆</span> End-to-end ephemeral
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-500">◆</span> Zero persistence
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-500">◆</span> No accounts
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
export default Page;
