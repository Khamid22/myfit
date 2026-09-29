# Future integrations (not implemented in V1)

V1 is local-first: all data lives in IndexedDB (`src/storage`). These are the seams
for later work — each is an interface so the UI does not change when it lands.

| Module | Seam in V1 |
|---|---|
| API client / FastAPI backend | `services/contracts.ts` → `ApiClient` |
| Authentication | `services/contracts.ts` → `AuthProvider` |
| Cloud sync (PostgreSQL) | every record has `id`, `createdAt`, `updatedAt`, `deletedAt` (tombstones) — see `storage/repositories/base.ts`; `SyncEngine` interface |
| AI coach | `domain/recommendations/types.ts` → `RecommendationProvider` (rules implement it today) |
| AI meal photo recognition | `services/contracts.ts` → `FoodRecognizer` returning `FoodCandidate[]` (same shape as online search) |
| Apple Health | `services/contracts.ts` → `HealthSource` (needs the native iOS app) |
| Push notifications | `services/contracts.ts` → `Notifier` |
