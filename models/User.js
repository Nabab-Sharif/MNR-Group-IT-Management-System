/*
  User Model (for localStorage)
  - userId: Unique identifier for the user.
  - name: User's name.
  - profilePicture: Path to the user's profile picture.
  - productTotals: An object to store the total count of each product the user has.
    Example: { "Laptop": 2, "Mouse": 1 }
*/

class User {
  constructor(userId, name, profilePicture = '', productTotals = {}) {
    this.userId = userId;
    this.name = name;
    this.profilePicture = profilePicture;
    this.productTotals = productTotals;
  }
}

// Example usage:
// const user = new User('user1', 'Alice');
