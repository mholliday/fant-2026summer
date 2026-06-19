class DonorDataService {
  constructor(axiosInstance) {
    this.axios = axiosInstance;
  }

  getAll(page = 0, donorsPerPage = 10) {
    return this.axios.instance.get(`/donor?page=${page}&donorsPerPage=${donorsPerPage}`);
  }

  getByDid(did) {
    return this.axios.instance.get(`/donor/${did}`);
  }

  find(filters, page = 0) {
    const params = new URLSearchParams();
    for (let key in filters) {
      params.append(key, filters[key]);
    }
    params.append("page", page);
    return this.axios.instance.get(`/donor?${params.toString()}`);
  }

  createDonor(data) {
    return this.axios.instance.post("/donor", data);
  }

  updateDonor(data) {
    return this.axios.instance.put("/donor", data);
  }

  archiveDonor(did) {
    return this.axios.instance.delete(`/donor?did=${did}`);
  }

  deleteDonor(did) {
    return this.axios.instance.delete(`/donor/archive?did=${did}`);
  }

  getArchive(page = 0) {
    return this.axios.instance.get(`/donor/archive?page=${page}`);
  }

  restoreArchived(did) {
    return this.axios.instance.put(`/donor/archive?did=${did}`);
  }

  getVersions(did) {
    return this.axios.instance.get(`/donor/version?did=${did}`);
  }

  restoreVersion(vid) {
    return this.axios.instance.put(`/donor/version?vid=${vid}`);
  }

  getByVid(did, vid) {
    return this.axios.instance.get(`/donor/${did}?vid=${vid}`);
  }

  getNextID() {
    return this.axios.instance.get("/donor/next-id");
  }

  getPDF(did) {
    return this.axios.instance.get(`/donor/pdf?did=${did}`, { responseType: "blob" });
  }

  findArch(filters, page = 0) {
    const params = new URLSearchParams();
    for (let key in filters) {
      params.append(key, filters[key]);
    }
    params.append("page", page);
    return this.axios.instance.get(`/donor/archive?${params.toString()}`);
  }
}

/**
 * Converts donor data to the DB schema format.
 */
const toDBSchema = (donorID, donorData) => ({
  donor: { donorID, data: { ...donorData } },
});

/**
 * Converts a donor from DB format to accordion/UI format.
 */
const toAccordionSchema = (donorData) => {
  const keyToExclude = ["donorID", "archived", "timestamp", "modifiedBy"];
  let accordionDonor = { identification: {}, ...donorData.skeleton };
  for (let key of Object.keys(donorData)) {
    if (typeof donorData[key] !== "object" && !keyToExclude.includes(key)) {
      accordionDonor.identification[key] = donorData[key];
    }
  }
  return accordionDonor;
};

export default DonorDataService;
export { DonorDataService, toDBSchema, toAccordionSchema };
