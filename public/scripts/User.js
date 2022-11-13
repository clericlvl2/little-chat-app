class User {
  constructor(id, username) {
    this.id = id;
    this.name = username;
  }
  setName(newName) {
    this.name = newName;
    sessionStorage.setItem('username', newName);
  }
}