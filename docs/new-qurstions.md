# Questions List API

## GET /questions
**Auth:** User or Admin

**Query Params:**
- `skip` (int): Default 0
- `limit` (int): Default 20, max 100
- `search` (string|null): Search in question text, variants, or number
- `has_image` (bool|null): Filter by image presence
- `is_active` (bool|null): Admin only; users are forced to `true`
- `test_id` (int|null): Filter by test id
- `category_id` (int|null): Filter by category id

**Notes:**
- Users always get active questions only.
- Admins can pass `is_active=true/false` or omit it to get all.
- Ordered by `number` asc (nulls last), then `id` asc.

**Response:** 200 OK
```json
{
  "questions": [
    {
      "id": 1,
      "number": 1,
      "question": {
        "uz": "What is a road sign?",
        "ru": "What is a road sign?"
      },
      "image": "https://storage.googleapis.com/bucket/images/question-1.jpg",
      "shuffle": true,
      "variants": [
        {
          "uz": "A traffic regulation sign",
          "ru": "A traffic regulation sign",
          "is_correct": true
        }
      ],
      "category_id": 1,
      "test_id": 2,
      "is_active": true
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 1160,
    "has_more": true,
    "current_page": 1,
    "total_pages": 58
  }
}
```

**Examples:**
- `GET /questions?test_id=2&category_id=1`
- `GET /questions?search=signs&has_image=true`
- `GET /questions?is_active=false` (admin only)
