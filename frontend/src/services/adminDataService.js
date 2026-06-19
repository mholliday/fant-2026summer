class AdminDataService {
  constructor(axiosInstance) {
    this.axios = axiosInstance;
  }

  backup() {
    return this.axios.instance.get('/admin/backup', { responseType: 'blob' });
  }

  restore(data) {
    return this.axios.instance.post('/admin/restore', data);
  }
}

export default AdminDataService;
