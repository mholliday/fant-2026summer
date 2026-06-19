class AuthDataService {
  constructor(axiosConfig) {
    this.axios = axiosConfig;
  }

  login(username, password) {
    return this.axios.instance.post("/auth/login", { username, password });
  }

  logout() {
    return this.axios.instance.post("/auth/logout");
  }

  refresh() {
    return this.axios.instance.get("/auth/refresh");
  }
}

export default AuthDataService;
