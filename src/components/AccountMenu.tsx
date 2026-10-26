import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";
import { useLearning } from "../hooks/useLearning";
import { useQueryClient } from "@tanstack/react-query";
export function AccountMenu() {
  const { t } = useTranslation();

  const { account, busy } = useLearning();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (!account)
    return (
      <Link
        to="/login"
        data-testid="account-link"
        className="text-base font-semibold whitespace-nowrap text-ink no-underline underline-offset-4 hover:underline"
      >
        {t("common:login")}
      </Link>
    );
  return (
    <div
      data-testid="account-menu"
      className="flex max-w-full flex-wrap items-center gap-3 text-base"
    >
      <div className="flex min-w-0 items-center gap-2">
        <img
          data-testid="account-avatar"
          className="size-8 shrink-0 rounded-full border border-line bg-surface object-cover"
          src={
            account.image && failedImage !== account.image
              ? account.image
              : "/avatar-default.svg"
          }
          alt=""
          width={32}
          height={32}
          referrerPolicy="no-referrer"
          ref={(image) => {
            if (image?.complete && image.naturalWidth === 0 && account.image) {
              setFailedImage(account.image);
            }
          }}
          onError={() => setFailedImage(account.image ?? null)}
        />
        <span
          data-testid="account-name"
          className="max-w-30 truncate max-[768px]:max-w-20"
          title={account.email}
        >
          {account.name}
        </span>
      </div>
      <button
        data-testid="text-button"
        className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
        disabled={busy || pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error(result.error.message);
            await router.invalidate();
            queryClient.removeQueries({
              queryKey: ["learning"],
              type: "inactive",
            });
            await navigate({ to: "/" });
          } catch {
            setError("errors:logout");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? t("auth:loggingOut") : t("auth:logout")}
      </button>
      {error && <span role="alert">{t(error)}</span>}
    </div>
  );
}
