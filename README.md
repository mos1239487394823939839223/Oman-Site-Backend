<div align="center">

# 🛒 Oman E-Commerce — Backend API

**Production REST API powering an e-commerce store in Oman — catalog, cart, orders, invoices and online payments with Thawani & Stripe.**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## ✨ Features

- 🔐 **Auth & roles** — signup/login, JWT, password reset by email, `user` / `manager` / `admin` permissions
- 📦 **Catalog** — products, categories, sub-categories, brands, services and gift items
- 🛍️ **Shopping** — cart, wishlist, saved addresses, coupons and product reviews
- 💳 **Payments** — **Thawani Pay** (Oman) checkout sessions and Stripe
- 🧾 **Orders & invoices** — order lifecycle (create → pay → deliver) with invoice records
- 🖼️ **Media** — image upload with Multer and optimisation with Sharp
- 🎨 **CMS-style content** — banners and footer managed from the dashboard
- ⚡ **Real-time** updates with Socket.io
- 🛡️ Request validation (express-validator), central error handling, gzip compression, request logging
- 🐳 Dockerfile + entrypoint for container deployment

## 🏗️ Architecture

```
routes/        Express routers (one per resource, mounted under /api/v1)
services/      Business logic + generic CRUD handlers factory
models/        Mongoose schemas (Product, Order, Invoice, Payment, Coupon…)
middlewares/   Auth guards, validation, error handling, uploads
utils/         ApiError, ApiFeatures (filter / sort / paginate / search), email
config/        Database connection and Socket.io setup
```

List endpoints support **filtering, sorting, field limiting, search and pagination** out of the box.

📘 Full endpoint documentation: **[FRONTEND_API_REFERENCE.md](./FRONTEND_API_REFERENCE.md)**

## 🚀 Getting Started

```bash
git clone https://github.com/mos1239487394823939839223/Oman-Site-Backend.git
cd Oman-Site-Backend
npm install
npm run start:dev      # http://localhost:8000/api/v1
```

Create `config.env` (never commit it):

```env
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DB_URI=mongodb+srv://...
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASSWORD=...

STRIPE_SECRET=sk_test_...
THAWANI_BASE_URL=https://uatcheckout.thawani.om
THAWANI_API_KEY=...
THAWANI_PUBLISHABLE_KEY=...
```

### 🐳 Docker

```bash
docker build -t oman-backend .
docker run -p 8000:8000 --env-file config.env oman-backend
```

## 🔗 Related

- Frontend: **[Oman-Site-Frontend](https://github.com/mos1239487394823939839223/Oman-Site-Frontend)**

---

<div align="center">

Built by **[Mustafa Anwer Hamed](https://github.com/mos1239487394823939839223)**

</div>
