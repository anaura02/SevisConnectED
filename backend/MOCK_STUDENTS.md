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
| `SEVIS-006` | Emma Thompson | 11 | Wewak Secondary School | `123456` ⚠️ |
| `SEVIS-007` | James Anderson | 12 | Kokopo High School | `123456` ⚠️ |
| `SEVIS-008` | Lisa Martinez | 11 | Alotau Secondary School | `123456` ⚠️ |

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

## Populate Mock Data

To populate all students with mock data (diagnostics, weaknesses, learning paths, progress):

```bash
cd backend
python manage.py populate_mock_data
```

This will create:
- **Diagnostic Results**: 10-15 questions per student (Math & English)
- **Weakness Profiles**: AI-analyzed weaknesses and strengths for each subject
- **Learning Paths**: Personalized week-by-week study plans
- **Progress Records**: 30 days of activity tracking

**Note**: Run `create_mock_students` first, then `populate_mock_data` to fill in all the data.

## Notes

- These are pre-created in the database
- You can still create new students by entering a different SevisPass ID
- The system will auto-create users on first login if they don't exist
- For MVP demo, any SevisPass ID will work (creates new user if not found)
- ⚠️ **SEVIS-006, SEVIS-007, SEVIS-008** are configured with **below 60% average grades** to test study plan generation for struggling students

