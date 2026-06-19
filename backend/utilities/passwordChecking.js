const defaultChecks = [
  { regex: /[A-Z]/, weight: 1 },       // must have uppercase
  { regex: /[a-z]/, weight: 1 },       // must have lowercase
  { regex: /[\d]/, weight: 1 },        // must have a digit
  { regex: /[!@#$%^&*?]/, weight: 1 }, // must have a special character
  { regex: /.{8,}/, weight: 1 },       // at least 8 chars
];

const createPasswordTester = (checks, difference = 0) => (password) => {
  let total = 0;
  let strength = 0;
  checks.forEach(({ regex, weight }) => {
    total += weight;
    if (password.match(regex)) strength += weight;
  });
  return strength + difference >= total;
};

const defaultPasswordTester = createPasswordTester(defaultChecks, 0);

module.exports = { createPasswordTester, defaultPasswordTester };
