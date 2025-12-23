// ============================================
// ATOM BANK - INTERNATIONALIZATION (i18n) SYSTEM
// Supports English (en) and Turkish (tr)
// ============================================

const translations = {
  en: {
    // ========== COMMON ==========
    welcome: "Hi {name}, welcome back!",
    logout: "Logout",
    logOut: "Log Out",
    cancel: "Cancel",
    save: "Save",
    saveChanges: "Save Changes",
    saving: "Saving...",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    ok: "OK",
    back: "Back",
    next: "Next",
    previous: "Previous",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",

    // ========== NAVIGATION & SIDEBAR ==========
    overview: "Overview",
    dashboard: "Dashboard",
    accounts: "Accounts",
    accountHistory: "Account History",
    fundTransfer: "Fund Transfer",
    billPayment: "Bill Payment",
    billPayments: "Bill Payments",
    currencyExchange: "Currency Exchange",
    smartAssistant: "Smart Assistant",
    smartAssistantSupport: "Smart Assistant Support",
    settings: "Settings",
    profile: "Profile",
    notifications: "Notifications",
    home: "Home",

    // ========== THEME & LANGUAGE ==========
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    english: "English",
    turkish: "Turkish",
    useDarkMode: "Use Dark Mode",

    // ========== PROFILE ==========
    editProfile: "Edit Profile",
    profileImage: "Profile Image",
    uploadImage: "Upload Image",
    firstName: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    email: "Email",
    phoneNumber: "Phone Number",
    phone: "Phone",
    address: "Address",
    street: "Street",
    city: "City",
    state: "State",
    postalCode: "Postal Code",
    country: "Country",
    dateOfBirth: "Date of Birth",
    preferences: "Preferences",
    subscribeNewsletter: "Subscribe to Newsletter",
    enableSms: "Enable SMS Notifications",
    enableEmail: "Enable Email Notifications",
    enablePush: "Enable Push Notifications",
    twoFactorAuth: "Two-Factor Authentication",
    profileUpdated: "Profile updated successfully!",
    profileUpdateFailed: "Failed to update profile",

    // ========== PASSWORD ==========
    changePassword: "Change Password",
    changePasswordTitle: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordChanged: "Password changed successfully!",
    passwordChangeFailed: "Failed to change password",
    passwordsNotMatch: "New passwords do not match!",
    passwordTooShort: "Password must be at least 6 characters.",

    // ========== AUTH ==========
    login: "Login",
    register: "Register",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    rememberMe: "Remember Me",
    authRequired: "Authentication required. Please log in again.",
    sessionExpired: "Session expired. Please login again.",
    loginSuccess: "Login successful!",
    loginFailed: "Login failed. Please check your credentials.",
    registerSuccess: "Registration successful!",
    registerFailed: "Registration failed. Please try again.",

    // ========== DASHBOARD ==========
    yourBalance: "Your Balance",
    totalBalance: "Total Balance",
    accountNo: "Account No",
    recentTransactions: "Recent Transactions",
    spendAnalysis: "Spend Analysis",
    quickTransfer: "Quick Transfer",
    viaMobileNo: "Via Mobile No.",
    viaAccountNo: "Via Account No.",
    sendNow: "Send Now",
    yourAccounts: "Your Accounts",
    today: "Today",
    yesterday: "Yesterday",
    showMore: "Show More",
    viewAll: "View All",
    noTransactions: "No transactions found",
    noData: "No data available",

    // ========== ACCOUNTS ==========
    createAccount: "Create New Account",
    openNewAccount: "Open New Account",
    accountName: "Account Name",
    accountType: "Account Type",
    currency: "Currency",
    balance: "Balance",
    availableBalance: "Available Balance",
    checking: "Checking",
    savings: "Savings",
    deposit: "Deposit",
    investment: "Investment",
    accountCreated: "Account created successfully!",
    accountCreateFailed: "Failed to create account",
    accountClosed: "Account closed successfully",
    accountStatus: "Account Status",
    active: "Active",
    blocked: "Blocked",
    closed: "Closed",

    // ========== TRANSACTIONS ==========
    transactions: "Transactions",
    transactionHistory: "Transaction History",
    transactionDetails: "Transaction Details",
    transactionDate: "Transaction Date",
    transactionType: "Transaction Type",
    transactionAmount: "Amount",
    transactionDescription: "Description",
    transactionStatus: "Status",
    transactionId: "Transaction ID",
    deposit: "Deposit",
    withdraw: "Withdraw",
    withdrawal: "Withdrawal",
    transferIn: "Transfer In",
    transferOut: "Transfer Out",
    externalTransfer: "External Transfer",
    billPayment: "Bill Payment",
    exchangeIn: "Exchange In",
    exchangeOut: "Exchange Out",
    goalContribution: "Goal Contribution",
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    downloadReceipt: "Download Receipt",

    // ========== FUND TRANSFER ==========
    sendMoney: "Send Money",
    sendMoneyDesc: "Send money securely to any bank account.",
    recipient: "Recipient",
    recipientName: "Recipient Name",
    recipientAccount: "Recipient Account",
    amount: "Amount",
    description: "Description",
    savedRecipient: "Saved Recipient",
    savedRecipients: "Saved Recipients",
    newRecipient: "New Recipient",
    savePayee: "Save this payee",
    saveRecipient: "Save Recipient",
    transfer: "Transfer",
    transferFunds: "Transfer Funds",
    sourceAccount: "Source Account",
    destinationAccount: "Destination Account",
    iban: "IBAN",
    bankName: "Bank Name",
    paste: "Paste",
    transferSuccess: "Transfer successful!",
    transferFailed: "Transfer failed",
    insufficientBalance: "Insufficient balance",
    invalidIban: "Invalid IBAN",
    confirmTransfer: "Confirm Transfer",
    verifyRecipient: "Verify Recipient",
    recipientVerification: "Recipient Verification",
    typeRecipientName: "Type the recipient's name to confirm",

    // ========== BILL PAYMENTS ==========
    manageBills: "Manage your outstanding bills easily.",
    bills: "Bills",
    payBill: "Pay Bill",
    payAllBills: "Pay All Bills",
    addBill: "Add Bill",
    billTitle: "Bill Title",
    companyName: "Company Name",
    subscriberNo: "Subscriber No",
    category: "Category",
    dueDate: "Due Date",
    status: "Status",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    autoPay: "Auto Pay",
    recurring: "Recurring",
    billPaid: "Bill paid successfully!",
    billPayFailed: "Failed to pay bill",

    // Bill Categories
    electricity: "Electricity",
    water: "Water",
    gas: "Gas",
    internet: "Internet",
    phoneBill: "Phone",
    tv: "TV",
    insurance: "Insurance",
    rent: "Rent",
    mobile: "Mobile",
    creditCard: "Credit Card",
    streaming: "Streaming",
    tuition: "Tuition",
    gym: "Gym",
    other: "Other",

    // ========== CURRENCY EXCHANGE ==========
    exchangeDesc: "Real-time rates, zero hidden fees.",
    from: "From",
    to: "To",
    rate: "Rate",
    exchangeRate: "Exchange Rate",
    fee: "Fee",
    noFee: "No Fee",
    totalCost: "Total Cost",
    toReceive: "You Will Receive",
    exchange: "Exchange",
    exchangeSuccess: "Exchange successful!",
    exchangeFailed: "Exchange failed",
    selectCurrency: "Select Currency",
    liveRates: "Live Rates",
    lastUpdated: "Last Updated",

    // ========== SMART ASSISTANT ==========
    getHelp: "Your AI-powered banking assistant",
    askQuestion: "Type your message... (e.g., Balance, Bills, Help)",
    send: "Send",
    clearChat: "Clear Chat",
    help: "Help",
    online: "Online",
    offline: "Offline",
    typing: "Typing...",
    confirmAction: "Waiting for your confirmation",
    yesConfirm: "Yes, Confirm",
    noCancel: "Cancel",
    connectionError: "Connection error. Please try again.",
    errorOccurred: "An error occurred. Please try again.",
    accountCount: "Account Count",
    pendingBills: "Pending Bills",
    total: "Total",
    lastPayment: "Last payment",
    income: "Income",
    expense: "Expense",
    net: "Net",
    progress: "Progress",
    atomAssistant: "Atom Assistant",
    poweredBy: "Atom Assistant - Making your banking easier",

    // ========== SAVINGS GOALS ==========
    savingsGoals: "Savings Goals",
    createGoal: "Create Goal",
    goalName: "Goal Name",
    targetAmount: "Target Amount",
    currentAmount: "Current Amount",
    targetDate: "Target Date",
    contributeToGoal: "Contribute",
    goalProgress: "Goal Progress",
    onTrack: "On Track",
    behind: "Behind Schedule",
    goalCompleted: "Goal Completed!",
    goalAbandoned: "Abandoned",

    // ========== SPEND ANALYSIS ==========
    spendingByCategory: "Spending by Category",
    totalIncome: "Total Income",
    totalSpending: "Total Spending",
    netAmount: "Net Amount",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    period: "Period",
    percentage: "Percentage",
    visual: "Visual",

    // Spending Categories
    utilities: "Utilities",
    shopping: "Shopping",
    food: "Food & Dining",
    transport: "Transport",
    entertainment: "Entertainment",
    health: "Health",
    education: "Education",

    // ========== FORMS & VALIDATION ==========
    required: "Required",
    optional: "Optional",
    invalidEmail: "Invalid email address",
    invalidPhone: "Invalid phone number",
    invalidAmount: "Invalid amount",
    minLength: "Minimum {min} characters",
    maxLength: "Maximum {max} characters",
    enterValidAmount: "Please enter a valid amount",
    selectOption: "Please select an option",
    fillAllFields: "Please fill in all fields",

    // ========== MESSAGES ==========
    welcomeToAtomBank: "Welcome to Atom Bank",
    manageBalance: "Manage your balance, transfers and cards in one aurora-style dashboard.",
    sureLogout: "Are you sure you want to log out?",
    noChanges: "No changes to save.",
    areYouSure: "Are you sure?",
    actionCannotBeUndone: "This action cannot be undone.",
    operationSuccess: "Operation completed successfully",
    operationFailed: "Operation failed",
    pleaseWait: "Please wait...",
    tryAgain: "Try Again",
    contactSupport: "Contact Support",

    // ========== MODALS ==========
    modalClose: "Close",
    modalConfirm: "Confirm",
    modalCancel: "Cancel",
    details: "Details",
    moreInfo: "More Info",

    // ========== COMMON ACTIONS ==========
    select: "Select",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    clear: "Clear",
    submit: "Submit",
    apply: "Apply",
    reset: "Reset",
    refresh: "Refresh",
    download: "Download",
    upload: "Upload",
    copy: "Copy",
    copied: "Copied!",
    share: "Share",
    print: "Print",
    export: "Export",
    import: "Import",

    // ========== DATE & TIME ==========
    date: "Date",
    time: "Time",
    dateTime: "Date & Time",
    startDate: "Start Date",
    endDate: "End Date",
    createdAt: "Created At",
    updatedAt: "Updated At",
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
    sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday",
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",

    // ========== MISC ==========
    version: "Version",
    copyright: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    helpCenter: "Help Center",
    faq: "FAQ",
    support: "Support",
    aboutUs: "About Us",
    contactUs: "Contact Us",
  },

  tr: {
    // ========== ORTAK ==========
    welcome: "Merhaba {name}, tekrar hoş geldiniz!",
    logout: "Çıkış Yap",
    logOut: "Çıkış Yap",
    cancel: "İptal",
    save: "Kaydet",
    saveChanges: "Değişiklikleri Kaydet",
    saving: "Kaydediliyor...",
    edit: "Düzenle",
    delete: "Sil",
    close: "Kapat",
    confirm: "Onayla",
    yes: "Evet",
    no: "Hayır",
    ok: "Tamam",
    back: "Geri",
    next: "İleri",
    previous: "Önceki",
    loading: "Yükleniyor...",
    error: "Hata",
    success: "Başarılı",
    warning: "Uyarı",
    info: "Bilgi",

    // ========== NAVİGASYON & KENAR ÇUBUĞU ==========
    overview: "Genel Bakış",
    dashboard: "Kontrol Paneli",
    accounts: "Hesaplar",
    accountHistory: "Hesap Geçmişi",
    fundTransfer: "Para Transferi",
    billPayment: "Fatura Ödeme",
    billPayments: "Fatura Ödemeleri",
    currencyExchange: "Döviz Kuru",
    smartAssistant: "Akıllı Asistan",
    smartAssistantSupport: "Akıllı Asistan Desteği",
    settings: "Ayarlar",
    profile: "Profil",
    notifications: "Bildirimler",
    home: "Ana Sayfa",

    // ========== TEMA & DİL ==========
    theme: "Tema",
    lightMode: "Açık Mod",
    darkMode: "Karanlık Mod",
    language: "Dil",
    english: "İngilizce",
    turkish: "Türkçe",
    useDarkMode: "Karanlık Modu Kullan",

    // ========== PROFİL ==========
    editProfile: "Profili Düzenle",
    profileImage: "Profil Resmi",
    uploadImage: "Resim Yükle",
    firstName: "Ad",
    lastName: "Soyad",
    fullName: "Ad Soyad",
    email: "E-posta",
    phoneNumber: "Telefon Numarası",
    phone: "Telefon",
    address: "Adres",
    street: "Sokak",
    city: "Şehir",
    state: "İlçe",
    postalCode: "Posta Kodu",
    country: "Ülke",
    dateOfBirth: "Doğum Tarihi",
    preferences: "Tercihler",
    subscribeNewsletter: "Bültene Abone Ol",
    enableSms: "SMS Bildirimlerini Etkinleştir",
    enableEmail: "E-posta Bildirimlerini Etkinleştir",
    enablePush: "Push Bildirimlerini Etkinleştir",
    twoFactorAuth: "İki Faktörlü Kimlik Doğrulama",
    profileUpdated: "Profil başarıyla güncellendi!",
    profileUpdateFailed: "Profil güncellenemedi",

    // ========== ŞİFRE ==========
    changePassword: "Şifre Değiştir",
    changePasswordTitle: "Şifre Değiştir",
    currentPassword: "Mevcut Şifre",
    newPassword: "Yeni Şifre",
    confirmPassword: "Yeni Şifreyi Onayla",
    passwordChanged: "Şifre başarıyla değiştirildi!",
    passwordChangeFailed: "Şifre değiştirilemedi",
    passwordsNotMatch: "Yeni şifreler eşleşmiyor!",
    passwordTooShort: "Şifre en az 6 karakter olmalıdır.",

    // ========== KİMLİK DOĞRULAMA ==========
    login: "Giriş Yap",
    register: "Kayıt Ol",
    signIn: "Oturum Aç",
    signUp: "Kayıt Ol",
    signOut: "Çıkış Yap",
    forgotPassword: "Şifremi Unuttum",
    resetPassword: "Şifreyi Sıfırla",
    rememberMe: "Beni Hatırla",
    authRequired: "Kimlik doğrulama gerekli. Lütfen tekrar giriş yapın.",
    sessionExpired: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
    loginSuccess: "Giriş başarılı!",
    loginFailed: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
    registerSuccess: "Kayıt başarılı!",
    registerFailed: "Kayıt başarısız. Lütfen tekrar deneyin.",

    // ========== KONTROL PANELİ ==========
    yourBalance: "Bakiyeniz",
    totalBalance: "Toplam Bakiye",
    accountNo: "Hesap No",
    recentTransactions: "Son İşlemler",
    spendAnalysis: "Harcama Analizi",
    quickTransfer: "Hızlı Transfer",
    viaMobileNo: "Cep Telefonu ile",
    viaAccountNo: "Hesap Numarası ile",
    sendNow: "Şimdi Gönder",
    yourAccounts: "Hesaplarınız",
    today: "Bugün",
    yesterday: "Dün",
    showMore: "Daha Fazla",
    viewAll: "Tümünü Gör",
    noTransactions: "İşlem bulunamadı",
    noData: "Veri mevcut değil",

    // ========== HESAPLAR ==========
    createAccount: "Yeni Hesap Oluştur",
    openNewAccount: "Yeni Hesap Aç",
    accountName: "Hesap Adı",
    accountType: "Hesap Türü",
    currency: "Para Birimi",
    balance: "Bakiye",
    availableBalance: "Kullanılabilir Bakiye",
    checking: "Vadesiz",
    savings: "Vadeli",
    deposit: "Para Yatırma",
    investment: "Yatırım",
    accountCreated: "Hesap başarıyla oluşturuldu!",
    accountCreateFailed: "Hesap oluşturulamadı",
    accountClosed: "Hesap başarıyla kapatıldı",
    accountStatus: "Hesap Durumu",
    active: "Aktif",
    blocked: "Blokeli",
    closed: "Kapalı",

    // ========== İŞLEMLER ==========
    transactions: "İşlemler",
    transactionHistory: "İşlem Geçmişi",
    transactionDetails: "İşlem Detayları",
    transactionDate: "İşlem Tarihi",
    transactionType: "İşlem Türü",
    transactionAmount: "Tutar",
    transactionDescription: "Açıklama",
    transactionStatus: "Durum",
    transactionId: "İşlem No",
    deposit: "Para Yatırma",
    withdraw: "Para Çekme",
    withdrawal: "Para Çekme",
    transferIn: "Gelen Transfer",
    transferOut: "Giden Transfer",
    externalTransfer: "Harici Transfer",
    billPayment: "Fatura Ödeme",
    exchangeIn: "Döviz Alım",
    exchangeOut: "Döviz Satım",
    goalContribution: "Hedef Katkısı",
    completed: "Tamamlandı",
    pending: "Beklemede",
    failed: "Başarısız",
    cancelled: "İptal Edildi",
    downloadReceipt: "Dekont İndir",

    // ========== PARA TRANSFERİ ==========
    sendMoney: "Para Gönder",
    sendMoneyDesc: "Herhangi bir banka hesabına güvenli bir şekilde para gönderin.",
    recipient: "Alıcı",
    recipientName: "Alıcı Adı",
    recipientAccount: "Alıcı Hesap",
    amount: "Tutar",
    description: "Açıklama",
    savedRecipient: "Kayıtlı Alıcı",
    savedRecipients: "Kayıtlı Alıcılar",
    newRecipient: "Yeni Alıcı",
    savePayee: "Bu alıcıyı kaydet",
    saveRecipient: "Alıcıyı Kaydet",
    transfer: "Transfer Et",
    transferFunds: "Para Transfer Et",
    sourceAccount: "Kaynak Hesap",
    destinationAccount: "Hedef Hesap",
    iban: "IBAN",
    bankName: "Banka Adı",
    paste: "Yapıştır",
    transferSuccess: "Transfer başarılı!",
    transferFailed: "Transfer başarısız",
    insufficientBalance: "Yetersiz bakiye",
    invalidIban: "Geçersiz IBAN",
    confirmTransfer: "Transferi Onayla",
    verifyRecipient: "Alıcıyı Doğrula",
    recipientVerification: "Alıcı Doğrulama",
    typeRecipientName: "Onaylamak için alıcının adını yazın",

    // ========== FATURA ÖDEMELERİ ==========
    manageBills: "Ödenmemiş faturalarınızı kolayca yönetin.",
    bills: "Faturalar",
    payBill: "Fatura Öde",
    payAllBills: "Tüm Faturaları Öde",
    addBill: "Fatura Ekle",
    billTitle: "Fatura Başlığı",
    companyName: "Şirket Adı",
    subscriberNo: "Abone No",
    category: "Kategori",
    dueDate: "Son Ödeme Tarihi",
    status: "Durum",
    paid: "Ödendi",
    unpaid: "Ödenmedi",
    overdue: "Gecikmiş",
    autoPay: "Otomatik Ödeme",
    recurring: "Tekrarlayan",
    billPaid: "Fatura başarıyla ödendi!",
    billPayFailed: "Fatura ödenemedi",

    // Fatura Kategorileri
    electricity: "Elektrik",
    water: "Su",
    gas: "Doğalgaz",
    internet: "İnternet",
    phoneBill: "Telefon",
    tv: "TV",
    insurance: "Sigorta",
    rent: "Kira",
    mobile: "Mobil",
    creditCard: "Kredi Kartı",
    streaming: "Yayın Servisi",
    tuition: "Eğitim Ücreti",
    gym: "Spor Salonu",
    other: "Diğer",

    // ========== DÖVİZ KURU ==========
    exchangeDesc: "Gerçek zamanlı kurlar, gizli ücret yok.",
    from: "Gönderen",
    to: "Alan",
    rate: "Kur",
    exchangeRate: "Döviz Kuru",
    fee: "Ücret",
    noFee: "Ücretsiz",
    totalCost: "Toplam Maliyet",
    toReceive: "Alacağınız Tutar",
    exchange: "Döviz Çevir",
    exchangeSuccess: "Döviz işlemi başarılı!",
    exchangeFailed: "Döviz işlemi başarısız",
    selectCurrency: "Para Birimi Seç",
    liveRates: "Canlı Kurlar",
    lastUpdated: "Son Güncelleme",

    // ========== AKILLI ASİSTAN ==========
    getHelp: "Yapay zeka destekli bankacılık asistanınız",
    askQuestion: "Mesajınızı yazın... (örnek: Bakiyem, Faturalarım, Yardım)",
    send: "Gönder",
    clearChat: "Sohbeti Temizle",
    help: "Yardım",
    online: "Çevrimiçi",
    offline: "Çevrimdışı",
    typing: "Yazıyor...",
    confirmAction: "İşlem onayınızı bekliyor",
    yesConfirm: "Evet, Onayla",
    noCancel: "İptal",
    connectionError: "Bağlantı hatası. Lütfen tekrar deneyin.",
    errorOccurred: "Bir hata oluştu. Lütfen tekrar deneyin.",
    accountCount: "Hesap Sayısı",
    pendingBills: "Bekleyen Fatura",
    total: "Toplam",
    lastPayment: "Son ödeme",
    income: "Gelir",
    expense: "Gider",
    net: "Net",
    progress: "İlerleme",
    atomAssistant: "Atom Asistan",
    poweredBy: "Atom Asistan - Bankacılığınızı kolaylaştırın",

    // ========== BİRİKİM HEDEFLERİ ==========
    savingsGoals: "Birikim Hedefleri",
    createGoal: "Hedef Oluştur",
    goalName: "Hedef Adı",
    targetAmount: "Hedef Tutar",
    currentAmount: "Mevcut Tutar",
    targetDate: "Hedef Tarih",
    contributeToGoal: "Katkıda Bulun",
    goalProgress: "Hedef İlerlemesi",
    onTrack: "Yolunda",
    behind: "Geride",
    goalCompleted: "Hedef Tamamlandı!",
    goalAbandoned: "Vazgeçildi",

    // ========== HARCAMA ANALİZİ ==========
    spendingByCategory: "Kategoriye Göre Harcama",
    totalIncome: "Toplam Gelir",
    totalSpending: "Toplam Harcama",
    netAmount: "Net Tutar",
    daily: "Günlük",
    weekly: "Haftalık",
    monthly: "Aylık",
    yearly: "Yıllık",
    period: "Dönem",
    percentage: "Yüzde",
    visual: "Görsel",

    // Harcama Kategorileri
    utilities: "Faturalar",
    shopping: "Alışveriş",
    food: "Yeme & İçme",
    transport: "Ulaşım",
    entertainment: "Eğlence",
    health: "Sağlık",
    education: "Eğitim",

    // ========== FORMLAR & DOĞRULAMA ==========
    required: "Zorunlu",
    optional: "İsteğe Bağlı",
    invalidEmail: "Geçersiz e-posta adresi",
    invalidPhone: "Geçersiz telefon numarası",
    invalidAmount: "Geçersiz tutar",
    minLength: "En az {min} karakter",
    maxLength: "En fazla {max} karakter",
    enterValidAmount: "Lütfen geçerli bir tutar girin",
    selectOption: "Lütfen bir seçenek seçin",
    fillAllFields: "Lütfen tüm alanları doldurun",

    // ========== MESAJLAR ==========
    welcomeToAtomBank: "Atom Bank'a Hoş Geldiniz",
    manageBalance: "Bakiyenizi, transferlerinizi ve kartlarınızı tek bir aurora tarzı kontrol panelinden yönetin.",
    sureLogout: "Çıkış yapmak istediğinize emin misiniz?",
    noChanges: "Kaydedilecek değişiklik yok.",
    areYouSure: "Emin misiniz?",
    actionCannotBeUndone: "Bu işlem geri alınamaz.",
    operationSuccess: "İşlem başarıyla tamamlandı",
    operationFailed: "İşlem başarısız",
    pleaseWait: "Lütfen bekleyin...",
    tryAgain: "Tekrar Dene",
    contactSupport: "Destek ile İletişime Geç",

    // ========== MODALLER ==========
    modalClose: "Kapat",
    modalConfirm: "Onayla",
    modalCancel: "İptal",
    details: "Detaylar",
    moreInfo: "Daha Fazla Bilgi",

    // ========== GENEL EYLEMLER ==========
    select: "Seç",
    search: "Ara",
    filter: "Filtrele",
    sort: "Sırala",
    clear: "Temizle",
    submit: "Gönder",
    apply: "Uygula",
    reset: "Sıfırla",
    refresh: "Yenile",
    download: "İndir",
    upload: "Yükle",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    share: "Paylaş",
    print: "Yazdır",
    export: "Dışa Aktar",
    import: "İçe Aktar",

    // ========== TARİH & SAAT ==========
    date: "Tarih",
    time: "Saat",
    dateTime: "Tarih & Saat",
    startDate: "Başlangıç Tarihi",
    endDate: "Bitiş Tarihi",
    createdAt: "Oluşturulma Tarihi",
    updatedAt: "Güncellenme Tarihi",
    jan: "Oca", feb: "Şub", mar: "Mar", apr: "Nis", may: "May", jun: "Haz",
    jul: "Tem", aug: "Ağu", sep: "Eyl", oct: "Eki", nov: "Kas", dec: "Ara",
    sunday: "Pazar", monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba",
    thursday: "Perşembe", friday: "Cuma", saturday: "Cumartesi",
    sun: "Paz", mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt",

    // ========== ÇEŞİTLİ ==========
    version: "Sürüm",
    copyright: "Tüm hakları saklıdır",
    privacyPolicy: "Gizlilik Politikası",
    termsOfService: "Kullanım Şartları",
    helpCenter: "Yardım Merkezi",
    faq: "SSS",
    support: "Destek",
    aboutUs: "Hakkımızda",
    contactUs: "Bize Ulaşın",
  },
};

// ============================================
// i18n CORE FUNCTIONS
// ============================================

/**
 * Get current language from storage or default to 'en'
 */
function getCurrentLanguage() {
  return localStorage.getItem("atomBankLanguage") || "en";
}

/**
 * Set language and persist to localStorage
 * @param {string} lang - Language code ('en' or 'tr')
 */
function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language '${lang}' not found, defaulting to 'en'`);
    lang = "en";
  }

  localStorage.setItem("atomBankLanguage", lang);
  document.documentElement.lang = lang;

  // Update HTML lang attribute
  document.documentElement.setAttribute("lang", lang);

  // Apply translations to all elements with data-i18n
  applyTranslations();

  // Update language toggle buttons
  document.querySelectorAll(".language-toggle button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Dispatch event for other scripts to react
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));

  // Sync with user profile if logged in
  syncLanguageWithProfile(lang);
}

/**
 * Translation function with parameter support
 * @param {string} key - Translation key
 * @param {object} params - Parameters to replace in translation
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  const lang = getCurrentLanguage();
  let translation = translations[lang]?.[key] || translations.en[key] || key;

  // Replace placeholders like {name}, {amount}, etc.
  Object.keys(params).forEach((paramKey) => {
    translation = translation.replace(
      new RegExp(`\\{${paramKey}\\}`, "g"),
      params[paramKey]
    );
  });

  return translation;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const params = el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : {};
    const translation = t(key, params);

    // Handle different element types
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      if (el.getAttribute("placeholder")) {
        el.placeholder = translation;
      } else {
        el.value = translation;
      }
    } else if (el.tagName === "IMG") {
      el.alt = translation;
    } else if (el.tagName === "OPTION") {
      el.textContent = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Handle data-i18n-placeholder for inputs
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  // Handle data-i18n-title for tooltips
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });

  // Handle data-i18n-aria for accessibility
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    el.setAttribute("aria-label", t(key));
  });
}

/**
 * Sync language preference with user profile (if logged in)
 */
async function syncLanguageWithProfile(lang) {
  const token = localStorage.getItem("atomBankToken") || sessionStorage.getItem("atomBankToken");
  if (!token) return;

  try {
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferences: {
          language: lang,
        },
      }),
    });
  } catch (err) {
    // Silently fail - preference is still saved locally
    console.debug("Could not sync language to profile:", err.message);
  }
}

// ============================================
// THEME FUNCTIONS
// ============================================

/**
 * Get current theme from storage
 * Syncs atomBankTheme with atomBankDarkMode for consistency
 */
function getCurrentTheme() {
  // Check atomBankDarkMode first (used by main.js and settings)
  const darkModeValue = localStorage.getItem("atomBankDarkMode");
  if (darkModeValue !== null) {
    // Sync atomBankTheme with atomBankDarkMode
    const theme = darkModeValue === "true" ? "dark" : "light";
    localStorage.setItem("atomBankTheme", theme);
    return theme;
  }
  // Fallback to atomBankTheme
  return localStorage.getItem("atomBankTheme") || "light";
}

/**
 * Set theme and persist to localStorage
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function setTheme(theme) {
  if (theme !== "light" && theme !== "dark") {
    console.warn(`Theme '${theme}' not valid, defaulting to 'light'`);
    theme = "light";
  }

  // Prevent transition flash on initial load
  document.body.classList.add("no-transition");

  // Apply theme class to body
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);

  // Store preference - sync both keys for consistency
  localStorage.setItem("atomBankTheme", theme);
  localStorage.setItem("atomBankDarkMode", theme === "dark" ? "true" : "false");

  // FORCE dark mode styles with inline styles (highest specificity)
  applyDarkModeInlineStyles(theme);

  // Re-enable transitions
  requestAnimationFrame(() => {
    document.body.classList.remove("no-transition");
  });

  // Update theme toggle
  document.querySelectorAll(".theme-toggle").forEach((toggle) => {
    toggle.setAttribute("aria-pressed", theme === "dark");
  });

  // Dispatch event for other scripts
  window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));

  // Sync with user profile
  syncThemeWithProfile(theme);
}

/**
 * Apply inline styles for dark mode (overrides Tailwind)
 */
function applyDarkModeInlineStyles(theme) {
  const isDark = theme === "dark";

  // BODY background - most important!
  if (isDark) {
    document.body.style.setProperty('background-color', '#000000', 'important');
    document.body.style.setProperty('background', '#000000', 'important');
  } else {
    document.body.style.setProperty('background-color', '#e5e8f0', 'important');
    document.body.style.removeProperty('background');
  }

  // Main content section
  document.querySelectorAll('.main_content, section.main_content').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#000000', 'important');
      el.style.setProperty('background', '#000000', 'important');
    } else {
      el.style.removeProperty('background-color');
      el.style.removeProperty('background');
    }
  });

  // Main element and flex containers
  document.querySelectorAll('main, main.flex-1, .flex-1.overflow-y-auto, .overflow-y-auto').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#000000', 'important');
    } else {
      el.style.removeProperty('background-color');
    }
  });

  // Target all bg-white elements
  document.querySelectorAll('.bg-white, [class*="bg-white"]').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#000000', 'important');
      el.style.setProperty('background', '#000000', 'important');
    } else {
      el.style.removeProperty('background-color');
      el.style.removeProperty('background');
    }
  });

  // Target gray backgrounds
  document.querySelectorAll('.bg-gray-50, .bg-gray-100, [class*="bg-gray-50"], [class*="bg-gray-100"]').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#0a0a0a', 'important');
      el.style.setProperty('background', '#0a0a0a', 'important');
    } else {
      el.style.removeProperty('background-color');
      el.style.removeProperty('background');
    }
  });

  // Target bg-atom-bg elements (inputs)
  document.querySelectorAll('.bg-atom-bg, [class*="bg-atom-bg"]').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#0a0a0a', 'important');
    } else {
      el.style.removeProperty('background-color');
    }
  });

  // Target inputs and selects
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', '#0a0a0a', 'important');
      el.style.setProperty('border-color', '#1a1a1a', 'important');
      el.style.setProperty('color', '#f8fafc', 'important');
    } else {
      el.style.removeProperty('background-color');
      el.style.removeProperty('border-color');
      el.style.removeProperty('color');
    }
  });

  // Target borders
  document.querySelectorAll('.border-white, .border-gray-100, .border-gray-200, [class*="border-gray"]').forEach(el => {
    if (isDark) {
      el.style.setProperty('border-color', '#1a1a1a', 'important');
    } else {
      el.style.removeProperty('border-color');
    }
  });

  // Target text colors
  document.querySelectorAll('.text-atom-text-black').forEach(el => {
    if (isDark) {
      el.style.setProperty('color', '#f8fafc', 'important');
    } else {
      el.style.removeProperty('color');
    }
  });

  document.querySelectorAll('.text-atom-text-dark-grey').forEach(el => {
    if (isDark) {
      el.style.setProperty('color', '#a1a1aa', 'important');
    } else {
      el.style.removeProperty('color');
    }
  });

  document.querySelectorAll('.text-atom-text-grey').forEach(el => {
    if (isDark) {
      el.style.setProperty('color', '#71717a', 'important');
    } else {
      el.style.removeProperty('color');
    }
  });

  // Container div
  document.querySelectorAll('.container').forEach(el => {
    if (isDark) {
      el.style.setProperty('background-color', 'transparent', 'important');
    } else {
      el.style.removeProperty('background-color');
    }
  });
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const currentTheme = getCurrentTheme();
  setTheme(currentTheme === "light" ? "dark" : "light");
}

/**
 * Sync theme preference with user profile (if logged in)
 */
async function syncThemeWithProfile(theme) {
  const token = localStorage.getItem("atomBankToken") || sessionStorage.getItem("atomBankToken");
  if (!token) return;

  try {
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferences: {
          darkMode: theme === "dark",
        },
      }),
    });
  } catch (err) {
    console.debug("Could not sync theme to profile:", err.message);
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize theme and language on page load
 */
function initThemeAndLanguage() {
  // Check for user's system preference as fallback
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Initialize theme
  const savedTheme = localStorage.getItem("atomBankTheme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (systemPrefersDark) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  // Initialize language
  const savedLang = localStorage.getItem("atomBankLanguage");
  const userLang = navigator.language?.startsWith("tr") ? "tr" : "en";
  setLanguage(savedLang || userLang);

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("atomBankTheme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });

  // Re-apply dark mode styles after Tailwind renders (multiple attempts)
  const currentTheme = getCurrentTheme();
  setTimeout(() => applyDarkModeInlineStyles(currentTheme), 100);
  setTimeout(() => applyDarkModeInlineStyles(currentTheme), 500);
  setTimeout(() => applyDarkModeInlineStyles(currentTheme), 1000);

  // Watch for dynamically added elements
  const observer = new MutationObserver(() => {
    if (getCurrentTheme() === 'dark') {
      applyDarkModeInlineStyles('dark');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Create and inject theme toggle button
 */
function createThemeToggle(container) {
  if (!container) return;

  const toggle = document.createElement("button");
  toggle.className = "theme-toggle";
  toggle.setAttribute("aria-label", "Toggle theme");
  toggle.setAttribute("aria-pressed", getCurrentTheme() === "dark");
  toggle.innerHTML = `
    <span class="theme-toggle-icon sun">☀️</span>
    <span class="theme-toggle-icon moon">🌙</span>
  `;
  toggle.addEventListener("click", toggleTheme);
  container.appendChild(toggle);
  return toggle;
}

/**
 * Create and inject language toggle
 */
function createLanguageToggle(container) {
  if (!container) return;

  const currentLang = getCurrentLanguage();
  const toggle = document.createElement("div");
  toggle.className = "language-toggle";
  toggle.innerHTML = `
    <button data-lang="en" class="${currentLang === 'en' ? 'active' : ''}">EN</button>
    <button data-lang="tr" class="${currentLang === 'tr' ? 'active' : ''}">TR</button>
  `;

  toggle.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  container.appendChild(toggle);
  return toggle;
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeAndLanguage);
} else {
  initThemeAndLanguage();
}

// ============================================
// EXPORTS
// ============================================

if (typeof window !== "undefined") {
  window.t = t;
  window.translations = translations;
  window.setLanguage = setLanguage;
  window.getCurrentLanguage = getCurrentLanguage;
  window.applyTranslations = applyTranslations;
  window.setTheme = setTheme;
  window.getCurrentTheme = getCurrentTheme;
  window.toggleTheme = toggleTheme;
  window.createThemeToggle = createThemeToggle;
  window.createLanguageToggle = createLanguageToggle;
}
