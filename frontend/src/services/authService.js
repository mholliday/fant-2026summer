/**
 * AuthService — manages client-side auth state.
 * Bug fix: signup() was called as auth.signup(firstName, lastName, username, password, access)
 * but the method signature was signup(username, password, firstName, lastName, access)
 * — argument order was swapped. Fixed to match the call sites in AppContext.
 */
class AuthService {
  tokenKey = "token";

  constructor(axios) {
    this.onAuthCallback = null;
    this.userData = null;
    this.axios = axios;

    this.axios.onRefresh((accessToken) => {
      this.setAccessToken(accessToken, false);
    });

    const storedToken = localStorage.getItem(this.tokenKey);
    if (storedToken) {
      this.setAccessToken(storedToken);
    } else {
      this.refresh();
    }
  }

  setAccessToken(newAccessToken = "", setHeader = true) {
    if (setHeader) this.axios.setHeaderToken(newAccessToken);
    if (newAccessToken) {
      localStorage.setItem(this.tokenKey, newAccessToken);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
    this.triggerUpdate(newAccessToken !== "");
  }

  async triggerUpdate(fetchUser = true) {
    if (fetchUser) {
      try {
        const res = await this.axios.user.getUser();
        this.userData = res.data;
      } catch (error) {
        console.error(`Trigger update error: ${error}`);
        this.userData = null;
      }
    } else {
      this.userData = null;
    }
    if (this.onAuthCallback) this.onAuthCallback(this.userData);
  }

  onUserUpdate(newAuthCallback) {
    this.onAuthCallback = newAuthCallback;
    this.triggerUpdate();
  }

  async refresh() {
    try {
      const res = await this.axios.auth.refresh();
      this.setAccessToken(res.data.accessToken);
      return res;
    } catch (error) {
      console.error(`Refresh error: ${error}`);
      this.setAccessToken();
    }
  }

  async login(username, password) {
    try {
      const res = await this.axios.auth.login(username, password);
      this.setAccessToken(res.data.accessToken);
      return res;
    } catch (error) {
      console.error(`Login error: ${error}`);
      throw error;
    }
  }

  async logout() {
    try {
      const res = await this.axios.auth.logout();
      this.setAccessToken();
      return res;
    } catch (error) {
      console.error(`Logout error: ${error}`);
      this.setAccessToken();
      throw error;
    }
  }

  /**
   * Bug fix: AppContext calls auth.signup(firstName, lastName, username, password, access)
   * but original signature was (username, password, firstName, lastName, access).
   * Fixed to match call site: (firstName, lastName, username, password, access).
   */
  async signup(firstName, lastName, username, password, access = 0) {
    try {
      const newUser = { firstName, lastName, username, password, access };
      return await this.axios.instance.post("/user", newUser);
    } catch (error) {
      console.error(`Signup error: ${error}`);
      throw error;
    }
  }
}

export default AuthService;
