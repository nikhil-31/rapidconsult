# RapidConsult — HTTP & WebSocket API Specification

**Version:** 1.0.0 (aligned with `drf-spectacular` `SPECTACULAR_SETTINGS`)  
**Application:** RapidConsult — multi-organization consultation, scheduling, and real-time messaging platform.  
**Stack:** Django 5, Django REST Framework, Django Channels, PostgreSQL, MongoDB (MongoEngine), Redis, Celery.  
**Canonical discovery:** `GET /api/schema/` (OpenAPI 3), `GET /api/docs/` (Swagger UI; **admin-only** by default).

---

## 1. API overview

### 1.1 Base URL

| Environment | Example base |
|-------------|----------------|
| Local ASGI | `http://localhost:8000` |


All REST resources in this document are rooted at **`/api/`** unless noted.

### 1.2 Versioning strategy

- **Current:** No URL prefix versioning (`/api/v1/...` is **not** used). Breaking changes should be coordinated with clients; prefer additive changes and deprecation headers.
- **Recommended (future):** Introduce `/api/v1/` when you need parallel major versions; keep Spectacular `VERSION` in sync.

### 1.3 Authentication

| Mechanism | Usage |
|-----------|--------|
| **DRF Token** | Header: `Authorization: Token <token_key>` |
| **Session** | Cookie session (browser / same-site); used when calling from Django-rendered pages |
| **WebSocket** | Query parameter: `?token=<token_key>` (see §7) |

**Token issuance:** `POST /api/auth-token/` (username + password). Response includes `token` and organization context.

**There is no JWT or refresh-token flow in the current codebase.** Clients store the opaque token securely (mobile Keychain, web memory + httpOnly strategy if you add cookie-based API auth later).

### 1.4 Request / response format

- **Content-Type:** `application/json` for bodies unless uploading files (`multipart/form-data`).
- **Charset:** UTF-8.
- **Dates:** ISO 8601 strings in JSON where serializers emit datetime (e.g. `2025-03-28T12:00:00Z`).
- **IDs:** Integer primary keys for PostgreSQL models; MongoDB ObjectIds as strings where noted.

### 1.5 CORS

API CORS is restricted to configured origins (see `CORS_ALLOWED_ORIGINS` in settings). Third-party browser clients must be explicitly allowed.

---

## 2. Data models (logical)

Relationships reflect PostgreSQL unless labeled **(Mongo)**.

### 2.1 User (`users.User`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | PK |
| `username` | string | Unique; login identifier |
| `email` | string | |
| `name` | string \| null | Display name |
| `profile_picture` | URL \| null | Uploaded file URL when configured |

**Relations:** `org_profiles` → `UserOrgProfile`; `phone_numbers` → `Contact`.

**Example (public summary in nested payloads):**

```json
{
  "id": 42,
  "username": "jdoe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "profile_picture": "https://cdn.example.com/media/profile/jdoe.jpg"
}
```

### 2.2 Contact (`users.Contact`)

| Field | Type |
|-------|------|
| `id` | integer |
| `label` | string \| null |
| `type` | enum: `mobile`, `home`, `work`, `fax`, `other`, `email`, `on_call`, `clinic` |
| `country_code` | string \| null |
| `number` | string \| null |
| `primary` | boolean |

Owned by the authenticated user.

### 2.3 Role (`scheduling.Role`)

| Field | Type |
|-------|------|
| `id` | integer |
| `name` | string (unique) |

**Application-level permissions** (not enforced uniformly on all endpoints; returned in login/profile payloads from `config.roles.get_permissions_for_role`):

| Role name | Permission slugs (examples) |
|-----------|----------------------------|
| `admin` | `create_user`, `delete_user`, `assign_shifts`, `view_all_data` |
| `doctor` | `view_schedule`, `mark_availability`, `messages`, `contacts` |
| `nurse` | `view_schedule`, `messages`, `contacts` |
| `manager` | `assign_shifts`, `view_schedule`, `messages`, `contacts` |

### 2.4 Address, Organization, Location, Department, Unit

- **Address:** `address_1`, `address_2`, `city`, `state`, `zip_code`, `lat`, `lon`, `label`.
- **Organization:** `name`, nested `address`, optional `display_picture`.
- **Location:** `name`, `organization` (FK), `address`, optional `display_picture`.
- **Department:** `name`, `location` (FK); responses may include `location_details`.
- **Unit:** `name`, `department` (FK), members via `UnitMembership`, optional `oncall` summary (computed).

### 2.5 UserOrgProfile

| Field | Type |
|-------|------|
| `id` | integer |
| `user` | User summary |
| `organization` | nested Organization |
| `role` | Role |
| `job_title` | string \| null |
| `allowed_locations` | list of Location |
| `permissions` | string[] (derived from role name) |

### 2.6 UnitMembership

| Field | Type |
|-------|------|
| `id` | integer |
| `unit` | integer (FK) |
| `user` | integer (UserOrgProfile FK) |
| `user_details` | nested UserOrgProfile (read) |
| `is_admin` | boolean \| null |
| `joined_at` | datetime (read-only) |

### 2.7 OnCallShift

| Field | Type |
|-------|------|
| `id` | integer |
| `user` | integer (UserOrgProfile, write) |
| `unit` | integer (write) |
| `shift_type` | `oncall` \| `outpatient` |
| `start_time`, `end_time` | datetime \| null |
| `user_details`, `unit_details` | read-only nested |

### 2.8 Consultation

| Field | Type |
|-------|------|
| `id` | integer |
| `patient_name`, `patient_age`, `patient_sex`, `ward` | scalar / enum |
| `referred_by_doctor`, `referred_to_doctor` | nested UserOrgProfile (read) |
| `referred_by_doctor_id`, `referred_to_doctor_id` | integer (write) |
| `urgency` | `routine` \| `urgent` \| `emergency` |
| `status` | `pending` \| `in_progress` \| `completed` \| `closed` |
| `diagnosis`, `reason_for_referral`, `consultant_remarks`, `consultant_review`, `review_notes` | text |
| `organization`, `location`, `department`, `unit` | nested or IDs per serializer |
| `organization_id`, `location_id`, `department_id`, `unit_id` | write |
| `consultation_datetime`, `closed_at`, `created_at`, `updated_at` | datetime |

**Example (create/update body fragment):**

```json
{
  "patient_name": "Alex Patient",
  "patient_age": 67,
  "patient_sex": "male",
  "ward": "3W",
  "referred_by_doctor_id": 10,
  "referred_to_doctor_id": 11,
  "urgency": "urgent",
  "reason_for_referral": "Cardiology opinion",
  "organization_id": 1,
  "location_id": 2,
  "department_id": 5,
  "unit_id": 12
}
```

### 2.9 Legacy chat (PostgreSQL)

**Conversation:** `id` (UUID string), `name` (e.g. `userA__userB`), `other_user`, `last_message`.

**Message:** `id` (UUID), `conversation`, nested `from_user` / `to_user`, `content`, `timestamp`, `read`, `file` (URL).

### 2.10 Mongo-backed chat **(Mongo)**

**UserConversation** (sidebar / inbox row):

```json
{
  "_id": "65f0c0c0c0c0c0c0c0c0c0c0",
  "userId": "42",
  "conversationId": "65f0c0c0c0c0c0c0c0c0c0c1",
  "conversationType": "direct",
  "directMessage": {
    "otherParticipantId": "99",
    "otherParticipantName": "Dr. Smith",
    "otherParticipantAvatar": "https://...",
    "otherParticipantStatus": "online"
  },
  "lastMessage": {
    "messageId": "...",
    "content": "Hello",
    "senderId": "42",
    "senderName": "Jane",
    "timestamp": "2025-03-28T10:00:00Z",
    "type": "text"
  },
  "unreadCount": 2,
  "lastReadAt": "2025-03-28T09:00:00Z",
  "isPinned": false,
  "isMuted": false,
  "isArchived": false,
  "updatedAt": "2025-03-28T10:01:00Z"
}
```

**MongoMessage** (channel message):

```json
{
  "id": "65f1a1a1a1a1a1a1a1a1a1a1a",
  "conversationId": "65f0c0c0c0c0c0c0c0c0c0c1",
  "senderId": "42",
  "senderName": "Jane Doe",
  "content": "See you at rounds",
  "type": "text",
  "timestamp": "2025-03-28T10:05:00Z",
  "media": null,
  "readBy": [{ "userId": "99", "readAt": "2025-03-28T10:06:00Z" }],
  "locationId": "2",
  "organizationId": "1",
  "replyTo": null
}
```

### 2.11 UserDevice (push)

| Field | Type |
|-------|------|
| `id` | integer |
| `registration_id` | string (unique) |
| `type` | `fcm` \| `apns` \| `web` |
| `device_type` | string \| null (client OS hint) |
| `active` | boolean |
| `date_created` | datetime (read-only) |

---

## 3. Endpoints

**Defaults:**

- Unless stated, **`IsAuthenticated`** applies (session or token).
- **Pagination (global):** `PageNumberPagination`, `page_size=20`, query params `page`, `page_size` (max typically 100 where a custom paginator overrides).

### 3.1 Auth — obtain token

| | |
|--|--|
| **Method / URL** | `POST /api/auth-token/` |
| **Auth** | None |
| **Description** | Exchange username + password for API token and organization context. |

**Request body:**

```json
{
  "username": "jdoe",
  "password": "••••••••"
}
```

**Response `200 OK`:**

```json
{
  "id": 42,
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "username": "jdoe",
  "profile_picture": "https://api.example.com/media/profile/jdoe.jpg",
  "organizations": [
    {
      "id": 7,
      "organization": { "id": 1, "name": "General Hospital", "address": { "...": "..." } },
      "role": { "id": 2, "name": "doctor" },
      "job_title": "Attending",
      "permissions": ["view_schedule", "mark_availability", "messages", "contacts"],
      "allowed_locations": [{ "id": 2, "name": "Main Campus", "...": "..." }]
    }
  ]
}
```

| Code | When |
|------|------|
| `200` | Success |
| `400` | Validation error (`{"non_field_errors": ["Unable to log in..."]}`) |

**Logout / refresh:** Not implemented as first-class APIs. To “logout,” **delete the `Token` record** server-side (admin or custom endpoint) or stop sending the token. There is **no** refresh token rotation in-repo.

---

### 3.2 Users (`/api/users/`)

ViewSet: `UserViewSet` — lookup by **`username`**.

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `GET` | `/api/users/` | Yes | List users (paginated). |
| `GET` | `/api/users/{username}/` | Yes | Retrieve user by username. |
| `PUT`/`PATCH` | `/api/users/{username}/` | Yes | Update user (optional password). |
| `POST` | `/api/users/register/` | Yes* | **`register_user`** — create user + org profile. *Same permission stack as viewset (authenticated). |

**`GET /api/users/all/`** (custom list)

- **Query:** `organization_id` (optional), `location_id` (optional).
- **Behavior:** Excludes requesting user; filters by org / allowed location membership.

**`GET /api/users/search/`**

- **Query:** `q` (required), `organization_id`, `location_id`.
- **Errors:** `400` if `q` missing: `{"detail": "Missing search query"}`.

**`POST /api/users/register/`** body example:

```json
{
  "username": "newuser",
  "email": "new@example.com",
  "name": "New User",
  "password": "secure-password",
  "org_profile": {
    "organization": 1,
    "role": 2,
    "job_title": "RN"
  }
}
```

| Code | When |
|------|------|
| `200` / `201` | Success |
| `400` | Serializer validation |
| `401` | Not authenticated |
| `404` | Unknown username (retrieve) |

---

### 3.3 Profile (`/api/profile/`)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `GET`/`PUT`/`PATCH` | `/api/profile/me/` | Yes | Current user profile with contacts + organizations. |
| `GET`/`PUT`/`PATCH` | `/api/profile/{pk}/` | Yes | Profile by user **integer** `pk`. |

**`GET /api/profile/me/` example fragment:**

```json
{
  "id": 42,
  "username": "jdoe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "profile_picture": null,
  "contacts": [],
  "organizations": []
}
```

| Code | When |
|------|------|
| `200` | OK |
| `404` | Unknown `pk` |

---

### 3.4 Contacts (`/api/contacts/`)

Standard **`ModelViewSet`**. Queryset scoped to **`request.user`**.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/contacts/` | List own contacts |
| `POST` | `/api/contacts/` | Create |
| `GET` | `/api/contacts/{id}/` | Retrieve |
| `PUT`/`PATCH` | `/api/contacts/{id}/` | Update |
| `DELETE` | `/api/contacts/{id}/` | Delete |

**Example `POST` body:**

```json
{
  "label": "Work mobile",
  "type": "mobile",
  "country_code": "+1",
  "number": "5551234567",
  "primary": true
}
```

| Code | When |
|------|------|
| `201` | Created |
| `400` | Validation |
| `401` | Unauthenticated |
| `404` | Not owner / missing |

---

### 3.5 Organizations (`/api/organizations/`)

**`ModelViewSet`**. **Note (implementation gap):** `permission_classes = [IsAuthenticated]` only — **any authenticated user may create/update/delete any organization**. Tighten with object-level or admin checks before third-party exposure.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/organizations/` | List |
| `POST` | `/api/organizations/` | Create |
| `GET` | `/api/organizations/{id}/` | Retrieve |
| `PUT`/`PATCH` | `/api/organizations/{id}/` | Update |
| `DELETE` | `/api/organizations/{id}/` | Delete |

Nested `address` object on create/update per `OrganizationSerializer`.

---

### 3.6 Locations (`/api/locations/`)

**`ModelViewSet`**. Create/update/destroy: **`check_org_admin_or_raise`** — user must have **`UserOrgProfile`** with `role.name` case-insensitive **`admin`** for that organization.

**`get` queryset:**

- Optional `organization_id`. If set, user must belong to that org or **`403 PermissionDenied`**.

**Example `POST`:**

```json
{
  "name": "East Wing",
  "organization": 1,
  "address": {
    "address_1": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip_code": "02101"
  }
}
```

| Code | When |
|------|------|
| `200`/`201` | Success |
| `403` | Not org member / not org admin for mutating actions |

---

### 3.7 Departments (`/api/departments/`)

Same admin pattern as locations for writes. **Query:** `organization_id`, `location_id`.

**`GET /api/departments/org/?organization_id={id}`**

- Returns departments for org; **`400`** if `organization_id` missing; **`403`** if user not in org.

---

### 3.8 Units (`/api/units/`)

- **GET:** `UnitSerializer`; **POST/PUT/PATCH:** `UnitWriteSerializer` with nested `members`.
- **Query:** `organization_id`, `department_id`.
- **Create:** Triggers Mongo **group chat** creation (`create_group_chat`); org-admin check on create is **commented out** in code — treat as **implementation risk**.
- **Update/destroy:** org admin required.

---

### 3.9 Unit memberships (`/api/unit-memberships/`)

**`ModelViewSet`**. **Query:** `organization_id`, `unit_id`.

**Create/update/destroy:** org **admin** only; create/update syncs Mongo group membership (`add_user_to_group_chat` / `remove_user_from_group_chat`).

**Errors:** `403` if user profile not in same org as unit.

---

### 3.10 User org profiles (`/api/allowed-location/`)

Router basename `allowed-location` → list/detail under that path.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/allowed-location/` | List profiles |
| `POST` | `/api/allowed-location/` | Create |
| `GET` | `/api/allowed-location/{id}/` | Retrieve |
| `PUT`/`PATCH` | `/api/allowed-location/{id}/` | Update |
| `DELETE` | `/api/allowed-location/{id}/` | Delete |
| `PATCH` | `/api/allowed-location/{id}/update-locations/` | Replace `allowed_locations` only |

**`update-locations` body:**

```json
{
  "allowed_locations": [2, 3, 5]
}
```

Response success: `{"detail": "Locations updated successfully."}`

---

### 3.11 Roles (`/api/roles/`)

**`ModelViewSet`**. No extra permission class in view — inherits global **`IsAuthenticated`** only. **Lock down** before external API use.

---

### 3.12 On-call shifts (`/api/shifts/`)

**`ModelViewSet`**. **Filter backends:** `DjangoFilterBackend`, `OrderingFilter`.

**Query parameters (all optional unless noted):**

| Param | Effect |
|-------|--------|
| `unit` | Filter by unit id |
| `department` | Filter by department id |
| `location` | Shifts under this location |
| `user` | With `location`, filters `user_id` + location path |
| `shift_type` | `oncall` or `outpatient` |
| `start_date`, `end_date` | ISO datetimes; overlap filter |

**Example:**

```http
GET /api/shifts/?location=2&shift_type=oncall&start_date=2025-03-01T00:00:00Z&end_date=2025-03-31T23:59:59Z
Authorization: Token abc123...
```

| Code | When |
|------|------|
| `200` | OK |
| `401` | Unauthenticated |

---

### 3.13 Consultations (`/api/consultations/`)

**`ModelViewSet`**. **List/retrieve:** `IsAuthenticated`. **Create, update, partial_update, destroy:** `IsAuthenticated` + **`HasOrgLocationAccess`**.

**`HasOrgLocationAccess` requirement:** Every such request must include **`organization_id`** and **`location_id`** in **query string or JSON body** (permission reads `request.data` and `request.query_params`). User must have a **`UserOrgProfile`** for that org and the location must appear in **`allowed_locations`**.

**Filtering / search / ordering:**

| Feature | Implementation |
|---------|----------------|
| **Filter** | `status`, `urgency`, `organization`, `location`, `unit` (query params) |
| **Search** | `search=` against `patient_name`, `diagnosis`, `reason_for_referral` |
| **Order** | `ordering=` on `created_at`, `updated_at`, `consultation_datetime` (prefix `-` for descending) |
| **Extra query** | `organization_id`, `location_id`, `status`, `urgency` (applied in `get_queryset`) |

**Queryset rule:** User only sees consultations where they are **`referred_by_doctor`** or **`referred_to_doctor`** as a **`UserOrgProfile`**.

**`DELETE` response:** `204` with body `{"detail": "Consultation deleted successfully."}` (non-standard for 204; clients should accept empty body).

**Example create (include org + location for permission):**

```http
POST /api/consultations/?organization_id=1&location_id=2
Authorization: Token abc123...
Content-Type: application/json

{
  "patient_name": "Pat Example",
  "urgency": "routine",
  "referred_by_doctor_id": 10,
  "referred_to_doctor_id": 11,
  "organization_id": 1,
  "location_id": 2
}
```

| Code | When |
|------|------|
| `200`/`201` | OK |
| `400` | Validation |
| `403` | Missing org/location, not org member, or location not allowed |
| `404` | Not found or not visible |

---

### 3.14 Legacy conversations & messages (PostgreSQL)

**Conversations** — `ConversationViewSet`: `GET` list, `GET` retrieve.

- Queryset: `name__contains` current username.
- **Lookup:** `name` (string), not integer id.

**Messages** — `MessageViewSet`: **`GET` list only**.

- **Query (required):** `conversation=<conversation_name>`.
- **Pagination:** `MessagePagination` (`page`, `page_size`).

```http
GET /api/messages-depr/?conversation=alice__bob&page=1
Authorization: Token ...
```

---

### 3.15 Active conversations (Mongo) (`/api/active-conversations/`)

**Permission:** **`HasOrgLocationAccess`** — `organization_id` + `location_id` required on **list** (query params).

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/active-conversations/?organization_id=&location_id=&search=` | Inbox list (paginated, `UserConversationPagination`) |
| `POST` | `/api/active-conversations/` | Create DM or group conversation |
| `GET` | `/api/active-conversations/{conversation_id}/?user_id=` | Single row for user (**requires `user_id` query**) |

**`POST` — direct:**

```json
{
  "type": "direct",
  "organization_id": "1",
  "location_id": "2",
  "user1_id": "42",
  "user2_id": "99"
}
```

**`POST` — group:**

```json
{
  "type": "group",
  "organization_id": "1",
  "location_id": "2",
  "name": "ICU Team",
  "description": "Unit channel",
  "member_ids": ["42", "99", "100"],
  "unit_id": "12"
}
```

**List errors:**

- `400` if no conversations: `{"error": "No conversations found for user_id '42'"}`  
- `403` if org/location access fails

**Retrieve errors:**

- `404` if `UserConversation` not found for `conversationId` + `userId`

---

### 3.16 Mongo messages (`/api/messages/`)

**ViewSet:** `MongoMessageViewSet` — **`list` only**.

**Permission:** **`HasOrgLocationAccess`** — pass **`organization_id`** and **`location_id`** as query params.

```http
GET /api/messages/?conversation_id=65f0...&organization_id=1&location_id=2&page=1
Authorization: Token ...
```

**Errors:**

- `400` without `conversation_id`: `{"error": "conversation_id is required"}`

---

### 3.17 Save Mongo message / file (`/api/save-message/`)

**`POST`** — `ImageMessageViewSet.create`. **Auth:** `IsAuthenticated` + **`HasOrgLocationAccess`**.

**Content-Type:** `multipart/form-data` or JSON (text-only).

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `conversationId` | Yes | Mongo conversation ObjectId string |
| `content` | If no file | Message text |
| `file` | Optional | Attachment → uploaded to S3-compatible storage (`upload_to_spaces`) |
| `replyTo` | Optional | Message id to reply to |
| `organizationId`, `locationId` | For permission + denormalized fields | Must satisfy `HasOrgLocationAccess` |

**Responses:**

- `200` / `201` with `MongoMessageSerializer` payload (implementation returns serializer data; treat as success body).
- `400` — missing/invalid `conversationId`, invalid ObjectId, or empty text when no file.

---

### 3.18 Legacy chat image upload (`/api/messages/image/`)

**`POST`** `ImageMessageUploadView`. **Auth:** `IsAuthenticated`. **Multipart** fields: `file`, `conversation` (conversation **name**), optional `content`.

**Errors:** `400` `{"error": "Missing data"}` if `file` or `conversation` missing.

---

### 3.19 Push devices (`/api/devices/`)

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/devices/` | Register or update device (`update_or_create` on `registration_id`) |
| `DELETE` | `/api/devices/{id}/` | Delete by id |
| `POST` | `/api/devices/unregister/` | Body: `registration_id` — **`204`** if deleted, **`404`** if not found |

**Register body:**

```json
{
  "registration_id": "fcm-token-or-apns-token",
  "type": "fcm",
  "device_type": "ios",
  "active": true
}
```

---

## 4. Pagination, filtering, sorting

### 4.1 Standard page query

```http
GET /api/users/?page=2&page_size=20
```

**Typical response envelope:**

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/users/?page=3&page_size=20",
  "previous": "http://localhost:8000/api/users/?page=1&page_size=20",
  "results": []
}
```

### 4.2 Consultations

```http
GET /api/consultations/?status=pending&urgency=urgent&search=cardio&ordering=-created_at
```

### 4.3 Shifts

Combine `location`, `unit`, `shift_type`, and date range as in §3.12.

---

## 5. Authentication APIs (summary)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth-token/` | Login → token + org payload |
| *(none)* | Logout — delete token or add custom endpoint |
| *(none)* | Refresh — not implemented |
| `POST /api/users/register/` | Provision user (authenticated caller in current code) |

django-allauth routes are not mounted on root `urls.py` in the reviewed config; **email/password signup flows** may be admin-only or custom — confirm `rapidconsult.users.urls` if you enable public registration.

---

## 6. Role-based access control (effective behavior)

This matrix describes **what the code enforces today**, not only role **labels** from `config/roles.py`.

| Area | Rule |
|------|------|
| **Org admin mutations** | `role.name` equals **`admin`** (case-insensitive) on a **`UserOrgProfile`** for the target **organization** (`check_org_admin_or_raise`). Applies to: locations, departments, units (update/delete), unit memberships. |
| **Location-scoped APIs** | **`HasOrgLocationAccess`**: user must belong to org and **`location_id` ∈ allowed_locations**. Applies to: Mongo messages list, active-conversations list/create, save-message, consultation writes. |
| **Consultation visibility** | User must be referrer or referred **`UserOrgProfile`**. |
| **Contacts / devices / profile** | Scoped to **`request.user`**. |
| **Organizations / roles** | Authenticated only — **recommend** restricting to superuser or org admin before production third-party use. |
| **Permission arrays in JSON** | Informational for UI; **not** a substitute for server checks on every endpoint. |

---

## 7. WebSocket APIs

**ASGI root** (no `/api` prefix). **Auth:** `TokenAuthMiddleware` — pass **`?token=<DRF_TOKEN>`**.

| Path | Consumer | Purpose |
|------|----------|---------|
| `/chats/{conversation_name}/` | `ChatConsumer` | Legacy SQL-backed DM channel (`conversation_name` e.g. `userA__userB`) |
| `/notifications/` | `NotificationConsumer` | Unread + presence heartbeats |
| `/voxchats/{conversation_id}/` | `VoxChatConsumer` | Mongo conversation; primary mobile/web chat |

**Upgrade headers:** Required when using TLS (`wss://`).

### 7.1 Legacy `ChatConsumer` events

**Server → client (examples):**

```json
{ "type": "last_50_messages", "messages": [], "message_count": 0, "has_more": false }
```

```json
{ "type": "chat_message_echo", "name": "jdoe", "message": { "...": "MessageSerializer" } }
```

**Client → server:**

```json
{ "type": "chat_message", "message": "Hello", "name": "Jane" }
```

```json
{ "type": "typing", "typing": true }
```

```json
{ "type": "read_messages" }
```

```json
{ "type": "ping" }
```

### 7.2 `NotificationConsumer`

**Client → server:**

```json
{ "type": "heartbeat" }
```

**Server → client:** `new_message_notification`, `unread_count`, `user_status`, etc.

### 7.3 `VoxChatConsumer`

**Client → server:**

```json
{
  "type": "chat_message",
  "conversationId": "65f0...",
  "content": "Hello",
  "messageType": "text",
  "locationId": "2",
  "organizationId": "1",
  "replyTo": null
}
```

```json
{ "type": "typing", "status": true }
```

```json
{ "type": "read_messages" }
```

```json
{ "type": "presence_updates", "user_id": "99", "status": "online" }
```

---

## 8. Rate limiting & security

### 8.1 Throttling (recommended)

The base project may **not** define DRF `DEFAULT_THROTTLE_CLASSES`. **Recommended for production:**

- **Anon:** strict throttle on `POST /api/auth-token/` (e.g. 5/min per IP).
- **User:** burst + sustained limits on message create and file upload endpoints.
- **WebSocket:** connection rate limit at proxy (Nginx/Traefik) per IP.

### 8.2 Validation

- Serializer validation on all write endpoints; Mongo ObjectId validated on `save-message`.
- **File uploads:** size limits should be enforced at **reverse proxy** and **Django** (`DATA_UPLOAD_MAX_MEMORY_SIZE`); chat upload uses `upload_to_spaces` — scan/AV pipeline recommended for production.

### 8.3 Common mitigations

| Risk | Mitigation |
|------|------------|
| Token in query (WS) | Use WSS only; rotate tokens; avoid logging full URLs |
| CSRF | Session views use CSRF; token auth typically exempt for API — prefer token only over HTTPS for SPAs |
| IDOR | Tighten queryset filters on `UserOrgProfile`, `Organization`, `Role` viewsets |
| Over-privileged org CRUD | Add object-level permissions to `OrganizationViewSet` |
| SQL injection | Django ORM + parameterized queries |
| XSS | JSON API; sanitize rich text if added later |

---

## 9. File upload APIs

| Endpoint | Format | Storage |
|----------|--------|---------|
| `POST /api/messages/image/` | `multipart/form-data` | `Message.file` — local or configured `DEFAULT_FILE_STORAGE` |
| `POST /api/save-message/` | `multipart` or JSON | Files → **S3-compatible** via `upload_to_spaces` |
| Profile / org images | `multipart` on respective serializers | Per `MEDIA` / Spaces settings |

**Headers example:**

```http
POST /api/save-message/
Authorization: Token ...
Content-Type: multipart/form-data; boundary=----abc

------abc
Content-Disposition: form-data; name="conversationId"

65f0c0c0c0c0c0c0c0c0c0c1
------abc
Content-Disposition: form-data; name="file"; filename="scan.png"
Content-Type: image/png

(binary)
------abc--
```

---

## 10. Error handling format

### 10.1 DRF validation (`400`)

```json
{
  "field_name": ["This field is required."]
}
```

or

```json
{
  "non_field_errors": ["Invalid data."]
}
```

### 10.2 Authentication (`401`)

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 10.3 Permission (`403`)

```json
{
  "detail": "You must specify an organization and location"
}
```

or plain string messages from `PermissionDenied`.

### 10.4 Not found (`404`)

```json
{
  "detail": "Not found."
}
```

### 10.5 Custom error payloads

Several chat endpoints return `{"error": "..."}` with `400`/`404` — treat **`detail`** and **`error`** keys as errors when present.

---

## 11. API best practices (for consumers)

1. **Naming:** Resource plural segments (`/users/`, `/shifts/`); use **trailing slashes** as Django expects (`APPEND_SLASH`).
2. **Idempotency:** `POST` creates are not idempotent; `PUT`/`PATCH` are per resource. Device register uses **`update_or_create`** on `registration_id` — safe to retry with same id.
3. **Org + location:** For any `HasOrgLocationAccess` endpoint, always send **`organization_id`** and **`location_id`** explicitly.
4. **Consultation writes:** Same as above, even when body includes FK ids.
5. **Web + mobile:** Prefer **`Authorization: Token`** for REST; reuse token in WS query over **WSS** only.
6. **Versioning:** Watch `GET /api/schema/` for additive fields; do not assume undocumented fields are stable.

---

## 12. OpenAPI / Swagger (bonus)

The server already exposes:

- **OpenAPI 3 schema:** `GET /api/schema/`
- **Swagger UI:** `GET /api/docs/` (**`IsAdminUser`** by default)

**Client generation:**

```bash
curl -s http://localhost:8000/api/schema/ -H "Authorization: Token <admin-token>" -o openapi.yaml
```

Use **openapi-generator** or **Orval** (TypeScript) against that schema. For CI, download schema with a **superuser** token or temporarily relax `SERVE_PERMISSIONS` in development only.

---

## Appendix A — Endpoint index (quick reference)

| Method | Path |
|--------|------|
| POST | `/api/auth-token/` |
| GET/PUT/PATCH | `/api/users/`, `/api/users/{username}/` |
| GET | `/api/users/all/` |
| GET | `/api/users/search/` |
| POST | `/api/users/register/` |
| GET/PUT/PATCH | `/api/profile/me/`, `/api/profile/{pk}/` |
| CRUD | `/api/contacts/` |
| CRUD | `/api/organizations/`, `/api/locations/`, `/api/departments/`, `/api/units/` |
| GET | `/api/departments/org/` |
| CRUD | `/api/unit-memberships/` |
| CRUD | `/api/allowed-location/` + PATCH `.../update-locations/` |
| CRUD | `/api/roles/` |
| CRUD | `/api/shifts/` |
| CRUD | `/api/consultations/` |
| GET | `/api/conversations/`, `/api/conversations/{name}/` |
| GET | `/api/messages-depr/` |
| GET/POST | `/api/active-conversations/` |
| GET | `/api/active-conversations/{id}/` |
| GET | `/api/messages/` |
| POST | `/api/save-message/` |
| POST | `/api/messages/image/` |
| POST/DELETE | `/api/devices/` + POST `/api/devices/unregister/` |
| GET | `/api/schema/`, `/api/docs/` |

---

*This document reflects the RapidConsult codebase at the time of writing. Prefer the live OpenAPI schema for field-level truth when the two diverge.*
