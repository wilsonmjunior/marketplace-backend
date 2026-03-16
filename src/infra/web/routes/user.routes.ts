import { FastifyInstance } from "fastify";
import { registerSchema } from "./schemas/authentication/register.schema";
import { AuthenticateController } from "../controllers/user/authenticate.controller";
import { RegisterController } from "../controllers/user/register.controller";
import { RefreshTokenController } from "../controllers/user/refresh-token.controller";
import { loginSchema } from "./schemas/authentication/login.schema";
import { refreshTokenSchema } from "./schemas/authentication/refresh-token.schema";
import { UpdateUserDataController } from "../controllers/user/update-user-data.controller";
import { updateUserDataSchema } from "./schemas/authentication/update-user-data.schema";
import { CheckAuthtenticationMiddleware } from "../middlewares/check-authentication";
import { uploadUserAvatarSchema } from "./schemas/authentication/upload-user-avatar.schema";
import { UploadUserAvatarController } from "../controllers/user/upload-user-avatar.controller";

export const configure = (fastify: FastifyInstance) => {
  /** Cast para evitar erro de tipagem do Fastify 5 (route espera 0 args na definição). */
  const route = (fastify as FastifyInstance & { route(opts: object): void }).route.bind(fastify);

  const authenticateController = new AuthenticateController();
  const registerController = new RegisterController();
  const refreshTokenController = new RefreshTokenController();
  const updateUserData = new UpdateUserDataController();
  const uploadImageController = new UploadUserAvatarController();
  const checkAuthenticated = new CheckAuthtenticationMiddleware();

  route({
    url: "/auth/register",
    method: "post",
    handler: registerController.execute,
    schema: registerSchema,
  });

  route({
    url: "/auth/login",
    method: "post",
    handler: authenticateController.execute,
    schema: loginSchema,
  });

  route({
    url: "/auth/refresh",
    method: "post",
    handler: refreshTokenController.execute,
    schema: refreshTokenSchema,
  });

  route({
    url: "/user",
    method: "put",
    handler: updateUserData.execute,
    preHandler: [checkAuthenticated.execute],
    schema: updateUserDataSchema,
  });

  route({
    url: "/user/avatar",
    method: "post",
    handler: uploadImageController.execute,
    preHandler: [checkAuthenticated.execute],
    schema: uploadUserAvatarSchema,
  });
};
