import { randomUUID } from "node:crypto";
import express, {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import type { ParsedQs } from "qs";

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserBody {
  name: string;
  email: string;
}

interface UserParams {
  userId: string;
}

interface UserQuery extends ParsedQs {
  includeEmail?: string;
}

interface UserResponse {
  data: User | Omit<User, "email">;
  requestId: string;
}

interface UsersResponse {
  data: User[];
  requestId: string;
}

interface ErrorResponse {
  error: string;
  requestId?: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const app = express();
const users: User[] = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com" },
  { id: 2, name: "Grace Hopper", email: "grace@example.com" },
];

const requestIdMiddleware: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

app.use(requestIdMiddleware);
app.use(express.json());

app.get(
  "/api/users",
  (_req: Request, res: Response<UsersResponse>) => {
    res.json({
      data: users,
      requestId: _req.requestId,
    });
  },
);

app.get(
  "/api/users/:userId",
  (
    req: Request<UserParams, UserResponse | ErrorResponse, never, UserQuery>,
    res: Response<UserResponse | ErrorResponse>,
  ) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      res.status(400).json({ error: "userId must be a positive integer", requestId: req.requestId });
      return;
    }

    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      res.status(404).json({ error: "User not found", requestId: req.requestId });
      return;
    }

    if (req.query.includeEmail === "false") {
      const { email: _email, ...publicUser } = user;
      res.json({ data: publicUser, requestId: req.requestId });
      return;
    }

    res.json({ data: user, requestId: req.requestId });
  },
);

const validateCreateUser: RequestHandler<
  Record<string, never>,
  ErrorResponse,
  CreateUserBody
> = (req, res, next) => {
  const { name, email } = req.body;
  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    res.status(400).json({
      error: "Provide a non-empty name and a valid email address",
      requestId: req.requestId,
    });
    return;
  }

  next();
};

app.post(
  "/api/users",
  validateCreateUser,
  (
    req: Request<Record<string, never>, UserResponse | ErrorResponse, CreateUserBody>,
    res: Response<UserResponse | ErrorResponse>,
  ) => {
    const email = req.body.email.trim().toLowerCase();
    if (users.some((user) => user.email === email)) {
      res.status(409).json({ error: "A user with that email already exists", requestId: req.requestId });
      return;
    }

    const user: User = {
      id: Math.max(0, ...users.map((existing) => existing.id)) + 1,
      name: req.body.name.trim(),
      email,
    };
    users.push(user);
    res.status(201).json({ data: user, requestId: req.requestId });
  },
);

const errorHandler: ErrorRequestHandler = (error: Error, req, res, _next) => {
  console.error(`[${req.requestId}] ${error.message}`);
  res.status(500).json({
    error: "An unexpected error occurred",
    requestId: req.requestId,
  });
};

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Typed Express API listening on http://localhost:${port}`);
});
