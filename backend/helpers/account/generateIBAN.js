const generateIBAN = (accountNumber) => {
  // TR + 2 check digits + 5 bank code + 1 reserve + 16 account number
  const bankCode = "00001"; // Atom Bank kodu
  const reserve = "0";
  const checkDigits = Math.floor(Math.random() * 90 + 10).toString();
  return `TR${checkDigits}${bankCode}${reserve}${accountNumber}`;
};

module.exports = { generateIBAN };
