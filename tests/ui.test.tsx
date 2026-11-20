// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, renderHook, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import AddSavingsForm from "../src/components/AddSavingsForm";
import LogEntry from "../src/components/LogEntry";
import Celebration from "../src/components/Celebration";
import ProgressBar from "../src/components/ProgressBar";
import Home from "../src/app/page";
import TripDashboard from "../src/app/trip/[tripId]/page";
import { useGoalCelebration } from "../src/lib/useGoalCelebration";
import { splitGoal, validateAmount } from "../src/lib/money";

const mocks = vi.hoisted(() => ({
  auth: { user: { uid: "alice" }, loading: false },
  watchTrip: vi.fn(), watchUserTrips: vi.fn(), watchSavingsLog: vi.fn(), joinTrip: vi.fn(),
}));
vi.mock("@/components/AuthProvider", () => ({ useAuth: () => mocks.auth, SignInPrompt: () => <p>Sign in prompt</p> }));
vi.mock("@/lib/firebase", () => ({ ...mocks, addSavingsEntry: vi.fn(), updateSavingsEntry: vi.fn(), deleteSavingsEntry: vi.fn() }));
const animations = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock("animejs", () => ({ default: Object.assign(animations.animate, { remove: vi.fn(), stagger: vi.fn(), random: vi.fn() }) }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.auth = { user: { uid: "alice" }, loading: false };
  mocks.joinTrip.mockResolvedValue(undefined);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("savings controls", () => {
  it("keeps a failed addition editable and allows retry", async () => {
    const onAdd = vi.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);
    render(<AddSavingsForm onAdd={onAdd} />);
    fireEvent.change(screen.getByLabelText("Amount saved in rupees"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(screen.getByLabelText("Amount saved in rupees")).toHaveValue(100);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(screen.getByLabelText("Amount saved in rupees")).toHaveValue(null));
    expect(onAdd).toHaveBeenCalledTimes(2);
  });
  it("recovers from edit and delete failures", async () => {
    vi.stubGlobal("confirm", () => true);
    const onSave = vi.fn().mockRejectedValue(new Error("Cannot save"));
    const onDelete = vi.fn().mockRejectedValue(new Error("Cannot delete"));
    render(<LogEntry entry={{ id: "one", uid: "alice", displayName: "Alice", amount: 100 }} isMine onSave={onSave} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Save"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot save");
    expect(screen.getByText("Save")).toBeEnabled();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Delete"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot delete");
    expect(screen.getByText("Delete")).toBeEnabled();
  });
  it("uses a fresh entry amount when reopening the editor", () => {
    const props = { isMine: true, onSave: vi.fn(), onDelete: vi.fn() };
    const entry = { id: "one", uid: "alice", displayName: "Alice", amount: 100 };
    const view = render(<LogEntry {...props} entry={entry} />);
    view.rerender(<LogEntry {...props} entry={{ ...entry, amount: 250 }} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByLabelText("Edit amount in rupees")).toHaveValue(250);
  });
});

describe("loading, membership and sharing", () => {
  it("waits for auth before subscribing or showing sign-in", () => {
    mocks.auth.loading = true;
    render(<TripDashboard params={{ tripId: "one" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your account");
    expect(mocks.watchTrip).not.toHaveBeenCalled();
    expect(screen.queryByText("Sign in prompt")).not.toBeInTheDocument();
  });
  it("shows missing trips and subscription errors", async () => {
    mocks.watchTrip.mockImplementationOnce((_id, cb) => { cb(null); return vi.fn(); });
    const view = render(<TripDashboard params={{ tripId: "missing" }} />);
    expect(await screen.findByText("Trip not found")).toBeInTheDocument();
    view.unmount();
    mocks.watchTrip.mockImplementationOnce((_id, _cb, error) => { error({ code: "permission-denied" }); return vi.fn(); });
    render(<TripDashboard params={{ tripId: "private" }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("don't have access");
  });
  it("lists every returned trip and displays query errors", async () => {
    mocks.watchUserTrips.mockImplementationOnce((_uid, cb) => { cb([{ id: "one", name: "Goa", goalAmount: 100, mode: "team" }, { id: "two", name: "Solo", goalAmount: 200, mode: "individual" }]); return vi.fn(); });
    const view = render(<Home />);
    expect(await screen.findByRole("link", { name: /Goa/ })).toHaveAttribute("href", "/trip/one");
    expect(screen.getByRole("link", { name: /Solo/ })).toHaveAttribute("href", "/trip/two");
    view.unmount();
    mocks.watchUserTrips.mockImplementationOnce((_uid, _cb, error) => { error(new Error("Network failed")); return vi.fn(); });
    render(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Network failed");
  });
  it("waits for membership before reading logs and offers a failed join retry", async () => {
    mocks.watchTrip.mockImplementationOnce((_id, cb) => { cb({ id: "one", name: "Goa", goalAmount: 100, mode: "team", memberUids: ["bob"], members: { bob: { uid: "bob", totalSaved: 0 } } }); return vi.fn(); });
    mocks.joinTrip.mockRejectedValueOnce(new Error("Join failed"));
    render(<TripDashboard params={{ tripId: "one" }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Join failed");
    expect(mocks.watchSavingsLog).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Try joining again"));
    await waitFor(() => expect(mocks.joinTrip).toHaveBeenCalledTimes(2));
  });
  it("provides a selectable link when sharing and clipboard fail", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new Error("Unavailable")) });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    mocks.watchTrip.mockImplementationOnce((_id, cb) => { cb({ id: "one", name: "Goa", goalAmount: 100, mode: "team", memberUids: ["alice"], members: { alice: { uid: "alice", displayName: "Alice", totalSaved: 0 } } }); return vi.fn(); });
    mocks.watchSavingsLog.mockImplementationOnce((_id, cb) => { cb([]); return vi.fn(); });
    render(<TripDashboard params={{ tripId: "one" }} />);
    fireEvent.click(await screen.findByText("Share invite link"));
    expect(await screen.findByLabelText("Invite link")).toHaveValue(window.location.href);
  });
});

describe("progress and celebration", () => {
  it("ignores an already completed trip and only celebrates a live crossing once", () => {
    const { result, rerender } = renderHook(({ percent }) => useGoalCelebration("one", percent), { initialProps: { percent: 100 } });
    expect(result.current.celebrate).toBe(false);
    rerender({ percent: 90 }); rerender({ percent: 100 });
    expect(result.current.celebrate).toBe(true);
    act(() => result.current.closeCelebration());
    rerender({ percent: 50 }); rerender({ percent: 100 });
    expect(result.current.celebrate).toBe(false);
  });
  it("does not treat initial loading as a zero-percent baseline", () => {
    const { result, rerender } = renderHook(({ percent }: { percent: number | null }) => useGoalCelebration("one", percent), { initialProps: { percent: null } as { percent: number | null } });
    rerender({ percent: 100 });
    expect(result.current.celebrate).toBe(false);
  });
  it("persists celebration per trip and tolerates disabled storage", () => {
    localStorage.setItem("mytripbud:celebrated:v1:one", "true");
    const { result, rerender } = renderHook(({ tripId, percent }) => useGoalCelebration(tripId, percent), { initialProps: { tripId: "one", percent: 50 } });
    rerender({ tripId: "one", percent: 100 });
    expect(result.current.celebrate).toBe(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    rerender({ tripId: "two", percent: 10 }); rerender({ tripId: "two", percent: 100 });
    expect(result.current.celebrate).toBe(true);
  });
  it("opens a native modal, handles Escape, and restores focus", () => {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; };
    const close = vi.fn();
    const opener = document.createElement("button"); document.body.append(opener); opener.focus();
    const view = render(<Celebration message="Goal reached" onClose={close} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Goal reached");
    fireEvent(dialog, new Event("cancel", { bubbles: false }));
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
  it("continues the progress counter from its current value and uses scale transforms", () => {
    const view = render(<ProgressBar percent={40} />);
    const counter = animations.animate.mock.calls.find(([options]) => "value" in options)![0].targets;
    counter.value = 40;
    animations.animate.mockClear();
    view.rerender(<ProgressBar percent={70} />);
    const label = animations.animate.mock.calls.find(([options]) => "value" in options)![0];
    expect(label.targets).toBe(counter);
    expect(label.targets.value).toBe(40);
    expect(animations.animate.mock.calls.some(([options]) => options.scaleX === 0.7)).toBe(true);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "70");
  });
});

it("splits whole rupees deterministically with no lost remainder", () => {
  expect(splitGoal(100, ["c", "b", "a"])).toEqual({ a: 34, b: 33, c: 33 });
  expect(splitGoal(1, ["b", "a"])).toEqual({ a: 1, b: 0 });
  expect(splitGoal(100, [])).toEqual({});
  for (const value of [NaN, Infinity, -1, 0, 1.5, 1000000001]) expect(() => validateAmount(value)).toThrow();
});
