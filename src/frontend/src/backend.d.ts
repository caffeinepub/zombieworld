import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HighScore {
    player: Principal;
    score: bigint;
    timestamp: Time;
    playerName: string;
}
export type Time = bigint;
export interface backendInterface {
    getBestScore(): Promise<HighScore>;
    getGlobalLeaderboard(limit: bigint): Promise<Array<HighScore>>;
    submitScore(name: string, score: bigint): Promise<void>;
}
