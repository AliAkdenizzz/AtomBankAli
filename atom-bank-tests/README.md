# Atom Bank Test Suite

Atom Bank uygulaması için kapsamlı test paketi. Bu test suite, unit testler, integration testler, E2E testler, güvenlik testleri ve performans testlerini içerir.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Kurulum](#kurulum)
- [Test Yapısı](#test-yapısı)
- [Testleri Çalıştırma](#testleri-çalıştırma)
- [Test Kategorileri](#test-kategorileri)
- [Coverage Raporu](#coverage-raporu)
- [Test ID Referansları](#test-id-referansları)

## 🎯 Genel Bakış

| Test Tipi | Framework | Test Sayısı | Açıklama |
|-----------|-----------|-------------|----------|
| Unit Tests | Jest | 40+ | Helper fonksiyonlar, validation, middleware |
| Integration Tests | Jest + Supertest | 35+ | API endpoint testleri |
| E2E Tests | Playwright | 30+ | Kullanıcı akış testleri |
| Security Tests | Jest | 12+ | Güvenlik açığı testleri |
| Performance Tests | k6 | 5+ | Yük ve stres testleri |

## 🚀 Kurulum

### Gereksinimler

- Node.js >= 18.0.0
- npm veya yarn
- k6 (performans testleri için)

### Adımlar

```bash
# 1. Test dizinine gidin
cd atom-bank-tests

# 2. Bağımlılıkları yükleyin
npm install

# 3. Playwright browser'larını yükleyin
npx playwright install

# 4. k6'yı yükleyin (performans testleri için)
# macOS:
brew install k6
# Windows:
choco install k6
# Linux:
sudo apt-get install k6
```

## 📁 Test Yapısı

```
tests/
├── setup.js                    # Jest global setup
├── teardown.js                 # Jest global teardown
├── fixtures/
│   └── testData.json          # Test verileri
├── unit/
│   ├── helpers/
│   │   ├── validation.test.js # IBAN, amount, password validation
│   │   └── account.test.js    # Account number, IBAN generation
│   └── middlewares/
│       └── auth.test.js       # JWT authentication middleware
├── integration/
│   ├── auth.test.js           # Auth API testleri
│   ├── transaction.test.js    # Transaction API testleri
│   └── account-bill.test.js   # Account & Bill API testleri
├── e2e/
│   ├── auth.spec.js           # Login/Register/Logout akışları
│   ├── transfer.spec.js       # Transfer ve işlem akışları
│   └── bills-savings.spec.js  # Fatura ve tasarruf hedefi akışları
├── security/
│   └── security.test.js       # Güvenlik testleri
└── performance/
    ├── load-test.js           # k6 yük testi
    └── stress-test.js         # k6 stres testi
```

## 🧪 Testleri Çalıştırma

### Unit & Integration Tests (Jest)

```bash
# Tüm Jest testlerini çalıştır
npm test

# Sadece unit testleri
npm run test:unit

# Sadece integration testleri
npm run test:integration

# Coverage raporu ile
npm run test:coverage

# Watch modunda
npm run test:watch

# CI ortamında
npm run test:ci
```

### E2E Tests (Playwright)

```bash
# Tüm E2E testleri
npm run e2e

# Tarayıcı görünür modda
npm run e2e:headed

# Debug modunda
npm run e2e:debug

# UI modunda
npm run e2e:ui

# Belirli browser'da
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit

# Mobil testler
npm run e2e:mobile

# Raporu görüntüle
npm run e2e:report
```

### Performance Tests (k6)

```bash
# Yük testi
npm run perf:load

# Stres testi
npm run perf:stress

# Özel VU sayısıyla
npm run perf:load:50   # 50 virtual user
npm run perf:load:100  # 100 virtual user
npm run perf:load:200  # 200 virtual user

# Manuel çalıştırma
k6 run tests/performance/load-test.js
k6 run -e BASE_URL=http://localhost:5000 tests/performance/stress-test.js
```

### Tüm Testler

```bash
# Unit + Integration + E2E
npm run test:all

# Full suite (coverage + E2E + performance)
npm run test:full
```

## 📊 Test Kategorileri

### Unit Tests (UT-)

| Test ID | Dosya | Açıklama |
|---------|-------|----------|
| UT-VAL-01 to 15 | validation.test.js | IBAN, amount, password, email validation |
| UT-ACC-01 to 09 | account.test.js | Account number, IBAN generation, balance calculation |
| UT-AUTH-01 to 14 | auth.test.js | JWT middleware, role-based access |

### Integration Tests (IT-)

| Test ID | Dosya | Açıklama |
|---------|-------|----------|
| IT-AUTH-01 to 15 | auth.test.js | Register, Login, Logout API |
| IT-TR-01 to 20 | transaction.test.js | Deposit, Withdraw, Transfer API |
| IT-ACC-01 to 10 | account-bill.test.js | Account management API |
| IT-BILL-01 to 08 | account-bill.test.js | Bill management API |

### E2E Tests (E2E-)

| Test ID | Dosya | Açıklama |
|---------|-------|----------|
| E2E-AUTH-01 to 10 | auth.spec.js | Login, Register, Logout flows |
| E2E-TR-01 to 12 | transfer.spec.js | Transfer, Deposit, Withdraw flows |
| E2E-BILL-01 to 06 | bills-savings.spec.js | Bill payment flows |
| E2E-SAV-01 to 06 | bills-savings.spec.js | Savings goal flows |

### Security Tests (SEC-)

| Test ID | Açıklama |
|---------|----------|
| SEC-01 | Rate limiting |
| SEC-02 | Authentication bypass |
| SEC-03 | IDOR (Insecure Direct Object Reference) |
| SEC-04 | SQL/NoSQL injection |
| SEC-05 | XSS prevention |
| SEC-06 | JWT token manipulation |
| SEC-07 | Token expiration |
| SEC-08 | Sensitive data exposure |
| SEC-09 | Error message information leakage |
| SEC-10 | Security headers |
| SEC-11 | Negative amount prevention |
| SEC-12 | Transaction amount limits |

### Performance Tests (PERF-)

| Test ID | Açıklama |
|---------|----------|
| PERF-01 | Login performance |
| PERF-02 | Dashboard load performance |
| PERF-03 | Transaction history performance |
| PERF-04 | Transfer performance |
| PERF-05 | Deposit performance |
| STRESS-01 | Breaking point test |
| STRESS-02 | API endpoint stress |
| STRESS-03 | Transaction stress |

## 📈 Coverage Raporu

Coverage hedefleri:

| Metrik | Hedef |
|--------|-------|
| Statements | ≥70% |
| Branches | ≥70% |
| Functions | ≥70% |
| Lines | ≥70% |

Coverage raporunu görüntüleme:

```bash
# Coverage ile test çalıştır
npm run test:coverage

# HTML raporu aç
npm run report:coverage
# veya
open coverage/lcov-report/index.html
```

## 📝 Environment Variables

`.env` dosyası oluşturun:

```env
# Test server URL
BASE_URL=http://localhost:5000

# Test database
MONGODB_URI=mongodb://localhost:27017/atombank_test

# JWT
JWT_SECRET_KEY=test-secret-key
JWT_EXPIRE=1h

# Test mode
NODE_ENV=test
```

## 🔧 Konfigürasyon Dosyaları

- `jest.config.js` - Jest konfigürasyonu
- `playwright.config.js` - Playwright konfigürasyonu

## 📚 Test Report Formatı

Test sonuçları aşağıdaki formatlarda üretilir:

| Format | Konum | Araç |
|--------|-------|------|
| HTML Coverage | `coverage/lcov-report/index.html` | Jest |
| LCOV | `coverage/lcov.info` | Jest |
| HTML Report | `playwright-report/index.html` | Playwright |
| JSON Results | `test-results/results.json` | Playwright |
| k6 Summary | `test-results/k6-summary.json` | k6 |

## 🎓 Akademik Rapor için Kullanım

Bu test suite, yazılım mühendisliği dersi için test raporu hazırlamak üzere tasarlanmıştır:

1. **Black-box testler**: E2E testleri ve integration testleri
2. **White-box testler**: Unit testleri
3. **Security testler**: OWASP standartlarına göre
4. **Performance testler**: k6 ile yük ve stres testleri

## 📞 Destek

Sorularınız için: test-team@atombank.com

---

**Not**: Bu test suite, Atom Bank projesinin `models/user.js` embedded subdocument yapısı (accounts[], transactions[], bills[], savingsGoals[]) dikkate alınarak hazırlanmıştır.
