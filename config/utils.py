import boto3
from django.conf import settings
import uuid

def upload_to_spaces(file, folder="chat"):
    session = boto3.session.Session()
    client = session.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    # Unique filename
    filename = f"{folder}/{uuid.uuid4()}-{file.name}"

    client.upload_fileobj(
        file,
        settings.AWS_STORAGE_BUCKET_NAME,
        filename,
        ExtraArgs={"ACL": "public-read"}
    )

    return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{filename}"
