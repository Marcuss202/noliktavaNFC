# NFC Noliktava - Complete Architecture Guide

## Overview

Your app is an **NFC-based inventory system**. When someone scans an NFC tag, they get a unique product link. If they're logged in as an admin, they can edit; otherwise, they see a read-only store page.

```
Physical NFC Tag → Scan Link (e.g., /item/ABC123) → Check if Admin → Show Admin Edit OR Customer View
```

---

## Part 1: Frontend Structure

### How Authentication Works (The Flow)

```
1. User opens app
   ↓
2. React loads → AuthProvider runs → calls /api/auth/me
   ↓
3. Backend finds JWT cookie (httpOnly) → returns user data (email, is_staff)
   ↓
4. AuthContext stores user info globally
   ↓
5. ANY component can access user data via useAuth() hook
```

**Key Files:**
- **`frontend/src/AuthContext.jsx`** – Stores logged-in user info globally
  - Calls `authAPI.me()` on startup to check if user has valid cookie
  - Exports `useAuth()` hook so components can access `user` object
  - `user.is_staff` tells us if they're an admin

- **`frontend/src/api.js`** – Makes API calls to backend
  - `fetchWithAuth()` sends requests WITH cookies (`credentials: 'include'`)
  - `authAPI.login()`, `authAPI.logout()`, `authAPI.me()` handle auth

---

### Frontend Pages (What Users See)

#### **1. Store Page** (`frontend/src/pages/Store.jsx`)
**What it does:** Shows all products as cards
```
Fetches: GET /api/products/
For each product → shows: name, price, image, stock
When clicked → links to `/item/{nfc_tag_id}`
```

#### **2. Item Detail Page** (`frontend/src/pages/ItemDetail.jsx`)
**What it does:** Shows ONE product (read-only)
```
URL: /item/:nfc_tag_id (e.g., /item/ABC123)
Fetches: GET /api/products/lookup_nfc/?nfc_tag_id=ABC123
Backend finds product by NFC tag → returns product data
Shows: name, description, price, stock, image
Action: "Add to Cart" button (coming soon)
NO EDITING HERE (admins use Admin Panel instead)
```

#### **3. Admin Inventory Page** (`frontend/src/pages/AdminInventory.jsx`)
**What it does:** Admin-only product list with create/delete
```
Protected: Only logged-in admins see this (/adminInventory route)
Shows table: Product Name | NFC ID | Price | Stock | Actions
Actions:
  - "Admin Edit" → goes to /adminInventory/{product_id}/
  - "Delete" → sends DELETE /api/products/{id}/
  - "+ Add Product" form → sends POST /api/products/ with name, nfc_tag_id, etc.
```

#### **4. Admin Product Edit Page** (`frontend/src/pages/AdminProductEdit.jsx`)
**What it does:** Edit single product with image upload
```
URL: /adminInventory/:id (e.g., /adminInventory/5/)
Fetches: GET /api/products/5/ (get product details)
Form fields: name, nfc_tag_id, price, stock, description, image
On save:
  - Creates FormData (MULTIPART for image)
  - Sends: PATCH /api/products/5/ with image file
  - Redirects back to /adminInventory on success
Image preview shown before upload
```

#### **5. Login/Register Pages**
**What they do:** Auth UI
```
Login: POST /api/auth/login → backend sets httpOnly JWT cookie
Register: POST /api/auth/register → creates new user
After login: cookie automatically sent on all future requests
```

---

### How Authentication Cookie Works (The Magic)

```
1. User logs in:
   Frontend → POST /api/auth/login → Backend
   ↓
2. Backend checks email/password → creates JWT token
   Backend response sets cookie: Set-Cookie: jwt_access=eyJ... (httpOnly, secure)
   ↓
3. Browser automatically stores cookie (user can't see it—httpOnly)
   ↓
4. Every future request includes the cookie automatically
   Frontend.fetchWithAuth() has credentials: 'include'
   ↓
5. Backend receives request + cookie
   Backend extracts JWT from cookie → validates it → knows who the user is
```

**Why httpOnly cookies?**
- JavaScript can't steal it (security)
- Browser auto-sends it on every request
- Perfect for NFC scans (persistent across browser tabs)

---

## Part 2: Backend Structure

### Database Schema

```
Profile (User)
├── id (auto)
├── email (unique, login)
├── password (hashed)
├── name
├── phone
├── is_staff (admin flag)
└── is_active

Product
├── id (auto)
├── name
├── nfc_tag_id (unique—this is the NFC tag number!)
├── description
├── price (decimal)
├── stock_quantity (integer)
├── image (ImageField—stores file upload)
└── created_at (auto timestamp)
```

**Key Table: Product**
- When someone scans NFC tag `ABC123`, your frontend looks up product WHERE `nfc_tag_id=ABC123`
- That's the magic: NFC tag ID matches database column

---

### Backend Files (What They Do)

#### **1. Models** (`StorePages/models.py`)
**What it does:** Define database tables
```python
class Profile(AbstractBaseUser):
    email, name, phone, is_staff, etc.
    # custom user model—email is username

class Product(models.Model):
    name, nfc_tag_id, price, stock_quantity, description, image
    # NFC tag ID is the UNIQUE identifier for linking
```
**Why custom Profile?** Your app uses email to login (not username like Django default)

---

#### **2. Serializers** (`StorePages/serializers.py`)
**What it does:** Convert Python objects ↔ JSON
```
Frontend sends JSON → Serializer converts to Python → saves to DB
DB data → Serializer converts to JSON → Frontend receives JSON

ProductSerializer:
  - Takes Product model
  - Returns JSON with all fields: id, name, price, nfc_tag_id, image, etc.
  - Used for detail views + editing

ProductMinimalSerializer:
  - Lightweight version for list views
  - Only returns: id, name, price, nfc_tag_id, image
  - Faster when showing 100 products
```

---

#### **3. Views/ViewSet** (`StorePages/views_products.py`)
**What it does:** API endpoints (CRUD operations)

```python
class ProductViewSet(viewsets.ModelViewSet):
    # Auto-generates these endpoints:
    
    GET /api/products/
        → Returns list of ALL products (uses ProductMinimalSerializer for speed)
        → Public (no auth required)
    
    POST /api/products/
        → Create new product
        → Admin only (checks is_staff)
        → Accepts multipart form-data (for images)
    
    GET /api/products/{id}/
        → Get ONE product details (uses ProductSerializer)
        → Public
    
    PATCH /api/products/{id}/
        → Update product (name, price, etc.)
        → Admin only
        → Accepts multipart form-data (image upload)
    
    DELETE /api/products/{id}/
        → Delete product
        → Admin only
    
    GET /api/products/lookup_nfc/?nfc_tag_id=ABC123
        → CUSTOM endpoint: find product by NFC tag
        → Returns full ProductSerializer data
        → Public (so customers can scan NFC tags)

    PATCH /api/products/{id}/update_stock/
        → CUSTOM endpoint: change stock quantity
        → Admin only
```

**Admin-Only Check:**
```python
def perform_create(self, serializer):
    if not self.request.user.is_staff:
        raise PermissionDenied("Only admin users can create products")
    serializer.save()
```
Backend checks `request.user.is_staff` before allowing changes

---

#### **4. Authentication** (`StorePages/authentication.py`)
**What it does:** Extract JWT from cookies
```python
class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Get token from cookie instead of header
        raw_token = request.COOKIES.get('jwt_access')
        # Validate the token
        # Return (user, token) if valid
```
Django REST Framework normally expects: `Authorization: Bearer eyJ...`
But your app uses cookies instead for NFC persistence.

---

#### **5. Auth Views** (`StorePages/views_auth.py`)
**What it does:** Login, register, logout endpoints
```
POST /api/auth/register
  → Creates new user
  → Returns user data

POST /api/auth/login
  → Validates email/password
  → Creates JWT token
  → Sets httpOnly cookie
  → Returns user data

POST /api/auth/logout
  → Deletes the cookie

GET /api/auth/me
  → Returns currently logged-in user data
  → Frontend calls this on startup to restore user session
```

---

#### **6. Settings** (`BackendNFC/settings.py`)
**What it does:** Django configuration
```python
AUTH_USER_MODEL = 'StorePages.Profile'  # Use custom user model

REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
    'StorePages.authentication.JWTCookieAuthentication',  # Check cookies first
    'rest_framework_simplejwt.authentication.JWTAuthentication',  # Fallback to header
]

MEDIA_ROOT = BASE_DIR / 'media'  # Where uploaded images are stored
MEDIA_URL = '/media/'  # URL to access images

DEBUG = True  # For development (serves media files + shows errors)
```

---

#### **7. URLs** (`BackendNFC/urls.py`)
**What it does:** Map URLs to views
```python
router.register(r'products', ProductViewSet)
# Auto-generates /api/products/ routes

path('api/', include(router.urls))
# All product endpoints under /api/

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve uploaded images from /media/
```

---

## Part 3: How It All Connects (The Real Magic)

### Scenario: Admin Scans NFC Tag & Edits Product

```
1. PHYSICAL SCAN
   Admin scans NFC tag with number: ABC123
   Phone opens: https://myapp.com/item/ABC123

2. FRONTEND ROUTE
   React Router matches /item/:nfc_tag_id
   ItemDetail.jsx component loads
   Parameter extracted: nfc_tag_id = "ABC123"

3. FETCH PRODUCT DATA
   ItemDetail calls: GET /api/products/lookup_nfc/?nfc_tag_id=ABC123
   Backend ProductViewSet.lookup_nfc() receives query param
   Backend does: Product.objects.get(nfc_tag_id="ABC123")
   Database finds product with ID=5, returns full data

4. CHECK IF ADMIN
   In ItemDetail.jsx:
   const { user } = useAuth()  // Get from AuthContext
   if (user?.is_staff) → show admin controls
   else → show customer view only

5. ADMIN CLICKS "EDIT"
   Navigates to: /adminInventory/5/
   AdminProductEdit page loads
   Fetches: GET /api/products/5/

6. ADMIN EDITS & UPLOADS IMAGE
   Changes: name, price, description, uploads new PNG
   Form creates FormData (multipart/form-data)
   Sends: PATCH /api/products/5/
   Backend receives:
     - multipart data (parsers decode it)
     - JWT cookie (authentication layer finds user)
     - Checks: is user.is_staff? Yes → allowed
   Backend saves to DB + stores image in media/ folder

7. IMAGE DISPLAY
   Product now has image field populated
   ItemDetail.jsx shows: <img src={product.image} />
   Browser requests: GET /media/product_images/ABC123.png
   Django serves file from media/ folder
```

---

## Part 4: Understanding CRUD for NFC Products

### CREATE (Add New Product)

```
Frontend: /adminInventory page → click "+ Add Product"
Form: name, nfc_tag_id, price, stock, description, image
Submit: POST /api/products/ with FormData

Backend:
├─ Check: is user authenticated? (JWT cookie)
├─ Check: is user.is_staff? (admin)
├─ Validate: all required fields present
├─ Save: Product.objects.create(...)
├─ Save image: to media/product_images/ folder
└─ Return: new product data with media URL

Frontend: Success → reload list → see new product
```

### READ (View Product)

```
Frontend: Click product card → /item/{nfc_tag_id}
Backend: GET /api/products/lookup_nfc/?nfc_tag_id={tag}
├─ Find: Product where nfc_tag_id = {tag}
├─ Return: full product JSON
└─ Frontend displays: name, price, description, image

MULTIPLE SCENARIOS:
1. Customer views: sees read-only page + "Add to Cart" button
2. Admin views: sees read-only page + "Edit Product" button (leads to /adminInventory/:id)
3. Not logged in: sees read-only page + no buttons

How does backend know? 
→ It doesn't care! Frontend checks user locally.
→ Backend just returns data, frontend decides what UI to show.
```

### UPDATE (Edit Product)

```
Frontend: /adminInventory/:id → click "Save Changes"
Form: name, price, stock, description, image
Submit: PATCH /api/products/:id/ with FormData

Backend:
├─ Check: JWT cookie valid?
├─ Check: is user.is_staff?
├─ Load: existing product from DB
├─ Update: fields provided in request
├─ Handle image: if new image uploaded, save it
├─ Save: product.save()
└─ Return: updated product

Frontend: Success → redirect back to inventory list
```

### DELETE (Remove Product)

```
Frontend: /adminInventory → click "Delete" button
Submit: DELETE /api/products/:id/

Backend:
├─ Check: JWT cookie valid?
├─ Check: is user.is_staff?
├─ Delete: Product.objects.get(id=:id).delete()
└─ Return: 204 No Content

Frontend: Success → reload list → product gone
```

---

## Part 5: How To Learn & Do This Yourself

### Step 1: Understand the Flow
**Question:** "How does the backend know if user is admin?"
**Answer:** 
1. User sends request with JWT cookie
2. `JWTCookieAuthentication` extracts JWT from cookie
3. Django validates JWT → extracts user ID
4. `request.user` is now the Profile object
5. Check `if request.user.is_staff:`

### Step 2: Map New Feature to Architecture

**If you want to add something:**

1. **Figure out data** → Add to `models.py`
   ```python
   class Product(models.Model):
       # Add new field here
       serial_number = models.CharField(max_length=50)
   ```

2. **Update database** → Make migration
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Update serializer** → Show data as JSON
   ```python
   class ProductSerializer(serializers.ModelSerializer):
       class Meta:
           fields = [..., 'serial_number']  # Add here
   ```

4. **Create API endpoint if needed** → Add to `views_products.py`
   ```python
   @action(detail=True, methods=['post'])
   def my_custom_action(self, request, pk=None):
       # Custom logic here
       return Response(...)
   ```

5. **Create frontend component** → Call API
   ```jsx
   useEffect(() => {
       fetch('/api/products/...', { credentials: 'include' })
       .then(r => r.json())
       .then(data => setProduct(data))
   }, [])
   ```

### Step 3: Debugging

**Product not showing up?**
1. Check database: `python manage.py shell` → `Product.objects.all()`
2. Check serializer: Is the field in `fields = [...]`?
3. Check API: Call `/api/products/` in browser, see JSON
4. Check frontend: Open DevTools → Network tab → see API response

**Edit not saving?**
1. Check permissions: Is `user.is_staff` actually True?
2. Check serializer: Are all required fields present?
3. Check backend logs: `python manage.py runserver` shows errors
4. Check frontend: DevTools → Network → see response error

**Image not uploading?**
1. Check `parser_classes = [MultiPartParser, FormParser, JSONParser]` in viewset
2. Check form is `multipart/form-data` (not regular JSON)
3. Check media folder exists: `ls media/product_images/`
4. Check MEDIA_URL works: `/media/product_images/` returns image

### Step 4: Common Tasks

**Add a new product field?**
```
models.py →
  serializers.py →
    make migration →
    migrate →
      frontend form input →
        frontend submit with field in FormData
```

**Make field read-only after creation?**
```python
# serializers.py
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        extra_kwargs = {
            'nfc_tag_id': {'read_only': True}  # Can't change after create
        }
```

**Allow only admins to create?**
```python
# views_products.py - already done
def perform_create(self, serializer):
    if not self.request.user.is_staff:
        raise PermissionDenied("Admins only")
    serializer.save()
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL NFC TAG                         │
│                   (stores product ID)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SCAN
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ AuthContext (Global User State)                      │  │
│  │ user = { email, is_staff, id }                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pages:                                               │  │
│  │ - Store.jsx (list all products)                      │  │
│  │ - ItemDetail.jsx (view one: /item/:nfc_tag_id)       │  │
│  │   → Checks user.is_staff → show edit button or not   │  │
│  │ - AdminInventory.jsx (admin list + create/delete)    │  │
│  │ - AdminProductEdit.jsx (admin edit with image)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Calls (api.js):                                  │  │
│  │ - fetchWithAuth() adds JWT cookie to every request   │  │
│  │ - credentials: 'include' → browser sends cookies     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────────┘
                           │
            HTTP/HTTPS API (with Cookie header)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Django)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Authentication Layer                                 │  │
│  │ JWTCookieAuthentication:                             │  │
│  │ 1. Extract JWT from request.COOKIES['jwt_access']   │  │
│  │ 2. Validate token                                    │  │
│  │ 3. Set request.user = Profile object                │  │
│  │ 4. request.user.is_staff = admin flag               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Endpoints (urls.py + views_products.py)          │  │
│  │ GET    /api/products/                    [public]     │  │
│  │ POST   /api/products/                    [admin]      │  │
│  │ GET    /api/products/{id}/                [public]     │  │
│  │ PATCH  /api/products/{id}/                [admin]      │  │
│  │ DELETE /api/products/{id}/                [admin]      │  │
│  │ GET    /api/products/lookup_nfc/         [public]     │  │
│  │        ?nfc_tag_id=ABC123                            │  │
│  │ PATCH  /api/products/{id}/update_stock/  [admin]      │  │
│  │                                                       │  │
│  │ Each endpoint:                                        │  │
│  │ 1. Check authentication (JWT valid?)                 │  │
│  │ 2. Check permissions (is_staff for write)            │  │
│  │ 3. Deserialize JSON → Python                         │  │
│  │ 4. Call model methods / DB operations                │  │
│  │ 5. Serialize Python → JSON response                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Model Layer                                          │  │
│  │ Profile: email, password, is_staff, is_active       │  │
│  │ Product: name, nfc_tag_id, price, image, stock      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
│  Tables:                                                    │
│  - store_pages_profile (users)                              │
│  - store_pages_product (products + nfc_tag_id)              │
└─────────────────────────────────────────────────────────────┘
                           │
                  Media Folder (on disk)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            Uploaded Images (/media/product_images/)          │
│  ABC123.png, XYZ789.jpg, etc.                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Authentication is the foundation**
   - Login sets httpOnly JWT cookie
   - Every request includes cookie automatically
   - Backend extracts JWT → knows who the user is + their permissions

2. **Frontend checks `user.is_staff` locally**
   - If admin → show edit button, link to `/adminInventory/:id`
   - If not admin → show read-only view
   - Backend also checks permissions (double-check for security)

3. **NFC tag ID is the lookup key**
   - Physical tag contains: `ABC123`
   - Frontend link: `/item/ABC123`
   - Backend query: `Product.where(nfc_tag_id='ABC123')`
   - Database returns product data

4. **MVC Pattern** (Model-View-Controller)
   - **Model**: `models.py` (database schema)
   - **View**: `views_products.py` (API logic + permissions)
   - **Frontend**: React components (UI + API calls)
   - Serializer: glue between Python objects & JSON

5. **Always follow the flow**
   - For any feature: Data → API → Frontend UI
   - For any bug: Frontend logs → API response → Database
