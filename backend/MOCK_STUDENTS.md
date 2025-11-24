# Mock Student Data for Testing

## Pre-created Students

You can login with any of these SevisPass IDs:

| SevisPass ID | Name | Grade | School | Password |
|-------------|------|-------|--------|----------|
| `SEVIS-001` | John Doe | 11 | Port Moresby High School | `123456` |
| `SEVIS-002` | Mary Smith | 11 | Lae Secondary School | `123456` |
| `SEVIS-003` | Peter Wilson | 12 | Goroka High School | `123456` |
| `SEVIS-004` | Sarah Brown | 12 | Mount Hagen Secondary | `123456` |
| `SEVIS-005` | David Johnson | 11 | Madang Secondary School | `123456` |

## How to Use

1. Go to the login page: http://localhost:5174/login
2. Enter any SevisPass ID from the table above (e.g., `SEVIS-001`)
3. Enter the password: **123456** (default for all MVP accounts)
4. Optionally fill in name, grade, and school (or leave blank)
5. Click "Login with SevisPass"

## Re-create Mock Students

If you need to reset or recreate the mock students:

```bash
cd backend
python manage.py create_mock_students
```

## Notes

- These are pre-created in the database
- You can still create new students by entering a different SevisPass ID
- The system will auto-create users on first login if they don't exist
- For MVP demo, any SevisPass ID will work (creates new user if not found)

