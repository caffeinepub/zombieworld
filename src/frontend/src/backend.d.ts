import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface HighScore {
    player: Principal;
    score: bigint;
    timestamp: Time;
    playerName: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    getActivePlayers(): Promise<bigint>;
    getBestScore(): Promise<HighScore>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGlobalLeaderboard(limit: bigint): Promise<Array<HighScore>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTotalPlayersJoined(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    recordActivePlayer(): Promise<bigint>;
    recordPlayerJoin(): Promise<bigint>;
    recordPlayerLeave(): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitScore(name: string, score: bigint): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
