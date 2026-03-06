module {
  type OldActor = {
    totalPlayersJoined : Nat;
  };

  type NewActor = {
    totalPlayersJoined : Nat;
    activePlayers : Nat;
  };

  public func run(old : OldActor) : NewActor {
    { old with activePlayers = 0 };
  };
};
