import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "warn students about approaching deadlines",
  { hours: 1 },
  internal.deadlines.notifyApproachingDeadlines,
);

export default crons;
