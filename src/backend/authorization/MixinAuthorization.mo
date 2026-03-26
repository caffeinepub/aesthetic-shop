import AccessControl "./access-control";
import Prim "mo:prim";

mixin (accessControlState : AccessControl.AccessControlState) {
  let ADMIN_TOKEN : Text = "aesthetic-admin-2024";

  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    let adminToken = switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
      case (?token) { token };
      case (null) { ADMIN_TOKEN };
    };
    AccessControl.initialize(accessControlState, caller, adminToken, userSecret);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };
};
