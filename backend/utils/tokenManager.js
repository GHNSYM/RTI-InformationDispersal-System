const tokenBlacklist = new Set();

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Clean up expired tokens from blacklist periodically
setInterval(() => {
  tokenBlacklist.clear();
}, 24 * 60 * 60 * 1000); // Clear blacklist every 24 hours

module.exports = {
  blacklistToken,
  isTokenBlacklisted
};
