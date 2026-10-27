import { createFileRoute } from "@tanstack/react-router";
import { Tenses } from "../components/Tenses";

export const Route = createFileRoute("/tenses")({ component: Tenses });
