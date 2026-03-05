import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";



actor {
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

  type Profile = {
    name : Text;
    highScore : HighScore;
  };

  let profiles = Map.empty<Principal, Profile>();
  var totalPlayersJoined = 0;

  public shared ({ caller }) func submitScore(name : Text, score : Nat) : async () {
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
    totalPlayersJoined += 1;
    totalPlayersJoined;
  };

  public query ({ caller }) func getTotalPlayersJoined() : async Nat {
    totalPlayersJoined;
  };

  public query ({ caller }) func getBestScore() : async HighScore {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
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
};
