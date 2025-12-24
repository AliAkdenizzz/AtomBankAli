# Profil Overlay'den Full Name Değiştirme Özelliğinin Kaldırılması

## Özet

Profil overlay'den (her sayfada görünen profil düzenleme modalı) kullanıcıların ad ve soyad (full name) değiştirme özelliği kaldırılmıştır. Artık kullanıcılar profil overlay üzerinden ad ve soyadlarını değiştiremezler.

## Değiştirilen Dosya

- **`frontend/main.js`** - Profil overlay oluşturma, form yükleme ve form gönderme kodları güncellendi

---

## Yapılan Değişiklikler

### 1. HTML Form Alanlarının Kaldırılması

**Konum:** `createProfileOverlay()` fonksiyonu içinde (yaklaşık satır 339-349)

**Kaldırılan Kod:**

```html
<!-- Name Fields -->
<div class="form-row">
  <div class="form-group">
    <label data-i18n="firstName">First Name</label>
    <input
      type="text"
      id="editFirstName"
      data-i18n-placeholder="firstName"
      placeholder="First Name"
    />
  </div>
  <div class="form-group">
    <label data-i18n="lastName">Last Name</label>
    <input
      type="text"
      id="editLastName"
      data-i18n-placeholder="lastName"
      placeholder="Last Name"
    />
  </div>
</div>
```

**Açıklama:** Profil overlay HTML'inden First Name ve Last Name input alanları tamamen kaldırıldı. Bu alanlar artık kullanıcıya gösterilmemektedir.

---

### 2. JavaScript Değişken Tanımlarının Kaldırılması

**Konum:** DOM element referansları bölümünde (yaklaşık satır 557-558)

**Kaldırılan Kod:**

```javascript
// Form inputs
var editFirstName = document.getElementById("editFirstName");
var editLastName = document.getElementById("editLastName");
var editPhone = document.getElementById("editPhone");
```

**Yeni Kod:**

```javascript
// Form inputs
var editPhone = document.getElementById("editPhone");
```

**Açıklama:** `editFirstName` ve `editLastName` değişken tanımları kaldırıldı çünkü artık bu HTML elementleri mevcut değil.

---

### 3. Form Veri Yükleme Kodunun Kaldırılması

**Konum:** `loadUserDataIntoForm()` fonksiyonu içinde (yaklaşık satır 618-643)

**Kaldırılan Kod:**

```javascript
var data = await res.json();
var user = data.data;

// Split fullName or name into first/last
var fullName = user.fullName || user.name || "";
var nameParts = fullName.trim().split(" ");
if (editFirstName) {
  editFirstName.value = nameParts[0] || "";
}
if (editLastName) {
  editLastName.value = nameParts.slice(1).join(" ") || "";
}

// Fill other fields
if (editPhone) editPhone.value = user.phone || "";
```

**Yeni Kod:**

```javascript
var data = await res.json();
var user = data.data;

// Fill other fields
if (editPhone) editPhone.value = user.phone || "";
```

**Açıklama:** Kullanıcı verilerini form alanlarına yüklerken, fullName'i first name ve last name'e bölen ve bu alanları dolduran kod kaldırıldı. Artık sadece telefon numarası ve diğer alanlar yükleniyor.

---

### 4. Form Gönderme (Submit) Kodunun Kaldırılması

**Konum:** `profileForm` submit event listener içinde (yaklaşık satır 821-854)

**Kaldırılan Kod:**

```javascript
// Build update object with ALL form data (even if empty)
var updateData = {};

// Name - always send if fields exist
var firstName = editFirstName ? editFirstName.value.trim() : "";
var lastName = editLastName ? editLastName.value.trim() : "";
if (firstName || lastName) {
  updateData.fullName = (firstName + " " + lastName).trim();
  updateData.name = firstName || updateData.fullName; // Use fullName if firstName is empty
}

// Contact - always send if fields exist
if (editPhone) updateData.phone = editPhone.value.trim();
```

**Yeni Kod:**

```javascript
// Build update object with ALL form data (even if empty)
var updateData = {};

// Contact - always send if fields exist
if (editPhone) updateData.phone = editPhone.value.trim();
```

**Açıklama:** Form gönderilirken first name ve last name değerlerini alıp birleştirerek `fullName` ve `name` alanlarını oluşturan ve `updateData` objesine ekleyen kod kaldırıldı. Artık form gönderilirken name/fullName bilgisi backend'e gönderilmemektedir.

---

## Etkilenen Fonksiyonlar

1. **`createProfileOverlay()`** - Profil overlay HTML'ini oluşturan fonksiyon

   - First Name ve Last Name input alanları kaldırıldı

2. **`loadUserDataIntoForm()`** - Kullanıcı verilerini forma yükleyen fonksiyon

   - Full name'i parçalayıp form alanlarına yükleyen kod kaldırıldı

3. **`profileForm` submit event listener** - Form gönderme işlemini yöneten event listener
   - Name/fullName gönderme kodları kaldırıldı

---

## Sonuç

Profil overlay'den full name değiştirme özelliği başarıyla kaldırılmıştır. Kullanıcılar artık profil overlay üzerinden:

- ✅ Profil resmi değiştirebilir
- ✅ Telefon numarası değiştirebilir
- ✅ Adres bilgilerini güncelleyebilir
- ✅ Tercihleri (newsletter, SMS, dark mode, dil) değiştirebilir
- ✅ Şifre değiştirebilir
- ❌ Ad ve soyad değiştiremez (kaldırıldı)

---

## Notlar

- Backend API (`/api/user/me` endpoint'i) hala fullName bilgisini döndürmektedir, ancak frontend'de bu bilgi artık düzenlenemez.
- Backend'deki `updateProfile` fonksiyonu hala `fullName` ve `name` parametrelerini kabul edebilir, ancak frontend'den bu parametreler artık gönderilmemektedir.
- Kullanıcı adı görüntüleme işlevleri (sidebar, profil kartı vb.) etkilenmemiştir, sadece düzenleme özelliği kaldırılmıştır.

---

## Tarih

Değişiklik yapılan tarih: 2024
