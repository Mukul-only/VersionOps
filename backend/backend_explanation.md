# Backend Project Structure and API Documentation

This document provides a comprehensive overview of the backend project structure, database schema, and API endpoints. It is intended to assist in integrating the backend with a frontend application.

## Project Overview

The backend is built using **NestJS** and uses **Prisma** as the ORM with a **PostgreSQL** database.

### Root Directory Structure

- `src/`: Contains the source code of the application.
- `prisma/`: Contains the Prisma schema and migration files.
- `test/`: Contains test files.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

### Source Code Structure (`src/`)

- `main.ts`: Entry point of the application. Configures global pipes, filters, versioning, and CORS.
- `app.module.ts`: Root module of the application.
- `common/`: Shared resources like DTOs, filters, and decorators.
- `config/`: Configuration service.
- `logger/`: Custom logger service.
- `prisma/`: Prisma service for database connection.
- `modules/`: Feature modules of the application.

## Database Schema

The database schema is defined in `prisma/schema.prisma`.

### Enums

- **Year**: `ONE`, `TWO`
- **Position**: `FIRST`, `SECOND`, `THIRD`
- **FestStatus**: `REGISTERED`, `CHECKED_IN`, `NO_SHOW`

### Models

#### College (`colleges`)
- `id`: Int (PK, Auto-increment)
- `code`: String (Unique, VarChar(10))
- `name`: String (VarChar(255))
- `createdAt`: DateTime
- **Relations**: `participants`, `score`

#### Participant (`participants`)
- `id`: Int (PK, Auto-increment)
- `participantId`: String (Unique, VarChar(50)) - Readable ID (e.g., ABC-1-001)
- `name`: String (VarChar(255))
- `collegeId`: Int (FK)
- `email`: String (Unique, VarChar(255))
- `year`: Year (Enum)
- `festStatus`: FestStatus (Enum, Default: REGISTERED)
- `hackerearthUser`: String? (Unique, VarChar(100))
- `phone`: String? (VarChar(20))
- `createdAt`: DateTime
- **Relations**: `college`, `participations`, `results`

#### Event (`events`)
- `id`: Int (PK, Auto-increment)
- `name`: String (Unique, VarChar(255))
- `teamSize`: Int (Default: 1)
- `participationPoints`: Int (Default: 0)
- `firstPrizePoints`: Int (Default: 0)
- `secondPrizePoints`: Int (Default: 0)
- `thirdPrizePoints`: Int (Default: 0)
- `createdAt`: DateTime
- **Relations**: `participations`, `results`

#### EventParticipation (`event_participations`)
- `id`: Int (PK, Auto-increment)
- `eventId`: Int (FK)
- `participantId`: Int (FK)
- `dummyId`: String? (VarChar(50)) - Dummy ID like AC-001
- `teamId`: String? (VarChar(50)) - Team grouping identifier
- `createdAt`: DateTime
- **Constraints**: Unique([eventId, participantId]), Unique([eventId, dummyId])
- **Relations**: `event`, `participant`

#### EventResult (`event_results`)
- `id`: Int (PK, Auto-increment)
- `eventId`: Int (FK)
- `participantId`: Int (FK)
- `position`: Position (Enum)
- `createdAt`: DateTime
- **Constraints**: Unique([eventId, participantId])
- **Relations**: `event`, `participant`

#### CollegeScore (`college_scores`)
- `collegeId`: Int (PK, FK)
- `totalPoints`: Int (Default: 0)
- `firstPrizes`: Int (Default: 0)
- `secondPrizes`: Int (Default: 0)
- `thirdPrizes`: Int (Default: 0)
- `updatedAt`: DateTime
- **Relations**: `college`

## API Endpoints

The API is versioned (URI versioning) and prefixed with `/api`.
**Base URL**: `http://localhost:<PORT>/api/v1`

### Common Query Parameters (`QueryOptionsDto`)

Most `GET` endpoints support the following query parameters for pagination, sorting, and filtering:

- `skip`: Number (Default: 0) - Number of records to skip.
- `take`: Number (Default: 20) - Number of records to take.
- `search`: String - Search term.
- `sortBy`: String (Default: 'createdAt') - Field to sort by.
- `order`: 'asc' | 'desc' (Default: 'desc') - Sort order.
- `filters`: String (JSON) - Filters.
- `includeRelations`: Boolean (Default: false) - Whether to include related entities.

### Modules

#### 1. Events (`/events`)

- **GET** `/events`
  - Description: Get all events.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedEventResponse`
    ```typescript
    {
      items: [
        {
          id: number;
          name: string;
          teamSize: number;
          participationPoints: number;
          firstPrizePoints: number;
          secondPrizePoints: number;
          thirdPrizePoints: number;
          participations?: EventParticipation[];
          results?: EventResult[];
          createdAt: string;
        }
      ];
      total: number;
    }
    ```

- **GET** `/events/:id`
  - Description: Get a single event by ID.
  - Params: `id` (Int)
  - Query: `includeRelations` (string: 'true'/'false')
  - Response: `Event`

- **POST** `/events`
  - Description: Create a new event.
  - Body: `CreateEventDto`
    ```typescript
    {
      name: string;
      teamSize?: number; // Min: 1
      participationPoints?: number; // Min: 0
      firstPrizePoints?: number; // Min: 0
      secondPrizePoints?: number; // Min: 0
      thirdPrizePoints?: number; // Min: 0
    }
    ```

- **PATCH** `/events/:id`
  - Description: Update an event.
  - Params: `id` (Int)
  - Body: `UpdateEventDto` (Partial `CreateEventDto`)

- **DELETE** `/events/:id`
  - Description: Delete an event.
  - Params: `id` (Int)

- **GET** `/events/:id/participants`
  - Description: Get participants for a specific event.
  - Params: `id` (Int)
  - Query: `QueryOptionsDto`
  - Response: `PaginatedParticipantResponse`

#### 2. Colleges (`/colleges`)

- **GET** `/colleges`
  - Description: Get all colleges.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedCollegeResponse`
    ```typescript
    {
      items: [
        {
          id: number;
          code: string;
          name: string;
          score?: CollegeScore | null;
          participants?: Participant[];
          createdAt?: Date;
          participantCount?: number;
        }
      ];
      total: number;
    }
    ```

- **GET** `/colleges/:id`
  - Description: Get a single college by ID.
  - Params: `id` (Int)
  - Query: `includeRelations` (string: 'true'/'false')
  - Response: `CollegeResponse`

- **POST** `/colleges`
  - Description: Create a new college.
  - Body: `CreateCollegeDto`
    ```typescript
    {
      code: string; // MaxLength: 10
      name: string; // MaxLength: 255
    }
    ```

- **PATCH** `/colleges/:id`
  - Description: Update a college.
  - Params: `id` (Int)
  - Body: `UpdateCollegeDto` (Partial `CreateCollegeDto`, `code` omitted)

- **DELETE** `/colleges/:id`
  - Description: Delete a college.
  - Params: `id` (Int)

#### 3. Participants (`/participants`)

- **GET** `/participants`
  - Description: Get all participants.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedParticipantResponse`
    ```typescript
    {
      items: [
        {
          id: number;
          participantId: string;
          name: string;
          college: CollegeResponse;
          year: Year;
          email: string;
          festStatus: FestStatus;
          hackerearthUser?: string;
          phone?: string;
          participations?: EventParticipation[];
          results?: EventResult[];
          createdAt: string;
        }
      ];
      total: number;
    }
    ```

- **GET** `/participants/:id`
  - Description: Get a single participant by ID.
  - Params: `id` (Int)
  - Query: `includeRelations` (string: 'true'/'false')
  - Response: `ParticipantResponse`

- **POST** `/participants`
  - Description: Create a new participant.
  - Body: `CreateParticipantDto`
    ```typescript
    {
      name: string; // MaxLength: 255
      year: Year; // Enum: ONE, TWO
      email: string; // MaxLength: 255, Email
      hackerearthUser?: string; // MaxLength: 100
      phone?: string; // MaxLength: 20
      collegeId: number;
    }
    ```

- **PATCH** `/participants/:id`
  - Description: Update a participant.
  - Params: `id` (Int)
  - Body: `UpdateParticipantDto` (Partial `CreateParticipantDto`)

- **DELETE** `/participants/:id`
  - Description: Delete a participant.
  - Params: `id` (Int)

- **POST** `/participants/bulk-import`
  - Description: Bulk import participants.
  - Body: `BulkParticipantInput[]`
    ```typescript
    [
      {
        name: string;
        email: string;
        collegeCode: string;
        year: Year;
        hackerearthUser?: string;
        phone?: string;
      }
    ]
    ```

- **POST** `/participants/:id/check-in`
  - Description: Check-in a participant.
  - Params: `id` (Int)

#### 4. Event Participations (`/event-participations`)

- **GET** `/event-participations`
  - Description: Get all event participations.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedEventParticipationResponse`
    ```typescript
    {
      items: [
        {
          id: number;
          eventId: number;
          participantId: number;
          dummyId?: string;
          teamId?: string;
          event?: Event;
          participant?: Participant;
          createdAt: string;
        }
      ];
      total: number;
    }
    ```

- **GET** `/event-participations/:id`
  - Description: Get a single event participation by ID.
  - Params: `id` (Int)
  - Query: `includeRelations` (string: 'true'/'false')
  - Response: `EventParticipation`

- **POST** `/event-participations`
  - Description: Create a new event participation.
  - Body: `CreateEventParticipationDto`
    ```typescript
    {
      eventId: number;
      participantId: number;
      dummyId?: string;
      teamId?: string;
    }
    ```

- **PATCH** `/event-participations/:id`
  - Description: Update an event participation.
  - Params: `id` (Int)
  - Body: `UpdateEventParticipationDto` (Partial `CreateEventParticipationDto`)

- **DELETE** `/event-participations/:id`
  - Description: Delete an event participation.
  - Params: `id` (Int)

- **POST** `/event-participations/bulk-copy`
  - Description: Bulk copy participants to an event.
  - Body: `BulkCopyParticipantsDto`
    ```typescript
    {
      fromEventId: number;
      toEventId: number;
      participantIds?: number[]; // Optional, if empty copies all
    }
    ```

#### 5. Event Results (`/event-results`)

- **GET** `/event-results`
  - Description: Get all event results.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedEventResultResponse`
    ```typescript
    {
      items: [
        {
          id: number;
          eventId: number;
          participantId: number;
          event?: Event;
          participant?: Participant;
          position: Position;
          createdAt: string;
        }
      ];
      total: number;
    }
    ```

- **GET** `/event-results/:id`
  - Description: Get a single event result by ID.
  - Params: `id` (Int)
  - Query: `includeRelations` (string: 'true'/'false')
  - Response: `EventResult`

- **POST** `/event-results`
  - Description: Create a new event result.
  - Body: `CreateEventResultDto`
    ```typescript
    {
      eventId: number;
      participantId: number;
      position: Position; // Enum: FIRST, SECOND, THIRD
    }
    ```

- **PATCH** `/event-results/:id`
  - Description: Update an event result.
  - Params: `id` (Int)
  - Body: `UpdateEventResultDto` (Partial `CreateEventResultDto`)

- **DELETE** `/event-results/:id`
  - Description: Delete an event result.
  - Params: `id` (Int)

#### 6. Leaderboard (`/leaderboard`)

- **GET** `/leaderboard`
  - Description: Get the leaderboard.
  - Query: `QueryOptionsDto`
  - Response: `PaginatedLeaderboardResponse`
    ```typescript
    {
      items: [
        {
          collegeId: number;
          college?: College;
          totalPoints: number;
          firstPrizes: number;
          secondPrizes: number;
          thirdPrizes: number;
          updatedAt: string;
        }
      ];
      total: number;
    }
    ```

- **POST** `/leaderboard/recalculate`
  - Description: Recalculate the leaderboard scores.

#### 7. Health Check (`/`)

- **GET** `/`
  - Description: Returns "Hello World!".

## Integration Notes

- **Base URL**: Ensure all API requests are prefixed with `/api/v1`.
- **CORS**: The backend is configured to allow origins specified in the `ALLOWED_ORIGINS` environment variable.
- **Validation**: The backend uses `class-validator` and `class-transformer` for DTO validation. Invalid requests will return a 400 Bad Request error.
- **Pagination**: Use `skip` and `take` query parameters to handle pagination on the frontend.
- **Relations**: Use `includeRelations=true` query parameter when you need nested data (e.g., fetching a participant with their college details).
