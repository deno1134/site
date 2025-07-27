# 🔐 License System API

Asterix.wuaze.com sitesine benzer, API tabanlı hile lisanslama sistemi.

## 🚀 Özellikler

- ✅ UUID v4 tabanlı lisans anahtarları
- 🔒 HWID (Hardware ID) doğrulaması ve bağlama
- ⏰ Süreli lisanslar (7d, 30d, 90d, 365d, lifetime)
- 👨‍💼 Admin paneli API'leri
- 📊 Rate limiting ve güvenlik
- 📝 Detaylı loglama sistemi
- 🛡️ JWT token desteği

## 🏗️ Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Üretim modunda çalıştır
npm start
```

## ⚙️ Konfigürasyon

`.env` dosyasını düzenleyin:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Admin Configuration
ADMIN_API_KEY=admin-api-key-change-this-in-production

# Database Configuration
DB_PATH=./database.sqlite

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📋 API Endpoints

### 🔓 Public Endpoints

#### POST `/api/verify` - Lisans Doğrulama
Lisans anahtarı ve HWID doğrulaması yapar.

**Request:**
```json
{
  "license_key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA",
  "hwid": "unique-hardware-identifier"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "License valid",
  "timestamp": "2025-07-27T17:57:27.839Z",
  "data": {
    "license": {
      "key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA",
      "hwid": "unique-hardware-identifier",
      "expiresAt": 1756231043576,
      "status": "active",
      "isExpired": false,
      "lastUsedAt": "2025-07-27 17:57:27",
      "usageCount": 1,
      "createdAt": "2025-07-27 17:57:23"
    },
    "server_time": "2025-07-27T17:57:27.839Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "HWID mismatch - license bound to different hardware",
  "timestamp": "2025-07-27T17:57:31.306Z",
  "data": {
    "license": {...},
    "server_time": "2025-07-27T17:57:31.306Z"
  }
}
```

### 🔒 Admin Endpoints

Tüm admin endpoint'leri `X-API-Key` header'ı gerektirir.

#### POST `/api/create` - Lisans Oluşturma

**Headers:**
```
X-API-Key: admin-api-key-change-this-in-production
Content-Type: application/json
```

**Request:**
```json
{
  "license_type": "30d"
}
```

**Valid License Types:**
- `7d` - 7 günlük
- `30d` - 30 günlük  
- `90d` - 90 günlük
- `365d` - 1 yıllık
- `lifetime` - Süresiz

**Response:**
```json
{
  "success": true,
  "message": "License created successfully",
  "timestamp": "2025-07-27T17:57:23.583Z",
  "data": {
    "license": {
      "key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA",
      "hwid": null,
      "expiresAt": 1756231043576,
      "status": "active",
      "isExpired": false,
      "lastUsedAt": null,
      "usageCount": 0,
      "createdAt": "2025-07-27 17:57:23"
    }
  }
}
```

#### POST `/api/reset-hwid` - HWID Sıfırlama

**Request:**
```json
{
  "license_key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "HWID reset successfully",
  "timestamp": "2025-07-27T17:57:34.842Z"
}
```

#### GET `/api/licenses` - Tüm Lisansları Getir

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Licenses retrieved successfully",
  "timestamp": "2025-07-27T17:57:38.492Z",
  "data": {
    "licenses": [
      {
        "key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA",
        "hwid": "unique-hardware-identifier",
        "expiresAt": 1756231043576,
        "status": "active",
        "isExpired": false,
        "lastUsedAt": "2025-07-27 17:57:27",
        "usageCount": 1,
        "createdAt": "2025-07-27 17:57:23"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1
    }
  }
}
```

#### GET `/api/license/:key` - Lisans Detayları

**Response:**
```json
{
  "success": true,
  "message": "License details retrieved successfully",
  "timestamp": "2025-07-27T17:57:38.492Z",
  "data": {
    "license": {...},
    "logs": [
      {
        "id": 1,
        "license_key": "3A062C0D-BEC1-4B3A-9903-7279BDF4D0BA",
        "ip_address": "127.0.0.1",
        "hwid": "unique-hardware-identifier",
        "action": "first_bind",
        "success": 1,
        "created_at": "2025-07-27 17:57:27"
      }
    ]
  }
}
```

#### PUT `/api/license/:key/status` - Lisans Durumu Güncelleme

**Request:**
```json
{
  "status": "suspended"
}
```

**Valid Statuses:**
- `active` - Aktif
- `expired` - Süresi dolmuş
- `suspended` - Askıya alınmış
- `banned` - Yasaklanmış

#### DELETE `/api/license/:key` - Lisans Silme

**Response:**
```json
{
  "success": true,
  "message": "License deleted successfully",
  "timestamp": "2025-07-27T17:57:38.492Z"
}
```

## 🔒 Güvenlik

- **Rate Limiting**: IP başına dakika başı istek sınırı
- **HWID Binding**: Lisans ilk kullanımda donanıma bağlanır
- **API Key Protection**: Admin işlemleri için API anahtarı gerekli
- **Input Validation**: Tüm girdiler doğrulanır
- **Error Handling**: Güvenli hata mesajları
- **Request Logging**: Tüm istekler loglanır

## 📊 Durum Kodları

- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Geçersiz istek
- `401` - Yetkisiz erişim
- `403` - Yasaklı
- `404` - Bulunamadı
- `429` - Çok fazla istek
- `500` - Sunucu hatası

## 🧪 Test Örnekleri

### cURL Örnekleri

```bash
# Lisans oluştur
curl -X POST http://localhost:3001/api/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-api-key-change-this-in-production" \
  -d '{"license_type": "30d"}'

# Lisans doğrula
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key": "YOUR-LICENSE-KEY", "hwid": "your-hardware-id"}'

# HWID sıfırla
curl -X POST http://localhost:3001/api/reset-hwid \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-api-key-change-this-in-production" \
  -d '{"license_key": "YOUR-LICENSE-KEY"}'

# Tüm lisansları getir
curl -X GET http://localhost:3001/api/licenses \
  -H "X-API-Key: admin-api-key-change-this-in-production"
```

## 🗄️ Veritabanı Yapısı

### licenses
- `id` - Primary key
- `license_key` - UUID v4 lisans anahtarı
- `hwid` - Donanım kimliği
- `expires_at` - Son kullanma tarihi
- `status` - Lisans durumu
- `created_at` - Oluşturulma tarihi
- `updated_at` - Güncellenme tarihi
- `last_used_at` - Son kullanım tarihi
- `usage_count` - Kullanım sayısı

### license_logs
- `id` - Primary key
- `license_key` - Lisans anahtarı
- `ip_address` - IP adresi
- `hwid` - Donanım kimliği
- `action` - Yapılan işlem
- `success` - Başarı durumu
- `created_at` - Oluşturulma tarihi

## 🚀 Üretim Dağıtımı

1. `.env` dosyasındaki güvenlik anahtarlarını değiştirin
2. `NODE_ENV=production` ayarlayın
3. HTTPS kullanın
4. Firewall kurallarını ayarlayın
5. Log dosyalarını izleyin

## 📞 Destek

Herhangi bir sorun için issue açabilirsiniz.