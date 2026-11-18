from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from tracker.models import MediaItem, UserMedia

User = get_user_model()

class ProfileStatsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='statsuser',
            password='testpassword123',
            email='stats@kinemio.com'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile_stats_return_200_ok(self):
        url = reverse('profile-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn('stats', data)
        self.assertIn('achievements_data', data)
        self.assertIn('chart_data', data)

    def test_profile_stats_math_logic(self):
        movie = MediaItem.objects.create(
            title="The Matrix",
            media_type="movie",
            release_year="1999",
            runtime=136
        )
        series = MediaItem.objects.create(
            title="Breaking Bad",
            media_type="series",
            seasons='5'
        )

        UserMedia.objects.create(user=self.user, media_item=movie, status='completed', score=10)
        UserMedia.objects.create(user=self.user, media_item=series, status='planned')

        url = reverse('profile-stats')
        response = self.client.get(url)
        data = response.json()

        stats = data['stats']
        achievements = data['achievements_data']

        self.assertEqual(stats['total_saved'], 2)
        self.assertEqual(stats['completed'], 1)

        self.assertEqual(stats['avg_score'], 10.0)
        self.assertEqual(stats['movies_count'], 1)
        self.assertEqual(achievements['planned_count'], 1)
        self.assertEqual(stats['total_minutes'], 136)