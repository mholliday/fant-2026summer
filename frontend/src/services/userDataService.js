class UserDataService {
  constructor(axiosInstance) {
    this.axios = axiosInstance;
  }

  getAll() {
    return this.axios.instance.get("/user/all");
  }

  getUser() {
    return this.axios.instance.get("/user");
  }

  getByID(id) {
    return this.axios.instance.get(`/user/${id}`);
  }

  createUser(data) {
    return this.axios.instance.post("/user", data);
  }

  updateUser(data) {
    return this.axios.instance.put("/user", data);
  }

  deleteUser(id) {
    return this.axios.instance.delete(`/user?uid=${id}`);
  }

  resetPass(password) {
    return this.axios.instance.put("/user/reset-password", { password });
  }
}

export default UserDataService;
