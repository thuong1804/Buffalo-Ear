import { createFileRoute } from "@tanstack/react-router";
import { authConfigured, getAuth } from "../../../lib/auth";

async function handle({ request }: { request: Request }) {
  if (!authConfigured())
    return Response.json(
      { message: "Đăng nhập chưa được cấu hình trên máy chủ." },
      { status: 503 },
    );
  return getAuth().handler(request);
}
export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
