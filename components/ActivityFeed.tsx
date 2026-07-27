"use client";

import { useMemo, useState } from "react";

type ActivityStatus = "Working" | "Completed" | "Waiting" | "Needs Approval" | "Failed";

type ActivityItem = {
  id: number;
  executive: string;
  symbol: string;
  action: string;
  project: string;
  timestamp: string;
  status: ActivityStatus;
  detail: string;
};

type ActivityFeedProps = {
  activities?: ActivityItem[];
};

const defaultActivities: ActivityItem[] = [
  {
    id: 1,
    executive: "Brayko",
    symbol: "B",
    action: "started building the AI router",
    project: "Core orchestration",
    timestamp: "8 min ago",
    status: "Working",
    detail: "Brayko is wiring the shared AI service layer for multi-provider orchestration and provider routing.",
  },
  {
    id: 2,
    executive: "Lunexa",
    symbol: "L",
    action: "completed the dashboard design",
    project: "Executive experience",
    timestamp: "22 min ago",
    status: "Completed",
    detail: "Lunexa finalized the premium glass-panel visual system and polished the command-center layout.",
  },
  {
    id: 3,
    executive: "Orynth",
    symbol: "O",
    action: "created a new mission",
    project: "Mission Center",
    timestamp: "41 min ago",
    status: "Working",
    detail: "Orynth launched a new mission with milestones, owners, and a boardroom-ready narrative.",
  },
  {
    id: 4,
    executive: "Kavro",
    symbol: "K",
    action: "requested approval for a pricing plan",
    project: "Finance review",
    timestamp: "1 hr ago",
    status: "Needs Approval",
    detail: "Kavro requested a budget and pricing review for the next growth phase before lock-in.",
  },
  {
    id: 5,
    executive: "Vyreel",
    symbol: "V",
    action: "prepared a marketing campaign",
    project: "Launch growth",
    timestamp: "2 hrs ago",
    status: "Waiting",
    detail: "Vyreel prepared the launch narrative and acquisition motion for the upcoming campaign window.",
  },
];

const statusStyles: Record<ActivityStatus, string> = {
  Working: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  Completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Waiting: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "Needs Approval": "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
  Failed: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const filters: Array<"All" | ActivityStatus> = ["All", "Working", "Completed", "Needs Approval"];

export function ActivityFeed({ activities = defaultActivities }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<"All" | ActivityStatus>("All");
  const [selectedId, setSelectedId] = useState<number>(activities[0]?.id ?? 0);

  const filteredActivities = useMemo(() => {
    if (activeFilter === "All") {
      return activities;
    }

    return activities.filter((activity) => activity.status === activeFilter);
  }, [activities, activeFilter]);

  const selectedActivity = filteredActivities.find((item) => item.id === selectedId) ?? filteredActivities[0];

  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Activity Feed</p>
          <h2 className="mt-2 text-xl font-semibold">Recent executive activity</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300">
          {activities.length} events
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setActiveFilter(filter);
              setSelectedId(activities[0]?.id ?? 0);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${activeFilter === filter ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_0.95fr]">
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {filteredActivities.map((activity) => {
            const isSelected = selectedActivity?.id === activity.id;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => setSelectedId(activity.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${isSelected ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-sm font-semibold text-white">
                      {activity.symbol}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">{activity.executive}</div>
                      <div className="text-sm text-zinc-400">{activity.action}</div>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${statusStyles[activity.status]}`}>
                    {activity.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
                  <span>{activity.project}</span>
                  <span>{activity.timestamp}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          {selectedActivity ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">Selected update</div>
                  <div className="mt-2 text-xl font-semibold text-zinc-100">{selectedActivity.executive}</div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${statusStyles[selectedActivity.status]}`}>
                  {selectedActivity.status}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
                <div className="font-medium text-zinc-100">{selectedActivity.project}</div>
                <div className="mt-2">{selectedActivity.detail}</div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.25em]">Action</div>
                  <div className="mt-1 text-zinc-100">{selectedActivity.action}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.25em]">Timestamp</div>
                  <div className="mt-1 text-zinc-100">{selectedActivity.timestamp}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-zinc-400">No activity matches the selected filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}
