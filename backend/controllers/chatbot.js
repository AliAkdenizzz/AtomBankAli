const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// In-memory session store for pending confirmations
const pendingSessions = new Map();

// ===================== TRANSLATIONS =====================
const translations = {
  // Greetings
  greeting: {
    tr: (name) => `Merhaba ${name}! 👋\n\nBen Atom Bank'ın akıllı asistanıyım. Size nasıl yardımcı olabilirim?\n\n**Yapabileceğim işlemler:**\n• Bakiye sorgulama\n• Fatura ödeme\n• Para transferi\n• Hesap açma\n• İşlem geçmişi görüntüleme`,
    en: (name) => `Hello ${name}! 👋\n\nI'm Atom Bank's smart assistant. How can I help you?\n\n**What I can do:**\n• Balance inquiry\n• Bill payment\n• Money transfer\n• Open account\n• Transaction history`
  },
  greetingSuggestions: {
    tr: ["Bakiyem", "Faturalarım", "Hesaplarım", "Yardım"],
    en: ["My Balance", "My Bills", "My Accounts", "Help"]
  },

  // Balance
  noActiveAccount: {
    tr: "Henüz aktif bir hesabınız bulunmuyor. Yeni hesap açmak ister misiniz?",
    en: "You don't have any active accounts yet. Would you like to open a new account?"
  },
  accountBalances: {
    tr: "**Hesap Bakiyeleriniz:**",
    en: "**Your Account Balances:**"
  },
  balanceSuggestions: {
    tr: ["Hesaplarım", "İşlem geçmişi", "Para gönder"],
    en: ["My Accounts", "Transaction history", "Send money"]
  },
  newAccountSuggestions: {
    tr: ["Yeni hesap aç", "TRY hesabı aç", "USD hesabı aç"],
    en: ["Open new account", "Open TRY account", "Open USD account"]
  },

  // Accounts
  noAccount: {
    tr: "Henüz bir hesabınız bulunmuyor. Yeni hesap açmak ister misiniz?",
    en: "You don't have any accounts yet. Would you like to open a new account?"
  },
  accountsCount: {
    tr: (count) => `**${count} hesabınız bulunuyor:**`,
    en: (count) => `**You have ${count} account(s):**`
  },
  accountSuggestions: {
    tr: ["Bakiyem", "Yeni hesap aç", "Para gönder"],
    en: ["My Balance", "Open new account", "Send money"]
  },

  // Create Account
  newAccountConfirm: {
    tr: (type, currency) => `**Yeni ${type} ${currency} Hesabı** oluşturulacak.\n\nOnaylıyor musunuz?`,
    en: (type, currency) => `**New ${type} ${currency} Account** will be created.\n\nDo you confirm?`
  },
  accountTypeNames: {
    tr: { checking: "Vadesiz", savings: "Vadeli", deposit: "Mevduat", investment: "Yatırım" },
    en: { checking: "Checking", savings: "Savings", deposit: "Deposit", investment: "Investment" }
  },
  confirmSuggestions: {
    tr: ["Evet", "Hayır"],
    en: ["Yes", "No"]
  },

  // Transfer
  transferNeedInfo: {
    tr: "Para göndermek için alıcı ve miktar belirtmeniz gerekiyor.\n\n**Örnek:** \"Ali'ye 500 TL gönder\"",
    en: "You need to specify recipient and amount to send money.\n\n**Example:** \"Send 500 TRY to Ali\""
  },
  transferRecipientSuggestions: {
    tr: ["Bakiyem", "Alıcılarım"],
    en: ["My Balance", "My Recipients"]
  },
  transferHowMuch: {
    tr: (name) => `${name} kişisine ne kadar göndermek istiyorsunuz?`,
    en: (name) => `How much would you like to send to ${name}?`
  },
  recipientNotFound: {
    tr: (name) => `"${name}" isimli kayıtlı alıcı bulunamadı.\n\nKayıtlı alıcılarınız:`,
    en: (name) => `Saved recipient "${name}" not found.\n\nYour saved recipients:`
  },
  currencyMismatch: {
    tr: (sent, recipient) => `❌ **Para birimi uyuşmuyor!**\n\n• Göndermek istediğiniz: ${sent}\n• Alıcının hesap para birimi: ${recipient}\n\nFarklı para birimleri arasında transfer yapılamaz.`,
    en: (sent, recipient) => `❌ **Currency mismatch!**\n\n• You want to send: ${sent}\n• Recipient's account currency: ${recipient}\n\nTransfers between different currencies are not allowed.`
  },
  insufficientBalance: {
    tr: (amount, currency) => `Yeterli bakiye bulunamadı. ${amount} göndermek için yeterli ${currency} bakiyeniz yok.`,
    en: (amount, currency) => `Insufficient balance. You don't have enough ${currency} to send ${amount}.`
  },
  transferConfirm: {
    tr: (name, iban, currency, amount, account) => `**Para Transferi**\n\n• Alıcı: ${name}\n• Alıcı IBAN: ${iban}\n• Para Birimi: ${currency}\n• Miktar: ${amount}\n• Gönderen Hesap: ${account}\n\nOnaylıyor musunuz?`,
    en: (name, iban, currency, amount, account) => `**Money Transfer**\n\n• Recipient: ${name}\n• Recipient IBAN: ${iban}\n• Currency: ${currency}\n• Amount: ${amount}\n• From Account: ${account}\n\nDo you confirm?`
  },

  // Bills
  noBills: {
    tr: "Ödenmemiş faturanız bulunmuyor! 🎉",
    en: "You have no unpaid bills! 🎉"
  },
  billsSuggestions: {
    tr: ["Bakiyem", "Hesaplarım", "İşlem geçmişi"],
    en: ["My Balance", "My Accounts", "Transaction history"]
  },
  unpaidBillsCount: {
    tr: (count) => `**${count} Ödenmemiş Faturanız Var:**`,
    en: (count) => `**You Have ${count} Unpaid Bill(s):**`
  },
  billPaySuggestions: {
    tr: ["Fatura öde", "Elektrik faturası öde", "Tüm faturaları öde"],
    en: ["Pay bill", "Pay electricity bill", "Pay all bills"]
  },
  billNotFound: {
    tr: (category) => `${category} kategorisinde ödenmemiş fatura bulunamadı.`,
    en: (category) => `No unpaid bill found in ${category} category.`
  },
  whichBill: {
    tr: "Hangi faturayı ödemek istiyorsunuz?",
    en: "Which bill would you like to pay?"
  },
  billPayConfirm: {
    tr: (title, amount, account) => `**Fatura Ödeme**\n\n• Fatura: ${title}\n• Tutar: ${amount}\n• Ödenecek Hesap: ${account}\n\nOnaylıyor musunuz?`,
    en: (title, amount, account) => `**Bill Payment**\n\n• Bill: ${title}\n• Amount: ${amount}\n• From Account: ${account}\n\nDo you confirm?`
  },
  billNeedBalance: {
    tr: (title, amount) => `Yeterli bakiye bulunamadı. ${title} faturası için ${amount} gerekiyor.`,
    en: (title, amount) => `Insufficient balance. ${amount} is required for ${title} bill.`
  },

  // Transaction History
  noTransactions: {
    tr: "Henüz işlem geçmişiniz bulunmuyor.",
    en: "You don't have any transaction history yet."
  },
  transactionSuggestions: {
    tr: ["Bakiyem", "Para gönder", "Fatura öde"],
    en: ["My Balance", "Send money", "Pay bill"]
  },
  recentTransactions: {
    tr: "**Son İşlemleriniz:**",
    en: "**Your Recent Transactions:**"
  },
  transactionHistorySuggestions: {
    tr: ["Bakiyem", "Harcamalarım", "Faturalarım"],
    en: ["My Balance", "My Spending", "My Bills"]
  },

  // Spending Analysis
  spendingAnalysis: {
    tr: "**Harcama Analiziniz:**",
    en: "**Your Spending Analysis:**"
  },
  spendingWarning: {
    tr: (category, percentage) => `⚠️ **${category}** harcamalarınız toplam harcamalarınızın %${percentage}'ini oluşturuyor.`,
    en: (category, percentage) => `⚠️ **${category}** spending makes up ${percentage}% of your total spending.`
  },
  spendingSuggestions: {
    tr: ["İşlem geçmişi", "Bakiyem", "Hedeflerim"],
    en: ["Transaction history", "My Balance", "My Goals"]
  },
  categoryNames: {
    tr: {
      "transfer-out": "Transfer",
      "bill-payment": "Fatura",
      "withdrawal": "Para Çekme",
      "electricity": "Elektrik",
      "water": "Su",
      "gas": "Doğalgaz",
      "internet": "İnternet",
      "phone": "Telefon",
      "rent": "Kira",
      "streaming": "Streaming",
      "insurance": "Sigorta",
      "other": "Diğer"
    },
    en: {
      "transfer-out": "Transfer",
      "bill-payment": "Bill Payment",
      "withdrawal": "Withdrawal",
      "electricity": "Electricity",
      "water": "Water",
      "gas": "Gas",
      "internet": "Internet",
      "phone": "Phone",
      "rent": "Rent",
      "streaming": "Streaming",
      "insurance": "Insurance",
      "other": "Other"
    }
  },

  // Savings Goals
  noGoals: {
    tr: "Henüz bir tasarruf hedefiniz bulunmuyor.",
    en: "You don't have any savings goals yet."
  },
  goalsSuggestions: {
    tr: ["Bakiyem", "Hesaplarım", "Yardım"],
    en: ["My Balance", "My Accounts", "Help"]
  },
  savingsGoals: {
    tr: "**Tasarruf Hedefleriniz:**",
    en: "**Your Savings Goals:**"
  },
  goalStatus: {
    tr: { active: "Devam ediyor", completed: "Tamamlandı" },
    en: { active: "In Progress", completed: "Completed" }
  },

  // Help
  helpTitle: {
    tr: `**Atom Bank Akıllı Asistan Yardım**\n\n**Hesap İşlemleri:**\n• "Bakiyem" - Bakiye sorgulama\n• "Hesaplarım" - Tüm hesapları görme\n• "Yeni hesap aç" - Hesap oluşturma\n\n**Para Transferi:**\n• "Ali'ye 500 TL gönder"\n• "Para gönder"\n\n**Fatura İşlemleri:**\n• "Faturalarım" - Bekleyen faturaları görme\n• "Elektrik faturasını öde"\n\n**Diğer:**\n• "İşlem geçmişi"\n• "Harcamalarım"\n• "Hedeflerim"`,
    en: `**Atom Bank Smart Assistant Help**\n\n**Account Operations:**\n• "My balance" - Check balance\n• "My accounts" - View all accounts\n• "Open new account" - Create account\n\n**Money Transfer:**\n• "Send 500 TRY to Ali"\n• "Send money"\n\n**Bill Operations:**\n• "My bills" - View pending bills\n• "Pay electricity bill"\n\n**Other:**\n• "Transaction history"\n• "My spending"\n• "My goals"`
  },
  helpSuggestions: {
    tr: ["Bakiyem", "Faturalarım", "Hesaplarım", "Para gönder"],
    en: ["My Balance", "My Bills", "My Accounts", "Send money"]
  },

  // Default
  notUnderstood: {
    tr: "Üzgünüm, ne demek istediğinizi anlayamadım. Size nasıl yardımcı olabilirim?\n\n\"Yardım\" yazarak yapabileceğim işlemleri görebilirsiniz.",
    en: "Sorry, I didn't understand what you meant. How can I help you?\n\nType \"Help\" to see what I can do."
  },
  defaultSuggestions: {
    tr: ["Yardım", "Bakiyem", "Faturalarım", "Hesaplarım"],
    en: ["Help", "My Balance", "My Bills", "My Accounts"]
  },

  // Confirmations
  actionCancelled: {
    tr: "İşlem iptal edildi.",
    en: "Action cancelled."
  },
  cancelledSuggestions: {
    tr: ["Bakiyem", "Faturalarım", "Hesaplarım"],
    en: ["My Balance", "My Bills", "My Accounts"]
  },

  // Success messages
  accountCreated: {
    tr: (name, iban) => `✅ **Hesabınız başarıyla oluşturuldu!**\n\n• Hesap: ${name}\n• IBAN: ${iban}`,
    en: (name, iban) => `✅ **Your account has been created successfully!**\n\n• Account: ${name}\n• IBAN: ${iban}`
  },
  transferSuccess: {
    tr: (name, amount, balance) => `✅ **Transfer başarılı!**\n\n• Alıcı: ${name}\n• Tutar: ${amount}\n• Yeni Bakiye: ${balance}`,
    en: (name, amount, balance) => `✅ **Transfer successful!**\n\n• Recipient: ${name}\n• Amount: ${amount}\n• New Balance: ${balance}`
  },
  billPaidSuccess: {
    tr: (title, amount, balance) => `✅ **Fatura başarıyla ödendi!**\n\n• Fatura: ${title}\n• Tutar: ${amount}\n• Yeni Bakiye: ${balance}`,
    en: (title, amount, balance) => `✅ **Bill paid successfully!**\n\n• Bill: ${title}\n• Amount: ${amount}\n• New Balance: ${balance}`
  },

  // Error messages
  transferFailed: {
    tr: "❌ Transfer başarısız! Yetersiz bakiye.",
    en: "❌ Transfer failed! Insufficient balance."
  },
  billNotFoundOrPaid: {
    tr: "❌ Fatura bulunamadı veya zaten ödenmiş.",
    en: "❌ Bill not found or already paid."
  },
  paymentFailed: {
    tr: "❌ Ödeme başarısız! Yetersiz bakiye.",
    en: "❌ Payment failed! Insufficient balance."
  },
  actionFailed: {
    tr: "İşlem gerçekleştirilemedi.",
    en: "Action could not be completed."
  }
};

// Helper: Get text by language
function getText(key, lang, ...args) {
  const text = translations[key];
  if (!text) return key;

  const langText = text[lang] || text['en'] || text['tr'];
  if (typeof langText === 'function') {
    return langText(...args);
  }
  return langText;
}

// Helper: Get array by language
function getArray(key, lang) {
  const arr = translations[key];
  if (!arr) return [];
  return arr[lang] || arr['en'] || arr['tr'] || [];
}

// Helper: Format currency
function formatCurrency(amount, currency = "TRY", lang = "tr") {
  const symbols = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper: Format date
function formatDate(date, lang = "tr") {
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Helper: Parse transfer command
function parseTransferCommand(message) {
  // Patterns: "Ali'ye 500 TL gönder", "500 TL Ali'ye gönder", "Ali'ye para gönder"
  const patterns = [
    /(.+?)'?[eyia] (\d+(?:[.,]\d+)?)\s*(tl|lira|try|usd|dolar|eur|euro|gbp)?(?:\s+gönder|\s+transfer|\s+yolla)?/i,
    /(\d+(?:[.,]\d+)?)\s*(tl|lira|try|usd|dolar|eur|euro|gbp)?\s+(.+?)'?[eyia](?:\s+gönder|\s+transfer|\s+yolla)/i,
    /(.+?)'?[eyia]\s+(?:para\s+)?(?:gönder|transfer|yolla)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      if (match.length === 4 && !isNaN(parseFloat(match[1]))) {
        // Pattern 2: amount first
        return {
          recipient: match[3].trim(),
          amount: parseFloat(match[1].replace(",", ".")),
          currency: normalizeCurrency(match[2]),
        };
      } else if (match.length === 4) {
        // Pattern 1: recipient first
        return {
          recipient: match[1].trim(),
          amount: parseFloat(match[2].replace(",", ".")),
          currency: normalizeCurrency(match[3]),
        };
      } else if (match.length === 2) {
        // Pattern 3: no amount
        return {
          recipient: match[1].trim(),
          amount: null,
          currency: null,
        };
      }
    }
  }
  return null;
}

// Helper: Normalize currency
function normalizeCurrency(curr) {
  if (!curr) return "TRY";
  curr = curr.toLowerCase();
  if (curr === "tl" || curr === "lira" || curr === "try") return "TRY";
  if (curr === "dolar" || curr === "usd") return "USD";
  if (curr === "euro" || curr === "eur") return "EUR";
  if (curr === "gbp") return "GBP";
  return "TRY";
}

// Helper: Parse account creation command
function parseAccountCommand(message) {
  // Patterns: "TRY hesabı aç", "dolar hesabı aç", "vadesiz TRY hesabı aç"
  const typeMap = {
    vadesiz: "checking",
    vadeli: "savings",
    mevduat: "deposit",
    yatırım: "investment",
    yatirim: "investment",
    tasarruf: "savings",
  };

  const currencyMap = {
    try: "TRY",
    tl: "TRY",
    lira: "TRY",
    dolar: "USD",
    usd: "USD",
    euro: "EUR",
    eur: "EUR",
    gbp: "GBP",
    sterlin: "GBP",
  };

  let accountType = "checking";
  let currency = "TRY";

  const lowerMsg = message.toLowerCase();

  // Find account type
  for (const [key, value] of Object.entries(typeMap)) {
    if (lowerMsg.includes(key)) {
      accountType = value;
      break;
    }
  }

  // Find currency
  for (const [key, value] of Object.entries(currencyMap)) {
    if (lowerMsg.includes(key)) {
      currency = value;
      break;
    }
  }

  return { accountType, currency };
}

// Helper: Parse bill payment command
function parseBillCommand(message) {
  const categoryMap = {
    elektrik: "electricity",
    su: "water",
    doğalgaz: "gas",
    dogalgaz: "gas",
    gaz: "gas",
    internet: "internet",
    telefon: "phone",
    kira: "rent",
    sigorta: "insurance",
    netflix: "streaming",
    spotify: "streaming",
  };

  const lowerMsg = message.toLowerCase();

  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }
  return null;
}

// Main chat handler
const sendMessage = errorWrapper(async (req, res, next) => {
  const { message, language } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === "") {
    return next(new CustomError("Message is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Get language: from request > user preferences > default 'en'
  const lang = language || user.preferences?.language || 'en';

  const userMessage = message.toLowerCase().trim();
  let response = "";
  let data = null;
  let requiresConfirmation = false;
  let suggestions = [];

  // Check for pending confirmation
  const pendingAction = pendingSessions.get(userId);
  if (pendingAction) {
    // Handle confirmation response
    const isConfirm = /^(evet|onay|tamam|e|yes|confirm|ok)$/i.test(userMessage);
    const isCancel = /^(hayır|hayir|iptal|vazgeç|vazgec|h|no|cancel)$/i.test(userMessage);

    if (isConfirm) {
      // Execute pending action with language
      const result = await executePendingAction(user, pendingAction, lang);
      pendingSessions.delete(userId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        suggestions: result.suggestions || getArray('cancelledSuggestions', lang),
      });
    } else if (isCancel) {
      pendingSessions.delete(userId);
      return res.status(200).json({
        success: true,
        message: getText('actionCancelled', lang),
        suggestions: getArray('cancelledSuggestions', lang),
      });
    }
    // If not a clear yes/no, clear pending and process as new message
    pendingSessions.delete(userId);
  }

  // ===================== GREETINGS =====================
  if (/^(merhaba|selam|hey|hi|hello|günaydın|iyi günler|iyi akşamlar|good morning|good evening)$/i.test(userMessage)) {
    const userName = user.name || user.fullName || (lang === 'tr' ? "Değerli Müşterimiz" : "Valued Customer");
    response = getText('greeting', lang, userName);
    suggestions = getArray('greetingSuggestions', lang);
  }
  // ===================== BALANCE INQUIRY =====================
  else if (/bakiye|ne kadar param|hesabımda ne var|balance|how much|my money/i.test(userMessage)) {
    const accounts = user.accounts.filter(a => a.status === "active");

    if (accounts.length === 0) {
      response = getText('noActiveAccount', lang);
      suggestions = getArray('newAccountSuggestions', lang);
    } else {
      const accountsData = accounts.map(acc => ({
        name: acc.accountName,
        balance: formatCurrency(acc.balance, acc.currency, lang),
        currency: acc.currency,
      }));

      // Calculate total in TRY
      const exchangeRates = { TRY: 1, USD: 34.5, EUR: 37.2, GBP: 43.5 };
      const totalTRY = accounts.reduce((sum, acc) => {
        return sum + acc.balance * (exchangeRates[acc.currency] || 1);
      }, 0);

      response = getText('accountBalances', lang);
      data = {
        accounts: accountsData,
        totalTRY: formatCurrency(totalTRY, "TRY", lang),
      };
      suggestions = getArray('balanceSuggestions', lang);
    }
  }
  // ===================== VIEW ACCOUNTS =====================
  else if (/hesaplar|hesabım|hesaplarımı göster|tüm hesaplar|my accounts|accounts|view accounts/i.test(userMessage)) {
    const accounts = user.accounts;

    if (accounts.length === 0) {
      response = getText('noAccount', lang);
      suggestions = getArray('newAccountSuggestions', lang);
    } else {
      const accountsData = accounts.map(acc => ({
        name: acc.accountName,
        balance: formatCurrency(acc.balance, acc.currency, lang),
        type: acc.type,
        status: acc.status,
        iban: acc.iban,
      }));

      response = getText('accountsCount', lang, accounts.length);
      data = { accounts: accountsData };
      suggestions = getArray('accountSuggestions', lang);
    }
  }
  // ===================== CREATE ACCOUNT =====================
  else if (/yeni hesap|hesap aç|hesabı aç|hesabi aç|open account|new account|create account/i.test(userMessage)) {
    const { accountType, currency } = parseAccountCommand(userMessage);

    const typeNames = translations.accountTypeNames[lang] || translations.accountTypeNames.en;

    pendingSessions.set(userId, {
      type: "CREATE_ACCOUNT",
      accountType,
      currency,
      lang,
    });

    response = getText('newAccountConfirm', lang, typeNames[accountType], currency);
    requiresConfirmation = true;
    suggestions = getArray('confirmSuggestions', lang);
  }
  // ===================== MONEY TRANSFER =====================
  else if (/gönder|transfer|yolla|havale|eft|send money|send to/i.test(userMessage)) {
    const transferInfo = parseTransferCommand(userMessage);

    if (!transferInfo) {
      response = getText('transferNeedInfo', lang);

      // Show saved recipients if any
      if (user.savedRecipients && user.savedRecipients.length > 0) {
        data = {
          savedRecipients: user.savedRecipients.map(r => ({
            name: r.name,
            iban: r.iban ? r.iban.slice(-8) : "",
          })),
        };
      }
      suggestions = getArray('transferRecipientSuggestions', lang);
    } else if (!transferInfo.amount) {
      pendingSessions.set(userId, {
        type: "TRANSFER_AMOUNT_PENDING",
        recipient: transferInfo.recipient,
        lang,
      });
      response = getText('transferHowMuch', lang, transferInfo.recipient);
      suggestions = ["100 TL", "500 TL", "1000 TL"];
    } else {
      // Find recipient in saved recipients
      const recipient = user.savedRecipients?.find(
        r => r.name.toLowerCase().includes(transferInfo.recipient.toLowerCase())
      );

      if (!recipient) {
        response = getText('recipientNotFound', lang, transferInfo.recipient);
        if (user.savedRecipients && user.savedRecipients.length > 0) {
          data = {
            savedRecipients: user.savedRecipients.map(r => ({
              name: r.name,
              currency: r.currency || "TRY",
            })),
          };
        }
        suggestions = getArray('transferRecipientSuggestions', lang);
      } else {
        // Get recipient's currency (default to TRY if not set)
        const recipientCurrency = recipient.currency || "TRY";

        // Check if transfer currency matches recipient's currency
        if (transferInfo.currency !== recipientCurrency) {
          response = getText('currencyMismatch', lang, transferInfo.currency, recipientCurrency);
          suggestions = getArray('balanceSuggestions', lang);
        } else {
          // Find account with sufficient balance in matching currency
          const accounts = user.accounts.filter(
            a => a.status === "active" && a.currency === transferInfo.currency
          );
          const sourceAccount = accounts.find(a => a.balance >= transferInfo.amount);

          if (!sourceAccount) {
            response = getText('insufficientBalance', lang, formatCurrency(transferInfo.amount, transferInfo.currency, lang), transferInfo.currency);
            suggestions = getArray('balanceSuggestions', lang);
          } else {
            pendingSessions.set(userId, {
              type: "TRANSFER",
              recipientId: recipient._id,
              recipientName: recipient.name,
              recipientIban: recipient.iban,
              recipientCurrency: recipientCurrency,
              amount: transferInfo.amount,
              currency: transferInfo.currency,
              sourceAccountId: sourceAccount._id,
              sourceAccountName: sourceAccount.accountName,
              lang,
            });

            response = getText('transferConfirm', lang, recipient.name, recipient.iban, transferInfo.currency, formatCurrency(transferInfo.amount, transferInfo.currency, lang), sourceAccount.accountName);
            requiresConfirmation = true;
            suggestions = getArray('confirmSuggestions', lang);
          }
        }
      }
    }
  }
  // ===================== VIEW BILLS =====================
  else if ((/fatura|faturalar|bekleyen fatura/i.test(userMessage) && !/öde|ödeme/i.test(userMessage)) || /my bills|bills|pending bills/i.test(userMessage)) {
    const unpaidBills = user.bills.filter(b => !b.isPaid && (b.status === "pending" || b.status === "overdue"));

    if (unpaidBills.length === 0) {
      response = getText('noBills', lang);
      suggestions = getArray('billsSuggestions', lang);
    } else {
      const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

      response = getText('unpaidBillsCount', lang, unpaidBills.length);
      data = {
        bills: unpaidBills.map(b => ({
          title: b.title,
          amount: formatCurrency(b.amount, "TRY", lang),
          dueDate: formatDate(b.dueDate, lang),
          category: b.category,
        })),
        totalAmount: formatCurrency(totalAmount, "TRY", lang),
      };
      suggestions = getArray('billPaySuggestions', lang);
    }
  }
  // ===================== PAY BILL =====================
  else if (/fatura.*öde|öde.*fatura|faturayı öde|faturasını öde|pay.*bill|pay my bill/i.test(userMessage)) {
    const category = parseBillCommand(userMessage);
    const unpaidBills = user.bills.filter(b => !b.isPaid && (b.status === "pending" || b.status === "overdue"));

    if (unpaidBills.length === 0) {
      response = getText('noBills', lang);
      suggestions = getArray('balanceSuggestions', lang);
    } else {
      let billToPay = null;

      if (category) {
        billToPay = unpaidBills.find(b => b.category === category);
        if (!billToPay) {
          const categoryName = translations.categoryNames[lang]?.[category] || category;
          response = getText('billNotFound', lang, categoryName);
          data = {
            bills: unpaidBills.map(b => ({
              title: b.title,
              amount: formatCurrency(b.amount, "TRY", lang),
            })),
          };
          suggestions = unpaidBills.slice(0, 3).map(b => lang === 'tr' ? `${b.title} öde` : `Pay ${b.title}`);
        }
      } else {
        // Show all unpaid bills to choose
        response = getText('whichBill', lang);
        data = {
          bills: unpaidBills.map(b => ({
            title: b.title,
            amount: formatCurrency(b.amount, "TRY", lang),
            category: b.category,
          })),
        };
        suggestions = unpaidBills.slice(0, 3).map(b => lang === 'tr' ? `${b.title} öde` : `Pay ${b.title}`);
      }

      if (billToPay) {
        // Find account with sufficient balance
        const accounts = user.accounts.filter(a => a.status === "active" && a.currency === "TRY");
        const sourceAccount = accounts.find(a => a.balance >= billToPay.amount);

        if (!sourceAccount) {
          response = getText('billNeedBalance', lang, billToPay.title, formatCurrency(billToPay.amount, "TRY", lang));
          suggestions = getArray('balanceSuggestions', lang);
        } else {
          pendingSessions.set(userId, {
            type: "PAY_BILL",
            billId: billToPay._id,
            billTitle: billToPay.title,
            amount: billToPay.amount,
            sourceAccountId: sourceAccount._id,
            sourceAccountName: sourceAccount.accountName,
            lang,
          });

          response = getText('billPayConfirm', lang, billToPay.title, formatCurrency(billToPay.amount, "TRY", lang), sourceAccount.accountName);
          requiresConfirmation = true;
          suggestions = getArray('confirmSuggestions', lang);
        }
      }
    }
  }
  // ===================== TRANSACTION HISTORY =====================
  else if (/işlem geçmişi|son işlemler|hareketler|geçmiş|transaction history|recent transactions|history/i.test(userMessage)) {
    const allTransactions = [];

    user.accounts.forEach(acc => {
      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach(tx => {
          allTransactions.push({
            type: tx.type,
            amount: formatCurrency(tx.amount, tx.currency || acc.currency, lang),
            description: tx.description || tx.type,
            date: formatDate(tx.createdAt, lang),
            account: acc.accountName,
          });
        });
      }
    });

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTx = allTransactions.slice(0, 10);

    if (recentTx.length === 0) {
      response = getText('noTransactions', lang);
      suggestions = getArray('transactionSuggestions', lang);
    } else {
      response = getText('recentTransactions', lang);
      data = { transactions: recentTx };
      suggestions = getArray('transactionHistorySuggestions', lang);
    }
  }
  // ===================== SPENDING ANALYSIS =====================
  else if (/harcama|harcamalar|ne kadar harcadım|analiz|spending|my spending|spending analysis/i.test(userMessage)) {
    let totalIncome = 0;
    let totalSpending = 0;
    const spendingByCategory = {};

    // Category name mapping based on language
    const categoryNames = translations.categoryNames[lang] || translations.categoryNames.en;

    user.accounts.forEach(acc => {
      if (acc.transactions) {
        acc.transactions.forEach(tx => {
          if (tx.type === "deposit" || tx.type === "transfer-in") {
            totalIncome += tx.amount;
          } else if (tx.type === "withdrawal" || tx.type === "transfer-out" || tx.type === "bill-payment") {
            totalSpending += tx.amount;

            // Categorize spending
            let category = tx.type;
            if (tx.type === "bill-payment" && tx.description) {
              // Try to extract bill category from description
              const desc = tx.description.toLowerCase();
              if (desc.includes("elektrik") || desc.includes("electric")) category = "electricity";
              else if (desc.includes("su") || desc.includes("water")) category = "water";
              else if (desc.includes("gaz") || desc.includes("gas")) category = "gas";
              else if (desc.includes("internet")) category = "internet";
              else if (desc.includes("telefon") || desc.includes("phone")) category = "phone";
              else if (desc.includes("kira") || desc.includes("rent")) category = "rent";
              else if (desc.includes("netflix") || desc.includes("spotify")) category = "streaming";
              else if (desc.includes("sigorta") || desc.includes("insurance")) category = "insurance";
            }

            spendingByCategory[category] = (spendingByCategory[category] || 0) + tx.amount;
          }
        });
      }
    });

    const net = totalIncome - totalSpending;

    // Find high spending categories (>80% of total)
    const warnings = [];
    const categoryBreakdown = [];

    for (const [category, amount] of Object.entries(spendingByCategory)) {
      const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
      const categoryName = categoryNames[category] || category;

      categoryBreakdown.push({
        category: categoryName,
        amount: formatCurrency(amount, "TRY", lang),
        percentage: `${percentage.toFixed(1)}%`,
      });

      // Warn if category is >80% of total spending
      if (percentage >= 80 && totalSpending > 0) {
        warnings.push(getText('spendingWarning', lang, categoryName, percentage.toFixed(0)));
      }
    }

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => {
      const amountA = parseFloat(a.amount.replace(/[^\d,.-]/g, "").replace(",", "."));
      const amountB = parseFloat(b.amount.replace(/[^\d,.-]/g, "").replace(",", "."));
      return amountB - amountA;
    });

    response = getText('spendingAnalysis', lang);

    if (warnings.length > 0) {
      response += "\n\n" + warnings.join("\n");
    }

    data = {
      totalIncome: formatCurrency(totalIncome, "TRY", lang),
      totalSpending: formatCurrency(totalSpending, "TRY", lang),
      net: (net >= 0 ? "+" : "") + formatCurrency(net, "TRY", lang),
      categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : undefined,
    };
    suggestions = getArray('spendingSuggestions', lang);
  }
  // ===================== SAVINGS GOALS =====================
  else if (/hedef|tasarruf|birikimler|goals|my goals|savings/i.test(userMessage)) {
    const goals = user.savingsGoals?.filter(g => g.status !== "abandoned") || [];
    const goalStatusText = translations.goalStatus[lang] || translations.goalStatus.en;

    if (goals.length === 0) {
      response = getText('noGoals', lang);
      suggestions = getArray('goalsSuggestions', lang);
    } else {
      response = getText('savingsGoals', lang);
      data = {
        goals: goals.map(g => ({
          name: g.name,
          current: formatCurrency(g.currentAmount || 0, "TRY", lang),
          target: formatCurrency(g.targetAmount, "TRY", lang),
          progress: `${Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)}%`,
          status: g.status,
          statusText: goalStatusText[g.status] || g.status,
        })),
      };
      suggestions = getArray('spendingSuggestions', lang);
    }
  }
  // ===================== HELP =====================
  else if (/yardım|help|ne yapabilirsin|komutlar|what can you do/i.test(userMessage)) {
    response = getText('helpTitle', lang);
    suggestions = getArray('helpSuggestions', lang);
  }
  // ===================== DEFAULT =====================
  else {
    response = getText('notUnderstood', lang);
    suggestions = getArray('defaultSuggestions', lang);
  }

  return res.status(200).json({
    success: true,
    message: response,
    data: data,
    requiresConfirmation: requiresConfirmation,
    suggestions: suggestions,
  });
});

// Execute pending action
async function executePendingAction(user, action, lang = 'en') {
  let message = "";
  let data = null;
  let suggestions = [];

  // Use language from action if available
  lang = action.lang || lang;

  switch (action.type) {
    case "CREATE_ACCOUNT": {
      const typeNames = translations.accountTypeNames[lang] || translations.accountTypeNames.en;

      // Generate IBAN
      const randomPart = Math.random().toString().slice(2, 18).padEnd(16, "0");
      const iban = `TR${Math.floor(10 + Math.random() * 90)}0001${randomPart}`;

      // Generate account number
      const accountNumber = Math.random().toString().slice(2, 12);

      const accountSuffix = lang === 'tr' ? 'Hesabı' : 'Account';
      const newAccount = {
        accountName: `${typeNames[action.accountType]} ${action.currency} ${accountSuffix}`,
        accountNumber: accountNumber,
        iban: iban,
        type: action.accountType,
        currency: action.currency,
        balance: 0,
        status: "active",
      };

      user.accounts.push(newAccount);
      await user.save();

      message = getText('accountCreated', lang, newAccount.accountName, iban);
      data = {
        account: {
          name: newAccount.accountName,
          iban: iban,
          type: typeNames[action.accountType],
          currency: action.currency,
        },
      };
      suggestions = getArray('balanceSuggestions', lang);
      break;
    }

    case "TRANSFER": {
      const sourceAccount = user.accounts.id(action.sourceAccountId);

      if (!sourceAccount || sourceAccount.balance < action.amount) {
        message = getText('transferFailed', lang);
        suggestions = getArray('balanceSuggestions', lang);
      } else {
        // Deduct from source
        sourceAccount.balance -= action.amount;

        // Add transaction
        const transferDesc = lang === 'tr' ? `${action.recipientName} kişisine transfer` : `Transfer to ${action.recipientName}`;
        sourceAccount.transactions.push({
          type: "transfer-out",
          amount: action.amount,
          currency: action.currency,
          description: transferDesc,
          recipientIban: action.recipientIban,
          status: "completed",
          createdAt: new Date(),
        });

        await user.save();

        message = getText('transferSuccess', lang, action.recipientName, formatCurrency(action.amount, action.currency, lang), formatCurrency(sourceAccount.balance, action.currency, lang));
        suggestions = getArray('transactionHistorySuggestions', lang);
      }
      break;
    }

    case "PAY_BILL": {
      const bill = user.bills.id(action.billId);
      const sourceAccount = user.accounts.id(action.sourceAccountId);

      if (!bill || bill.isPaid) {
        message = getText('billNotFoundOrPaid', lang);
        suggestions = getArray('billsSuggestions', lang);
      } else if (!sourceAccount || sourceAccount.balance < action.amount) {
        message = getText('paymentFailed', lang);
        suggestions = getArray('balanceSuggestions', lang);
      } else {
        // Deduct from account
        sourceAccount.balance -= action.amount;

        // Mark bill as paid
        bill.isPaid = true;
        bill.status = "paid";
        bill.paidAt = new Date();
        bill.paidFromAccountId = action.sourceAccountId;

        // Add transaction
        const billDesc = lang === 'tr' ? `Fatura ödemesi: ${action.billTitle}` : `Bill payment: ${action.billTitle}`;
        sourceAccount.transactions.push({
          type: "bill-payment",
          amount: action.amount,
          currency: "TRY",
          billId: action.billId,
          description: billDesc,
          status: "completed",
          createdAt: new Date(),
        });

        await user.save();

        message = getText('billPaidSuccess', lang, action.billTitle, formatCurrency(action.amount, "TRY", lang), formatCurrency(sourceAccount.balance, sourceAccount.currency, lang));
        suggestions = getArray('billsSuggestions', lang);
      }
      break;
    }

    default:
      message = getText('actionFailed', lang);
      suggestions = getArray('helpSuggestions', lang);
  }

  return { message, data, suggestions };
}

// Get help
const getHelp = errorWrapper(async (req, res, next) => {
  // Get language from query or user preferences
  const lang = req.query.language || req.user?.preferences?.language || 'en';

  const response = getText('helpTitle', lang);
  const suggestions = getArray('helpSuggestions', lang);

  return res.status(200).json({
    success: true,
    message: response,
    suggestions: suggestions,
  });
});

// Get quick actions
const getQuickActions = errorWrapper(async (req, res, next) => {
  // Get language from query or user preferences
  const lang = req.query.language || req.user?.preferences?.language || 'en';

  const actions = lang === 'tr' ? [
    { type: "PAY_BILL", label: "Fatura Öde", icon: "receipt" },
    { type: "BALANCE", label: "Bakiye", icon: "wallet" },
    { type: "TRANSFER", label: "Gönder", icon: "send" },
    { type: "CREATE_ACCOUNT", label: "Hesap Aç", icon: "plus" },
  ] : [
    { type: "PAY_BILL", label: "Pay Bill", icon: "receipt" },
    { type: "BALANCE", label: "Balance", icon: "wallet" },
    { type: "TRANSFER", label: "Send", icon: "send" },
    { type: "CREATE_ACCOUNT", label: "New Account", icon: "plus" },
  ];

  return res.status(200).json({
    success: true,
    actions: actions,
  });
});

// Clear session
const clearSession = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  pendingSessions.delete(userId);

  return res.status(200).json({
    success: true,
    message: "Session cleared",
  });
});

module.exports = {
  sendMessage,
  getHelp,
  getQuickActions,
  clearSession,
};
