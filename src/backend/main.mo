import Map "mo:core/Map";
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  let products = Map.empty<Nat, Product>();
  let categoryList = List.empty<Category>();

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Nat.compare(product1.id, product2.id);
    };
  };

  let categoryMap = Map.empty<Text, ()>();

  module Category {
    public func compare(category1 : Category, category2 : Category) : Order.Order {
      Text.compare(category1.name, category2.name);
    };
  };

  var productId = 0;
  let categoryCache = Map.empty<Text, Bool>();

  type Category = {
    name : Text;
  };

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Category;
    image : Storage.ExternalBlob;
    isActive : Bool;
  };

  type ProductInput = {
    name : Text;
    description : Text;
    price : Nat;
    categoryName : Text;
    image : Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  public shared ({ caller }) func createProduct(productInput : ProductInput) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create products");
    };
    let id = productId;
    let product : Product = {
      productInput with
      id;
      category = {
        name = productInput.categoryName;
      };
      isActive = true;
    };
    products.add(id, product);
    productId += 1;
    if (not categoryCache.containsKey(productInput.categoryName)) {
      categoryCache.add(productInput.categoryName, true);
      let category : Category = {
        name = productInput.categoryName;
      };
      categoryList.add(category);
      categoryMap.add(productInput.categoryName, ());
    };
    id;
  };

  public query func readProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(id);
  };

  public shared ({ caller }) func editProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can edit products");
    };
    if (not products.containsKey(product.id)) { Runtime.trap("Product does not exist") };
    products.add(product.id, product);
    if (not categoryCache.containsKey(product.category.name)) {
      categoryCache.add(product.category.name, true);
      categoryList.add(product.category);
      categoryMap.add(product.category.name, ());
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query func filterByCategory(categoryName : Text) : async [Product] {
    products.values().toArray().filter(
      func(product) { Text.equal(product.category.name, categoryName) }
    );
  };

  public query func getCategories() : async [Category] {
    categoryList.toArray().sort();
  };
};
