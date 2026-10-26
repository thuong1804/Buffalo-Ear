import { createFileRoute } from "@tanstack/react-router";
import { LearningPage } from "../components/LearningPage";
export const Route = createFileRoute("/")({ component: LearningPage });
