import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Migration "migration";

(with migration = Migration.run)
actor {
  // HighScore type
  type HighScore = {
    player : Principal;
    score : Nat;
    timestamp : Time.Time;
    playerName : Text;
  };

  module HighScore {
    public func compare(highScore1 : HighScore, highScore2 : HighScore) : Order.Order {
      switch (Nat.compare(highScore2.score, highScore1.score)) {
        case (#equal) { Int.compare(highScore2.timestamp, highScore1.timestamp) };
        case (order) { order };
      };
    };
  };

  // Profile type
  type Profile = {
    name : Text;
    highScore : HighScore;
  };

  // User profile type for access control system
  public type UserProfile = {
    name : Text;
  };

  // Persistent state
  let accessControlState = AccessControl.initState(); // initialize users
  include MixinAuthorization(accessControlState);

  let profiles = Map.empty<Principal, Profile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var totalPlayersJoined = 0;
  var activePlayers = 0;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Game functions
  public shared ({ caller }) func submitScore(name : Text, score : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit scores");
    };
    if (score <= 0) { Runtime.trap("Score must be positive") };
    let highScore = {
      player = caller;
      score;
      timestamp = Time.now();
      playerName = name;
    };
    switch (profiles.get(caller)) {
      case (null) {
        profiles.add(
          caller,
          {
            name;
            highScore;
          },
        );
      };
      case (?existingProfile) {
        if (score > existingProfile.highScore.score) {
          profiles.add(
            caller,
            {
              name;
              highScore;
            },
          );
        };
      };
    };
  };

  public shared ({ caller }) func recordPlayerJoin() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join the game");
    };
    totalPlayersJoined += 1;
    totalPlayersJoined;
  };

  public query ({ caller }) func getTotalPlayersJoined() : async Nat {
    totalPlayersJoined;
  };

  public query ({ caller }) func getBestScore() : async HighScore {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their scores");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile.highScore };
    };
  };

  public query ({ caller }) func getGlobalLeaderboard(limit : Nat) : async [HighScore] {
    let allHighScores = profiles.values().toArray().map(
      func(profile) { profile.highScore }
    );
    let sortedHighScores = allHighScores.sort();
    let len = sortedHighScores.size();
    if (len <= limit) {
      return sortedHighScores;
    };
    Array.tabulate<HighScore>(
      limit,
      func(i) { sortedHighScores[i] },
    );
  };

  // Active players tracking
  public shared ({ caller }) func recordActivePlayer() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record active players");
    };
    activePlayers += 1;
    activePlayers;
  };

  public shared ({ caller }) func recordPlayerLeave() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record player leaving");
    };
    if (activePlayers > 0) { activePlayers -= 1 };
    activePlayers;
  };

  public query ({ caller }) func getActivePlayers() : async Nat {
    activePlayers;
  };

  // Stripe payment integration
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    switch (stripeConfig) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkoutSessions");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) {
        await Stripe.createCheckoutSession(
          config,
          caller,
          items,
          successUrl,
          cancelUrl,
          transform,
        );
      };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can check session status");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) {
        await Stripe.getSessionStatus(config, sessionId, transform);
      };
    };
  };
};
