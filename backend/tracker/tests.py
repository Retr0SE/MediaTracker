from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import MediaItem, UserMedia

User = get_user_model()

class TrackerAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='tracker_user',
            password='testpassword123' 
        )
        self.client.force_authenticate(user=self.user)
        self.movie = MediaItem.objects.create(
            title='Interception',
            media_type="movie"
        )
        self.user_media = UserMedia.objects.create(
            user=self.user,
            media_item=self.movie,
            status="planned"
        )

    def test_update_media_status_and_score(self):
        url = reverse('media-update', args=[self.user_media.id])
        payload = {
            'status': 'completed',
            'score': 10
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.user_media.refresh_from_db()
        self.assertEqual(self.user_media.status, 'completed')
        self.assertEqual(self.user_media.score, 10)

    def test_delete_media_removes_record_from_db(self):
        url = reverse('media-delete', args=[self.user_media.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(UserMedia.objects.count(), 0)
        self.assertEqual(MediaItem.objects.count(), 1)