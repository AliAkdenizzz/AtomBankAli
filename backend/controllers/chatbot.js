const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// In-memory session store for pending confirmations
const pendingSessions = new Map();

// Helper: Format currency
function formatCurrency(amount, currency = "TRY") {
  const symbols = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper: Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString("tr-TR", {
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
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === "") {
    return next(new CustomError("Message is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

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
      // Execute pending action
      const result = await executePendingAction(user, pendingAction);
      pendingSessions.delete(userId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        suggestions: result.suggestions || ["Bakiyem", "Faturalarım", "Hesaplarım"],
      });
    } else if (isCancel) {
      pendingSessions.delete(userId);
      return res.status(200).json({
        success: true,
        message: "İşlem iptal edildi.",
        suggestions: ["Bakiyem", "Faturalarım", "Hesaplarım"],
      });
    }
    // If not a clear yes/no, clear pending and process as new message
    pendingSessions.delete(userId);
  }

  // ===================== GREETINGS =====================
  if (/^(merhaba|selam|hey|hi|hello|günaydın|iyi günler|iyi akşamlar)$/i.test(userMessage)) {
    const userName = user.name || user.fullName || "Değerli Müşterimiz";
    response = `Merhaba ${userName}! 👋\n\nBen Atom Bank'ın akıllı asistanıyım. Size nasıl yardımcı olabilirim?\n\n**Yapabileceğim işlemler:**\n• Bakiye sorgulama\n• Fatura ödeme\n• Para transferi\n• Hesap açma\n• İşlem geçmişi görüntüleme`;
    suggestions = ["Bakiyem", "Faturalarım", "Hesaplarım", "Yardım"];
  }
  // ===================== BALANCE INQUIRY =====================
  else if (/bakiye|ne kadar param|hesabımda ne var/i.test(userMessage)) {
    const accounts = user.accounts.filter(a => a.status === "active");

    if (accounts.length === 0) {
      response = "Henüz aktif bir hesabınız bulunmuyor. Yeni hesap açmak ister misiniz?";
      suggestions = ["Yeni hesap aç", "TRY hesabı aç", "USD hesabı aç"];
    } else {
      const accountsData = accounts.map(acc => ({
        name: acc.accountName,
        balance: formatCurrency(acc.balance, acc.currency),
        currency: acc.currency,
      }));

      // Calculate total in TRY
      const exchangeRates = { TRY: 1, USD: 34.5, EUR: 37.2, GBP: 43.5 };
      const totalTRY = accounts.reduce((sum, acc) => {
        return sum + acc.balance * (exchangeRates[acc.currency] || 1);
      }, 0);

      response = `**Hesap Bakiyeleriniz:**`;
      data = {
        accounts: accountsData,
        totalTRY: formatCurrency(totalTRY, "TRY"),
      };
      suggestions = ["Hesaplarım", "İşlem geçmişi", "Para gönder"];
    }
  }
  // ===================== VIEW ACCOUNTS =====================
  else if (/hesaplar|hesabım|hesaplarımı göster|tüm hesaplar/i.test(userMessage)) {
    const accounts = user.accounts;

    if (accounts.length === 0) {
      response = "Henüz bir hesabınız bulunmuyor. Yeni hesap açmak ister misiniz?";
      suggestions = ["Yeni hesap aç", "TRY hesabı aç"];
    } else {
      const accountsData = accounts.map(acc => ({
        name: acc.accountName,
        balance: formatCurrency(acc.balance, acc.currency),
        type: acc.type,
        status: acc.status,
        iban: acc.iban,
      }));

      response = `**${accounts.length} hesabınız bulunuyor:**`;
      data = { accounts: accountsData };
      suggestions = ["Bakiyem", "Yeni hesap aç", "Para gönder"];
    }
  }
  // ===================== CREATE ACCOUNT =====================
  else if (/yeni hesap|hesap aç|hesabı aç|hesabi aç/i.test(userMessage)) {
    const { accountType, currency } = parseAccountCommand(userMessage);

    const typeNames = {
      checking: "Vadesiz",
      savings: "Vadeli",
      deposit: "Mevduat",
      investment: "Yatırım",
    };

    pendingSessions.set(userId, {
      type: "CREATE_ACCOUNT",
      accountType,
      currency,
    });

    response = `**Yeni ${typeNames[accountType]} ${currency} Hesabı** oluşturulacak.\n\nOnaylıyor musunuz?`;
    requiresConfirmation = true;
    suggestions = ["Evet", "Hayır"];
  }
  // ===================== MONEY TRANSFER =====================
  else if (/gönder|transfer|yolla|havale|eft/i.test(userMessage)) {
    const transferInfo = parseTransferCommand(userMessage);

    if (!transferInfo) {
      response = "Para göndermek için alıcı ve miktar belirtmeniz gerekiyor.\n\n**Örnek:** \"Ali'ye 500 TL gönder\"";

      // Show saved recipients if any
      if (user.savedRecipients && user.savedRecipients.length > 0) {
        data = {
          savedRecipients: user.savedRecipients.map(r => ({
            name: r.name,
            iban: r.iban ? r.iban.slice(-8) : "",
          })),
        };
      }
      suggestions = ["Bakiyem", "Alıcılarım"];
    } else if (!transferInfo.amount) {
      pendingSessions.set(userId, {
        type: "TRANSFER_AMOUNT_PENDING",
        recipient: transferInfo.recipient,
      });
      response = `${transferInfo.recipient} kişisine ne kadar göndermek istiyorsunuz?`;
      suggestions = ["100 TL", "500 TL", "1000 TL"];
    } else {
      // Find recipient in saved recipients
      const recipient = user.savedRecipients?.find(
        r => r.name.toLowerCase().includes(transferInfo.recipient.toLowerCase())
      );

      if (!recipient) {
        response = `"${transferInfo.recipient}" isimli kayıtlı alıcı bulunamadı.\n\nKayıtlı alıcılarınız:`;
        if (user.savedRecipients && user.savedRecipients.length > 0) {
          data = {
            savedRecipients: user.savedRecipients.map(r => ({
              name: r.name,
              currency: r.currency || "TRY",
            })),
          };
        }
        suggestions = ["Alıcılarım", "Bakiyem"];
      } else {
        // Get recipient's currency (default to TRY if not set)
        const recipientCurrency = recipient.currency || "TRY";

        // Check if transfer currency matches recipient's currency
        if (transferInfo.currency !== recipientCurrency) {
          response = `❌ **Para birimi uyuşmuyor!**\n\n• Göndermek istediğiniz: ${transferInfo.currency}\n• Alıcının hesap para birimi: ${recipientCurrency}\n\nFarklı para birimleri arasında transfer yapılamaz. Lütfen aynı para biriminde transfer yapın.`;
          suggestions = [`${transferInfo.recipient}'e ${recipientCurrency} gönder`, "Bakiyem", "Hesaplarım"];
        } else {
          // Find account with sufficient balance in matching currency
          const accounts = user.accounts.filter(
            a => a.status === "active" && a.currency === transferInfo.currency
          );
          const sourceAccount = accounts.find(a => a.balance >= transferInfo.amount);

          if (!sourceAccount) {
            response = `Yeterli bakiye bulunamadı. ${formatCurrency(transferInfo.amount, transferInfo.currency)} göndermek için yeterli ${transferInfo.currency} bakiyeniz yok.`;
            suggestions = ["Bakiyem", "Hesaplarım"];
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
            });

            response = `**Para Transferi**\n\n• Alıcı: ${recipient.name}\n• Alıcı IBAN: ${recipient.iban}\n• Para Birimi: ${transferInfo.currency}\n• Miktar: ${formatCurrency(transferInfo.amount, transferInfo.currency)}\n• Gönderen Hesap: ${sourceAccount.accountName}\n\nOnaylıyor musunuz?`;
            requiresConfirmation = true;
            suggestions = ["Evet", "Hayır"];
          }
        }
      }
    }
  }
  // ===================== VIEW BILLS =====================
  else if (/fatura|faturalar|bekleyen fatura/i.test(userMessage) && !/öde|ödeme/i.test(userMessage)) {
    const unpaidBills = user.bills.filter(b => !b.isPaid && (b.status === "pending" || b.status === "overdue"));

    if (unpaidBills.length === 0) {
      response = "Ödenmemiş faturanız bulunmuyor! 🎉";
      suggestions = ["Bakiyem", "Hesaplarım", "İşlem geçmişi"];
    } else {
      const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

      response = `**${unpaidBills.length} Ödenmemiş Faturanız Var:**`;
      data = {
        bills: unpaidBills.map(b => ({
          title: b.title,
          amount: formatCurrency(b.amount, "TRY"),
          dueDate: formatDate(b.dueDate),
          category: b.category,
        })),
        totalAmount: formatCurrency(totalAmount, "TRY"),
      };
      suggestions = ["Fatura öde", "Elektrik faturası öde", "Tüm faturaları öde"];
    }
  }
  // ===================== PAY BILL =====================
  else if (/fatura.*öde|öde.*fatura|faturayı öde|faturasını öde/i.test(userMessage)) {
    const category = parseBillCommand(userMessage);
    const unpaidBills = user.bills.filter(b => !b.isPaid && (b.status === "pending" || b.status === "overdue"));

    if (unpaidBills.length === 0) {
      response = "Ödenmemiş faturanız bulunmuyor!";
      suggestions = ["Bakiyem", "Hesaplarım"];
    } else {
      let billToPay = null;

      if (category) {
        billToPay = unpaidBills.find(b => b.category === category);
        if (!billToPay) {
          response = `${category} kategorisinde ödenmemiş fatura bulunamadı.`;
          data = {
            bills: unpaidBills.map(b => ({
              title: b.title,
              amount: formatCurrency(b.amount, "TRY"),
            })),
          };
          suggestions = unpaidBills.slice(0, 3).map(b => `${b.title} öde`);
        }
      } else {
        // Show all unpaid bills to choose
        response = "Hangi faturayı ödemek istiyorsunuz?";
        data = {
          bills: unpaidBills.map(b => ({
            title: b.title,
            amount: formatCurrency(b.amount, "TRY"),
            category: b.category,
          })),
        };
        suggestions = unpaidBills.slice(0, 3).map(b => `${b.title} öde`);
      }

      if (billToPay) {
        // Find account with sufficient balance
        const accounts = user.accounts.filter(a => a.status === "active" && a.currency === "TRY");
        const sourceAccount = accounts.find(a => a.balance >= billToPay.amount);

        if (!sourceAccount) {
          response = `Yeterli bakiye bulunamadı. ${billToPay.title} faturası için ${formatCurrency(billToPay.amount, "TRY")} gerekiyor.`;
          suggestions = ["Bakiyem", "Hesaplarım"];
        } else {
          pendingSessions.set(userId, {
            type: "PAY_BILL",
            billId: billToPay._id,
            billTitle: billToPay.title,
            amount: billToPay.amount,
            sourceAccountId: sourceAccount._id,
            sourceAccountName: sourceAccount.accountName,
          });

          response = `**Fatura Ödeme**\n\n• Fatura: ${billToPay.title}\n• Tutar: ${formatCurrency(billToPay.amount, "TRY")}\n• Ödenecek Hesap: ${sourceAccount.accountName}\n\nOnaylıyor musunuz?`;
          requiresConfirmation = true;
          suggestions = ["Evet", "Hayır"];
        }
      }
    }
  }
  // ===================== TRANSACTION HISTORY =====================
  else if (/işlem geçmişi|son işlemler|hareketler|geçmiş/i.test(userMessage)) {
    const allTransactions = [];

    user.accounts.forEach(acc => {
      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach(tx => {
          allTransactions.push({
            type: tx.type,
            amount: formatCurrency(tx.amount, tx.currency || acc.currency),
            description: tx.description || tx.type,
            date: formatDate(tx.createdAt),
            account: acc.accountName,
          });
        });
      }
    });

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTx = allTransactions.slice(0, 10);

    if (recentTx.length === 0) {
      response = "Henüz işlem geçmişiniz bulunmuyor.";
      suggestions = ["Bakiyem", "Para gönder", "Fatura öde"];
    } else {
      response = "**Son İşlemleriniz:**";
      data = { transactions: recentTx };
      suggestions = ["Bakiyem", "Harcamalarım", "Faturalarım"];
    }
  }
  // ===================== SPENDING ANALYSIS =====================
  else if (/harcama|harcamalar|ne kadar harcadım|analiz/i.test(userMessage)) {
    let totalIncome = 0;
    let totalSpending = 0;
    const spendingByCategory = {};

    // Category name mapping
    const categoryNames = {
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
      "other": "Diğer",
    };

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
              if (desc.includes("elektrik")) category = "electricity";
              else if (desc.includes("su")) category = "water";
              else if (desc.includes("gaz")) category = "gas";
              else if (desc.includes("internet")) category = "internet";
              else if (desc.includes("telefon")) category = "phone";
              else if (desc.includes("kira")) category = "rent";
              else if (desc.includes("netflix") || desc.includes("spotify")) category = "streaming";
              else if (desc.includes("sigorta")) category = "insurance";
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
        amount: formatCurrency(amount, "TRY"),
        percentage: `${percentage.toFixed(1)}%`,
      });

      // Warn if category is >80% of total spending
      if (percentage >= 80 && totalSpending > 0) {
        warnings.push(`⚠️ **${categoryName}** harcamalarınız toplam harcamalarınızın %${percentage.toFixed(0)}'ini oluşturuyor. Bu kategoriyi düşürmeyi düşünebilirsiniz.`);
      }
    }

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => {
      const amountA = parseFloat(a.amount.replace(/[^\d,.-]/g, "").replace(",", "."));
      const amountB = parseFloat(b.amount.replace(/[^\d,.-]/g, "").replace(",", "."));
      return amountB - amountA;
    });

    response = "**Harcama Analiziniz:**";

    if (warnings.length > 0) {
      response += "\n\n" + warnings.join("\n");
    }

    data = {
      totalIncome: formatCurrency(totalIncome, "TRY"),
      totalSpending: formatCurrency(totalSpending, "TRY"),
      net: (net >= 0 ? "+" : "") + formatCurrency(net, "TRY"),
      categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : undefined,
    };
    suggestions = ["İşlem geçmişi", "Bakiyem", "Hedeflerim"];
  }
  // ===================== SAVINGS GOALS =====================
  else if (/hedef|tasarruf|birikimler/i.test(userMessage)) {
    const goals = user.savingsGoals?.filter(g => g.status !== "abandoned") || [];

    if (goals.length === 0) {
      response = "Henüz bir tasarruf hedefiniz bulunmuyor.";
      suggestions = ["Bakiyem", "Hesaplarım", "Yardım"];
    } else {
      response = "**Tasarruf Hedefleriniz:**";
      data = {
        goals: goals.map(g => ({
          name: g.name,
          current: formatCurrency(g.currentAmount || 0, "TRY"),
          target: formatCurrency(g.targetAmount, "TRY"),
          progress: `${Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)}%`,
          status: g.status,
          statusText: g.status === "active" ? "Devam ediyor" : g.status === "completed" ? "Tamamlandı" : g.status,
        })),
      };
      suggestions = ["Bakiyem", "Harcamalarım"];
    }
  }
  // ===================== HELP =====================
  else if (/yardım|help|ne yapabilirsin|komutlar/i.test(userMessage)) {
    response = `**Atom Bank Akıllı Asistan Yardım**\n\n**Hesap İşlemleri:**\n• "Bakiyem" - Bakiye sorgulama\n• "Hesaplarım" - Tüm hesapları görme\n• "Yeni hesap aç" - Hesap oluşturma\n\n**Para Transferi:**\n• "Ali'ye 500 TL gönder"\n• "Para gönder"\n\n**Fatura İşlemleri:**\n• "Faturalarım" - Bekleyen faturaları görme\n• "Elektrik faturasını öde"\n\n**Diğer:**\n• "İşlem geçmişi"\n• "Harcamalarım"\n• "Hedeflerim"`;
    suggestions = ["Bakiyem", "Faturalarım", "Hesaplarım", "Para gönder"];
  }
  // ===================== DEFAULT =====================
  else {
    response = "Üzgünüm, ne demek istediğinizi anlayamadım. Size nasıl yardımcı olabilirim?\n\n\"Yardım\" yazarak yapabileceğim işlemleri görebilirsiniz.";
    suggestions = ["Yardım", "Bakiyem", "Faturalarım", "Hesaplarım"];
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
async function executePendingAction(user, action) {
  let message = "";
  let data = null;
  let suggestions = [];

  switch (action.type) {
    case "CREATE_ACCOUNT": {
      const typeNames = {
        checking: "Vadesiz",
        savings: "Vadeli",
        deposit: "Mevduat",
        investment: "Yatırım",
      };

      // Generate IBAN
      const randomPart = Math.random().toString().slice(2, 18).padEnd(16, "0");
      const iban = `TR${Math.floor(10 + Math.random() * 90)}0001${randomPart}`;

      // Generate account number
      const accountNumber = Math.random().toString().slice(2, 12);

      const newAccount = {
        accountName: `${typeNames[action.accountType]} ${action.currency} Hesabı`,
        accountNumber: accountNumber,
        iban: iban,
        type: action.accountType,
        currency: action.currency,
        balance: 0,
        status: "active",
      };

      user.accounts.push(newAccount);
      await user.save();

      message = `✅ **Hesabınız başarıyla oluşturuldu!**\n\n• Hesap: ${newAccount.accountName}\n• IBAN: ${iban}`;
      data = {
        account: {
          name: newAccount.accountName,
          iban: iban,
          type: typeNames[action.accountType],
          currency: action.currency,
        },
      };
      suggestions = ["Bakiyem", "Hesaplarım"];
      break;
    }

    case "TRANSFER": {
      const sourceAccount = user.accounts.id(action.sourceAccountId);

      if (!sourceAccount || sourceAccount.balance < action.amount) {
        message = "❌ Transfer başarısız! Yetersiz bakiye.";
        suggestions = ["Bakiyem"];
      } else {
        // Deduct from source
        sourceAccount.balance -= action.amount;

        // Add transaction
        sourceAccount.transactions.push({
          type: "transfer-out",
          amount: action.amount,
          currency: action.currency,
          description: `${action.recipientName} kişisine transfer`,
          recipientIban: action.recipientIban,
          status: "completed",
          createdAt: new Date(),
        });

        await user.save();

        message = `✅ **Transfer başarılı!**\n\n• Alıcı: ${action.recipientName}\n• Tutar: ${formatCurrency(action.amount, action.currency)}\n• Yeni Bakiye: ${formatCurrency(sourceAccount.balance, action.currency)}`;
        suggestions = ["Bakiyem", "İşlem geçmişi"];
      }
      break;
    }

    case "PAY_BILL": {
      const bill = user.bills.id(action.billId);
      const sourceAccount = user.accounts.id(action.sourceAccountId);

      if (!bill || bill.isPaid) {
        message = "❌ Fatura bulunamadı veya zaten ödenmiş.";
        suggestions = ["Faturalarım"];
      } else if (!sourceAccount || sourceAccount.balance < action.amount) {
        message = "❌ Ödeme başarısız! Yetersiz bakiye.";
        suggestions = ["Bakiyem"];
      } else {
        // Deduct from account
        sourceAccount.balance -= action.amount;

        // Mark bill as paid
        bill.isPaid = true;
        bill.status = "paid";
        bill.paidAt = new Date();
        bill.paidFromAccountId = action.sourceAccountId;

        // Add transaction
        sourceAccount.transactions.push({
          type: "bill-payment",
          amount: action.amount,
          currency: "TRY",
          billId: action.billId,
          description: `Fatura ödemesi: ${action.billTitle}`,
          status: "completed",
          createdAt: new Date(),
        });

        await user.save();

        message = `✅ **Fatura başarıyla ödendi!**\n\n• Fatura: ${action.billTitle}\n• Tutar: ${formatCurrency(action.amount, "TRY")}\n• Yeni Bakiye: ${formatCurrency(sourceAccount.balance, sourceAccount.currency)}`;
        suggestions = ["Faturalarım", "Bakiyem"];
      }
      break;
    }

    default:
      message = "İşlem gerçekleştirilemedi.";
      suggestions = ["Yardım"];
  }

  return { message, data, suggestions };
}

// Get help
const getHelp = errorWrapper(async (req, res, next) => {
  const response = `**Atom Bank Akıllı Asistan**\n\nMerhaba! Ben Atom Bank'ın akıllı asistanıyım.\n\n**Yapabileceğim İşlemler:**\n\n📊 **Hesap İşlemleri**\n• Bakiye sorgulama\n• Hesapları görüntüleme\n• Yeni hesap açma\n\n💸 **Para Transferi**\n• Kayıtlı alıcılara transfer\n• Hızlı para gönderme\n\n📄 **Fatura İşlemleri**\n• Fatura görüntüleme\n• Fatura ödeme\n\n📈 **Finansal Analiz**\n• İşlem geçmişi\n• Harcama analizi\n• Tasarruf hedefleri`;

  const suggestions = ["Bakiyem", "Faturalarım", "Hesaplarım", "Para gönder"];

  return res.status(200).json({
    success: true,
    message: response,
    suggestions: suggestions,
  });
});

// Get quick actions
const getQuickActions = errorWrapper(async (req, res, next) => {
  const actions = [
    { type: "PAY_BILL", label: "Fatura Öde", icon: "receipt" },
    { type: "BALANCE", label: "Bakiye", icon: "wallet" },
    { type: "TRANSFER", label: "Gönder", icon: "send" },
    { type: "CREATE_ACCOUNT", label: "Hesap Aç", icon: "plus" },
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
