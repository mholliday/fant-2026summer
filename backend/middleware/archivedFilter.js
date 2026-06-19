const archivedFilter = (archived = false) => {
  return (req, res, next) => {
    req.query.archived = archived;
    next();
  };
};

module.exports = archivedFilter;
