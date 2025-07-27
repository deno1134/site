# Key System Integration Guide

Bu rehber, dijital ürün anahtar sistemini exe loader'larınızla nasıl entegre edeceğinizi açıklar.

## Düzeltilen Connection Errors

### 1. Frontend Dependencies Hatası
- **Problem**: Frontend dependencies eksikti
- **Çözüm**: `npm install` komutu ile tüm dependencies yüklendi

### 2. Database Schema Güncellemesi
- **Problem**: `hwid` kolonu eksikti
- **Çözüm**: Database schema güncellendi ve HWID binding özelliği eklendi

### 3. API Endpoints İyileştirmesi
- **Problem**: Key validation endpoint yoktu
- **Çözüm**: `/api/validate-key` endpoint'i eklendi

## Proje Yapısı

```
project/
├── backend/          # Node.js Express API
│   ├── index.js      # Ana server dosyası
│   ├── db.js         # Database konfigürasyonu
│   └── package.json  # Dependencies
├── frontend/         # React web panel
│   └── src/
│       ├── App.jsx
│       └── components/
└── loader_example.cpp # C++ loader örneği
```

## Sistem Nasıl Çalışır?

### 1. Anahtar Doğrulama Süreci
1. User bir anahtar girer
2. Loader, sistem HWID'sini toplar
3. Server'a anahtar + HWID gönderilir
4. Server anahtarı doğrular ve HWID'ye bağlar
5. Başarılı doğrulama sonrası exe yüklenir

### 2. HWID Binding
- Her anahtar sadece bir cihaza bağlanabilir
- İlk kullanımda anahtar cihazın HWID'sine bağlanır
- Aynı anahtar başka bir cihazda kullanılamaz
- Admin panel üzerinden HWID reset yapılabilir

## Kurulum

### Backend Çalıştırma
```bash
cd backend
npm install
npm start
```
Server http://localhost:3001 adresinde çalışacak.

### Frontend Çalıştırma
```bash
cd frontend
npm install
npm run dev
```
Web panel http://localhost:5173 adresinde çalışacak.

### Varsayılan Admin Bilgileri
- **Username**: admin
- **Password**: admin123

## API Endpoints

### Anahtar Doğrulama (Loader için)
```http
POST /api/validate-key
Content-Type: application/json

{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "hardware_id_string",
  "product_name": "MySecureApp"
}
```

**Başarılı Response:**
```json
{
  "valid": true,
  "message": "Key validated",
  "key_id": 123,
  "product": "MySecureApp"
}
```

**Hata Response:**
```json
{
  "valid": false,
  "message": "Invalid key or product"
}
```

### Test Endpoint
```http
GET /api/generate-hwid
```
Test için rastgele HWID üretir.

## C++ Loader Integration

### Gerekli Kütüphaneler
1. **libcurl** - HTTP istekleri için
2. **jsoncpp** - JSON parsing için
3. **Windows API** - HWID toplama için

### Örnek Kod Kullanımı

```cpp
// Anahtar doğrulama
if (ValidateKey(userKey, "MyProduct")) {
    LoadProtectedExecutable("app.exe");
}
```

### HWID Toplama Yöntemleri
Kod örneğinde şu yöntemler kullanılıyor:
1. **Birincil**: `Win32_ComputerSystemProduct.UUID`
2. **Yedek**: CPU ID

### Compilation (Visual Studio)
```bash
# Gerekli linkler
wbemuuid.lib
libcurl.lib
jsoncpp.lib

# Preprocessor defines
CURL_STATICLIB
```

## Güvenlik Önerileri

### 1. Server Güvenliği
- JWT secret'ı değiştirin
- HTTPS kullanın (production için)
- Rate limiting ekleyin
- Database'i koruyun

### 2. Loader Güvenliği
- Loader'ı obfuscate edin
- Anti-debug koruması ekleyin
- Network trafiğini şifreleyin
- Multiple HWID source kullanın

### 3. Database Güvenliği
- Admin şifresini değiştirin
- Regular backup alın
- SQL injection koruması (parameterized queries)

## Advanced Integration

### 1. Encrypted Communication
```cpp
// SSL certificate validation
curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L);
curl_easy_setopt(curl, CURLOPT_CAINFO, "ca-bundle.crt");
```

### 2. Time-Based Keys
Server tarafında key expiration ekleyebilirsiniz:
```sql
ALTER TABLE keys ADD COLUMN expires_at DATETIME;
```

### 3. Multiple Product Support
```cpp
std::string productName = "MySecureApp_v2.0";
```

### 4. Offline Mode
```cpp
// Cache valid keys for offline use
bool CacheValidation(const std::string& key, const std::string& hwid) {
    // Implement local caching with encryption
}
```

## Troubleshooting

### Connection Errors
1. Backend server çalışıyor mu kontrol edin
2. Port 3001 açık mı kontrol edin
3. CORS ayarlarını kontrol edin

### Key Validation Fails
1. Product name database'de mevcut mu?
2. HWID doğru generate ediliyor mu?
3. Anahtar daha önce başka cihazda kullanıldı mı?

### Database Issues
1. SQLite file permissions kontrol edin
2. Database corruption check edin
3. Backup'tan restore edin

## Test Senaryosu

1. **Backend'i başlatın**
2. **Frontend'i açın** (http://localhost:5173)
3. **Admin login** yapın (admin/admin123)
4. **Yeni product** ekleyin ("TestProduct")
5. **Test key** ekleyin ("TEST-1234-5678-ABCD")
6. **C++ loader'ı derleyin** ve çalıştırın
7. **Test key'i** girin ve doğrulamayı test edin

## Production Deployment

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=your_secure_secret_here
DB_PATH=/data/production.db
PORT=3001
```

## License & Support

Bu sistem eğitim amaçlıdır. Production kullanımı için ek güvenlik önlemleri alınmalıdır.

For support: [Your contact information]