import { FastifyInstance } from "fastify";
import { AppError } from "../../../shared/errors/app.error";
import { HttpError } from "../../../shared/errors/http.error";
import { BusinessError } from "../../../shared/errors/business.error";
import { UnauthenticatedError } from "../../../shared/errors/unauthenticated.error";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { UnprocessedEntityError } from "../../../shared/errors/unprocessed-entity.error";
import { NotFoundError } from "../../../shared/errors/not-found.error";
import { DatabaseError } from "../../../shared/errors/database.error";
import { JWTError } from "../../../shared/errors/jwt.error";

type ErrorHandlerError = Error & {
  statusCode?: number;
  validation?: Array<{ message: string }>;
};

/** Interface mínima para o reply do Fastify (evita dependência dos tipos do fastify na build). */
interface ReplyWithStatus {
  status(code: number): { send(body: object): unknown };
}

/** Envia resposta HTTP; usa cast explícito para evitar erro de tipo em builds (ex.: Vercel). */
function sendReply(replyParam: unknown, code: number, body: object): void {
  (replyParam as ReplyWithStatus).status(code).send(body);
}

type FastifyWithErrorHandler = FastifyInstance & {
  setErrorHandler: (handler: (error: ErrorHandlerError, request: unknown, reply: unknown) => void | Promise<void>) => void;
};

export const configure = (fastify: FastifyInstance) => {
  (fastify as FastifyWithErrorHandler).setErrorHandler((error: ErrorHandlerError, _request: unknown, replyParam: unknown) => {
    if (
      (error instanceof AppError && error.getShouldPrintInConsole()) ||
      !(error instanceof AppError)
    ) {
      console.error("", error);
    }

    if (error instanceof HttpError) {
      return sendReply(replyParam, error.getStatusCode(), { message: error.message });
    }

    if (error instanceof BusinessError) {
      return sendReply(replyParam, 400, {
        message: error.message,
        internalErrorCode: error.getAppInternalCode(),
      });
    }

    if (error instanceof JWTError) {
      return sendReply(replyParam, 401, {
        message: error.message,
        errorType: error.getErrorType(),
        code: "JWT_ERROR",
      });
    }

    if (error instanceof UnauthenticatedError) {
      return sendReply(replyParam, 401, { message: error.message });
    }

    if (error instanceof ForbiddenError) {
      return sendReply(replyParam, 403, { message: error.message });
    }

    if (error instanceof NotFoundError) {
      return sendReply(replyParam, 404, { message: error.message });
    }

    if (error instanceof DatabaseError) {
      return sendReply(replyParam, 500, { message: error.message });
    }

    if (error instanceof UnprocessedEntityError) {
      return sendReply(replyParam, error.getStatusCode(), {
        message: error.message,
        errors: error.getErrors(),
      });
    }

    if (error.validation) {
      const messages = error.validation.map((e) => e.message);
      return sendReply(replyParam, 422, { message: "Validation error", errors: messages });
    }

    if ("statusCode" in error && (error as { statusCode: number }).statusCode === 429) {
      return sendReply(replyParam, 429, { message: error.message });
    }

    return sendReply(replyParam, 500, { message: "Server error." });
  });
};
