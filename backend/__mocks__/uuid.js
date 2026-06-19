// Manual mock for uuid so Jest doesn't hit the ESM-only build
let counter = 0;
module.exports = { v4: () => 'test-uuid-' + (++counter) };
