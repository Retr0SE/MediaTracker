import os 
from rest_framework import serializers

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png',],
    'image/gif': ['.gif'],
    'apllication/pdf': ['.pdf']
}

def validate_uploaded_file(file):
    if file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError('The file is too large (maximum 5 MB)')

    ext = os.path.splitext(file.name)[1].lower()
    allowed_extensions = ALLOWED_FILE_TYPES.get(file.content_type)
    if not allowed_extensions or ext not in allowed_extensions:
        raise serializers.ValidationError('Unsupported file type.')
    return file