# LaunchPad - Architecture

## System Overview
LaunchPad is a Solana token launchpad platform using Meteora's Dynamic Bonding Curve (DBC) protocol. Users can create tokens, trade them through progressive pricing curves, and automatically migrate to DLMM pools at maturity.

## Architecture Pattern
**Full-Stack TypeScript Application**
- Frontend: Angular 21+ SPA
- Backend: NestJS 11+ API Server
- Database: PostgreSQL (relational)
- Blockchain: Solana (mainnet)

## Frontend Architecture (Angular 21+)

### Structure
```
src/
├── app/
│   ├── components/          # Standalone components
│   ├── services/            # Business logic services
│   ├── guards/              # Route guards (auth)
│   ├── interceptors/        # HTTP interceptors (JWT)
│   ├── models/              # TypeScript interfaces
│   └── pages/               # Route pages
├── assets/                  # Static files
└── environments/            # Config (dev/prod)
```

### Key Patterns
- **Standalone Components:** No NgModules
- **Signals:** Reactive state management
- **Services:** Singleton business logic
- **Interceptors:** Auto JWT token injection
- **Guards:** Route protection

### State Management
- Angular Signals for reactive UI
- Services for shared state
- LocalStorage for persistence (watchlist, preferences)

## Backend Architecture (NestJS 11+)

### Structure
```
src/
├── modules/
│   ├── auth/               # JWT authentication
│   ├── tokens/             # Token CRUD
│   ├── dbc/                # Dynamic Bonding Curves
│   ├── meteora-api/        # Meteora integration
│   ├── trading/            # Buy/sell operations
│   └── rewards/            # Fee collection
├── entities/               # TypeORM entities
├── database/
│   └── migrations/         # DB schema changes
└── main.ts                 # Entry point
```

### Key Patterns
- **Modules:** Feature-based organization
- **Services:** Business logic layer
- **Controllers:** REST API endpoints
- **Entities:** Database models (TypeORM)
- **Guards:** Authentication/authorization

### Database Schema
**Main Tables:**
- `tokens` - Created tokens
- `meteora_pools` - DLMM/DBC pools
- `dbc_partner_configs` - Bonding curve configs
- `fee_claimer_vaults` - Revenue tracking
- `bot_creator_rewards` - Bot earnings

## Integration Layer

### Solana Blockchain
- **Web3.js:** Transaction building/signing
- **Meteora SDK:** Pool creation, liquidity management
- **Jupiter:** Token swaps, price aggregation

### Real-Time Updates
- **WebSocket:** Live price feeds, trade notifications
- **Polling:** Token sync (5 min intervals)

## Security

### Authentication
- **JWT Tokens:** HttpOnly cookies
- **Wallet Verification:** Sign message with private key
- **Auto-logout:** Token expiration handling

### Authorization
- **Guards:** Protected endpoints (POST only)
- **Wallet Ownership:** Verify user owns wallet

## Deployment Architecture

### Railway Services
1. **Frontend Service:** Static Angular build
2. **Backend Service:** NestJS Node.js app
3. **PostgreSQL Service:** Database

### Environment Variables
- Frontend: `API_URL`, `WS_URL`, `SOLANA_RPC_URL`
- Backend: `DATABASE_URL`, `JWT_SECRET`, `SOLANA_RPC_URL`, `PLATFORM_WALLET_PRIVATE_KEY`

## Data Flow

### Token Creation
```
User → Frontend → Backend API → Solana RPC → Meteora Protocol → Database
```

### Token Trading
```
User → Frontend → Backend API → Jupiter/Meteora → Solana → Database → WebSocket → Frontend
```

### Price Updates
```
Cron Job → Backend → Jupiter API → Database → WebSocket → Frontend
```

## Performance Considerations
- **Frontend:** Lazy loading, tree-shaking
- **Backend:** Connection pooling, caching
- **Database:** Indexes on frequently queried fields
- **Blockchain:** Batch transactions, retry logic

---

**Last Updated:** 2026-02-08
**Sprint:** 1 (10 features complete)
**Production:** Live (46+ hours uptime)
