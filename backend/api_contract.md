BASE_URL:
http://localhost:<PORT>/api/v1

AUTHENTICATION:

* Mechanism: None (Based on current code analysis)
* Header format: N/A
* Token acquisition endpoint: N/A

GLOBAL ERROR FORMAT:
{
  "success": boolean,
  "statusCode": number,
  "message": string | string[],
  "path": string,
  "timestamp": string
}

ENDPOINTS:

GET /events

Description: Get all events with pagination, search, and sorting

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "name": string,
      "teamSize": number,
      "participationPoints": number,
      "firstPrizePoints": number,
      "secondPrizePoints": number,
      "thirdPrizePoints": number,
      "participations": array (optional),
      "results": array (optional),
      "createdAt": string
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/events",
  "timestamp": string
}

GET /events/:id

Description: Get a single event by ID

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  includeRelations: string (optional, 'true' | 'false')
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "name": string,
  "teamSize": number,
  "participationPoints": number,
  "firstPrizePoints": number,
  "secondPrizePoints": number,
  "thirdPrizePoints": number,
  "participations": array (optional),
  "results": array (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found",
  "path": "/api/v1/events/:id",
  "timestamp": string
}

GET /events/:id/participants

Description: Get participants for a specific event

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string)
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "participantId": string,
      "name": string,
      "email": string,
      "year": string,
      "festStatus": string,
      "hackerearthUser": string (optional),
      "phone": string (optional),
      "college": {
        "id": number,
        "code": string,
        "name": string
      },
      "createdAt": string
    }
  ],
  "total": number
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found",
  "path": "/api/v1/events/:id/participants",
  "timestamp": string
}

POST /events

Description: Create a new event

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "name": string (required),
  "teamSize": number (optional, min: 1),
  "participationPoints": number (optional, min: 0),
  "firstPrizePoints": number (optional, min: 0),
  "secondPrizePoints": number (optional, min: 0),
  "thirdPrizePoints": number (optional, min: 0)
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "id": number,
  "name": string,
  "teamSize": number,
  "participationPoints": number,
  "firstPrizePoints": number,
  "secondPrizePoints": number,
  "thirdPrizePoints": number,
  "createdAt": string
}

Error Responses:
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Event with name \"...\" already exists",
  "path": "/api/v1/events",
  "timestamp": string
}

PATCH /events/:id

Description: Update an existing event

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "name": string (optional),
  "teamSize": number (optional, min: 1),
  "participationPoints": number (optional, min: 0),
  "firstPrizePoints": number (optional, min: 0),
  "secondPrizePoints": number (optional, min: 0),
  "thirdPrizePoints": number (optional, min: 0)
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "name": string,
  "teamSize": number,
  "participationPoints": number,
  "firstPrizePoints": number,
  "secondPrizePoints": number,
  "thirdPrizePoints": number,
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found",
  "path": "/api/v1/events/:id",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Event with name \"...\" already exists",
  "path": "/api/v1/events/:id",
  "timestamp": string
}

DELETE /events/:id

Description: Delete an event

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "success": boolean
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found",
  "path": "/api/v1/events/:id",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Cannot delete event with participations or results",
  "path": "/api/v1/events/:id",
  "timestamp": string
}

GET /colleges

Description: Get all colleges

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "code": string,
      "name": string,
      "score": object (optional),
      "participants": array (optional),
      "createdAt": string,
      "participantCount": number
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/colleges",
  "timestamp": string
}

GET /colleges/:id

Description: Get a single college by ID

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  includeRelations: string (optional, 'true' | 'false')
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "code": string,
  "name": string,
  "score": object (optional),
  "participants": array (optional),
  "createdAt": string,
  "participantCount": number
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "College not found",
  "path": "/api/v1/colleges/:id",
  "timestamp": string
}

POST /colleges

Description: Create a new college

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "code": string (required, max: 10),
  "name": string (required, max: 255)
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "id": number,
  "code": string,
  "name": string,
  "score": null,
  "participantCount": number,
  "createdAt": string
}

Error Responses:
409:
{
  "success": false,
  "statusCode": 409,
  "message": "College code already exists",
  "path": "/api/v1/colleges",
  "timestamp": string
}

PATCH /colleges/:id

Description: Update an existing college

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "name": string (optional, max: 255)
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "code": string,
  "name": string,
  "score": object (optional),
  "participantCount": number,
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "College not found",
  "path": "/api/v1/colleges/:id",
  "timestamp": string
}

DELETE /colleges/:id

Description: Delete a college

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "success": boolean
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "College not found",
  "path": "/api/v1/colleges/:id",
  "timestamp": string
}
400:
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot delete college with registered participants",
  "path": "/api/v1/colleges/:id",
  "timestamp": string
}

GET /participants

Description: Get all participants

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "participantId": string,
      "name": string,
      "email": string,
      "year": string,
      "festStatus": string,
      "hackerearthUser": string (optional),
      "phone": string (optional),
      "college": {
        "id": number,
        "code": string,
        "name": string
      },
      "participations": array (optional),
      "results": array (optional),
      "createdAt": string
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/participants",
  "timestamp": string
}

GET /participants/:id

Description: Get a single participant by ID

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  includeRelations: string (optional, 'true' | 'false')
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "participantId": string,
  "name": string,
  "email": string,
  "year": string,
  "festStatus": string,
  "hackerearthUser": string (optional),
  "phone": string (optional),
  "college": {
    "id": number,
    "code": string,
    "name": string
  },
  "participations": array (optional),
  "results": array (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Participant not found",
  "path": "/api/v1/participants/:id",
  "timestamp": string
}

POST /participants

Description: Create a new participant

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "name": string (required, max: 255),
  "year": string (required, enum: ['ONE', 'TWO', ...]),
  "email": string (required, email),
  "hackerearthUser": string (optional, max: 100),
  "phone": string (optional, max: 20),
  "collegeId": number (required)
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "id": number,
  "participantId": string,
  "name": string,
  "email": string,
  "year": string,
  "festStatus": string,
  "hackerearthUser": string (optional),
  "phone": string (optional),
  "college": {
    "id": number,
    "code": string,
    "name": string
  },
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "College not found",
  "path": "/api/v1/participants",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Email already registered | HackerEarth username already registered | Participant ID collision, try again",
  "path": "/api/v1/participants",
  "timestamp": string
}

POST /participants/bulk-import

Description: Bulk import participants

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
[
  {
    "name": string (required),
    "email": string (required),
    "collegeCode": string (required),
    "year": string (required),
    "hackerearthUser": string (optional),
    "phone": string (optional)
  }
]

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "total": number,
  "inserted": number,
  "failed": number,
  "errors": [
    {
      "index": number,
      "email": string (optional),
      "reason": string
    }
  ]
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/participants/bulk-import",
  "timestamp": string
}

POST /participants/:id/check-in

Description: Check-in a participant for the fest

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 201:
{
  "id": number,
  "participantId": string,
  "name": string,
  "email": string,
  "year": string,
  "festStatus": string,
  "hackerearthUser": string (optional),
  "phone": string (optional),
  "college": {
    "id": number,
    "code": string,
    "name": string
  },
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Participant not found",
  "path": "/api/v1/participants/:id/check-in",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Participant already checked in",
  "path": "/api/v1/participants/:id/check-in",
  "timestamp": string
}

PATCH /participants/:id

Description: Update an existing participant

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "name": string (optional, max: 255),
  "year": string (optional, enum: ['ONE', 'TWO', ...]),
  "email": string (optional, email),
  "hackerearthUser": string (optional, max: 100),
  "phone": string (optional, max: 20),
  "collegeId": number (optional)
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "participantId": string,
  "name": string,
  "email": string,
  "year": string,
  "festStatus": string,
  "hackerearthUser": string (optional),
  "phone": string (optional),
  "college": {
    "id": number,
    "code": string,
    "name": string
  },
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Participant not found",
  "path": "/api/v1/participants/:id",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Email already registered | HackerEarth username already registered | Participant ID already exists",
  "path": "/api/v1/participants/:id",
  "timestamp": string
}

DELETE /participants/:id

Description: Delete a participant

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "success": boolean
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Participant not found",
  "path": "/api/v1/participants/:id",
  "timestamp": string
}

GET /leaderboard

Description: Get the leaderboard

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "collegeId": number,
      "college": object (optional),
      "totalPoints": number,
      "firstPrizes": number,
      "secondPrizes": number,
      "thirdPrizes": number,
      "updatedAt": string
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/leaderboard",
  "timestamp": string
}

POST /leaderboard/recalculate

Description: Recalculate the leaderboard

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "success": boolean
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/leaderboard/recalculate",
  "timestamp": string
}

GET /event-participations

Description: Get all event participations

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "eventId": number,
      "participantId": number,
      "dummyId": string (optional),
      "teamId": string (optional),
      "event": object (optional),
      "participant": object (optional),
      "createdAt": string
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/event-participations",
  "timestamp": string
}

GET /event-participations/:id

Description: Get a single event participation by ID

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  includeRelations: string (optional, 'true' | 'false')
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "dummyId": string (optional),
  "teamId": string (optional),
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event participation not found",
  "path": "/api/v1/event-participations/:id",
  "timestamp": string
}

POST /event-participations

Description: Create a new event participation

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "eventId": number (required),
  "participantId": number (required),
  "dummyId": string (optional),
  "teamId": string (optional)
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "dummyId": string (optional),
  "teamId": string (optional),
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found | Participant not found",
  "path": "/api/v1/event-participations",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Participant already registered for this event | Dummy ID already used in this event | Team already has maximum allowed members",
  "path": "/api/v1/event-participations",
  "timestamp": string
}

POST /event-participations/bulk-copy

Description: Bulk copy participants from one event to another

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "fromEventId": number (required),
  "toEventId": number (required),
  "participantIds": array (optional, numbers)
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "copied": number
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Source event not found | Target event not found",
  "path": "/api/v1/event-participations/bulk-copy",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Source and target events cannot be same",
  "path": "/api/v1/event-participations/bulk-copy",
  "timestamp": string
}

PATCH /event-participations/:id

Description: Update an existing event participation

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "eventId": number (optional),
  "participantId": number (optional),
  "dummyId": string (optional),
  "teamId": string (optional)
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "dummyId": string (optional),
  "teamId": string (optional),
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event participation not found | Event not found | Participant not found",
  "path": "/api/v1/event-participations/:id",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Participant already registered for this event | Dummy ID already used in this event | Team already has maximum allowed members",
  "path": "/api/v1/event-participations/:id",
  "timestamp": string
}

DELETE /event-participations/:id

Description: Delete an event participation

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "success": boolean
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event participation not found",
  "path": "/api/v1/event-participations/:id",
  "timestamp": string
}

GET /event-results

Description: Get all event results

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  skip: number (optional, default: 0),
  take: number (optional, default: 20),
  search: string (optional),
  sortBy: string (optional, default: 'createdAt'),
  order: string (optional, 'asc' | 'desc', default: 'desc'),
  filters: string (optional, JSON string),
  includeRelations: boolean (optional, default: false)
}

Path Parameters:
{
}

Success Response 200:
{
  "items": [
    {
      "id": number,
      "eventId": number,
      "participantId": number,
      "position": string,
      "event": object (optional),
      "participant": object (optional),
      "createdAt": string
    }
  ],
  "total": number
}

Error Responses:
500:
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/event-results",
  "timestamp": string
}

GET /event-results/:id

Description: Get a single event result by ID

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
  includeRelations: string (optional, 'true' | 'false')
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "position": string,
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event result not found",
  "path": "/api/v1/event-results/:id",
  "timestamp": string
}

POST /event-results

Description: Create a new event result

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "eventId": number (required),
  "participantId": number (required),
  "position": string (required, enum: ['FIRST', 'SECOND', 'THIRD'])
}

Query Parameters:
{
}

Path Parameters:
{
}

Success Response 201:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "position": string,
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found | Participant not found",
  "path": "/api/v1/event-results",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Participant is not registered in this event | Result already exists for this participant in this event",
  "path": "/api/v1/event-results",
  "timestamp": string
}

PATCH /event-results/:id

Description: Update an existing event result

Request Headers:
{
  "Content-Type": "application/json"
}

Request Body:
{
  "eventId": number (optional),
  "participantId": number (optional),
  "position": string (optional, enum: ['FIRST', 'SECOND', 'THIRD'])
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "id": number,
  "eventId": number,
  "participantId": number,
  "position": string,
  "event": object (optional),
  "participant": object (optional),
  "createdAt": string
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event result not found | Event not found | Participant not found",
  "path": "/api/v1/event-results/:id",
  "timestamp": string
}
409:
{
  "success": false,
  "statusCode": 409,
  "message": "Participant is not registered in this event | Another result already exists for this participant in this event",
  "path": "/api/v1/event-results/:id",
  "timestamp": string
}

DELETE /event-results/:id

Description: Delete an event result

Request Headers:
{
}

Request Body:
{
}

Query Parameters:
{
}

Path Parameters:
{
  id: number
}

Success Response 200:
{
  "success": boolean
}

Error Responses:
404:
{
  "success": false,
  "statusCode": 404,
  "message": "Event result not found",
  "path": "/api/v1/event-results/:id",
  "timestamp": string
}
