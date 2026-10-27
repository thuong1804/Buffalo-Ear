import { createFileRoute } from "@tanstack/react-router";
import { Dialogues } from "../components/Dialogues";

export const Route = createFileRoute("/dialogues")({ component: Dialogues });
