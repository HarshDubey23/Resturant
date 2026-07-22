# Database Indexes

## Orders Collection

| Index | Type | Purpose |
|-------|------|---------|
| `restaurantID_1_state_1_createdAt_-1` | Compound | Admin dashboard order listing filtered by state |
| `restaurantID_1_customer_1_state_1` | Compound | Customer order history lookup |
| `restaurantID_1_createdAt_-1` | Compound | Recent orders by restaurant (SSE stream, analytics) |
| `restaurantID_1_n8nEventId_1` | Unique sparse | n8n webhook deduplication |
| `invoiceNumber_1` | Sparse | Invoice lookup |

## Menus Collection

| Index | Type | Purpose |
|-------|------|---------|
| `restaurantID_1_name_1` | Unique compound | Menu item uniqueness per restaurant |
| `slug_1` | Single | Slug-based lookups |
| `sku_1` | Single | SKU-based lookups |

## Loyalties Collection

| Index | Type | Purpose |
|-------|------|---------|
| `restaurantID_1_customer_1` | Unique compound | Customer loyalty lookup per restaurant |

## Tables Collection

| Index | Type | Purpose |
|-------|------|---------|
| `username_1_restaurantID_1` | Unique compound | Table uniqueness per restaurant |

## Migration

Run migration scripts after deployment:

```bash
npx tsx scripts/migrate-menu-index.ts
npx tsx scripts/migrate-order-indexes.ts
```
