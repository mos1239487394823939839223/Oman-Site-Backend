# Frontend API Integration Prompt

Use this backend configuration to connect the frontend application.

## Base Configuration

- Base URL: `http://localhost:8000/api/v1`
- Protected routes require: `Authorization: Bearer <token>`
- Roles used by backend: `admin`, `manager`, `user`
- JSON body is used by default unless the route includes file upload.
- File upload routes should use `multipart/form-data`.

## Authentication Routes

- `POST /auth/signup`
  - Public
  - Purpose: register a new user

- `POST /auth/login`
  - Public
  - Purpose: log in and receive JWT token

- `POST /auth/forgetPassword`
  - Public
  - Purpose: send password reset code to user email

- `POST /auth/verifyResetCode`
  - Public
  - Purpose: verify emailed reset code

- `PUT /auth/resetPassword`
  - Public
  - Purpose: set a new password after code verification

## User Routes

- `GET /users/getMe`
  - Protected
  - Purpose: get logged-in user profile

- `PUT /users/updateMyData`
  - Protected
  - Purpose: update logged-in user data

- `PUT /users/changeMyPassword`
  - Protected
  - Purpose: change logged-in user password

- `DELETE /users/deactivateMyAccount`
  - Protected
  - Purpose: deactivate logged-in account

- `PUT /users/changePassword/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: change another user's password

- `POST /users`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create user
  - Content type: `multipart/form-data` when sending `profileImage`

- `GET /users`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: list users

- `GET /users/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: get one user

- `PUT /users/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update user
  - Content type: `multipart/form-data` when sending `profileImage`

- `DELETE /users/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: deactivate user

## Category Routes

- `GET /categories`
  - Public
  - Purpose: list categories

- `POST /categories`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create category
  - Content type: `multipart/form-data` when sending category image

- `GET /categories/:id`
  - Public
  - Purpose: get category by id

- `PUT /categories/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update category
  - Content type: `multipart/form-data` when sending category image

- `DELETE /categories/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete category

## Subcategory Routes

- `GET /subcategories`
  - Public
  - Purpose: list all subcategories

- `POST /subcategories`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create subcategory

- `GET /subcategories/:id`
  - Public
  - Purpose: get subcategory by id

- `PUT /subcategories/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update subcategory

- `DELETE /subcategories/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete subcategory

- `GET /categories/:categoryId/subcategories`
  - Public
  - Purpose: list subcategories under one category

- `POST /categories/:categoryId/subcategories`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create subcategory under a specific category

## Brand Routes

- `GET /brands`
  - Public
  - Purpose: list brands

- `POST /brands`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create brand
  - Content type: `multipart/form-data` when sending brand image

- `GET /brands/:id`
  - Public
  - Purpose: get brand by id

- `PUT /brands/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update brand
  - Content type: `multipart/form-data` when sending brand image

- `DELETE /brands/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete brand

## Banner Routes

- `GET /banners`
  - Public
  - Purpose: list banners

- `POST /banners`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create banner
  - Content type: `multipart/form-data`

- `POST /banners/:id/image`
  - Public in current backend route setup
  - Purpose: upload image for an existing banner
  - Content type: `multipart/form-data`

- `GET /banners/:id`
  - Public
  - Purpose: get banner by id

- `PUT /banners/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update banner
  - Content type: `multipart/form-data`

- `DELETE /banners/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete banner

## Product Routes

- `GET /products`
  - Public
  - Purpose: list products
  - Supported query params include: `page`, `limit`, `keyword`, `sort`, `sortBy`, `order`, `sortPreset`, `fields`, `category`, `brand`, `subCategories`

- `POST /products`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create product
  - Content type: `multipart/form-data`
  - Upload fields: `imageCover` and `images`

- `GET /products/:id`
  - Public
  - Purpose: get product by id

- `PUT /products/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update product
  - Content type: `multipart/form-data` when sending images, otherwise JSON works for text-only updates

- `DELETE /products/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete product

## Review Routes

- `GET /reviews`
  - Public
  - Purpose: list all reviews

- `POST /reviews`
  - Protected
  - Roles: `user`
  - Purpose: create review

- `GET /reviews/:id`
  - Public
  - Purpose: get review by id

- `PUT /reviews/:id`
  - Protected
  - Roles: `user`
  - Purpose: update review (owner only)

- `DELETE /reviews/:id`
  - Protected
  - Roles: `admin`, `manager`, `user`
  - Purpose: delete review (owner, admin, or manager)

### Nested Product Reviews

- `GET /products/:productId/reviews`
  - Public
  - Purpose: list all reviews for a specific product

- `POST /products/:productId/reviews`
  - Protected
  - Roles: `user`
  - Purpose: create review on a specific product (`productId` auto-injected from URL)

## Wishlist Routes

- `GET /wishlist`
  - Protected
  - Roles: `user`
  - Purpose: get logged-in user's wishlist (populated with product details)

- `POST /wishlist`
  - Protected
  - Roles: `user`
  - Purpose: add product to wishlist (no duplicates)
  - Body: `{ "productId": "<id>" }`

- `DELETE /wishlist/:productId`
  - Protected
  - Roles: `user`
  - Purpose: remove product from wishlist

## Address Routes

- `GET /addresses`
  - Protected
  - Roles: `user`
  - Purpose: get all saved addresses for logged-in user

- `POST /addresses`
  - Protected
  - Roles: `user`
  - Purpose: add a new address
  - Body: `{ "alias": "Home", "details": "123 Main St", "phone": "+201001234567", "city": "Cairo", "postalCode": "11511" }`
  - Required fields: `alias`, `details`

- `DELETE /addresses/:addressId`
  - Protected
  - Roles: `user`
  - Purpose: remove a saved address by its embedded document id

## Cart Routes

- `GET /cart`
  - Protected
  - Roles: `user`
  - Purpose: get logged-in user's cart with populated product info

- `POST /cart`
  - Protected
  - Roles: `user`
  - Purpose: add product to cart; if same product+color already in cart, quantity is incremented
  - Body: `{ "productId": "<id>", "color": "red" }` (`color` is optional)

- `DELETE /cart`
  - Protected
  - Roles: `user`
  - Purpose: clear entire cart

- `PUT /cart/applyCoupon`
  - Protected
  - Roles: `user`
  - Purpose: apply a coupon code to get a discounted total
  - Body: `{ "coupon": "SAVE20" }`
  - Sets `totalPriceAfterDiscount` on the cart; cleared if cart items change

- `PUT /cart/:itemId`
  - Protected
  - Roles: `user`
  - Purpose: update quantity of a specific cart item
  - Body: `{ "quantity": 3 }`

- `DELETE /cart/:itemId`
  - Protected
  - Roles: `user`
  - Purpose: remove a specific item from the cart

## Coupon Routes

- `GET /coupons`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: list all coupons

- `POST /coupons`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: create a coupon
  - Body: `{ "name": "SAVE20", "expire": "2026-12-31", "discount": 20 }`
  - `name` is stored uppercase; `discount` is a percentage (1–100)

- `GET /coupons/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: get coupon by id

- `PUT /coupons/:id`
  - Protected
  - Roles: `admin`, `manager`
  - Purpose: update coupon

- `DELETE /coupons/:id`
  - Protected
  - Roles: `admin`
  - Purpose: delete coupon

## Integration Notes For Frontend

- Store JWT after login and send it in the `Authorization` header for protected endpoints.
- Product, category, brand, banner, and user image routes should use `FormData` when uploading files.
- Uploaded files are served statically by the backend from the `uploads` directory.
- Product responses include populated `category`, `subCategories`, `brand`, and `reviews` fields.
- For product creation and update, `subCategories` can be sent as either a single id or an array.
- For partial updates on user and product resources, send only the fields that changed.
- Cart: the price of each item is snapshotted at add-time. Price changes to the product will not retroactively affect items already in the cart.
- Cart: applying a coupon sets `totalPriceAfterDiscount`. If cart items change afterwards, re-apply the coupon to refresh the discounted total.
- Coupon codes are case-insensitive on input; they are stored and matched as uppercase.
- Wishlist uses `$addToSet` — adding the same product twice has no effect.
- Address `_id` values in the addresses array are MongoDB ObjectIds; use them as `:addressId` for deletion.

## Suggested Frontend Environment Variable

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Prompt To Give Frontend Developer

Build the frontend against the backend API whose base URL is `http://localhost:8000/api/v1`. Use JWT bearer authentication for protected routes. Implement authentication, product listing and details, categories, subcategories, brands, banners, user profile management, password reset flow, reviews, wishlist, saved addresses, shopping cart with coupon support, and coupon management. Use `multipart/form-data` for file upload routes. Respect role-based access for admin, manager, and user features. Use the route list in this file as the integration contract.
