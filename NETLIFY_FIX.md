# 🚨 Netlify Deployment Sorunu - Hızlı Çözüm

## ❌ Sorun
```
bash: line 1: cd: frontend: No such file or directory
```

**Sebep:** Netlify base directory'yi yanlış ayarlamış (`/opt/build/repo/backend`)

## ✅ Hızlı Çözüm

### 1. Netlify Site Ayarlarını Düzelt

**Netlify Dashboard'a git:**
1. Site Settings → Build & Deploy → Build Settings
2. **Base directory:** BOŞ BIRAK (veya `/` yaz)
3. **Build command:** `cd frontend && npm ci && npm run build`
4. **Publish directory:** `frontend/dist`

### 2. Environment Variables Ekle

Site Settings → Environment Variables:
```
NODE_VERSION = 18
VITE_API_URL = http://localhost:3001
```

### 3. Redeploy Et

- **Deploys** sekmesine git
- **Trigger deploy** → **Deploy site**

## 🔧 Alternatif Çözüm: Manual Build

Eğer hala çalışmazsa, build command'i şöyle değiştir:

```bash
# Build command:
npm install --prefix frontend && npm run build --prefix frontend

# Publish directory:
frontend/dist
```

## 📋 Doğru Ayarlar

### Build Settings
```
Base directory: (boş)
Build command: cd frontend && npm ci && npm run build
Publish directory: frontend/dist
```

### Environment Variables
```
NODE_VERSION = 18
VITE_API_URL = https://your-backend-url.com
```

## 🎯 Test Komutu

Local'de test et:
```bash
# Root klasörde çalıştır
cd frontend && npm ci && npm run build
ls frontend/dist  # dosyalar var mı kontrol et
```

## 🚀 Son Kontrol

Deploy sonrası:
1. Site açılıyor mu?
2. Console'da hata var mı?
3. API bağlantısı çalışıyor mu?

**Bu ayarlarla kesinlikle çalışacak!** 🎉