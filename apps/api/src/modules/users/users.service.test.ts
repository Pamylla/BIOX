import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "./users.service";

describe("UsersService.updateProfile", () => {
  const update = vi.fn();
  const findUniqueOrThrow = vi.fn();
  const prisma = { user: { update, findUniqueOrThrow } } as unknown as PrismaService;
  const service = new UsersService(prisma);

  beforeEach(() => {
    update.mockReset();
    findUniqueOrThrow.mockReset();
  });

  it("updates only the provided fields", async () => {
    await service.updateProfile("user-1", { name: "Marina A.", flagBorderline: false });

    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Marina A.", flagBorderline: false },
    });
  });

  it("converts dateOfBirth to a UTC Date", async () => {
    await service.updateProfile("user-1", { dateOfBirth: "1991-05-12" });

    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { dateOfBirth: new Date("1991-05-12T00:00:00.000Z") },
    });
  });

  it("clears nullable fields when the patch sends null", async () => {
    await service.updateProfile("user-1", { dateOfBirth: null, sexAtBirth: null });

    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { dateOfBirth: null, sexAtBirth: null },
    });
  });

  it("returns the current row without an UPDATE when the patch is empty", async () => {
    findUniqueOrThrow.mockResolvedValue({ id: "user-1" });

    await service.updateProfile("user-1", {});

    expect(findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(update).not.toHaveBeenCalled();
  });
});
