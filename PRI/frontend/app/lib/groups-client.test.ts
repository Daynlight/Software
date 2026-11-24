import {
  acceptJoinRequest,
  createGroup,
  fetchMyGroup,
  GroupsApiError,
  listJoinRequests,
  rejectJoinRequest,
  requestJoin,
  searchGroups,
} from "./groups-client";

const fetchMock = jest.fn();

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("groups API client", () => {
  it("builds search filters and returns the page", async () => {
    const page = { items: [], total: 0, totalPages: 0, page: 2, limit: 10 };
    fetchMock.mockResolvedValue(response(page));

    await expect(
      searchGroups({
        search: "alpha",
        leader: "Nowak",
        hasFreeSlots: true,
        mine: true,
        minFreeSlots: 2,
        page: 2,
        limit: 10,
        sort: "name",
        order: "asc",
      }),
    ).resolves.toEqual(page);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/groups?search=alpha&leader=Nowak&hasFreeSlots=true&mine=true&minFreeSlots=2&page=2&limit=10&sort=name&order=asc",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("omits empty and undefined search filters", async () => {
    fetchMock.mockResolvedValue(response({ items: [] }));

    await searchGroups({ search: "", leader: undefined });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/groups",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("creates a group with a JSON body", async () => {
    fetchMock.mockResolvedValue(response({ id: "group-1" }, true, 201));

    await createGroup({ name: "Zespół", description: "Opis projektu" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Zespół",
          description: "Opis projektu",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends and lists join requests", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ request: { id: "r1" } }, true, 201))
      .mockResolvedValueOnce(response({ items: [] }));

    await requestJoin("group/1");
    await listJoinRequests("group/1", {
      status: "PENDING",
      page: 2,
      limit: 10,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/groups/group%2F1/join-requests",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/groups/group%2F1/join-requests?status=PENDING&page=2&limit=10",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("accepts and rejects requests", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ request: { id: "r1" } }))
      .mockResolvedValueOnce(response({ request: { id: "r1" } }));

    await acceptJoinRequest("group-1", "request/1");
    await rejectJoinRequest("group-1", "request/1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/groups/group-1/join-requests/request%2F1/accept",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/groups/group-1/join-requests/request%2F1/reject",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns the current group or null", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ items: [{ id: "group-1" }] }))
      .mockResolvedValueOnce(response({ items: [] }));

    await expect(fetchMyGroup()).resolves.toEqual({ id: "group-1" });
    await expect(fetchMyGroup()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/groups?mine=true&limit=1",
      expect.any(Object),
    );
  });

  it("uses a string error message and exposes the status", async () => {
    fetchMock.mockResolvedValue(
      response({ message: "Grupa jest pełna" }, false, 409),
    );

    await expect(searchGroups()).rejects.toMatchObject({
      name: "GroupsApiError",
      status: 409,
      message: "Grupa jest pełna",
    });
  });

  it("joins validation messages into one error", async () => {
    fetchMock.mockResolvedValue(
      response({ message: ["Pole jest wymagane", "Minimalna długość"] }, false, 400),
    );

    await expect(searchGroups()).rejects.toBeInstanceOf(GroupsApiError);
    await expect(searchGroups()).rejects.toThrow(
      "Pole jest wymagane Minimalna długość",
    );
  });

  it("falls back when the error body has no message", async () => {
    fetchMock.mockResolvedValue(response({}, false, 500));

    await expect(searchGroups()).rejects.toThrow(
      "Nie udało się wykonać operacji. Spróbuj ponownie.",
    );
  });

  it("falls back when the error body is not JSON", async () => {
    const invalid = {
      ok: false,
      status: 502,
      json: jest.fn().mockRejectedValue(new Error("not json")),
    } as unknown as Response;
    fetchMock.mockResolvedValue(invalid);

    await expect(searchGroups()).rejects.toThrow(
      "Nie udało się wykonać operacji. Spróbuj ponownie.",
    );
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    await expect(searchGroups()).rejects.toThrow("network");
  });
});
