import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    /* -------------------- HTTP Errors -------------------- */

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message?: unknown }).message;

        message =
          typeof msg === 'string' || Array.isArray(msg)
            ? msg
            : exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      /* -------------------- Prisma Errors -------------------- */
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
    } else if (exception instanceof Error) {
      /* -------------------- Unknown Errors -------------------- */
      message = exception.message;
    }

    /* -------------------- Logging -------------------- */

    this.logger.error('Unhandled Exception', {
      path: request.url,
      method: request.method,
      status,
      message,
      stack:
        !isProduction && exception instanceof Error
          ? exception.stack
          : undefined,
    });

    /* -------------------- Response -------------------- */

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (error.code) {
      case 'P2002':
        return 'Unique constraint failed';
      case 'P2025':
        return 'Record not found';
      default:
        return 'Database error';
    }
  }
}
