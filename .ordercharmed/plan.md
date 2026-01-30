

# Coffee Shop Self-Ordering Kiosk & POS System

A comprehensive tablet-based ordering system with warm, coffee-inspired design that enables customers to browse, customize, and order drinks while seamlessly syncing with a full-featured POS for cashiers.

---

## 🎨 Design Theme
**Warm & Cozy Aesthetic**
- Earth tones with coffee-inspired colors (warm browns, creamy whites, soft oranges)
- Friendly, inviting typography and rounded elements
- Touch-friendly large buttons optimized for tablet use

---

## 📱 Customer Kiosk (Tablet Interface)

### Welcome Screen
- Attractive welcome display with coffee shop branding
- "Start Order" call-to-action button to begin ordering

### Menu Browsing
- Categories organized by drink type (Hot Coffee, Iced Drinks, Specialty, etc.)
- Visual menu with drink images, names, and prices
- Easy navigation between categories

### Drink Customization
- **Size selection** (Small, Medium, Large)
- **Temperature option** (Hot/Iced where applicable)
- Add-to-cart functionality with quantity adjustment

### Order Cart & Checkout
- View all items in cart with ability to edit/remove
- Order summary with total price
- "Place Order" button generates order number
- Confirmation screen with order reference for cashier

---

## 💻 Cashier POS System

### Order Queue Dashboard
- Real-time display of incoming orders from kiosk
- Order details (items, customizations, order number)
- Status management: New → In Progress → Ready → Completed

### Payment Processing
- Support for multiple payment methods:
  - Cash payments with change calculation
  - Card payments (manual entry or Stripe integration option)
  - Option to mark as online/pre-paid
- Receipt generation upon payment completion

### Sales Tracking
- Daily sales summary and totals
- Order history with search/filter
- Basic sales reports (daily, weekly overview)

### Menu Management (Admin)
- Add/edit/remove menu items
- Set prices and availability
- Manage drink categories
- Upload drink images

---

## 🔄 Real-Time Sync Features

### Order Flow
1. Customer places order on kiosk tablet
2. Order instantly appears on POS dashboard
3. Cashier calls order number for payment
4. Order marked as completed after payment

### Data Synchronization
- Orders sync in real-time between kiosk and POS
- Menu updates from POS reflect immediately on kiosk
- No refresh needed - live updates throughout

---

## 🗄️ Backend (Lovable Cloud)

### Database Structure
- **Menu Items**: drinks, categories, prices, availability
- **Orders**: order details, status, timestamps, payment info
- **Users**: admin/cashier accounts for POS access

### Key Functionality
- Real-time order streaming
- Secure admin authentication for POS
- Data persistence for all orders and menu items

---

## 📊 Additional Features

### Order Management
- Order numbering system for easy customer identification
- Order status tracking (from placement to completion)
- Order history for reference and reorders

### Accessibility
- Large, touch-friendly interface elements
- Clear visual hierarchy for easy navigation
- Responsive design for various tablet sizes

