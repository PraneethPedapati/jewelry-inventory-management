<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# this doc should not only have security things but also the order placement flow that we discussded, incorporate evrything in a single file wher dev can understand at granular level

Certainly! Here is a complete, **developer-oriented document** that covers both your **order placement flow** and all associated **security aspects**, structured in a way that is clear for implementation.

# Technical Specification: Order Placement Flow \& Security

**Project:** Jewelry Inventory Management System
**Document Version:** 1.0
**Date:** July 26, 2025
**Audience:** Backend, Frontend, and Full Stack Developers

## Table of Contents

1. [Order Placement Flow Overview](#1-order-placement-flow-overview)
2. [Detailed Order Flow: Step by Step](#2-detailed-order-flow-step-by-step)
3. [Order Status Lifecycle](#3-order-status-lifecycle)
4. [Admin Panel Features](#4-admin-panel-features)
5. [WhatsApp Integration Guide](#5-whatsapp-integration-guide)
6. [Draft Cleanup Mechanism](#6-draft-cleanup-mechanism)
7. [Security Measures Embedded in the Flow](#7-security-measures-embedded-in-the-flow)
8. [Developer Implementation Notes](#8-developer-implementation-notes)

## 1. Order Placement Flow Overview

The order placement process is designed for a **mobile-first, jewelry e-commerce experience** with focus on WhatsApp-based checkout and strong admin control. The system ensures both seamless customer experience and robust order management, with security and data integrity maintained throughout.

## 2. Detailed Order Flow: Step by Step

### **Customer Journey:**

1. **Cart \& Checkout**: User selects items, reviews cart, clicks "Place Order".
2. **Draft Creation**: System creates an order in DB with status `draft`, records timestamp for expiry.
3. **WhatsApp Redirection**: User is redirected to WhatsApp with a prefilled message. This includes Order ID and summary, but **no sensitive personal info** in the URL.
4. **Message Sent**: User sends the WhatsApp message to the business number.
    - If user **abandons**, the order stays as `draft`. See Draft Cleanup below.
5. **Confirmation**: Admin receives WhatsApp message, finds the matching `draft` order in admin panel.
6. **Send QR Code**: Admin uses "Send QR Code" button, which opens WhatsApp Web/desktop/mobile chat with that customer, attaches QR, and sends it.
7. **Payment**: Customer pays, then sends payment confirmation to business via WhatsApp.
8. **Status Change**: Admin marks the order as "confirmed" (or next appropriate status). Every further status change can optionally (at admin’s discretion) open a WhatsApp chat with prefilled status message.

## 3. Order Status Lifecycle

- `draft` — Created, awaiting admin review. Expires after 6 hours if untouched.
- `pending_whatsapp` — WhatsApp message confirmed sent by customer (admin clicks "WhatsApp Received").
- `payment_pending` — Admin sends QR code; waiting for confirmation from customer.
- `confirmed` — Admin receives payment confirmation; order is now committed to be processed.
- `processing` — Admin is preparing the order.
- `shipped` — Order shipped to customer (optional, if applicable).
- `delivered` — Customer has received the item (optional).
- `cancelled` — Order is cancelled at any stage (admin action or draft cleanup).


## 4. Admin Panel Features

- **Order List**: Separate sections for DRAFT orders and ACTIVE orders. DRAFTS show order age; ACTIVE orders show current status.
- **Draft Cleanup**: One-click button ("Clear Drafts > 6hrs") that removes all draft orders older than 6 hours, with confirmation dialog.
- **Order Details**: For each order:
    - View customer summary, items, payment history, WhatsApp number.
    - "Contact Customer" button: opens WhatsApp chat with customer (never exposes personal info in URL).
    - "Send QR Code" button: pre-fills chat and allows image upload.
    - "Confirm Payment" button: marks order as confirmed.
    - On status changes: "Send Status Update" button (optional, not automatic).
- **Action Logging**: All order status changes, deletions, and WhatsApp actions are logged (for auditing).


## 5. WhatsApp Integration Guide

- **Prefilled Message Includes**: Order ID (never database UUID, use a generated code e.g. `ORD001`), order summary, and clear instructions.
- **No Customer Data in URL**: Personal details (address, email, etc) must appear **only in chat message**, not URL.
- **Customer Phone Verification**: Before generating WhatsApp chat links, phone numbers are validated and sanitized.
- **WhatsApp Buttons (Admin Panel)**:
    - For status changes, admin can opt to immediately send the update via WhatsApp.
    - All chat links are generated using WhatsApp 'wa.me' format with prefilled (sanitized) text.


## 6. Draft Cleanup Mechanism

- **Cleanup Policy**: Draft orders (status `draft`) older than 6 hours are eligible for deletion.
- **Manual Admin Control**: Admin clicks "Clear Drafts > 6hrs". System presents confirmation dialog ("Delete 5 draft orders?").
- **Security**: Only orders with `draft` status and timestamp older than cutoff are deleted.
- **Logging**: All cleanup actions are logged with admin info, count, and timestamp.


## 7. Security Measures Embedded in the Flow

### **A. Customer Input Validation**

- All fields (name, email, address, phone) are strictly validated and sanitized on the backend.
- Product IDs and quantities are checked server-side for existence and stock.


### **B. Price \& Stock Check**

- Totals are calculated only from server data. Price/order manipulation from frontend is blocked.
- Orders with out-of-stock products are rejected.


### **C. Preventing Duplicate \& Spam Orders**

- For each customer, system disallows identical (same-items) new draft order within 5 minutes.
- Maximum 3 order attempts per IP per hour.


### **D. WhatsApp Contact Security**

- WhatsApp URLs only use order ID and do not leak customer personal details.
- All numbers are validated against E.164 international format before use.


### **E. Admin Operations Security**

- Every admin action is authenticated (JWT).
- Order access: ensures order exists and status is valid before any operation.
- Status transitions are validated (no skipping or illegal jumps).
- Logs all significant actions, including manual draft cleanup.


### **F. Data Sanitation for WhatsApp**

- Order/customer data included in WhatsApp messages is sanitized (removes special chars and length-limited).
- User input is never directly injected into WhatsApp message templates without cleansing.


### **G. Cleanup Actions**

- Manual cleanup is protected by confirmation requirement and performed only on eligible draft orders.
- No accidental deletion of confirmed/active orders is possible.


## 8. Developer Implementation Notes

- **Frontend** submits validated customer/order data to backend, triggers WhatsApp redirect on success.
- **Backend**:
    - Always revalidates all incoming data.
    - Product/price/stock/order status logic is 100% server enforced.
    - Makes order code (not database UUID) primary order reference for customers and WhatsApp chats.
    - Handles all order status logic according to defined lifecycle.
    - Draft cleanup endpoint is only accessible to admins, with appropriate confirmation dialog in UI.
- **All WhatsApp message construction** happens on server-side, templated, never from unsanitized user input.
- **Admin Panel** should clearly highlight draft orders and provide quick cleanup, with required confirmation, and a filtered view so only active/confirmed orders display by default.
- **Everything else** (file uploads, admin login, session management) should use standard security patterns (see broader project docs).


## Flowchart

```mermaid
graph TD;
  A[User adds items to cart] --> B[Clicks "Place Order"]
  B --> C[Backend: Create DRAFT order in DB]
  C --> D[Show WhatsApp button + redirect]
  D --> E{User sends WhatsApp?}
  E -- Yes --> F[Admin receives WhatsApp with Order ID]
  F --> G[Admin confirms in panel: "WhatsApp Received"]
  G --> H[Order status: pending_whatsapp]
  H --> I[Admin sends QR via WhatsApp button]
  I --> J[Customer pays, confirms in chat]
  J --> K[Admin marks order confirmed; updates status as needed]
  E -- No --> L[Order remains DRAFT]
  L --> M[If >30min, admin uses "Clear Drafts" (confirmation dialog)]
  M --> N[DRAFT orders >30min deleted from system]
```


## Glossary

- **Draft Order**: Placeholder order generated upon user initiating the WhatsApp process; awaiting confirmation that WhatsApp message was actually sent.
- **Order Code**: User-friendly, auto-generated short code (e.g., ORD001, BR025) displayed throughout system and WhatsApp.
- **Cleanup**: Manual, admin-triggered process that deletes unconfirmed/old draft orders to keep the order list clean.

**This document can be used for implementation, onboarding new devs, and as a model for future feature additions in your jewelry order flow.**
If you want any section as pseudo-code or want to see the DB, controller, or UI code for any step, let me know!

