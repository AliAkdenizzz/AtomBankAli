const generateAccountNumber = () => {
  // 16 haneli account number
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return timestamp + random;
};

module.exports = { generateAccountNumber };
