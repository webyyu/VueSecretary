# Voice API Documentation

This document outlines the endpoints for managing voice files in the BckendSecretary application.

## Base URL

```
/api/voice
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### Upload Voice File

Upload an audio file to Tencent Cloud Object Storage (COS) and save the reference in the database.

- **URL:** `/api/voice/upload`
- **Method:** `POST`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`

**Request Body:**

| Field      | Type | Description                    |
|------------|------|--------------------------------|
| audioFile  | File | The audio file to be uploaded  |

**Response:**

```json
{
  "status": "success",
  "data": {
    "fileId": "60f7b0b3a5f9d83e8c8b4568",
    "fileUrl": "https://your-bucket.cos.region.myqcloud.com/voice/1626789043-filename.mp3",
    "fileName": "filename.mp3",
    "fileSize": 1024000,
    "message": "File uploaded successfully"
  }
}
```

**Error Responses:**

- 400 Bad Request: No file uploaded or invalid file
- 401 Unauthorized: Missing or invalid authentication
- 500 Internal Server Error: Server-side error

### Get All Voice Files

Retrieve all voice files for the authenticated user.

- **URL:** `/api/voice`
- **Method:** `GET`
- **Auth Required:** Yes

**Response:**

```json
{
  "status": "success",
  "data": {
    "voices": [
      {
        "_id": "60f7b0b3a5f9d83e8c8b4568",
        "userId": "60f7b0b3a5f9d83e8c8b4567",
        "fileName": "filename.mp3",
        "fileUrl": "https://your-bucket.cos.region.myqcloud.com/voice/1626789043-filename.mp3",
        "fileSize": 1024000,
        "cosKey": "voice/1626789043-filename.mp3",
        "createdAt": "2023-07-20T12:30:43.000Z"
      },
      // More voice files...
    ]
  }
}
```

**Error Responses:**

- 401 Unauthorized: Missing or invalid authentication
- 500 Internal Server Error: Server-side error

### Get Voice File by ID

Retrieve a specific voice file by its ID.

- **URL:** `/api/voice/:id`
- **Method:** `GET`
- **Auth Required:** Yes
- **URL Parameters:** `id` - The ID of the voice file

**Response:**

```json
{
  "status": "success",
  "data": {
    "voice": {
      "_id": "60f7b0b3a5f9d83e8c8b4568",
      "userId": "60f7b0b3a5f9d83e8c8b4567",
      "fileName": "filename.mp3",
      "fileUrl": "https://your-bucket.cos.region.myqcloud.com/voice/1626789043-filename.mp3",
      "fileSize": 1024000,
      "cosKey": "voice/1626789043-filename.mp3",
      "createdAt": "2023-07-20T12:30:43.000Z"
    }
  }
}
```

**Error Responses:**

- 400 Bad Request: Invalid ID format
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: User does not own this voice file
- 404 Not Found: Voice file not found
- 500 Internal Server Error: Server-side error

### Delete Voice File

Delete a voice file both from COS storage and the database.

- **URL:** `/api/voice/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **URL Parameters:** `id` - The ID of the voice file to delete

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Voice file deleted successfully"
  }
}
```

**Error Responses:**

- 400 Bad Request: Invalid ID format
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: User does not own this voice file
- 404 Not Found: Voice file not found
- 500 Internal Server Error: Server-side error

## File Constraints

- **Supported Formats:** MP3, WAV, OGG, M4A
- **Max File Size:** 15MB
- **Storage Location:** Files are stored in Tencent Cloud Object Storage

## Terminal Output

All API operations will log details to the terminal for debugging purposes, including:
- Upload attempts
- Upload success/failure
- Database operations
- COS operations
- Authorization checks

## Notes for Frontend Development

1. When uploading files, ensure to use `multipart/form-data` as the Content-Type
2. The field name for the audio file must be `audioFile`
3. Store the returned `fileId` if you need to reference the file later
4. The `fileUrl` can be used directly to play or download the audio 