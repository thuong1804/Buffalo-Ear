import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";
import { useLearning } from "../hooks/useLearning";
export function Login() {
    const { t } = useTranslation();

    const { account, configured, googleEnabled } = useLearning();
    const [register, setRegister] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const navigate = useNavigate();
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email")).trim();
        const password = String(form.get("password"));
        setPending(true);
        setError("");
        try {
            const response = register
                ? await authClient.signUp.email({
                      name: String(form.get("name")).trim(),
                      email,
                      password,
                  })
                : await authClient.signIn.email({ email, password });
            if (response.error) {
                setError(register ? "errors:signup" : "errors:login");
                return;
            }
            await router.invalidate();
            await navigate({ to: "/" });
        } catch {
            setError("errors:connection");
        } finally {
            setPending(false);
        }
    }
    if (account)
        return (
            <section
                data-testid="auth-panel"
                className="mx-auto my-9 max-w-[480px] min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel max-[768px]:p-5.5 min-[901px]:p-8 min-[1500px]:p-8 [&>h1]:my-3 [&>h1]:text-3xl [&>h1]:font-semibold [&>h1]:tracking-[-0.025em] [&>p]:mb-6 [&>p]:leading-[1.7]"
            >
                <h1>{t("auth:alreadyLoggedIn")}</h1>
                <Link to="/">{t("auth:continue")}</Link>
            </section>
        );
    return (
        <section
            data-testid="auth-panel"
            className="mx-auto my-9 max-w-[480px] min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel max-[768px]:p-5.5 min-[901px]:p-8 min-[1500px]:p-8 [&>h1]:my-3 [&>h1]:text-3xl [&>h1]:font-semibold [&>h1]:tracking-[-0.025em] [&>p]:mb-6 [&>p]:leading-[1.7]"
            aria-labelledby="auth-title"
        >
            <span
                data-testid="eyebrow"
                className="flex flex-wrap items-center gap-2 text-base leading-relaxed font-normal tracking-normal text-muted"
            >
                {t("auth:eyebrow")}
            </span>
            <h1 id="auth-title">{register ? t("auth:createAccount") : t("auth:welcome")}</h1>
            <p>{t("auth:description")}</p>
            <div
                data-testid="segmented"
                className="mt-6 mb-5 flex flex-wrap gap-1 rounded-[9px] bg-background p-1.5 [&_button_span]:rounded-sm [&_button_span]:bg-surface [&_button_span]:px-1 [&_button_span]:py-px [&_button_span]:text-base [&_button:first-child]:grow-[1.1]"
                aria-label={t("auth:method")}
            >
                <button
                    aria-pressed={!register}
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1.5 text-base whitespace-nowrap text-muted hover:bg-soft aria-pressed:bg-background aria-pressed:font-medium aria-pressed:text-ink aria-pressed:shadow-sm max-[600px]:basis-0 max-[600px]:px-0.5"
                    disabled={pending}
                    onClick={() => {
                        setRegister(false);
                        setError("");
                    }}
                >
                    {t("common:login")}
                </button>
                <button
                    aria-pressed={register}
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1.5 text-base whitespace-nowrap text-muted hover:bg-soft aria-pressed:bg-background aria-pressed:font-medium aria-pressed:text-ink aria-pressed:shadow-sm max-[600px]:basis-0 max-[600px]:px-0.5"
                    disabled={pending}
                    onClick={() => {
                        setRegister(true);
                        setError("");
                    }}
                >
                    {t("auth:register")}
                </button>
            </div>
            {!configured && <p role="status">{t("auth:unavailable")}</p>}
            <form
                onSubmit={submit}
                data-testid="auth-form"
                className="mb-6 grid gap-5 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-background [&_input]:p-3 [&_input]:text-base [&_input]:text-ink [&>label]:grid [&>label]:gap-2.5 [&>small]:text-base"
            >
                {register && (
                    <label>
                        {t("auth:name")}
                        <input
                            name="name"
                            autoComplete="name"
                            required
                            maxLength={100}
                            disabled={!configured || pending}
                        />
                    </label>
                )}
                <label>
                    Email
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        disabled={!configured || pending}
                    />
                </label>
                <label>
                    {t("auth:password")}
                    <input
                        type="password"
                        name="password"
                        autoComplete={register ? "new-password" : "current-password"}
                        required
                        minLength={8}
                        maxLength={128}
                        disabled={!configured || pending}
                    />
                </label>
                {register && <small>{t("auth:passwordHint")}</small>}
                {error && (
                    <p
                        data-testid="audio-error"
                        className="rounded-lg border border-error bg-error-soft p-3 text-base text-error"
                        role="alert"
                    >
                        {t(error)}
                    </p>
                )}
                <button
                    data-testid="next-button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-primary px-4 py-2.5 text-base font-medium text-background hover:bg-ink"
                    disabled={!configured || pending}
                >
                    {pending
                        ? t("auth:pending")
                        : register
                          ? t("auth:createAccount")
                          : t("auth:emailLogin")}
                </button>
            </form>
            {googleEnabled && (
                <button
                    data-testid="secondary-button"
                    className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-background px-4 py-2.5 text-base font-medium text-primary-ink hover:bg-surface max-[600px]:w-full"
                    disabled={pending}
                    onClick={async () => {
                        setPending(true);
                        setError("");
                        try {
                            const response = await authClient.signIn.social({
                                provider: "google",
                                callbackURL: "/",
                            });
                            if (response.error) throw new Error();
                        } catch {
                            setError("errors:google");
                            setPending(false);
                        }
                    }}
                >
                    {t("auth:google")}
                </button>
            )}
            <Link
                to="/"
                data-testid="text-button"
                className="inline-flex min-h-11 items-center justify-center gap-2 border-0 bg-transparent px-1 py-1.5 text-base font-normal whitespace-nowrap text-muted hover:text-primary-ink"
            >
                {t("auth:guest")}
            </Link>
        </section>
    );
}
