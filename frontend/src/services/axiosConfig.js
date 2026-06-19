/**
 * AxiosConfig — wraps an Axios instance with auth token management.
 * Bug fix: on token refresh, the retry used `this.axios.request(originalRequest)`
 * but `this.axios` is the AxiosConfig instance, not the Axios instance.
 * Should be `this.instance.request(originalRequest)`.
 */
import axios from "axios";
import DonorDataService from "./donorDataService";
import UserDataService from "./userDataService";
import AuthDataService from "./authDataService";
import AdminDataService from "./adminDataService";

class AxiosConfig {
  constructor(url) {
    this.url = url;
    this.instance = axios.create({
      baseURL: url,
      headers: { "Content-type": "application/json" },
      withCredentials: true,
    });

    this.donor = new DonorDataService(this);
    this.user = new UserDataService(this);
    this.auth = new AuthDataService(this);
    this.admin = new AdminDataService(this);

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response ? error.response.status : null;
        const originalRequest = error.config;

        // Avoid infinite retry loops
        if (status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const res = await this.auth.refresh();
            const accessToken = res.data.accessToken;
            if (accessToken) {
              this.setHeaderToken(accessToken);
              if (this.onRefreshCallback) this.onRefreshCallback(accessToken);
              originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
              // Bug fix: was `this.axios.request` — should be `this.instance.request`
              return this.instance.request(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setHeaderToken(accessToken = "") {
    this.instance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  onRefresh(callback) {
    this.onRefreshCallback = callback;
  }
}

export default AxiosConfig;
