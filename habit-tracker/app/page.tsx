"use client";

import { useEffect, useState } from "react";

type Habit = {
  id: string;
  name: string;
  done: string[]; // dates as YYYY-MM-DD
};

const STORAGE_KEY = "habits-v1";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDays(n: number): Date[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return d;
  });
}

// Consecutive days completed, counting back from today.
// If today isn't done yet, the streak counts back from yesterday.
function currentStreak(done: string[]): number {
  const set = new Set(done);
  const d = new Date();
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHabits(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch {}
  }, [habits, loaded]);

  const days = lastNDays(7);

  function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setHabits((h) => [...h, { id: crypto.randomUUID(), name: trimmed, done: [] }]);
    setName("");
  }

  function toggle(id: string, key: string) {
    setHabits((hs) =>
      hs.map((h) =>
        h.id !== id
          ? h
          : {
              ...h,
              done: h.done.includes(key)
                ? h.done.filter((d) => d !== key)
                : [...h.done, key],
            }
      )
    );
  }

  function remove(id: string) {
    setHabits((hs) => hs.filter((h) => h.id !== id));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Habit Tracker</h1>
      <p className="mt-1 text-sm text-gray-500">Tick a box for each day you did the thing.</p>

      <form onSubmit={addHabit} className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit, e.g. Read 20 pages"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-black"
          aria-label="New habit name"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Add
        </button>
      </form>

      {loaded && habits.length === 0 && (
        <p className="mt-10 text-center text-gray-500">No habits yet. Add one above.</p>
      )}

      {habits.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium">Habit</th>
                {days.map((d) => (
                  <th key={dateKey(d)} className="w-10 text-center font-normal text-gray-500">
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                    <div className="text-xs">{d.getDate()}</div>
                  </th>
                ))}
                <th className="w-16 text-center font-medium">Streak</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => (
                <tr key={h.id} className="border-t border-gray-200">
                  <td className="py-3 pr-2">{h.name}</td>
                  {days.map((d) => {
                    const key = dateKey(d);
                    return (
                      <td key={key} className="text-center">
                        <input
                          type="checkbox"
                          checked={h.done.includes(key)}
                          onChange={() => toggle(h.id, key)}
                          aria-label={`${h.name} on ${key}`}
                          className="h-5 w-5 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                  <td className="text-center font-semibold">{currentStreak(h.done)}🔥</td>
                  <td className="text-center">
                    <button
                      onClick={() => remove(h.id)}
                      aria-label={`Delete ${h.name}`}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
