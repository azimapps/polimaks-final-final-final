# Users API

## GET /users/me
**Auth:** User

**Response:** 200 OK
```json
{
  "id": 1,
  "phone_number": "+998901234567",
  "fullname": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## PUT /users/me
**Auth:** User or Admin

**Request:**
```json
{
  "fullname": "John Smith",
  "current_password": "oldpassword123",
  "password": "newpassword123"
}
```

**Notes:**
- Users must provide `current_password` when changing password.
- Admins may change passwords without `current_password`.

**Response:** 200 OK
```json
{
  "id": 1,
  "phone_number": "+998901234567",
  "fullname": "John Smith",
  "created_at": "2024-01-01T00:00:00Z"
}
```


## GET /admin/users
**Auth:** Admin

**Query Params:**
- `skip` (int): Default 0
- `limit` (int): Default 100, max 100
- `search` (string): Search by phone number or fullname (partial match, case-insensitive)

**Response:** 200 OK
```json
{
  "total": 1250,
  "skip": 0,
  "limit": 20,
  "items": [
    {
      "id": 2,
      "phone_number": "+998907654321",
      "fullname": "Jane Smith",
      "created_at": "2024-01-02T00:00:00Z",
      "is_premium": false,
      "premium_expires_at": null
    },
    {
      "id": 1,
      "phone_number": "+998901234567",
      "fullname": "John Doe",
      "created_at": "2024-01-01T00:00:00Z",
      "is_premium": true,
      "premium_expires_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```
