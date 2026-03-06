import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HighScore } from "../backend.d";
import { useActor } from "./useActor";

export function useTotalPlayersJoined() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalPlayersJoined"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getTotalPlayersJoined();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useRecordPlayerJoin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.recordPlayerJoin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["totalPlayersJoined"] });
    },
  });
}

export function useLeaderboard(limit = 10n) {
  const { actor, isFetching } = useActor();
  return useQuery<HighScore[]>({
    queryKey: ["leaderboard", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGlobalLeaderboard(limit);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useBestScore() {
  const { actor, isFetching } = useActor();
  return useQuery<HighScore>({
    queryKey: ["bestScore"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getBestScore();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, score }: { name: string; score: bigint }) => {
      if (!actor) throw new Error("No actor");
      await actor.submitScore(name, score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["bestScore"] });
    },
  });
}

export function useActivePlayers() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["activePlayers"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getActivePlayers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useRecordActivePlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.recordActivePlayer();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activePlayers"] });
    },
  });
}

export function useRecordPlayerLeave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.recordPlayerLeave();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activePlayers"] });
    },
  });
}
