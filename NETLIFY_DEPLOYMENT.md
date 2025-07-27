# 🚀 Netlify Deployment Kılavuzu

## ✅ Hazırlık Tamamlandı

Proje Netlify deployment için hazırlandı:

- ✅ `netlify.toml` konfigürasyon dosyası
- ✅ Frontend build sistemi (Vite)
- ✅ Environment variables
- ✅ SPA routing konfigürasyonu
- ✅ API proxy ayarları

## 📋 Deployment Adımları

### 1. GitHub Repository Hazırlığı

```bash
# Değişiklikleri commit et
git add .
git commit -m "Add Netlify deployment configuration and license system frontend"
git push origin main
```

### 2. Netlify'da Site Oluşturma

1. **Netlify.com'a git** ve GitHub ile giriş yap
2. **"New site from Git"** butonuna tıkla
3. **GitHub** seç ve repository'ni bul: `deno1134/site`
4. **Deploy settings:**
   - **Branch to deploy:** `main`
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`

### 3. Environment Variables Ayarlama

Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_API_URL = https://your-backend-url.herokuapp.com
```

### 4. Backend Deployment (Önce Backend Deploy Et)

Backend'i Heroku, Railway, veya Render'a deploy et:

#### Heroku Örneği:
```bash
cd backend
# Heroku CLI ile
heroku create your-license-backend
git subtree push --prefix backend heroku main
```

#### Railway Örneği:
```bash
# Railway CLI ile
cd backend
railway login
railway init
railway up
```

### 5. API URL'ini Güncelle

Backend deploy edildikten sonra:

1. **Netlify Environment Variables'da** `VITE_API_URL`'i güncelle
2. **netlify.toml'da** API proxy URL'ini güncelle:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR-ACTUAL-BACKEND-URL.herokuapp.com/api/:splat"
  status = 200
  force = true
```

## 🔧 Netlify.toml Konfigürasyonu

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"
  environment = { NODE_VERSION = "18" }

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.herokuapp.com/api/:splat"
  status = 200
  force = true
```

## 🐛 Yaygın Sorunlar ve Çözümler

### ❌ Build Hatası
```
Error: Build failed
```

**Çözüm:**
1. `frontend/package.json`'da build script'ini kontrol et
2. Node.js versiyonunu kontrol et (18 önerilir)
3. Build command'i düzelt: `cd frontend && npm ci && npm run build`

### ❌ API Bağlantı Hatası
```
CORS Error / Network Error
```

**Çözüm:**
1. Backend'de CORS ayarlarını kontrol et
2. Environment variables'ı kontrol et
3. API URL'inin doğru olduğunu kontrol et

### ❌ 404 Hatası (SPA Routing)
```
Page not found
```

**Çözüm:**
`netlify.toml`'da redirect kuralı var mı kontrol et:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### ❌ Environment Variables Çalışmıyor
```
API_URL undefined
```

**Çözüm:**
1. Netlify Dashboard'da env vars'ı kontrol et
2. `VITE_` prefix'i kullan (Vite için gerekli)
3. Site'ı redeploy et

## 📱 Test Etme

Deploy sonrası test et:

1. **Frontend erişimi:** `https://your-site.netlify.app`
2. **API proxy:** `https://your-site.netlify.app/api/status`
3. **Lisans doğrulama** fonksiyonunu test et
4. **Admin panel** fonksiyonlarını test et

## 🔒 Güvenlik Ayarları

### Headers (netlify.toml'da mevcut)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

### HTTPS Redirect
Netlify otomatik olarak HTTPS'e yönlendirir.

## 🚀 Production Checklist

- [ ] Backend deploy edildi ve çalışıyor
- [ ] Environment variables ayarlandı
- [ ] API URL'leri güncellendi
- [ ] CORS ayarları yapıldı
- [ ] Frontend build başarılı
- [ ] SPA routing çalışıyor
- [ ] API proxy çalışıyor
- [ ] Lisans sistemi test edildi

## 📞 Destek

Deployment sırasında sorun yaşarsan:

1. **Netlify Build Logs'u** kontrol et
2. **Browser Developer Console'u** kontrol et
3. **Network tab'ında** API isteklerini kontrol et

## 🎯 Sonuç

Bu kılavuzu takip ederek lisans sistemi Netlify'da başarıyla deploy edilecek! 

**Demo URL:** `https://your-site.netlify.app`

### Özellikler:
- 🔐 Lisans doğrulama
- 👨‍💼 Admin paneli
- 📱 Responsive tasarım
- 🛡️ Güvenlik headers
- ⚡ Hızlı loading