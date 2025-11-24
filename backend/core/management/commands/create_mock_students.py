"""
Django management command to create mock student data
Run: python manage.py create_mock_students
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User


class Command(BaseCommand):
    help = 'Creates mock student data for testing'

    def handle(self, *args, **options):
        # Default password for all MVP accounts
        DEFAULT_PASSWORD = '123456'
        
        mock_students = [
            {
                'sevis_pass_id': 'SEVIS-001',
                'name': 'John Doe',
                'grade_level': 11,
                'school': 'Port Moresby High School',
                'email': 'john.doe@example.com',
                'password': make_password(DEFAULT_PASSWORD),
            },
            {
                'sevis_pass_id': 'SEVIS-002',
                'name': 'Mary Smith',
                'grade_level': 11,
                'school': 'Lae Secondary School',
                'email': 'mary.smith@example.com',
                'password': make_password(DEFAULT_PASSWORD),
            },
            {
                'sevis_pass_id': 'SEVIS-003',
                'name': 'Peter Wilson',
                'grade_level': 12,
                'school': 'Goroka High School',
                'email': 'peter.wilson@example.com',
                'password': make_password(DEFAULT_PASSWORD),
            },
            {
                'sevis_pass_id': 'SEVIS-004',
                'name': 'Sarah Brown',
                'grade_level': 12,
                'school': 'Mount Hagen Secondary',
                'email': 'sarah.brown@example.com',
                'password': make_password(DEFAULT_PASSWORD),
            },
            {
                'sevis_pass_id': 'SEVIS-005',
                'name': 'David Johnson',
                'grade_level': 11,
                'school': 'Madang Secondary School',
                'email': 'david.johnson@example.com',
                'password': make_password(DEFAULT_PASSWORD),
            },
        ]

        created_count = 0
        updated_count = 0

        for student_data in mock_students:
            user, created = User.objects.get_or_create(
                sevis_pass_id=student_data['sevis_pass_id'],
                defaults=student_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {user.name} ({user.sevis_pass_id})')
                )
            else:
                # Update existing user
                for key, value in student_data.items():
                    setattr(user, key, value)
                user.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated: {user.name} ({user.sevis_pass_id})')
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Mock students created/updated: {created_count} created, {updated_count} updated'
        ))
        self.stdout.write(self.style.SUCCESS(f'\n📝 Default password for all accounts: {DEFAULT_PASSWORD}'))
        self.stdout.write(self.style.SUCCESS('\nYou can now login with any of these SevisPass IDs:'))
        for student in mock_students:
            self.stdout.write(f'  - {student["sevis_pass_id"]} ({student["name"]}) - Password: {DEFAULT_PASSWORD}')

