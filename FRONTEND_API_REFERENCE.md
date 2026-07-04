# E‑Commerce Backend — Frontend API Reference

Everything the frontend needs to talk to the backend. Generated from the actual route/service/model/validator code.

---

## 1. Conventions

| Item | Value |
|------|-------|
| **Base URL** | `http://localhost:8000/api/v1` (from `BASE_URL` / `PORT` in `config.env`) |
| **Content type** | `application/json` for normal requests; `multipart/form-data` for endpoints that upload images |
| **Auth header** | `Authorization: Bearer <token>` |
| **Static files** | Uploaded images are served from `http://localhost:8000/uploads/...`. Image fields returned by the API are already **absolute URLs**. |
| **CORS** | Allows origin `FRONTEND_URL` (`http://localhost:3000`), `credentials: true` |
| **Token** | JWT, expires in `1d` (`JWT_EXPIRES_IN`). Get it from `signup` / `login` / `resetPassword` / `changeMyPassword`. |

### Roles
`user` (default), `manager`, `admin`. Endpoints are marked:
- **Public** – no token
- **Protected** – any logged‑in user
- **Admin/Manager** or **Admin only** – role‑restricted (403 otherwise)

### Response envelopes (they are NOT all identical — important)

**A. List endpoints (`getAll` factory)** — products, gifts, users, categories, subcategories, brands, reviews, coupons, orders:
```json
{
  "result": 5,
  "totalDocuments": 42,
  "currentPage": 1,
  "numberOfPages": 9,
  "data": [ /* array of documents */ ]
}
```

**B. Single‑document endpoints (`getOne`/`createOne`/`updateOne` factory)** — most get‑by‑id, create, update:
```json
{ "sucess": true, "data": { /* document */ } }
```
> ⚠️ The key is literally spelled `sucess` (typo in the codebase). Read it exactly as `sucess`, not `success`.

**C. Delete (factory)** — returns **HTTP 204 No Content**, empty body.

**D. Custom shapes** — auth, cart, wishlist, addresses, banners, footer, orders (create/pay/deliver) each return their own shape. These are documented per‑endpoint below.

### Error format
```json
// development (NODE_ENV=development — current setting)
{ "status": "fail" | "error", "error": {...}, "message": "...", "stack": "..." }

// production
{ "status": "fail" | "error", "message": "..." }
```
Validation errors (express‑validator) return **400** with:
```json
{ "errors": [ { "msg": "...", "path": "fieldName", "location": "body" } ] }
```
Common status codes: `400` validation/bad request, `401` not logged in / bad token, `403` wrong role, `404` not found, `409` conflict (footer already exists).

### Query params for all list endpoints
| Param | Meaning |
|-------|---------|
| `page` | page number (default 1) |
| `limit` | page size (default 5) |
| `sort` | comma fields, e.g. `-price,createdAt` |
| `sortBy` + `order` | e.g. `sortBy=price&order=asc` |
| `sortPreset` | `newest`, `oldest`, `price_asc`, `price_desc`, `rating_desc`, `best_selling`, `title_asc`, `title_desc` |
| `fields` | comma list of fields to return |
| `keyword` | text search on `title` + `description` |
| filter fields | any model field, e.g. `?price[gte]=100&ratingsAverage[gte]=4` (operators: `gte,gt,lte,lt,in,nin`) |
| `category`, `brand` | filter by Mongo id |
| `subCategories` | comma‑separated ids |
| `colors` | comma‑separated color names |
| `bestSeller` | `true` / `false` |

---

## 2. Auth — `/auth`

| Method | Path | Access |
|--------|------|--------|
| POST | `/auth/signup` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Protected |
| POST | `/auth/forgetPassword` | Public |
| POST | `/auth/verifyResetCode` | Public |
| PUT  | `/auth/resetPassword` | Public |

**POST `/auth/signup`**
Receives:
```json
{ "name": "John Doe", "email": "john@x.com", "password": "secret1", "passwordConfirm": "secret1", "phone": "+96890000000" }
```
Rules: name 3–50 chars; email valid & unique; password 6–128, must equal `passwordConfirm`, must not contain the word "password"; `phone` optional.
Returns **201**:
```json
{ "message": "User registered successfully", "user": { /* user doc incl. role, _id */ }, "token": "JWT" }
```

**POST `/auth/login`**
Receives: `{ "email": "...", "password": "..." }`
Returns **200**: `{ "message": "User logged in successfully", "user": {...}, "token": "JWT" }`
`401` on wrong email/password.

**POST `/auth/logout`** (Bearer token) → **200** `{ "message": "User logged out successfully" }` (invalidates existing tokens by bumping `passwordChangedAt`).

**POST `/auth/forgetPassword`** — `{ "email": "..." }` → emails a 6‑digit code (valid 10 min). Returns `{ "status": "success", "message": "Reset code sent to email" }`.

**POST `/auth/verifyResetCode`** — `{ "resetCode": "123456" }` (6 numeric digits) → `{ "status": "success", "message": "Reset code verified" }`.

**PUT `/auth/resetPassword`** — `{ "email": "...", "newPassword": "...", "newPasswordConfirm": "..." }` → `{ "status": "success", "token": "JWT" }`. Requires the code to have been verified first.

---

## 3. Users — `/users`

**"Me" endpoints (any logged‑in user):**

| Method | Path | Receives | Returns |
|--------|------|----------|---------|
| GET | `/users/getMe` | — | `{ "data": user }` |
| PUT | `/users/updateMyData` | `{ name?, email?, phone?, profileImage? }` | `{ "sucess": true, "data": user }` |
| PUT | `/users/changeMyPassword` | `{ currentPassword, newPassword }` | `{ "message": "Password changed successfully", "token": "JWT" }` |
| DELETE | `/users/deactivateMyAccount` | — | **204** (soft delete `active:false`) |

**Admin/Manager endpoints:**

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/users` | Admin/Manager | List (envelope A) |
| POST | `/users` | Admin/Manager | Create user, `multipart/form-data`, field `profileImage`; body `{ name, email, password, passwordConfirm, phone? }` → 201 (envelope B) |
| GET | `/users/:id` | Admin/Manager | envelope B |
| PUT | `/users/:id` | Admin/Manager | `multipart/form-data`; `{ name?, email?, phone?, profileImage? }` (password not changed here) → envelope B |
| DELETE | `/users/:id` | Admin/Manager | **204** (soft delete) |
| PUT | `/users/changePassword/:id` | Admin/Manager | `{ currentPassword, password, passwordConfirm }` → envelope B |

**User object shape:**
```json
{
  "_id": "...", "name": "...", "slug": "...", "email": "...",
  "role": "user|admin|manager", "phone": "...", "profileImage": "http://.../uploads/users/xxx.jpeg",
  "active": true, "wishlist": ["productId"], "addresses": [ /* see Addresses */ ],
  "createdAt": "...", "updatedAt": "..."
}
```
> Note: only users with `active !== false` are ever returned (soft‑deleted users are hidden).

---

## 4. Products — `/products`

| Method | Path | Access |
|--------|------|--------|
| GET | `/products` | Public (list, envelope A) |
| GET | `/products/:id` | Public (envelope B; also populates `reviews`) |
| POST | `/products` | Admin/Manager (multipart) |
| PUT | `/products/:id` | Admin/Manager (multipart) |
| DELETE | `/products/:id` | Admin only (**204**) |

**Create/Update — `multipart/form-data`.** Image fields: `imageCover` (single, required on create) and `images` (up to 5).
Other fields:
```
title           string, 3–100, required, unique
description     string, min 20, required
price           number ≥ 0, required
priceAfterDiscount  number ≥ 0, optional, must be < price
quantity        integer ≥ 0, required
sold            integer ≥ 0, optional
category        Mongo id, required (must exist)
subCategories   array of ids, optional (must belong to category)
brand           Mongo id, optional
colors          array of strings, optional
bestSeller      boolean, optional
ratingsAverage  1–5, optional
```
**Product object shape (returned):**
```json
{
  "_id": "...", "title": "...", "slug": "...", "description": "...",
  "price": 100, "priceAfterDiscount": 80, "quantity": 20, "sold": 5,
  "imageCover": "http://.../uploads/products/xxx.jpeg",
  "images": ["http://.../uploads/products/yyy.jpeg"],
  "category": { "_id": "...", "name": "..." },
  "subCategories": [ { "_id": "...", "name": "..." } ],
  "brand": { "_id": "...", "name": "..." },
  "colors": ["red"], "bestSeller": false,
  "ratingsAverage": 4.5, "ratingsQuantity": 10,
  "reviews": [ /* only on GET /products/:id */ ],
  "createdAt": "...", "updatedAt": "..."
}
```

---

## 5. Gifts — `/gifts`
Same structure and query params as products, **but `price` and `priceAfterDiscount` are forced to `0`.**

| Method | Path | Access |
|--------|------|--------|
| GET | `/gifts` | Public (list, envelope A) |
| GET | `/gifts/:id` | Public (envelope B) |
| POST | `/gifts` | Admin/Manager (multipart: `imageCover` required, `images` up to 5) |
| PUT | `/gifts/:id` | Admin/Manager (multipart) |
| DELETE | `/gifts/:id` | Admin only (**204**) |

Create body: `title` (3–100, required, unique), `description` (min 20, required), `quantity` (int ≥ 0, required), `imageCover` (required), `category` (required id), optional `subCategories`, `brand`, `colors`, `bestSeller`. `price` if sent must be `0`. Image URLs served from `/uploads/gifts/`.

---

## 6. Categories — `/categories`

| Method | Path | Access |
|--------|------|--------|
| GET | `/categories` | Public (envelope A) |
| GET | `/categories/:id` | Public (envelope B) |
| POST | `/categories` | Admin/Manager — multipart, field `image`, body `{ name }` (3–50, unique) → 201 |
| PUT | `/categories/:id` | Admin/Manager — multipart, `{ name? }` |
| DELETE | `/categories/:id` | Admin only (**204**) |

Category shape: `{ _id, name, slug, image: "http://.../uploads/categories/xxx", createdAt, updatedAt }`.
**Nested:** `/categories/:categoryId/subcategories` (see below).

---

## 7. SubCategories — `/subcategories`
Also reachable nested under `/categories/:categoryId/subcategories`.

| Method | Path | Access |
|--------|------|--------|
| GET | `/subcategories` | Public (envelope A) |
| GET | `/subcategories/:id` | Public (envelope B) |
| POST | `/subcategories` | Admin/Manager — `{ name, category }` (`category` auto‑set when nested) → 201 |
| PUT | `/subcategories/:id` | Admin/Manager — `{ name?, category? }` |
| DELETE | `/subcategories/:id` | Admin only (**204**) |

Shape: `{ _id, name, slug, category: "categoryId", createdAt, updatedAt }`.

---

## 8. Brands — `/brands`

| Method | Path | Access |
|--------|------|--------|
| GET | `/brands` | Public (envelope A) |
| GET | `/brands/:id` | Public (envelope B) |
| POST | `/brands` | Admin/Manager — multipart, field `image`, body `{ name }` (3–50, unique) → 201 |
| PUT | `/brands/:id` | Admin/Manager — multipart, `{ name? }` |
| DELETE | `/brands/:id` | Admin only (**204**) |

Shape: `{ _id, name, slug, image: "http://.../brands/xxx", createdAt, updatedAt }`.

---

## 9. Banners — `/banners`

| Method | Path | Access | Returns |
|--------|------|--------|---------|
| GET | `/banners` | Public | `{ "status":"success", "results": n, "data": [ {_id,name,images,link} ] }` — **only active banners**, sorted by `order` |
| GET | `/banners/:id` | Public | `{ "status":"success", "data": banner }` |
| POST | `/banners` | Admin/Manager | multipart; fields `images` and/or `image` (up to 8); body `{ name, isActive?, order? }` → **201** `{ status, data }` |
| POST | `/banners/:id/image` | ⚠️ no auth in route | Upload/replace images for a banner |
| PUT | `/banners/:id` | Admin/Manager | multipart; `{ name?, isActive?, order?, images? }` |
| DELETE | `/banners/:id` | Admin only | `{ status, data }` |

Banner shape: `{ _id, name, image, images: ["http://.../banners/xxx"], isActive, order, createdAt, updatedAt }`.

---

## 10. Reviews — `/reviews` (and nested `/products/:productId/reviews`)

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/reviews` or `/products/:productId/reviews` | Public | List (envelope A). Nested form filters by product. |
| GET | `/reviews/:id` | Public | envelope B |
| POST | `/products/:productId/reviews` (or `/reviews`) | Protected **user** | `{ rating, title? }` — `product` & `user` auto‑set → 201 (envelope B) |
| PUT | `/reviews/:id` | Owner (user) | `{ rating?, title? }` |
| DELETE | `/reviews/:id` | Owner user, or Admin/Manager | **204** |

Rules: `rating` required, number 1–5. A user can review a product **only once**. Creating/updating/deleting recalculates the product's `ratingsAverage` & `ratingsQuantity`.
Review shape:
```json
{ "_id":"...", "title":"...", "rating":4,
  "user": { "_id":"...", "name":"...", "profileImage":"..." },
  "product": { "_id":"...", "title":"...", "imageCover":"..." },
  "createdAt":"...", "updatedAt":"..." }
```

---

## 11. Wishlist — `/wishlist`  (Protected: user/admin/manager)

| Method | Path | Receives | Returns |
|--------|------|----------|---------|
| GET | `/wishlist` | — | `{ "success": true, "result": n, "data": [ product ] }` |
| POST | `/wishlist` | `{ "productId": "..." }` | `{ "success": true, "message": "Product added to wishlist", "data": [ product ] }` |
| DELETE | `/wishlist/:productId` | — | `{ "success": true, "message": "Product removed from wishlist", "data": [ product ] }` |

`data` is the populated wishlist array: each item `{ _id, title, imageCover, price, priceAfterDiscount, ratingsAverage, ratingsQuantity }`.

---

## 12. Addresses — `/addresses`  (Protected: user/admin/manager)

| Method | Path | Receives | Returns |
|--------|------|----------|---------|
| GET | `/addresses` | — | `{ "success": true, "result": n, "data": [address] }` |
| POST | `/addresses` | `{ alias, details, phone?, city?, postalCode? }` | `{ "success": true, "message": "Address added successfully", "data": [address] }` |
| DELETE | `/addresses/:addressId` | — | `{ "success": true, "message": "Address removed successfully", "data": [address] }` |

Rules: `alias` & `details` required; `phone` must be a valid mobile number if sent; `postalCode` validated if sent.
Address shape: `{ _id, alias, details, phone, city, postalCode }`.

---

## 13. Cart — `/cart`  (Protected: user/admin/manager)

| Method | Path | Receives | Returns |
|--------|------|----------|---------|
| GET | `/cart` | — | cart payload |
| POST | `/cart` | `{ productId }` **or** `{ giftId }`, optional `color` | cart payload |
| PUT | `/cart/applyCoupon` | `{ coupon: "SUMMER" }` | cart payload |
| PUT | `/cart/:itemId` | `{ quantity }` (int ≥ 1) | cart payload |
| DELETE | `/cart/:itemId` | — | cart payload |
| DELETE | `/cart` | — | **204** (clears cart) |

Rules: send **either** `productId` or `giftId`, not both. Adding the same product+color again increments quantity. Prices are set server‑side (product uses `priceAfterDiscount || price`; gift = 0).

**Cart payload:**
```json
{
  "success": true,
  "numOfCartItems": 2,
  "data": {
    "_id": "...", "user": "userId",
    "cartItems": [
      { "_id": "cartItemId", "product": { "_id","title","imageCover","price","priceAfterDiscount","description" },
        "quantity": 2, "color": "red", "price": 80 }
    ],
    "totalCartPrice": 160,
    "totalPriceAfterDiscount": 144,   // present only after applyCoupon
    "createdAt": "...", "updatedAt": "..."
  }
}
```
`:itemId` = the `cartItems[]._id` (the cart line id), **not** the product id.

---

## 14. Coupons — `/coupons`  (Admin/Manager only; delete is Admin only)

| Method | Path | Access |
|--------|------|--------|
| GET | `/coupons` | Admin/Manager (envelope A) |
| GET | `/coupons/:id` | Admin/Manager (envelope B) |
| POST | `/coupons` | Admin/Manager (envelope B) |
| PUT | `/coupons/:id` | Admin/Manager |
| DELETE | `/coupons/:id` | Admin only (**204**) |

Body: `{ name, expire, discount }` — `name` 3–30 (stored UPPERCASE, unique), `expire` ISO‑8601 date in the future, `discount` number 1–100 (percent).
> Customers never call these directly — they use `PUT /cart/applyCoupon` with the coupon name.

---

## 15. Footer — `/footer`  (singleton document)

| Method | Path | Access | Returns |
|--------|------|--------|---------|
| GET | `/footer` | Public | `{ "status":"success", "data": footer }` (auto‑creates if missing) |
| POST | `/footer` | Admin/Manager | Create only if none exists, else **409** |
| PUT | `/footer` | Admin/Manager | Upsert/update, returns updated footer |

Footer body/shape (all optional): contact fields `phone, whatsapp, email, address, addressAr, hours, hoursAr, instagram, facebook, twitter`; translatable objects (each `{ en, ar }`) `brand, description, quickLinks, contactInfo, home, products, reviews, favorites, cart, rights`; and `links: [ { href, labelEn, labelAr, order?, isActive? } ]`.

---

## 16. Orders — `/orders`  (all require login)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/orders/:cartId` | user | Create a **cash** order from a cart |
| GET | `/orders` | user/admin/manager | List orders (users see only their own) — envelope A |
| GET | `/orders/:id` | logged‑in | Get one order — envelope B |
| PUT | `/orders/:id/pay` | Admin/Manager | Mark paid |
| PUT | `/orders/:id/deliver` | Admin/Manager | Mark delivered |
| GET | `/orders/checkout-session/:cartId` | user | Create Stripe checkout session (card) |

**POST `/orders/:cartId`** — Receives `{ "shippingAddress": { address, city, postalCode, country } }`.
Effect: creates order from cart, decrements product/gift stock, increments `sold`, deletes the cart.
Returns **200**: `{ "message": "Order created successfully", "debugger": { /* order */ } }`.

**GET `/orders`** → list. Regular `user` automatically filtered to their own orders; admin/manager see all.

**PUT `/orders/:id/pay`** → `{ "message": "Order paid successfully" }` (sets `isPaid`, `isPaidAt`).
**PUT `/orders/:id/deliver`** → `{ "message": "Order delivered successfully" }` (sets `isDelivered`, `isDeliveredAt`).

**GET `/orders/checkout-session/:cartId`** → `{ "session": { /* Stripe Checkout session; redirect user to session.url */ } }`. Optionally accepts `{ shippingAddress }` (stored in Stripe metadata). Requires `STRIPE_SECRET` configured.

**Order shape:**
```json
{
  "_id": "...",
  "user": { "_id":"...", "name":"...", "email":"..." },
  "cartItems": [
    { "product": { "_id","title","imageCover" }, "gift": null,
      "name":"...", "quantity":2, "image":"...", "price":80 }
  ],
  "shippingAddress": { "address":"...", "city":"...", "postalCode":"...", "country":"..." },
  "taxPrice": 0, "shippingPrice": 0, "totalOrderPrice": 160,
  "paymentMethod": "cash" | "card",
  "isPaid": false, "isPaidAt": null,
  "isDelivered": false, "isDeliveredAt": null,
  "createdAt": "...", "updatedAt": "..."
}
```

---

## 17. Real-time — admin order notifications (Socket.IO)

Admins/managers get pushed a live event whenever a new order comes in (cash order created, or a card order marked paid). Built on **Socket.IO**, mounted on the same host/port as the REST API.

| Item | Value |
|------|-------|
| **URL** | Same origin as the API (e.g. `http://localhost:8000`) |
| **Transport** | Socket.IO client (`socket.io-client`) |
| **Auth** | JWT passed in the handshake — `auth: { token }`. Only `admin` / `manager` tokens are accepted; other roles are disconnected with an auth error. |
| **Room** | Authenticated admins auto-join the `admins` room; events are emitted there only. |
| **CORS** | Allows origin `FRONTEND_URL` (falls back to `*`) |

**Connect and listen:**

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: { token: localStorage.getItem('token') }, // an admin/manager JWT
});

socket.on('connect_error', (err) => console.error(err.message)); // e.g. "Authorization error: admins only"

socket.on('order:new', (order) => {
  // show a toast / badge / sound for the incoming order
  console.log('New order!', order);
});
```

**`order:new` payload:**

```jsonc
{
  "id": "665f...",              // order _id
  "user": "664a...",            // user _id who placed the order
  "totalOrderPrice": 1250,
  "itemCount": 3,               // number of line items
  "paymentMethod": "cash",      // "cash" | "card"
  "isPaid": false,
  "createdAt": "2026-07-05T12:00:00.000Z"
}
```

> Note: card payments only emit once the order is marked paid (`PUT /orders/:id/pay`). There is no Stripe webhook yet, so card orders created purely via the checkout session are not auto-notified until that endpoint runs.

---

## 18. Quick endpoint index

```
AUTH
  POST   /auth/signup
  POST   /auth/login
  POST   /auth/logout                 (token)
  POST   /auth/forgetPassword
  POST   /auth/verifyResetCode
  PUT    /auth/resetPassword

USERS
  GET    /users/getMe                 (token)
  PUT    /users/updateMyData          (token)
  PUT    /users/changeMyPassword      (token)
  DELETE /users/deactivateMyAccount   (token)
  PUT    /users/changePassword/:id    (admin/manager)
  GET    /users                       (admin/manager)
  POST   /users                       (admin/manager)
  GET    /users/:id                   (admin/manager)
  PUT    /users/:id                   (admin/manager)
  DELETE /users/:id                   (admin/manager)

PRODUCTS   GET,POST /products · GET,PUT,DELETE /products/:id
GIFTS      GET,POST /gifts · GET,PUT,DELETE /gifts/:id
CATEGORIES GET,POST /categories · GET,PUT,DELETE /categories/:id
SUBCATS    GET,POST /subcategories · GET,PUT,DELETE /subcategories/:id
BRANDS     GET,POST /brands · GET,PUT,DELETE /brands/:id
BANNERS    GET,POST /banners · POST /banners/:id/image · GET,PUT,DELETE /banners/:id
REVIEWS    GET,POST /reviews (or /products/:productId/reviews) · GET,PUT,DELETE /reviews/:id
WISHLIST   GET,POST /wishlist · DELETE /wishlist/:productId
ADDRESSES  GET,POST /addresses · DELETE /addresses/:addressId
CART       GET,POST,DELETE /cart · PUT /cart/applyCoupon · PUT,DELETE /cart/:itemId
COUPONS    GET,POST /coupons · GET,PUT,DELETE /coupons/:id   (admin/manager)
FOOTER     GET,POST,PUT /footer
ORDERS     POST /orders/:cartId · GET /orders · GET /orders/:id
           PUT /orders/:id/pay · PUT /orders/:id/deliver · GET /orders/checkout-session/:cartId
```
